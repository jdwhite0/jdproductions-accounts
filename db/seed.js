import postgres from 'postgres';

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const sql = postgres(url, { max: 1, prepare: false });
  await sql`
    INSERT INTO instruments (instrument_type, name, terms_version, counsel_status)
    SELECT 'early_support', 'Early Support', 'early_support_v0', 'unpapered'
    WHERE NOT EXISTS (
      SELECT 1 FROM instruments
      WHERE instrument_type = 'early_support'
        AND terms_version = 'early_support_v0'
    )
  `;
  const rows = await sql`
    SELECT id, instrument_type, terms_version, counsel_status
    FROM instruments
    WHERE instrument_type = 'early_support' AND terms_version = 'early_support_v0'
  `;
  console.log('seeded Early Support instrument', rows[0]);
  await sql.end({ timeout: 5 });
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
