"use client";

import { TrendingUp, AlertTriangle, CheckCircle2, Info, ExternalLink } from "lucide-react";

// ---------------------------------------------------------------------------
// Types matching BRAND_SECTION_SCHEMAS["seo_analysis"]
// ---------------------------------------------------------------------------

interface SEOReportProps {
  data: {
    overall_seo_signal?: string | null;
    title_tags?: { has_title_tags?: boolean; quality?: string; notes?: string } | null;
    meta_descriptions?: { coverage?: string; quality?: string; notes?: string } | null;
    heading_structure?: { h1_usage?: string; notes?: string } | null;
    keyword_strategy_signals?: {
      primary_keywords?: string[];
      content_clusters?: string[];
      seo_wedge?: string | null;
    } | null;
    structured_data?: {
      schemas_detected?: string[];
      coverage?: string;
      missing_opportunities?: string[];
    } | null;
    content_quality?: {
      signal?: string;
      avg_depth_signal?: string;
      blog_or_content_hub?: boolean;
      notes?: string;
    } | null;
    internal_linking?: { signal?: string; notes?: string } | null;
    content_gaps?: string[];
    top_seo_recommendations?: (string | { recommendation?: string; priority?: string; impact?: string; [key: string]: unknown })[];
    data_gaps?: string[];
  };
  /** Deterministic count from sitemap fetch — passed from extracted_signals.seo_signals */
  sitemapRouteCount?: number | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function signalColor(val?: string | null) {
  if (!val) return "text-[var(--text-3)]";
  const l = val.toLowerCase();
  if (l.includes("strong") || l.includes("high") || l.includes("complete") || l.includes("good")) return "text-emerald-400";
  if (l.includes("weak") || l.includes("low") || l.includes("missing") || l.includes("none") || l.includes("poor")) return "text-red-400";
  return "text-amber-400";
}

function SignalBool({ label, value, notes }: { label: string; value?: boolean | null; notes?: string }) {
  const icon = value === true
    ? <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
    : value === false
      ? <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
      : <Info size={14} className="text-[var(--text-3)] mt-0.5 shrink-0" />;
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
      {icon}
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">{label}</p>
        {notes && <p className="text-xs text-[var(--text-2)] mt-0.5 leading-relaxed">{notes}</p>}
        {value === null || value === undefined ? <p className="text-xs text-[var(--text-3)] mt-0.5">Unknown</p> : null}
      </div>
    </div>
  );
}

