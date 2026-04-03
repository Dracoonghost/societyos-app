"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  Target,
  ArrowLeft,
  RefreshCw,
  Loader2,
  AlertCircle,
  XCircle,
  ExternalLink,
  FileText,
  Layers,
  DollarSign,
  TrendingUp,
  Building2,
  Users,
  Briefcase,
  Code2,
  Lightbulb,
} from "lucide-react";
import { StatusPoller } from "@/components/competitor/StatusPoller";
import { CompetitorProgressScreen } from "@/components/competitor/CompetitorProgressScreen";
import { ReportSection } from "@/components/competitor/ReportSection";
import { CommunitySectionPanel } from "@/components/competitor/CommunitySectionPanel";
import { DebugPanel } from "@/components/competitor/DebugPanel";
import { SectionTabs, SectionKey } from "@/components/competitor/SectionTabs";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type PagePhase = "loading" | "in_progress" | "complete" | "failed" | "not_found";

interface Report {
  id: string;
  status: string;
  current_step?: string;
  error_message?: string;
  created_at?: string;
  completed_at?: string;
  input?: {
    competitor_url: string;
    competitor_name?: string;
    own_url?: string;
    industry?: string;
    focus_areas?: string[];
  };
  rawData?: Record<string, unknown>;
  aiInsights?: Record<string, Record<string, unknown> | null>;
  sections_generated?: string[];
  ai_model_used?: string;
  auditLog?: Record<string, unknown> | null;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  executive_summary:                <FileText size={14} />,
  product_overview:                 <Layers size={14} />,
  pricing_and_packaging:            <DollarSign size={14} />,
  gtm_and_positioning:              <TrendingUp size={14} />,
  funding_and_company:              <Building2 size={14} />,
  customer_and_social_proof:        <Users size={14} />,
  job_postings_intel:               <Briefcase size={14} />,
  community_and_developer_presence: <Code2 size={14} />,
  tactical_recommendations:         <Lightbulb size={14} />,
};

