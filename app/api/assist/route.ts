import { streamText } from "ai";
import { supabase } from "@/lib/supabase";
import { retrieve, formatContext } from "@/lib/rag";
import { primaryModel, fallbackModel } from "@/lib/llm";
import { assistPrompt, SYSTEM_RM_COPILOT } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const { clientId, question } = (await req.json()) as {
    clientId: string;
    question: string;
  };
  if (!clientId || !question) {
    return new Response(
      JSON.stringify({ error: "clientId and question required" }),
      { status: 400 }
    );
  }

  const clientRes = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();
  if (clientRes.error) {
    return new Response(JSON.stringify({ error: "client not found" }), {
      status: 404,
    });
  }
  const client = clientRes.data;

  const chunks = await retrieve(question, { k: 5, clientId });
  const context = formatContext(chunks);

  const prompt = assistPrompt({
    clientProfile: client.profile,
    question,
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
    temperature: 0.2,
  });

  return result.toTextStreamResponse({
    headers: {
      "x-sources": encodeURIComponent(
        JSON.stringify(chunks.map((c) => ({ source: c.source, type: c.doc_type })))
      ),
    },
  });
}
