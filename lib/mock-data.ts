/**
 * Fetch mock/seed data from Supabase instead of static files.
 * This allows dynamic data management and easy integration with the RM Copilot.
 */
import { supabase } from "./supabase";

export interface ClientProfile {
  age: number;
  occupation: string;
  risk_profile: string;
  aum_inr_cr: number;
  allocation: {
    equity: number;
    debt: number;
    alternatives: number;
    cash: number;
  };
  top_holdings: Array<{
    name: string;
    type: string;
    weight: number;
  }>;
  ytd_return_pct: number;
  benchmark_ytd_pct: number;
  kyc_status: string;
  flags: string[];
  segment?: string;
  sip_active?: boolean;
  last_activity?: string;
  urgency_score?: number;
  action?: string;
}

export interface Client {
  id: string;
  name: string;
  profile: ClientProfile;
}

export interface Interaction {
  id?: string;
  client_id: string;
  ts: string;
  kind: "call" | "email" | "note";
  summary: string;
}

/**
 * Fetch all clients for current RM from Supabase
 */
export async function getAllClients(rmId = "demo-rm"): Promise<Client[]> {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("id, name, profile")
      .eq("rm_id", rmId);

    if (error) {
      console.error("Failed to fetch clients:", error);
      return [];
    }

    return (data || []) as Client[];
  } catch (err) {
    console.error("Error fetching clients:", err);
    return [];
  }
}

/**
 * Fetch single client by ID
 */
export async function getClientById(
  clientId: string,
  rmId = "demo-rm"
): Promise<Client | null> {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("id, name, profile")
      .eq("id", clientId)
      .eq("rm_id", rmId)
      .single();

    if (error) {
      console.error(`Failed to fetch client ${clientId}:`, error);
      return null;
    }

    return data as Client;
  } catch (err) {
    console.error("Error fetching client:", err);
    return null;
  }
}

/**
 * Fetch interactions for a client
 */
export async function getClientInteractions(
  clientId: string,
  rmId = "demo-rm",
  limit = 50
): Promise<Interaction[]> {
  try {
    const { data, error } = await supabase
      .from("interactions")
      .select("id, client_id, ts, kind, summary")
      .eq("client_id", clientId)
      .eq("rm_id", rmId)
      .order("ts", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to fetch interactions:", error);
      return [];
    }

    return (data || []) as Interaction[];
  } catch (err) {
    console.error("Error fetching interactions:", err);
    return [];
  }
}

/**
 * Get clients by segment (Risk, Opportunity, etc.)
 */
export async function getClientsBySegment(
  segment: string,
  rmId = "demo-rm"
): Promise<Client[]> {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("id, name, profile")
      .eq("rm_id", rmId);

    if (error) {
      console.error("Failed to fetch clients:", error);
      return [];
    }

    return (data || [])
      .filter((c) => c.profile?.segment === segment)
      .map((c) => ({ id: c.id, name: c.name, profile: c.profile }));
  } catch (err) {
    console.error("Error fetching clients by segment:", err);
    return [];
  }
}

/**
 * Get high-urgency clients (sorted by urgencyScore desc)
 */
export async function getUrgentClients(
  rmId = "demo-rm",
  limit = 10
): Promise<Client[]> {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("id, name, profile")
      .eq("rm_id", rmId);

    if (error) {
      console.error("Failed to fetch clients:", error);
      return [];
    }

    return (data || [])
      .map((c) => ({ id: c.id, name: c.name, profile: c.profile }))
      .sort(
        (a, b) => (b.profile?.urgency_score || 0) - (a.profile?.urgency_score || 0)
      )
      .slice(0, limit);
  } catch (err) {
    console.error("Error fetching urgent clients:", err);
    return [];
  }
}

/**
 * Search clients by name
 */
export async function searchClients(
  query: string,
  rmId = "demo-rm"
): Promise<Client[]> {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("id, name, profile")
      .eq("rm_id", rmId)
      .ilike("name", `%${query}%`);

    if (error) {
      console.error("Failed to search clients:", error);
      return [];
    }

    return (data || []) as Client[];
  } catch (err) {
    console.error("Error searching clients:", err);
    return [];
  }
}

/**
 * Get client portfolio history (if stored in profile or separate table)
 */
export async function getClientPortfolioMetrics(
  clientId: string
): Promise<ClientProfile | null> {
  const client = await getClientById(clientId);
  return client?.profile || null;
}