const SECTION_TITLES: Record<string, string> = {
  executive_summary:                "Executive Summary",
  product_overview:                 "Product Overview",
  pricing_and_packaging:            "Pricing & Packaging",
  gtm_and_positioning:              "GTM & Positioning",
  funding_and_company:              "Funding & Company",
  customer_and_social_proof:        "Customers & Social Proof",
  job_postings_intel:               "Job Postings Intel",
  community_and_developer_presence: "Community & Developer Presence",
  tactical_recommendations:         "Tactical Recommendations",
};

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function CompetitorReportPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [phase, setPhase] = useState<PagePhase>("loading");
  const [report, setReport] = useState<Report | null>(null);
  const [statusData, setStatusData] = useState<{
    status: string;
    current_step?: string | null;
    sections_generated?: string[] | null;
  } | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>("executive_summary");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const tokenRef = useRef<string>("");
  const [token, setToken] = useState<string>("");

  const getToken = useCallback(async () => {
    if (!user) return "";
    const { getIdToken } = await import("firebase/auth");
    const t = await getIdToken(user as Parameters<typeof getIdToken>[0]);
    tokenRef.current = t;
    setToken(t);
    return t;
  }, [user]);

  const fetchReport = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const reportUrl = new URL(`${API_URL}/api/competitor-analysis/${id}`);
      reportUrl.searchParams.set("_ts", String(Date.now()));
      const res = await fetch(reportUrl.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.status === 404) { setPhase("not_found"); return; }
      if (!res.ok) throw new Error("fetch failed");
      const data: Report = await res.json();
      setReport(data);
      if (data.status === "complete") {
        setPhase("complete");
        // Default to executive_summary if available, or first generated section
        if (data.sections_generated?.includes("executive_summary")) {
          setActiveSection("executive_summary");
        } else if (data.sections_generated?.[0]) {
          setActiveSection(data.sections_generated[0] as SectionKey);
        }
      } else if (data.status === "failed") {
        setPhase("failed");
      } else {
        setPhase("in_progress");
        setStatusData({
          status: data.status,
          current_step: data.current_step,
          sections_generated: data.sections_generated,
        });
      }
    } catch {
      setPhase("failed");
    }
  }, [id, getToken]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  // Keep token fresh
  useEffect(() => { getToken(); }, [getToken]);

  const handleStatusUpdate = useCallback((data: {
    status: string;
    current_step?: string | null;
    sections_generated?: string[] | null;
  }) => {
    setStatusData(data);
  }, []);

  const handleComplete = useCallback(() => {
    fetchReport();
  }, [fetchReport]);

  const handleFailed = useCallback((error: string) => {
    setReport((prev) => prev ? { ...prev, status: "failed", error_message: error } : null);
    setPhase("failed");
  }, []);

  async function handleRefresh(forceRescrape = false) {
    if (!report) return;
    setRefreshing(true);
    setRefreshError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/competitor-analysis/${id}/refresh`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ force_rescrape: forceRescrape }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 402 && err.detail?.error === "insufficient_credits") {
          setRefreshError(`Not enough credits — need ${err.detail.credits_required}, have ${err.detail.credits_remaining}.`);
          return;
        }
        throw new Error("refresh failed");
      }
      setPhase("loading");
      await fetchReport();
    } catch {
      // ignore — leave current state
    } finally {
      setRefreshing(false);
    }
  }

  async function handleResume() {
    if (!report) return;
    setRefreshing(true);
    setRefreshError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/competitor-analysis/${id}/resume`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("resume failed");
      setPhase("loading");
      await fetchReport();
    } catch {
      setRefreshError("Resume failed — try Retry Analysis instead.");
    } finally {
      setRefreshing(false);
    }
  }

  // -------------------------------------------------------------------------
  // Render states
  // -------------------------------------------------------------------------

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={20} className="text-[var(--text-3)] animate-spin" />
      </div>
    );
  }

  if (phase === "not_found") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle size={24} className="text-[var(--text-3)]" />
        <p className="text-sm text-[var(--text-3)]">Report not found.</p>
        <Link href="/competitor-analysis" className="text-xs text-[var(--accent-amber)] hover:underline">
          ← Back to Competitor Intel
        </Link>
      </div>
    );
  }

  const input = report?.input;

  // -------------------------------------------------------------------------
  // In-progress state — rich pipeline progress screen
  // -------------------------------------------------------------------------
  if (phase === "in_progress") {
    const currentStatus = statusData?.status ?? report?.status ?? "queued";
    const currentStep = statusData?.current_step ?? report?.current_step;
    const sectionsGenerated = statusData?.sections_generated ?? report?.sections_generated ?? [];

    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Back + header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/competitor-analysis" className="text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[var(--text-3)] uppercase tracking-wider">Analysing competitor</p>
            <h1 className="text-base font-bold text-[var(--text-1)] truncate">
              {input?.competitor_name || input?.competitor_url}
            </h1>
          </div>
        </div>

        {/* Invisible poller */}
        {token && (
          <StatusPoller
            reportId={id}
            apiBase={API_URL}
            token={token}
            onComplete={handleComplete}
            onFailed={handleFailed}
            onStatusUpdate={handleStatusUpdate}
          />
        )}

        {/* Rich progress screen */}
        <CompetitorProgressScreen
          status={currentStatus}
          currentStep={currentStep}
          sectionsGenerated={sectionsGenerated}
          competitorName={input?.competitor_name}
          competitorUrl={input?.competitor_url}
          errorMessage={report?.error_message}
          onRetry={() => handleRefresh(false)}
          retrying={refreshing}
        />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Failed state
  // -------------------------------------------------------------------------
  if (phase === "failed") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/competitor-analysis" className="text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <h1 className="text-base font-bold text-[var(--text-1)]">
            {input?.competitor_name || input?.competitor_url || "Analysis"}
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <XCircle size={28} className="text-red-400" />
          <div>
            <p className="text-sm font-medium text-[var(--text-2)]">Analysis failed</p>
            {report?.error_message && (
              <p className="text-xs text-[var(--text-3)] mt-1 max-w-sm">{report.error_message}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {report?.rawData && (
              <button
                onClick={handleResume}
                disabled={refreshing}
                title="Continue from last checkpoint — no credits charged"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-default)] text-sm font-semibold text-[var(--text-1)] hover:border-[var(--border-strong)] transition-all disabled:opacity-50"
              >
                {refreshing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                Resume (free)
              </button>
            )}
            <button
              onClick={() => handleRefresh(false)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-amber)] text-[#0b0f14] text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {refreshing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              Retry Analysis
            </button>
          </div>
          {refreshError && (
            <p className="text-xs text-[var(--accent-amber)] flex items-center gap-1 mt-1">
              <AlertCircle size={10} />
              {refreshError}
            </p>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Complete state — full report
  // -------------------------------------------------------------------------
  const insights = report?.aiInsights ?? {};
  const generated = report?.sections_generated ?? [];

  // Resolve the effective section — fall back to first generated section if active one isn't ready
  const effectiveSection: SectionKey =
    activeSection === "debug" || generated.includes(activeSection)
      ? activeSection
      : generated.includes("executive_summary")
      ? "executive_summary"
      : (generated[0] as SectionKey | undefined) ?? "executive_summary";

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/competitor-analysis"
            className="text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors shrink-0"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-[var(--accent-amber)] shrink-0" />
              <h1 className="text-xl font-bold text-[var(--text-1)] truncate">
                {input?.competitor_name || input?.competitor_url}
              </h1>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              {input?.competitor_url && (
                <a
                  href={input.competitor_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--text-3)] flex items-center gap-1 hover:text-[var(--accent-amber)] transition-colors"
                >
                  <ExternalLink size={10} />
                  {input.competitor_url}
                </a>
              )}
              {input?.industry && (
                <span className="text-xs text-[var(--text-3)]">· {input.industry}</span>
              )}
              <span className="text-xs text-[var(--text-3)]">· {formatDate(report?.completed_at)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRefresh(false)}
              disabled={refreshing}
              title="Re-run AI synthesis (uses cached scrape if < 7 days old)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-xs text-[var(--text-2)] hover:border-[var(--border-strong)] hover:text-[var(--text-1)] transition-all disabled:opacity-50"
            >
              {refreshing ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
              Refresh
            </button>
            <button
              onClick={() => handleRefresh(true)}
              disabled={refreshing}
              title="Force full re-scrape + re-analyze"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-xs text-[var(--text-2)] hover:border-[var(--border-strong)] hover:text-[var(--text-1)] transition-all disabled:opacity-50"
            >
              Re-scrape
            </button>
          </div>
          {refreshError && (
            <p className="text-[11px] text-[var(--accent-amber)] flex items-center gap-1">
              <AlertCircle size={10} />
              {refreshError}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 border-b border-[var(--border-subtle)] pb-3">
        <SectionTabs
          activeSection={effectiveSection}
          onChange={setActiveSection}
          generatedSections={generated}
        />
      </div>

      {/* Active section */}
      <div className="flex flex-col gap-4">
        {effectiveSection === "debug" ? (
          <DebugPanel
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            auditLog={report?.auditLog as any}
            reportId={report?.id ?? ""}
            aiInsights={insights}
          />
        ) : effectiveSection === "community_and_developer_presence" && generated.includes(effectiveSection) ? (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-1)] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--accent-amber)]">{SECTION_ICONS[effectiveSection]}</span>
              <span className="font-semibold text-sm text-[var(--text-1)]">Community & Social Presence</span>
            </div>
            <div className="px-5 py-5">
              <CommunitySectionPanel data={insights[effectiveSection] ?? null} />
            </div>
          </div>
        ) : generated.includes(effectiveSection) ? (
          <ReportSection
            title={SECTION_TITLES[effectiveSection] ?? effectiveSection}
            icon={SECTION_ICONS[effectiveSection]}
            data={insights[effectiveSection] ?? null}
            defaultOpen={true}
          />
        ) : (
          /* Skeleton — section not yet generated */
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-1)] p-6">
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 rounded bg-[var(--bg-2)] animate-pulse" style={{ width: `${50 + i * 10}%` }} />
              ))}
            </div>
          </div>
        )}

        {/* Model attribution */}
        {report?.ai_model_used && effectiveSection !== "debug" && (
          <p className="text-[10px] text-[var(--text-3)] text-right">
            Synthesized by {report.ai_model_used}
          </p>
        )}

        {/* ─── What's Next? bridge cards ─── */}
        {report?.status === "complete" && effectiveSection !== "debug" && (
          <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-3)" }}>
              What&apos;s Next?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/reviews/new?mode=review"
                className="card-amber rounded-xl p-5 flex flex-col gap-3 group"
              >
                <div className="flex items-start justify-between">
                  <div className="icon-box icon-box-amber">
                    <Lightbulb size={14} className="text-[var(--accent-amber)]" />
                  </div>
                  <ArrowLeft size={13} className="text-[var(--text-3)] rotate-180 transition-transform group-hover:translate-x-0.5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[var(--text-1)] mb-1">Run a strategic review using these insights</p>
                  <p className="text-xs text-[var(--text-3)] leading-relaxed">Pressure-test your own approach with expert panel analysis informed by this competitive intelligence.</p>
                </div>
              </Link>
              <Link
                href="/simulations/new"
                className="card-cyan rounded-xl p-5 flex flex-col gap-3 group"
              >
                <div className="flex items-start justify-between">
                  <div className="icon-box icon-box-cyan">
                    <Users size={14} className="text-[var(--accent-cyan)]" />
                  </div>
                  <ArrowLeft size={13} className="text-[var(--text-3)] rotate-180 transition-transform group-hover:translate-x-0.5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[var(--text-1)] mb-1">Test your differentiation messaging</p>
                  <p className="text-xs text-[var(--text-3)] leading-relaxed">See how your target audience reacts to your positioning vs. this competitor.</p>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
