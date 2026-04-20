/**
 * Merge WealthPulse clients and interactions into the seed data.
 * Usage: npx ts-node scripts/merge-wealthpulse.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SEED_DIR = join(ROOT, "seed");

interface ClientData {
  id: string;
  name: string;
  profile: Record<string, any>;
}

interface InteractionData {
  client_id: string;
  ts: string;
  kind: string;
  summary: string;
}

async function main() {
  try {
    // Load existing data
    console.log("→ Loading existing clients…");
    const existingClientsPath = join(SEED_DIR, "clients.json");
    const existingClients = JSON.parse(
      readFileSync(existingClientsPath, "utf8")
    ) as ClientData[];
    console.log(`  loaded ${existingClients.length} existing clients`);

    // Load WealthPulse data
    console.log("→ Loading WealthPulse clients…");
    const wpClientsPath = join(SEED_DIR, "wealthpulse-clients.json");
    const wpClients = JSON.parse(
      readFileSync(wpClientsPath, "utf8")
    ) as ClientData[];
    console.log(`  loaded ${wpClients.length} WealthPulse clients`);

    // Merge (WealthPulse has unique IDs W001+, existing have C00X)
    const mergedClients = [...existingClients, ...wpClients];

    // Save merged clients
    console.log("→ Saving merged clients…");
    writeFileSync(
      existingClientsPath,
      JSON.stringify(mergedClients, null, 2)
    );
    console.log(`  saved ${mergedClients.length} total clients`);

    // Load and merge interactions
    console.log("→ Loading existing interactions…");
    const existingInteractionsPath = join(SEED_DIR, "interactions.json");
    const existingInteractions = JSON.parse(
      readFileSync(existingInteractionsPath, "utf8")
    ) as InteractionData[];
    console.log(`  loaded ${existingInteractions.length} existing interactions`);

    console.log("→ Loading WealthPulse interactions…");
    const wpInteractionsPath = join(SEED_DIR, "wealthpulse-interactions.json");
    const wpInteractions = JSON.parse(
      readFileSync(wpInteractionsPath, "utf8")
    ) as InteractionData[];
    console.log(`  loaded ${wpInteractions.length} WealthPulse interactions`);

    // Merge interactions
    const mergedInteractions = [...existingInteractions, ...wpInteractions];

    // Save merged interactions
    console.log("→ Saving merged interactions…");
    writeFileSync(
      existingInteractionsPath,
      JSON.stringify(mergedInteractions, null, 2)
    );
    console.log(`  saved ${mergedInteractions.length} total interactions`);

    console.log("\n✓ Merge complete! Run 'npm run seed' to ingest into Supabase.");
  } catch (error) {
    console.error("✗ Merge failed:", error);
    process.exit(1);
  }
}

main();
