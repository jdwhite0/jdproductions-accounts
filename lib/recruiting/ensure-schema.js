import { readFileSync } from 'node:fs';

const MIGRATION = '0003_recruiting.sql';
const LOCK_KEY = 814203;
let ready = false;

export async function ensureRecruitingSchema(sql) {
  if (ready) return;
  await sql`SELECT pg_advisory_lock(${LOCK_KEY})`;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    const [existing] = await sql`SELECT to_regclass('public.recruiting_organizations') AS name`;
    if (!existing?.name) {
      const text = readFileSync(new URL('../../db/migrations/0003_recruiting.sql', import.meta.url), 'utf8');
      await sql.begin(async (tx) => {
        await tx.unsafe(text);
        await tx`
          INSERT INTO schema_migrations (filename)
          VALUES (${MIGRATION})
          ON CONFLICT (filename) DO NOTHING
        `;
      });
    } else {
      await sql`
        INSERT INTO schema_migrations (filename)
        VALUES (${MIGRATION})
        ON CONFLICT (filename) DO NOTHING
      `;
    }
    ready = true;
  } finally {
    await sql`SELECT pg_advisory_unlock(${LOCK_KEY})`;
  }
}
