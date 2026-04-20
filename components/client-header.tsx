import Link from "next/link";
import { ArrowLeft, FileText, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  client: {
    id: string;
    name: string;
    profile: {
      risk_profile: string;
      aum_inr_cr: number;
      ytd_return_pct: number;
      benchmark_ytd_pct?: number;
      occupation?: string;
      flags?: string[];
    };
  };
  mode: "brief" | "assist";
};

export function ClientHeader({ client, mode }: Props) {
  const p = client.profile;
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-border pb-6 mb-6">
      <Link
        href="/"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:border-primary/60 hover:bg-primary/10 transition"
        aria-label="Back"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold truncate">{client.name}</h1>
          <span className="text-xs text-muted-foreground">{client.id}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {p.occupation} · {p.risk_profile} · ₹{p.aum_inr_cr.toFixed(1)} Cr AUM
          {" · "}
          <span
            className={cn(
              "tabular-nums",
              p.ytd_return_pct >= 0 ? "text-emerald-400" : "text-red-400"
            )}
          >
            {p.ytd_return_pct.toFixed(1)}% YTD
          </span>
          {typeof p.benchmark_ytd_pct === "number" && (
            <span className="text-muted-foreground">
              {" vs "}
              {p.benchmark_ytd_pct.toFixed(1)}% bench
            </span>
          )}
        </p>
      </div>

      <div className="ml-auto flex gap-2">
        <Link
          href={`/brief/${client.id}`}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
            mode === "brief"
              ? "bg-primary text-primary-foreground"
              : "border border-border hover:border-primary/60 hover:bg-primary/10"
          )}
        >
          <FileText className="h-3.5 w-3.5" />
          Brief
        </Link>
        <Link
          href={`/assist/${client.id}`}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
            mode === "assist"
              ? "bg-primary text-primary-foreground"
              : "border border-border hover:border-primary/60 hover:bg-primary/10"
          )}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Assist
        </Link>
      </div>
    </div>
  );
}
