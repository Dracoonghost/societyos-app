"use client";

import { useState } from "react";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import {
  IdentifyIcon,
  CrawlIcon,
  AnalyzeIcon,
  DiscoverIcon,
  DeepAnalyzeIcon,
  FinalizeIcon,
} from "./BrandProgressIcons";

// ---------------------------------------------------------------------------
// Stage definitions — maps backend status + sections_generated to 6 stages
// ---------------------------------------------------------------------------

const BATCH_1_SECTIONS = [
  "brand_overview",
  "seo_analysis",
  "technical_analysis",
  "ai_geo_analysis",
  "issue_checks",
];

const BATCH_2_SECTIONS = ["social_media_discovery", "competitor_discovery"];
const BATCH_3_SECTIONS = ["social_analysis"];
const BATCH_4_SECTIONS = ["brand_summary"];

interface Stage {
  key: string;
  label: string;
  description: string;
  icon: (state: "done" | "active" | "pending") => React.ReactNode;
  /** Returns true if this stage is fully done */
  isDone: (status: string, sections: string[]) => boolean;
  /** Returns true if this stage is currently active */
  isActive: (status: string, sections: string[]) => boolean;
}

const STAGES: Stage[] = [
  {
    key: "identify",
    label: "Identifying",
    description: "Detecting brand category",
    icon: (s) => <IdentifyIcon state={s} />,
    isDone: (status) => !["queued", "classifying"].includes(status),
    isActive: (status) => ["queued", "classifying"].includes(status),
  },
  {
    key: "crawl",
    label: "Crawling",
    description: "Scraping your website pages",
    icon: (s) => <CrawlIcon state={s} />,
    isDone: (status) => !["queued", "classifying", "scraping"].includes(status),
    isActive: (status) => status === "scraping",
  },
  {
    key: "analyze",
    label: "Analysing",
    description: "SEO, tech, overview & issues",
    icon: (s) => <AnalyzeIcon state={s} />,
    isDone: (_status, sections) => BATCH_1_SECTIONS.every((s) => sections.includes(s)),
    isActive: (status, sections) =>
      status === "analyzing" && !BATCH_1_SECTIONS.every((s) => sections.includes(s)),
  },
  {
    key: "discover",
    label: "Discovering",
    description: "Social profiles & competitors",
    icon: (s) => <DiscoverIcon state={s} />,
    isDone: (_status, sections) => BATCH_2_SECTIONS.every((s) => sections.includes(s)),
    isActive: (_status, sections) =>
      BATCH_1_SECTIONS.every((s) => sections.includes(s)) &&
      !BATCH_2_SECTIONS.every((s) => sections.includes(s)),
  },
  {
    key: "deep",
    label: "Deep analysis",
    description: "Social presence analysis",
    icon: (s) => <DeepAnalyzeIcon state={s} />,
    isDone: (_status, sections) => BATCH_3_SECTIONS.every((s) => sections.includes(s)),
    isActive: (_status, sections) =>
      BATCH_2_SECTIONS.every((s) => sections.includes(s)) &&
      !BATCH_3_SECTIONS.every((s) => sections.includes(s)),
  },
  {
    key: "finalize",
    label: "Finalising",
    description: "Compiling brand summary",
    icon: (s) => <FinalizeIcon state={s} />,
    isDone: (status) => status === "complete",
    isActive: (_status, sections) =>
      BATCH_3_SECTIONS.every((s) => sections.includes(s)) &&
      !BATCH_4_SECTIONS.every((s) => sections.includes(s)),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface BrandProgressScreenProps {
  status: string;
  currentStep?: string | null;
  sectionsGenerated?: string[];
  brandName?: string | null;
  brandUrl?: string | null;
  brandLogoUrl?: string | null;
  errorMessage?: string | null;
  onRetry?: () => void;
  onResume?: () => void;
  retrying?: boolean;
  hasCheckpoint?: boolean;
}

export function BrandProgressScreen({
  status,
  currentStep,
  sectionsGenerated = [],
  brandName,
  brandUrl,
  brandLogoUrl,
  errorMessage,
  onRetry,
  onResume,
  retrying,
  hasCheckpoint,
}: BrandProgressScreenProps) {
  const [logoError, setLogoError] = useState(false);
  const isFailed = status === "failed";
  const isComplete = status === "complete";

  // Progress: 2 pre-phases + 9 sections = 11 total checkpoints
  const prePhasesDone =
    (["queued", "classifying"].includes(status) ? 0 : 1) +
    (["queued", "classifying", "scraping"].includes(status) ? 0 : 1);
  const progressCount = prePhasesDone + sectionsGenerated.length;
  const progressPct = isComplete ? 100 : Math.round((progressCount / 11) * 100);

  // Brand domain for favicon fallback
  const domain = brandUrl
    ? (() => {
        try {
          return new URL(brandUrl).hostname;
        } catch {
          return "";
        }
      })()
    : "";

  const logoSrc = !logoError && brandLogoUrl
    ? brandLogoUrl
    : domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    : null;

  const initial = (brandName || brandUrl || "B").charAt(0).toUpperCase();

  return (
    <div className="max-w-md mx-auto">
      {/* Brand identity */}
      <div className="flex items-center gap-4 mb-8">
        {logoSrc ? (
          <img
            src={logoSrc}
            alt=""
            width={48}
            height={48}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-2)] object-contain"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div
            className="w-12 h-12 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-2)] flex items-center justify-center text-lg font-bold text-[var(--accent-amber)]"
          >
            {initial}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[var(--text-1)] truncate">
            {brandName || brandUrl || "Your Brand"}
          </h2>
          {brandUrl && (
            <p className="text-xs text-[var(--text-3)] truncate">{domain}</p>
          )}
        </div>
      </div>

      {/* Stage list */}
      <div className="flex flex-col gap-2 mb-8">
        {STAGES.map((stage) => {
          const done = stage.isDone(status, sectionsGenerated);
          const active = !done && stage.isActive(status, sectionsGenerated);
          const iconState = done ? "done" : active ? "active" : "pending";

          return (
            <div
              key={stage.key}
              className={`flex items-center gap-4 pl-3 pr-4 py-3 rounded-xl border transition-all duration-300 ${
                active
                  ? "border-[var(--accent-amber)]/60 bg-[var(--bg-2)]"
                  : done
                  ? "border-emerald-800/30 bg-emerald-950/10"
                  : "border-[var(--border-subtle)] bg-[var(--bg-1)] opacity-40"
              }`}
            >
              <div className="shrink-0">{stage.icon(iconState)}</div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold ${
                    active
                      ? "text-[var(--text-1)]"
                      : done
                      ? "text-emerald-300"
                      : "text-[var(--text-3)]"
                  }`}
                >
                  {stage.label}
                </p>
                <p className="text-[11px] text-[var(--text-3)] truncate">{stage.description}</p>
              </div>
              <div className="shrink-0">
                {done ? (
                  <CheckCircle size={16} className="text-emerald-400" />
                ) : active ? (
                  <Loader2 size={16} className="text-[var(--accent-amber)] animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-[var(--border-default)]" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      {!isFailed && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-[var(--text-3)]">
              {isComplete
                ? "Analysis complete"
                : currentStep || "Working…"}
            </span>
            <span className="text-xs font-mono text-[var(--text-3)]">{progressPct}%</span>
          </div>
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: "var(--bg-0)" }}
          >
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isComplete ? "bg-emerald-400" : "bg-[var(--accent-amber)]"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {sectionsGenerated.length > 0 && !isComplete && (
            <p className="text-[11px] text-[var(--text-3)] mt-2">
              {sectionsGenerated.length} of 9 sections complete
            </p>
          )}
        </div>
      )}

      {/* Time hint */}
      {!isFailed && !isComplete && (
        <p className="text-xs text-[var(--text-3)] text-center mt-4">
          This usually takes 30–90 seconds
        </p>
      )}

      {/* Failed state */}
      {isFailed && (
        <div className="flex flex-col items-center gap-4 mt-4 text-center">
          <XCircle size={28} className="text-red-400" />
          <div>
            <p className="text-sm font-medium text-[var(--text-2)]">Analysis failed</p>
            {errorMessage && (
              <p className="text-xs text-[var(--text-3)] mt-1 max-w-sm">{errorMessage}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {hasCheckpoint && onResume && (
              <button
                onClick={onResume}
                disabled={retrying}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
              >
                {retrying ? <Loader2 size={13} className="animate-spin" /> : null}
                Resume (free)
              </button>
            )}
            {onRetry && (
              <button
                onClick={onRetry}
                disabled={retrying}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-amber)] text-[#0b0f14] text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
              >
                {retrying ? <Loader2 size={13} className="animate-spin" /> : null}
                Retry (75 cr)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
