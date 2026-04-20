import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ClientHeader } from "@/components/client-header";
import { BriefView } from "@/components/brief-view";

export const dynamic = "force-dynamic";

export default async function BriefPage({
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
      <ClientHeader client={data} mode="brief" />
      <BriefView clientId={params.clientId} />
    </main>
  );
}
