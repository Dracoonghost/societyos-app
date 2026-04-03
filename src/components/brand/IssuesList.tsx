"use client";

import { useState } from "react";
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp } from "lucide-react";

// ---------------------------------------------------------------------------
// Types matching BRAND_SECTION_SCHEMAS["issue_checks"]
// ---------------------------------------------------------------------------

interface Issue {
  issue: string;
  description?: string;
  recommendation?: string;
}

interface IssuesData {
  critical?: Issue[];
  warnings?: Issue[];
  info?: Issue[];
  overall_health_signal?: string;
  data_gaps?: string[];
}

interface IssuesListProps {
  data: IssuesData;
}

type Severity = "all" | "critical" | "warning" | "info";

function IssueRow({ issue, severity }: { issue: Issue; severity: Severity }) {
  const [open, setOpen] = useState(false);
  const colors = {
    critical: { border: "rgba(239,68,68,0.2)", bg: "rgba(239,68,68,0.06)", icon: "text-red-400", label: "Critical" },
    warning: { border: "rgba(251,191,36,0.2)", bg: "rgba(251,191,36,0.06)", icon: "text-amber-400", label: "Warning" },
    info: { border: "rgba(88,184,216,0.2)", bg: "rgba(88,184,216,0.06)", icon: "text-[var(--accent-cyan)]", label: "Info" },
    all: { border: "var(--border-subtle)", bg: "var(--bg-1)", icon: "text-[var(--text-3)]", label: "" },
  }[severity];

  const Icon = severity === "critical" ? AlertCircle : severity === "warning" ? AlertTriangle : Info;
  const hasExtra = !!(issue.description || issue.recommendation);

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: colors.border, background: colors.bg }}
    >
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => hasExtra && setOpen(!open)}
        disabled={!hasExtra}
      >
        <Icon size={14} className={colors.icon + " shrink-0"} />
        <p className="flex-1 text-sm text-[var(--text-1)] font-medium">{issue.issue}</p>
        {hasExtra && (open ? <ChevronUp size={14} className="shrink-0 text-[var(--text-3)]" /> : <ChevronDown size={14} className="shrink-0 text-[var(--text-3)]" />)}
      </button>
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-2 border-t" style={{ borderColor: colors.border }}>
          {issue.description && (
            <div className="pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)] mb-1">Description</p>
              <p className="text-sm text-[var(--text-2)]">{issue.description}</p>
            </div>
          )}
          {issue.recommendation && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 mb-1">Recommendation</p>
              <p className="text-sm text-[var(--text-2)]">{issue.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function IssuesList({ data }: IssuesListProps) {
  const [filter, setFilter] = useState<Severity>("all");

  const criticalCount = data.critical?.length ?? 0;
  const warningCount = data.warnings?.length ?? 0;
  const infoCount = data.info?.length ?? 0;

  const tabs: { key: Severity; label: string; count: number; color: string }[] = [
    { key: "all", label: "All", count: criticalCount + warningCount + infoCount, color: "text-[var(--text-2)]" },
    { key: "critical", label: "Critical", count: criticalCount, color: "text-red-400" },
    { key: "warning", label: "Warnings", count: warningCount, color: "text-amber-400" },
    { key: "info", label: "Info", count: infoCount, color: "text-[var(--accent-cyan)]" },
  ];

  return (
    <div id="issues" className="flex flex-col gap-5 scroll-mt-20">
      {/* Overall health */}
      {data.overall_health_signal && (
        <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)] mb-1">Overall Health Signal</p>
          <p className="text-sm text-[var(--text-2)]">{data.overall_health_signal}</p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${filter === t.key ? "border-[var(--border-default)] bg-[var(--bg-2)]" : "border-transparent bg-transparent"} ${t.color}`}
          >
            {t.label} <span className="font-normal opacity-70 ml-0.5">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Issues */}
      <div className="flex flex-col gap-2">
        {(filter === "all" || filter === "critical") && data.critical?.map((issue, i) => (
          <IssueRow key={`c-${i}`} issue={issue} severity="critical" />
        ))}
        {(filter === "all" || filter === "warning") && data.warnings?.map((issue, i) => (
          <IssueRow key={`w-${i}`} issue={issue} severity="warning" />
        ))}
        {(filter === "all" || filter === "info") && data.info?.map((issue, i) => (
          <IssueRow key={`i-${i}`} issue={issue} severity="info" />
        ))}
      </div>

      {/* Data gaps */}
      {data.data_gaps && data.data_gaps.length > 0 && (
        <div className="rounded-xl p-4 border border-dashed" style={{ borderColor: "var(--border-subtle)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)] mb-2">Data Gaps</p>
          <ul className="flex flex-col gap-1">
            {data.data_gaps.map((gap, i) => (
              <li key={i} className="text-xs text-[var(--text-3)] flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0 opacity-50">·</span>{gap}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

