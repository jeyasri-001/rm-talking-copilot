/**
 * Prints the schema SQL and opens a clear path to apply it.
 *
 * Supabase JS client cannot execute arbitrary DDL. The canonical way
 * to apply the schema is via the Supabase Dashboard → SQL Editor.
 *
 * Usage:
 *   npm run migrate      # prints instructions
 *   npm run migrate -- --print  # prints the raw SQL to stdout
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const sqlPath = join(process.cwd(), "scripts", "schema.sql");
const sql = readFileSync(sqlPath, "utf8");

const args = process.argv.slice(2);
if (args.includes("--print")) {
  process.stdout.write(sql);
  process.exit(0);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "<your supabase project>";
const projectRef = url.replace(/^https:\/\/([^.]+)\..*$/, "$1");
const dashboardUrl = projectRef
  ? `https://supabase.com/dashboard/project/${projectRef}/sql/new`
  : "https://supabase.com/dashboard → your project → SQL Editor";

console.log(`
═══════════════════════════════════════════════════════════════════════
  Supabase migration — apply schema.sql via the dashboard
═══════════════════════════════════════════════════════════════════════

  1. Open: ${dashboardUrl}
  2. Paste the contents of: scripts/schema.sql
  3. Click "Run"

  Or pipe directly to clipboard (macOS):
      npm run migrate -- --print | pbcopy

  Then verify via:
      select count(*) from doc_chunks;   -- expect 0 initially
      select proname from pg_proc where proname = 'match_chunks';

  When done, run:  npm run seed
═══════════════════════════════════════════════════════════════════════
`);
