"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, FileText, MessageSquare, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Client = {
  id: string;
  name: string;
  profile: {
    risk_profile: string;
    aum_inr_cr: number;
    ytd_return_pct: number;
    flags?: string[];
    occupation?: string;
  };
};

export function ClientSearch() {
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((j) => {
        setClients(j.clients ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(t) ||
        c.id.toLowerCase().includes(t) ||
        c.profile.risk_profile?.toLowerCase().includes(t) ||
        c.profile.occupation?.toLowerCase().includes(t)
    );
  }, [q, clients]);

  return (
    <div className="w-full">
      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search clients by name, ID, risk profile…"
          className="w-full rounded-xl border border-border bg-card/60 py-4 pl-11 pr-4 text-base outline-none backdrop-blur transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {loading ? (
        <div className="text-center text-sm text-muted-foreground py-12">
          Loading clients…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-12">
          No clients match "{q}".
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((c) => (
            <li
              key={c.id}
              className="group rounded-xl border border-border bg-card/40 p-4 transition hover:border-primary/40 hover:bg-card/80"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-medium">{c.name}</h3>
                    <span className="text-xs text-muted-foreground">{c.id}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {c.profile.occupation} · {c.profile.risk_profile}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs text-muted-foreground">AUM</div>
                  <div className="font-medium tabular-nums">
                    ₹{c.profile.aum_inr_cr.toFixed(1)} Cr
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3 text-xs">
                <span
                  className={cn(
                    "flex items-center gap-1 tabular-nums",
                    c.profile.ytd_return_pct >= 0 ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {c.profile.ytd_return_pct >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {c.profile.ytd_return_pct.toFixed(1)}% YTD
                </span>
                {c.profile.flags?.length ? (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-400">
                    {c.profile.flags.length} flag{c.profile.flags.length > 1 ? "s" : ""}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/brief/${c.id}`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/90 px-3 py-2 text-xs font-medium text-primary-foreground transition hover:bg-primary"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Pre-call brief
                </Link>
                <Link
                  href={`/assist/${c.id}`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-transparent px-3 py-2 text-xs font-medium transition hover:border-primary/60 hover:bg-primary/10"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Real-time assist
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
