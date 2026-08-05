/**
 * Applies the SQL files in supabase/migrations in order, once each.
 *
 * Run with `npm run db:migrate`. Needs `SUPABASE_DB_URL` — the Supabase
 * connection string, which is only ever read from the environment, never
 * committed. Applied migrations are recorded in `public.schema_migrations`, so
 * re-running is a no-op.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const directory = join(root, "supabase", "migrations");

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error(
    "SUPABASE_DB_URL is not set. Copy the connection string from Supabase\n" +
      "(Project settings → Database → Connection string → Session pooler).",
  );
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

await client.query(`
  create table if not exists public.schema_migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )
`);

const applied = new Set(
  (await client.query("select name from public.schema_migrations")).rows.map(
    (row) => row.name,
  ),
);

const files = readdirSync(directory)
  .filter((name) => name.endsWith(".sql"))
  .sort();

let count = 0;
for (const name of files) {
  if (applied.has(name)) {
    console.log(`  skip     ${name}`);
    continue;
  }

  const sql = readFileSync(join(directory, name), "utf8");
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into public.schema_migrations (name) values ($1)", [name]);
    await client.query("commit");
    console.log(`  applied  ${name}`);
    count += 1;
  } catch (error) {
    await client.query("rollback");
    console.error(`  FAILED   ${name}\n${error instanceof Error ? error.message : error}`);
    await client.end();
    process.exit(1);
  }
}

console.log(count === 0 ? "Nothing to apply." : `Applied ${count} migration(s).`);
await client.end();
