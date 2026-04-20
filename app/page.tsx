import { ClientSearch } from "@/components/client-search";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          Powered by Groq · llama-3.3-70b
        </div>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          RM Copilot
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Pick a client to generate a pre-call brief, or jump into real-time
          assist to get suggested responses during a live conversation.
        </p>
      </header>
      <ClientSearch />
    </main>
  );
}
