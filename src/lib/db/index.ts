import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// A single lazily-created connection, reused across requests (important on
// serverless platforms like Vercel to avoid exhausting Postgres connections).
declare global {
  // eslint-disable-next-line no-var
  var __velouraDbClient: ReturnType<typeof postgres> | undefined;
}

function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Add it to your .env file (see .env.example).'
    );
  }
  return url;
}

const client =
  global.__velouraDbClient ??
  postgres(getConnectionString(), {
    // Kept deliberately small (default 5) because on serverless platforms
    // (Vercel etc.) EVERY warm function instance opens its own pool of this
    // size — with real concurrent traffic (e.g. ~200 simultaneous visitors
    // spread across many instances), a large per-instance `max` can add up
    // to more connections than Postgres allows. Tune with DB_POOL_MAX if
    // needed, but prefer pointing DATABASE_URL at your provider's pooled
    // connection string (Neon/Supabase's "pooler"/PgBouncer endpoint) so it
    // can multiplex far more logical connections than Postgres itself allows
    // — that matters far more for handling concurrent load than this number.
    max: Number(process.env.DB_POOL_MAX) || 5,
    prepare: false,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__velouraDbClient = client;
}

export const db = drizzle(client, { schema });
