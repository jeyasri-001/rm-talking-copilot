import { streamText } from "ai";
import { supabase } from "@/lib/supabase";
import { retrieve, formatContext } from "@/lib/rag";
import { primaryModel, fallbackModel } from "@/lib/llm";
import { briefPrompt, SYSTEM_RM_COPILOT } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const { clientId } = (await req.json()) as { clientId: string };
  if (!clientId)
    return new Response(JSON.stringify({ error: "clientId required" }), {
      status: 400,
    });

  const [clientRes, interactionsRes] = await Promise.all([
    supabase.from("clients").select("*").eq("id", clientId).single(),
    supabase
      .from("interactions")
      .select("ts, kind, summary")
      .eq("client_id", clientId)
      .order("ts", { ascending: false })
      .limit(5),
  ]);

  if (clientRes.error) {
    return new Response(JSON.stringify({ error: "client not found" }), {
      status: 404,
    });
  }
  const client = clientRes.data;
  const interactions = interactionsRes.data ?? [];

  // Seed the retrieval query from profile flags + recent topics
  const flags: string[] = (client.profile?.flags as string[]) ?? [];
  const recentTopics = interactions
    .slice(0, 3)
    .map((i) => i.summary)
    .join(" ");
  const retrievalQuery = [
    `Client ${client.name}, risk profile ${client.profile?.risk_profile}`,
    flags.join(" "),
    recentTopics,
  ]
    .filter(Boolean)
    .join(" ");

  const chunks = await retrieve(retrievalQuery, { k: 6, clientId });
  const context = formatContext(chunks);

  const prompt = briefPrompt({
    clientProfile: client.profile,
    recentInteractions: interactions,
    context,
  });

  let model;
  try {
    model = primaryModel();
  } catch {
    model = fallbackModel();
  }

  const result = await streamText({
    model,
    system: SYSTEM_RM_COPILOT,
    prompt,
    temperature: 0.3,
  });

  return result.toTextStreamResponse({
    headers: {
      "x-sources": encodeURIComponent(
        JSON.stringify(chunks.map((c) => ({ source: c.source, type: c.doc_type })))
      ),
    },
  });
}
