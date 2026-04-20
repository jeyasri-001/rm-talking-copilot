import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const supabase = supabaseAdmin();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (id) {
    const [client, interactions] = await Promise.all([
      supabase.from("clients").select("*").eq("id", id).single(),
      supabase
        .from("interactions")
        .select("*")
        .eq("client_id", id)
        .order("ts", { ascending: false })
        .limit(5),
    ]);
    if (client.error) {
      return NextResponse.json({ error: client.error.message }, { status: 404 });
    }
    return NextResponse.json({
      client: client.data,
      interactions: interactions.data ?? [],
    });
  }

  const { data, error } = await supabase
    .from("clients")
    .select("id, name, profile")
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ clients: data ?? [] });
}
