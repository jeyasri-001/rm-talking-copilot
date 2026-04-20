import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { supabaseAdmin } from "../lib/supabase";

async function main() {
  const db = supabaseAdmin();
  
  const { data, error } = await db
    .from("clients")
    .select("id, name")
    .limit(20);
  
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Clients in database:");
    data?.forEach(c => console.log(`  ${c.id}: ${c.name}`));
    console.log(`\nTotal: ${data?.length}`);
  }
}

main().catch(console.error);
