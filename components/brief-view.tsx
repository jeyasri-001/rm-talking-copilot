"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, Zap, FileText } from "lucide-react";
import { polishCitations } from "@/lib/utils";

type Source = { source: string; type: string | null };

export function BriefView({ clientId }: { clientId: string }) {
  const [text, setText] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firstTokenMs, setFirstTokenMs] = useState<number | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    const started = performance.now();
    let firstSet = false;

    (async () => {
      try {
        const res = await fetch("/api/brief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId }),
          signal: ac.signal,
        });
        if (!res.ok || !res.body) {
          setError(`Error ${res.status}: ${await res.text()}`);
          setLoading(false);
          return;
        }

        const srcHeader = res.headers.get("x-sources");
        if (srcHeader) {
          try {
            setSources(JSON.parse(decodeURIComponent(srcHeader)));
          } catch {}
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        setLoading(false);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (!firstSet) {
            setFirstTokenMs(Math.round(performance.now() - started));
            firstSet = true;
          }
          setText((t) => polishCitations(t + chunk));
        }
      } catch (e: unknown) {
        if ((e as { name?: string }).name !== "AbortError") {
          setError(String(e));
          setLoading(false);
        }
      }
    })();

    return () => ac.abort();
  }, [clientId]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
      <article className="min-w-0 rounded-xl border border-border bg-card/40 p-6">
        <div className="mb-4 flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-primary">
            <FileText className="h-3 w-3" />
            Pre-call brief
          </span>
          {firstTokenMs !== null && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Zap className="h-3 w-3 text-emerald-400" />
              first token in {firstTokenMs}ms
            </span>
          )}
        </div>

        {loading && (
          <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Retrieving context and generating…
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {text && (
          <div className="prose prose-invert max-w-none prose-headings:mt-6 prose-headings:mb-2 prose-h2:text-lg prose-h2:font-semibold prose-p:leading-relaxed prose-li:leading-relaxed">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        )}
      </article>

      <aside className="lg:sticky lg:top-6 h-fit rounded-xl border border-border bg-card/40 p-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
          Sources used
        </h3>
        {sources.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {loading ? "—" : "No sources retrieved."}
          </p>
        ) : (
          <ul className="space-y-2">
            {sources.map((s, i) => (
              <li
                key={i}
                className="rounded-lg border border-border/60 bg-background/40 p-2.5 text-xs"
              >
                <div className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center min-w-[1.25rem] h-[1.25rem] shrink-0 rounded-md bg-primary/20 text-primary text-[0.65rem] font-semibold">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{s.source}</div>
                    {s.type && (
                      <div className="mt-0.5 text-muted-foreground">{s.type}</div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
