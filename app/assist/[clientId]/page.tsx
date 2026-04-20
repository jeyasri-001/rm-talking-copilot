import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ClientHeader } from "@/components/client-header";
import { AssistChat } from "@/components/assist-chat";

export const dynamic = "force-dynamic";

export default async function AssistPage({
  params,
}: {
  params: { clientId: string };
}) {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", params.clientId)
    .single();

  if (error || !data) notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <ClientHeader client={data} mode="assist" />
      <AssistChat clientId={params.clientId} />
    </main>
  );
}
