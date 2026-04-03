"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  Target,
  Plus,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  FlaskConical,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface ReportSummary {
  id: string;
  status: string;
  competitor_url: string;
  competitor_name?: string;
  own_url?: string;
  created_at?: string;
  completed_at?: string;
  sections_generated?: string[];
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    complete: { label: "Complete", color: "text-emerald-400 bg-emerald-950/40 border-emerald-800/40", icon: <CheckCircle size={11} /> },
    failed: { label: "Failed", color: "text-red-400 bg-red-950/40 border-red-800/40", icon: <XCircle size={11} /> },
    analyzing: { label: "Analyzing…", color: "text-[var(--accent-amber)] bg-amber-950/20 border-amber-800/30", icon: <Loader2 size={11} className="animate-spin" /> },
    scraping: { label: "Scraping…", color: "text-[var(--accent-amber)] bg-amber-950/20 border-amber-800/30", icon: <Loader2 size={11} className="animate-spin" /> },
    queued: { label: "Queued", color: "text-[var(--text-3)] bg-[var(--bg-2)] border-[var(--border-subtle)]", icon: <Clock size={11} /> },
  };
  const cfg = map[status] ?? { label: status, color: "text-[var(--text-3)] bg-[var(--bg-2)] border-[var(--border-subtle)]", icon: <AlertCircle size={11} /> };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wide ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function CompetitorAnalysisListPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [phase, setPhase] = useState<"loading" | "loaded" | "error">("loading");

  const fetchReports = useCallback(async () => {
    if (!user) return;
    try {
      const { getIdToken } = await import("firebase/auth");
      const token = await getIdToken(user as Parameters<typeof getIdToken>[0]);
      const res = await fetch(`${API_URL}/api/competitor-analysis`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load reports");
      const data = await res.json();
      setReports(data.reports ?? []);
      setPhase("loaded");
    } catch {
      setPhase("error");
    }
  }, [user]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // Poll while any report is still in progress
  useEffect(() => {
    const IN_PROGRESS = ["queued", "scraping", "analyzing", "classifying"];
    const hasActive = reports.some((r) => IN_PROGRESS.includes(r.status));
    if (!hasActive) return;
    const id = setInterval(fetchReports, 4000);
    return () => clearInterval(id);
  }, [reports, fetchReports]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target size={18} className="text-[var(--accent-amber)]" />
            <h1 className="text-xl font-bold text-[var(--text-1)]">Competitor Intel</h1>
          </div>
          <p className="text-sm text-[var(--text-3)]">Deep AI-synthesized analysis of any competitor.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/competitor-analysis/debug"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border-default)] text-xs text-[var(--text-3)] hover:text-[var(--text-2)] hover:border-[var(--border-strong)] transition-all"
            title="Debug Lab — test pipeline steps individually"
          >
            <FlaskConical size={13} />
            Lab
          </Link>
          <Link
            href="/competitor-analysis/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-amber)] text-[#0b0f14] text-sm font-semibold hover:brightness-110 transition-all"
          >
            <Plus size={14} />
            Analyze Competitor
          </Link>
        </div>
      </div>

      {/* Content */}
      {phase === "loading" && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={20} className="text-[var(--text-3)] animate-spin" />
        </div>
      )}

      {phase === "error" && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <AlertCircle size={24} className="text-red-400" />
          <p className="text-sm text-[var(--text-3)]">Failed to load reports.</p>
          <button onClick={fetchReports} className="text-xs text-[var(--accent-amber)] hover:underline">
            Try again
          </button>
        </div>
      )}

      {phase === "loaded" && reports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-[var(--bg-2)] border border-[var(--border-subtle)] flex items-center justify-center">
            <Target size={20} className="text-[var(--text-3)]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-2)]">No competitor analyses yet</p>
            <p className="text-xs text-[var(--text-3)] mt-1">Enter a competitor URL to generate your first report.</p>
          </div>
          <Link
            href="/competitor-analysis/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-amber)] text-[#0b0f14] text-sm font-semibold hover:brightness-110 transition-all"
          >
            <Plus size={14} />
            Analyze Competitor
          </Link>
        </div>
      )}

      {phase === "loaded" && reports.length > 0 && (
        <div className="flex flex-col gap-2">
          {reports.map((r) => (
            <Link
              key={r.id}
              href={`/competitor-analysis/${r.id}`}
              className="group flex items-center gap-4 px-5 py-4 rounded-xl bg-[var(--bg-1)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-[var(--bg-2)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                <Target size={15} className="text-[var(--accent-amber)]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--text-1)] truncate">
                    {r.competitor_name || r.competitor_url}
                  </p>
                  <StatusBadge status={r.status} />
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-[var(--text-3)] flex items-center gap-1 truncate">
                    <ExternalLink size={9} className="shrink-0" />
                    {r.competitor_url}
                  </span>
                  {r.own_url && (
                    <span className="text-[10px] text-[var(--accent-amber)] bg-amber-950/20 border border-amber-800/30 px-1.5 py-0.5 rounded font-medium">
                      vs. You
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-right hidden sm:block">
                <p className="text-[10px] text-[var(--text-3)]">{formatDate(r.created_at)}</p>
                {r.sections_generated && r.sections_generated.length > 0 && (
                  <p className="text-[10px] text-[var(--text-3)]">{r.sections_generated.length} sections</p>
                )}
              </div>

              <ChevronRight size={14} className="text-[var(--text-3)] group-hover:text-[var(--text-2)] transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
