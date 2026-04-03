"use client";

import { useState } from "react";
import { ExternalLink, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";

interface Competitor {
  name: string;
  url?: string | null;
  description?: string | null;
  why_competitive?: string | null;
  evidence_source?: string | null;
}

interface CompetitorReport {
  id: string;
  competitor_url: string;
  competitor_name?: string | null;
  status: string;
  created_at: string;
}

interface CompetitorListProps {
  competitors: Competitor[];
  linkedReports: CompetitorReport[];
  brandId: string;
  token: string;
  apiBase: string;
  onNavigate: (reportId: string) => void;
}

export function CompetitorList({
  competitors,
  linkedReports,
  brandId,
  token,
  apiBase,
  onNavigate,
}: CompetitorListProps) {
  const [analyzing, setAnalyzing] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(competitor: Competitor) {
    if (!competitor.url) {
      setError("No URL available for this competitor.");
      return;
    }
    setAnalyzing((prev) => ({ ...prev, [competitor.url!]: true }));
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/brands/${brandId}/compare`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ competitor_url: competitor.url, competitor_name: competitor.name }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail ?? "Failed to start analysis");
      }
      const data = await res.json();
      onNavigate(data.reportId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start analysis");
      setAnalyzing((prev) => ({ ...prev, [competitor.url!]: false }));
    }
  }

  // Build a lookup for already-analysed competitors by URL
  const analysedUrls = new Set(linkedReports.map((r) => r.competitor_url?.toLowerCase()));

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="rounded-xl p-4 border border-red-500/30 bg-red-900/10 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Discovered competitors */}
      {competitors.length > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
            Discovered Competitors ({competitors.length})
          </p>
          {competitors.map((c, i) => {
            const alreadyAnalysed = c.url ? analysedUrls.has(c.url.toLowerCase()) : false;
            const isLoading = c.url ? !!analyzing[c.url] : false;
            return (
              <div
                key={i}
                className="rounded-xl border p-4 flex items-center gap-4"
                style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-[var(--text-1)]"
                  style={{ background: "var(--bg-2)" }}
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--text-1)] truncate">{c.name}</p>
                    {alreadyAnalysed && <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />}
                  </div>
                  {c.url && (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-[var(--text-3)] hover:text-[var(--accent-cyan)] transition-colors truncate"
                    >
                      <ExternalLink size={10} />
                      {c.url}
                    </a>
                  )}
                  {c.description && (
                    <p className="text-xs text-[var(--text-3)] mt-1 line-clamp-2">{c.description}</p>
                  )}
                  {c.why_competitive && (
                    <p className="text-xs text-[var(--text-2)] mt-1 italic">{c.why_competitive}</p>
                  )}
                </div>

                {/* Action */}
                <button
                  onClick={() => handleAnalyze(c)}
                  disabled={isLoading || !c.url}
                  className="btn-secondary shrink-0 flex items-center gap-1.5 min-w-[110px] justify-center"
                >
                  {isLoading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : alreadyAnalysed ? (
                    <>
                      Re-analyze <ChevronRight size={12} />
                    </>
                  ) : (
                    <>
                      Analyze <ChevronRight size={12} />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="rounded-xl border border-dashed p-8 text-center"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <p className="text-sm text-[var(--text-3)]">No competitors discovered yet.</p>
        </div>
      )}

      {/* Linked competitor reports */}
      {linkedReports.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
            Competitor Reports ({linkedReports.length})
          </p>
          {linkedReports.map((report) => (
            <button
              key={report.id}
              onClick={() => onNavigate(report.id)}
              className="rounded-xl border p-4 flex items-center gap-3 text-left hover:border-[var(--border-default)] transition-colors w-full"
              style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold text-[var(--text-1)]"
                style={{ background: "var(--bg-2)" }}
              >
                {(report.competitor_name ?? report.competitor_url).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-1)] truncate">
                  {report.competitor_name ?? report.competitor_url}
                </p>
                <p className="text-xs text-[var(--text-3)] truncate">{report.competitor_url}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    report.status === "complete"
                      ? "text-emerald-400 bg-emerald-400/10"
                      : report.status === "failed"
                      ? "text-red-400 bg-red-400/10"
                      : "text-amber-400 bg-amber-400/10"
                  }`}
                >
                  {report.status}
                </span>
                <ChevronRight size={14} className="text-[var(--text-3)]" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
