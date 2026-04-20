"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Loader2, Send, Zap, MessageSquare, User as UserIcon } from "lucide-react";
import { cn, polishCitations } from "@/lib/utils";

type Source = { source: string; type: string | null };
type Msg = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  firstTokenMs?: number;
  totalMs?: number;
};

const SAMPLE_QUESTIONS = [
  "Why did my portfolio drop more than the index?",
  "What should I do with my maturing FD?",
  "Should I increase international equity exposure?",
  "Is now a good time to move out of small-caps?",
];

export function AssistChat({ clientId }: { clientId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    setInput("");

    const userMsg: Msg = { role: "user", content: q };
    const assistantMsg: Msg = { role: "assistant", content: "" };
    setMessages((m) => [...m, userMsg, assistantMsg]);

    const started = performance.now();
    let firstSet = false;
    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, question: q }),
      });
      if (!res.ok || !res.body) {
        const err = await res.text();
        setMessages((m) =>
          m.map((x, i) =>
            i === m.length - 1
              ? { ...x, content: `⚠️ Error: ${err.slice(0, 200)}` }
              : x
          )
        );
        return;
      }

      let sources: Source[] = [];
      const srcHeader = res.headers.get("x-sources");
      if (srcHeader) {
        try {
          sources = JSON.parse(decodeURIComponent(srcHeader));
        } catch {}
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!firstSet) {
          const ms = Math.round(performance.now() - started);
          firstSet = true;
          setMessages((m) =>
            m.map((x, i) =>
              i === m.length - 1 ? { ...x, firstTokenMs: ms } : x
            )
          );
        }
        setMessages((m) =>
          m.map((x, i) =>
            i === m.length - 1 ? { ...x, content: polishCitations(x.content + chunk) } : x
          )
        );
      }
      const total = Math.round(performance.now() - started);
      setMessages((m) =>
        m.map((x, i) =>
          i === m.length - 1 ? { ...x, sources, totalMs: total } : x
        )
      );
    } catch (e) {
      setMessages((m) =>
        m.map((x, i) =>
          i === m.length - 1 ? { ...x, content: `⚠️ ${String(e)}` } : x
        )
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col rounded-xl border border-border bg-card/40">
      <div className="border-b border-border px-5 py-3 flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-primary">
          <MessageSquare className="h-3 w-3" />
          Real-time assist
        </span>
        <span className="text-muted-foreground">
          Type the client's question. Suggested response streams in under 2s.
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Start with a client question, or try one of these:
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-xl">
              {SAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => ask(q)}
                  className="rounded-full border border-border bg-background/40 px-3 py-1.5 text-xs transition hover:border-primary/60 hover:bg-primary/10"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, idx) => (
          <div
            key={idx}
            className={cn(
              "flex gap-3",
              m.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {m.role === "assistant" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Zap className="h-3.5 w-3.5" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[78%] rounded-2xl px-4 py-3 text-sm",
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-background/60 border border-border rounded-bl-sm"
              )}
            >
              {m.role === "assistant" ? (
                <>
                  {m.content ? (
                    <div className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-p:leading-relaxed">
                      <ReactMarkdown rehypePlugins={[rehypeRaw]}>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                    {m.firstTokenMs !== undefined && (
                      <span className="flex items-center gap-1">
                        <Zap className="h-2.5 w-2.5 text-emerald-400" />
                        {m.firstTokenMs}ms first token
                      </span>
                    )}
                    {m.totalMs !== undefined && (
                      <span>· {m.totalMs}ms total</span>
                    )}
                    {m.sources?.map((s, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-0.5"
                      >
                        <span className="inline-flex items-center justify-center min-w-[0.9rem] h-[0.9rem] rounded bg-primary/20 text-primary text-[0.55rem] font-semibold">
                          {i + 1}
                        </span>
                        {s.source}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
            {m.role === "user" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                <UserIcon className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}
      </div>

      <form
        className="border-t border-border p-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
          placeholder={busy ? "Generating…" : "Type the client's question…"}
          className="flex-1 rounded-lg border border-border bg-background/40 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition disabled:opacity-40 hover:bg-primary/90"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Send
        </button>
      </form>
    </div>
  );
}