function SignalText({ label, value, notes }: { label: string; value?: string | null; notes?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
      <Info size={14} className={`${signalColor(value)} mt-0.5 shrink-0`} />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">{label}</p>
        <p className={`text-sm font-medium mt-0.5 ${signalColor(value)}`}>{value}</p>
        {notes && <p className="text-xs text-[var(--text-2)] mt-0.5 leading-relaxed">{notes}</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SEOReport({ data, sitemapRouteCount }: SEOReportProps) {
  const kw = data.keyword_strategy_signals;
  const sd = data.structured_data;

  return (
    <div id="seo" className="flex flex-col gap-6 scroll-mt-20">
      {/* Overall */}
      {data.overall_seo_signal && (
        <div className="rounded-xl p-5 border flex items-center gap-4" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
          <TrendingUp size={20} className={signalColor(data.overall_seo_signal)} />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">Overall SEO Signal</p>
            <p className={`text-lg font-bold mt-0.5 ${signalColor(data.overall_seo_signal)}`}>{data.overall_seo_signal}</p>
          </div>
        </div>
      )}

      {/* On-page signals grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SignalBool label="Title Tags" value={data.title_tags?.has_title_tags} notes={`Quality: ${data.title_tags?.quality ?? "—"}${data.title_tags?.notes ? " · " + data.title_tags.notes : ""}`} />
        <SignalText label="Meta Descriptions" value={data.meta_descriptions?.coverage} notes={`Quality: ${data.meta_descriptions?.quality ?? "—"}${data.meta_descriptions?.notes ? " · " + data.meta_descriptions.notes : ""}`} />
        <SignalText label="Heading Structure (H1)" value={data.heading_structure?.h1_usage} notes={data.heading_structure?.notes} />
        <SignalText label="Internal Linking" value={data.internal_linking?.signal} notes={data.internal_linking?.notes} />
        <SignalText label="Content Quality" value={data.content_quality?.signal} notes={[data.content_quality?.avg_depth_signal, data.content_quality?.notes].filter(Boolean).join(" · ")} />
        <SignalBool
          label="Sitemap"
          value={sitemapRouteCount != null ? sitemapRouteCount > 0 : null}
          notes={sitemapRouteCount != null && sitemapRouteCount > 0 ? `${sitemapRouteCount} URLs indexed` : undefined}
        />
      </div>

      {/* Keywords */}
      {kw && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kw.primary_keywords && kw.primary_keywords.length > 0 && (
            <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)] mb-3">Primary Keywords</p>
              <div className="flex flex-wrap gap-2">
                {kw.primary_keywords.map((kw2, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium border text-[var(--accent-amber)]" style={{ background: "rgba(242,169,59,0.08)", borderColor: "rgba(242,169,59,0.2)" }}>
                    {kw2}
                  </span>
                ))}
              </div>
            </div>
          )}
          {kw.content_clusters && kw.content_clusters.length > 0 && (
            <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)] mb-3">Content Clusters</p>
              <div className="flex flex-wrap gap-2">
                {kw.content_clusters.map((c, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium border text-[var(--accent-cyan)]" style={{ background: "rgba(88,184,216,0.08)", borderColor: "rgba(88,184,216,0.2)" }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
          {kw.seo_wedge && (
            <div className="rounded-xl p-5 border md:col-span-2" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)] mb-1">SEO Wedge</p>
              <p className="text-sm text-[var(--text-2)]">{kw.seo_wedge}</p>
            </div>
          )}
        </div>
      )}

      {/* Structured data */}
      {sd && (
        <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">Structured Data</p>
            {sd.coverage && <span className={`text-xs font-semibold ${signalColor(sd.coverage)}`}>{sd.coverage}</span>}
          </div>
          {sd.schemas_detected && sd.schemas_detected.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {sd.schemas_detected.map((s, i) => (
                <span key={i} className="px-2 py-0.5 rounded text-[11px] font-medium border" style={{ background: "var(--bg-2)", borderColor: "var(--border-default)", color: "var(--text-2)" }}>
                  {s}
                </span>
              ))}
            </div>
          )}
          {sd.missing_opportunities && sd.missing_opportunities.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 mb-1.5">Missing Opportunities</p>
              <div className="flex flex-wrap gap-1.5">
                {sd.missing_opportunities.map((m, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[11px] font-medium border text-amber-400" style={{ background: "rgba(251,191,36,0.08)", borderColor: "rgba(251,191,36,0.2)" }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {data.top_seo_recommendations && data.top_seo_recommendations.length > 0 && (
        <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-cyan)] mb-3">Top Recommendations</p>
          <ol className="flex flex-col gap-2">
            {data.top_seo_recommendations.map((rec, i) => {
              const text = typeof rec === "string" ? rec : (rec.recommendation ?? rec.impact ?? Object.values(rec).find(v => typeof v === "string") ?? "");
              return (
                <li key={i} className="flex items-start gap-3 text-sm text-[var(--text-2)]">
                  <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-[var(--accent-cyan)]" style={{ background: "rgba(88,184,216,0.12)" }}>
                    {i + 1}
                  </span>
                  {text}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Content gaps */}
      {data.content_gaps && data.content_gaps.length > 0 && (
        <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3">Content Gaps</p>
          <ul className="flex flex-col gap-1.5">
            {data.content_gaps.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-2)]">
                <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-400" />
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}

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
