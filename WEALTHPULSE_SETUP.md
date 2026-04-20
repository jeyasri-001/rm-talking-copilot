# WealthPulse Data Integration

## ✓ What Was Done

1. **Replaced seed data** with WealthPulse mock data:
   - `seed/clients.json` → 15 curated clients (W001-W015) with realistic wealth advisory segments
   - `seed/interactions.json` → 45 timestamped interactions (calls, emails, notes)

2. **Created `lib/mock-data.ts`** — Utility functions to fetch data from Supabase:
   - `getAllClients(rmId)` — Get all clients for RM
   - `getClientById(clientId, rmId)` — Get single client
   - `getClientInteractions(clientId, rmId)` — Get client interactions
   - `getClientsBySegment(segment, rmId)` — Filter by Risk/Opportunity/Underperforming/Stable
   - `getUrgentClients(rmId, limit)` — Get high-priority clients by urgency score
   - `searchClients(query, rmId)` — Full-text search

3. **Backed up original data**:
   - `seed/clients.json.bak` — Original 8 clients
   - `seed/interactions.json.bak` — Original interactions

## 📋 Next Steps

### 1. Seed WealthPulse data into Supabase

```bash
npm run seed
```

This will:
- Upsert 15 WealthPulse clients into `clients` table
- Insert 45 interactions into `interactions` table
- Embed and chunk any docs in `seed/docs/`

### 2. Use Supabase-backed mock data in your app

Instead of hardcoded data, use the `lib/mock-data.ts` utilities:

```typescript
// In your API routes or components:
import { getAllClients, getClientsBySegment, getUrgentClients } from "@/lib/mock-data";

// Fetch clients from Supabase
const allClients = await getAllClients("demo-rm");

// Get Risk segment clients for urgent outreach
const riskClients = await getClientsBySegment("Risk", "demo-rm");

// Get top 5 urgent clients
const topUrgent = await getUrgentClients("demo-rm", 5);
```

### 3. Example: Dashboard with WealthPulse insights

```typescript
// app/dashboard/page.tsx
import { getUrgentClients, getClientsBySegment } from "@/lib/mock-data";

export default async function Dashboard() {
  const urgent = await getUrgentClients("demo-rm", 10);
  const opportunities = await getClientsBySegment("Opportunity", "demo-rm");
  const risks = await getClientsBySegment("Risk", "demo-rm");

  return (
    <div>
      <h2>Urgent Actions ({urgent.length})</h2>
      {urgent.map(client => (
        <div key={client.id}>
          {client.name} — {client.profile?.action}
          <span>{client.profile?.urgency_score}% urgent</span>
        </div>
      ))}

      <h2>Opportunities ({opportunities.length})</h2>
      {/* ... */}

      <h2>At-Risk ({risks.length})</h2>
      {/* ... */}
    </div>
  );
}
```

## 📊 WealthPulse Data Structure

Each client includes:
- **Segment**: Risk, Opportunity, Underperforming, Stable
- **AUM**: Assets under management (₹Cr)
- **Action**: Recommended action (e.g., "Reactivate SIP", "Upsell SIP")
- **Urgency Score**: 0-100 (higher = more urgent)
- **Risk Profile**: Conservative, Moderate, Aggressive
- **SIP Status**: Active/paused
- **Returns**: YTD returns % vs benchmark
- **Flags**: Alert messages (e.g., "SIP paused 52 days")

## 🔄 If You Need Original Data Back

Restore from backup:

```bash
cp seed/clients.json.bak seed/clients.json
cp seed/interactions.json.bak seed/interactions.json
npm run seed
```

## 🚀 Features Enabled

With this setup, you can now:
- ✅ Show clients by wealth segment in UI
- ✅ Display urgency-ranked action lists
- ✅ Filter clients by investment goal/segment
- ✅ Show interaction history (calls, emails, notes)
- ✅ Track SIP status and returns
- ✅ Build dashboards around wealth metrics

All data is stored in Supabase and accessed via the new `lib/mock-data.ts` utility functions.
