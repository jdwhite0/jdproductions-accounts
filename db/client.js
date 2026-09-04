import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.js';

let sqlClient;
let drizzleClient;

function requireDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    const err = new Error('DATABASE_URL is not set');
    err.status = 503;
    err.code = 'db_not_configured';
    throw err;
  }
  return url;
}

export function getSql() {
  if (!sqlClient) {
    sqlClient = postgres(requireDatabaseUrl(), {
      max: 1,
      prepare: false
    });
  }
  return sqlClient;
}

export function getDb() {
  if (!drizzleClient) {
    drizzleClient = drizzle(getSql(), { schema });
  }
  return drizzleClient;
}
