/** Used by drizzle-kit if you generate future migrations. SQL in db/migrations/ is the applied source. */
export default {
  schema: './db/schema.js',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL
  }
};
