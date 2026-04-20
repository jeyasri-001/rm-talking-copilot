import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { supabaseAdmin } from "../lib/supabase";

async function main() {
  const db = supabaseAdmin();
  
  console.log("→ Clearing old clients…");
  const { error: cErr } = await db
    .from("clients")
    .delete()
    .neq("rm_id", "____");
  if (cErr) console.error("Client delete error:", cErr);
  
  console.log("→ Clearing old interactions…");
  const { error: iErr } = await db
    .from("interactions")
    .delete()
    .neq("rm_id", "____");
  if (iErr) console.error("Interaction delete error:", iErr);
  
  console.log("✓ Cleared all data");
}

main().catch(console.error);
