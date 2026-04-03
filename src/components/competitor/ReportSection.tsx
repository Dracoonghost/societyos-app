"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, AlertCircle } from "lucide-react";

interface ReportSectionProps {
  title: string;
  icon?: React.ReactNode;
  data: Record<string, unknown> | null | undefined;
  defaultOpen?: boolean;
}

function TagList({ items }: { items: unknown }) {
  if (!Array.isArray(items) || items.length === 0) return <span className="text-[var(--text-3)] text-sm">—</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span
          key={i}
          className="px-2.5 py-1 rounded-md bg-[var(--bg-2)] border border-[var(--border-subtle)] text-xs text-[var(--text-2)]"
        >
          {String(item)}
        </span>
      ))}
    </div>
  );
}

function PricingTiers({ tiers }: { tiers: unknown }) {
  if (!Array.isArray(tiers) || tiers.length === 0) return <span className="text-[var(--text-3)] text-sm">—</span>;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tiers.map((tier: Record<string, unknown>, i: number) => (
        <div key={i} className="p-3 rounded-lg bg-[var(--bg-2)] border border-[var(--border-subtle)]">
          <div className="flex items-baseline justify-between mb-2">
            <span className="font-semibold text-sm text-[var(--text-1)]">{String(tier.name ?? "—")}</span>
            <span className="text-[var(--accent-amber)] text-sm font-bold">{String(tier.price ?? "—")}</span>
          </div>
          {Array.isArray(tier.highlights) && tier.highlights.length > 0 && (
            <ul className="space-y-1">
              {(tier.highlights as string[]).map((h, j) => (
                <li key={j} className="text-xs text-[var(--text-3)] flex gap-1.5">
                  <span className="text-[var(--accent-amber)] shrink-0">·</span>
                  {h}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function SentimentBadge({ value }: { value: string }) {
  const color =
    value === "positive" ? "text-emerald-400 bg-emerald-950/40 border-emerald-800/40" :
    value === "negative" ? "text-red-400 bg-red-950/40 border-red-800/40" :
    "text-yellow-400 bg-yellow-950/40 border-yellow-800/40";
  return (
    <span className={`px-2.5 py-1 rounded-md border text-xs font-semibold uppercase tracking-wide ${color}`}>
      {value}
    </span>
  );
}

function ObjectGrid({ obj }: { obj: Record<string, unknown> }) {
  const entries = Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (entries.length === 0) return <span className="text-[var(--text-3)] text-sm">—</span>;
  return (
    <div className="grid gap-1.5">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-baseline gap-2">
          <span className="text-[10px] text-[var(--text-3)] uppercase tracking-wide shrink-0 w-20">{humanize(k)}</span>
          <span className="text-sm text-[var(--text-2)]">
            {Array.isArray(v) ? v.join(", ") || "—" : String(v)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ObjectCardList({ items }: { items: Record<string, unknown>[] }) {
  return (
    <div className="grid gap-2.5">
      {items.map((item, i) => {
        const entries = Object.entries(item).filter(([, v]) => v !== null && v !== undefined && v !== "");
        if (entries.length === 0) return null;
        const [headingKey, headingVal] = entries[0];
        const rest = entries.slice(1);
        return (
          <div
            key={i}
            className="p-3 rounded-lg bg-[var(--bg-2)] border border-[var(--border-subtle)]"
          >
            <p className="text-sm font-semibold text-[var(--text-1)] mb-1">
              {String(headingVal)}
            </p>
            {rest.map(([k, v]) => (
              <p key={k} className="text-xs text-[var(--text-3)] leading-relaxed">
                <span className="text-[var(--text-2)] font-medium">{humanize(k)}:</span>{" "}
                {Array.isArray(v) ? v.join(", ") : String(v)}
              </p>
            ))}
            {rest.length === 0 && (
              <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wide">{humanize(headingKey)}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function renderValue(key: string, value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-[var(--text-3)] text-sm">—</span>;
  }

  // Special renderers
  if (key === "tiers") return <PricingTiers tiers={value} />;
  if (key === "overall" || key === "model") {
    const strVal = String(value);
    if (["positive", "negative", "mixed", "insufficient_data"].includes(strVal)) {
      return <SentimentBadge value={strVal} />;
    }
  }
  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
      return <ObjectCardList items={value as Record<string, unknown>[]} />;
    }
    return <TagList items={value} />;
  }

  // Plain objects (e.g. follower_summary, posting_cadence) — render as inline key-value grid
  if (typeof value === "object" && value !== null) {
    return <ObjectGrid obj={value as Record<string, unknown>} />;
  }

  const strVal = String(value);
  if (strVal.length > 120) {
    return <p className="text-sm text-[var(--text-2)] leading-relaxed">{strVal}</p>;
  }
  return <span className="text-sm text-[var(--text-2)]">{strVal}</span>;
}

function humanize(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ReportSection({ title, icon, data, defaultOpen = true }: ReportSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const hasError = data && typeof data === "object" && "error" in data;

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-1)] overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--bg-2)] transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-[var(--accent-amber)]">{icon}</span>}
          <span className="font-semibold text-sm text-[var(--text-1)]">{title}</span>
          {hasError && <AlertTriangle size={13} className="text-yellow-400" />}
        </div>
        {open ? (
          <ChevronUp size={14} className="text-[var(--text-3)] shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-[var(--text-3)] shrink-0" />
        )}
      </button>

      {/* Body */}
      {open && (
        <div className="px-5 pb-5 border-t border-[var(--border-subtle)]">
          {!data ? (
            /* skeleton while loading */
            <div className="pt-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 rounded bg-[var(--bg-2)] animate-pulse" style={{ width: `${60 + i * 10}%` }} />
              ))}
            </div>
          ) : hasError ? (
            <div className="pt-4 flex items-center gap-2 text-sm text-yellow-400">
              <AlertTriangle size={14} />
              Analysis unavailable for this section
            </div>
          ) : (
            <>
              <dl className="pt-4 grid gap-4">
                {Object.entries(data)
                  .filter(([key]) => key !== "data_gaps")
                  .map(([key, value]) => (
                  <div key={key} className="grid gap-1.5">
                    <dt className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider">
                      {humanize(key)}
                    </dt>
                    <dd>{renderValue(key, value)}</dd>
                  </div>
                ))}
              </dl>
              {Array.isArray(data.data_gaps) && data.data_gaps.length > 0 && (
                <div className="mt-5 rounded-lg p-3.5 flex items-start gap-2.5 border border-[var(--accent-amber)]/20 bg-[var(--accent-amber)]/5">
                  <AlertCircle size={13} className="text-[var(--accent-amber)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-amber)] mb-1.5">
                      Data Gaps
                    </p>
                    <ul className="space-y-1">
                      {(data.data_gaps as string[]).map((gap, i) => (
                        <li key={i} className="text-xs text-[var(--text-3)] flex gap-1.5">
                          <span className="text-[var(--accent-amber)] shrink-0">·</span>
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
