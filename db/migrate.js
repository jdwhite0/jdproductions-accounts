import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const sql = postgres(url, { max: 1, prepare: false });
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  const dir = join(__dirname, 'migrations');
  const files = (await readdir(dir)).filter((name) => name.endsWith('.sql')).sort();

  for (const filename of files) {
    const already = await sql`SELECT 1 FROM schema_migrations WHERE filename = ${filename}`;
    if (already.length) {
      console.log(`skip ${filename}`);
      continue;
    }

    const text = await readFile(join(dir, filename), 'utf8');
    await sql.begin(async (tx) => {
      await tx.unsafe(text);
      await tx`INSERT INTO schema_migrations (filename) VALUES (${filename})`;
    });
    console.log(`applied ${filename}`);
  }

  await sql.end({ timeout: 5 });
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
