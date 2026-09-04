-- Seed the v0 Early Support instrument. Idempotent.
INSERT INTO instruments (instrument_type, name, terms_version, counsel_status)
SELECT 'early_support', 'Early Support', 'early_support_v0', 'unpapered'
WHERE NOT EXISTS (
  SELECT 1 FROM instruments
  WHERE instrument_type = 'early_support'
    AND terms_version = 'early_support_v0'
);
