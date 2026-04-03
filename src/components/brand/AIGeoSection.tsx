"use client";

import { Brain, Globe } from "lucide-react";

// ---------------------------------------------------------------------------
// AIGeoSection — AI readiness + Geo targeting
// Consumes analysis.ai_geo_analysis
// ---------------------------------------------------------------------------

interface AIReadiness {
  overall?: string | null;
  structured_data_quality?: string | null;
  faq_schema?: boolean | null;
  howto_schema?: boolean | null;
  entity_disambiguation?: string | null;
  knowledge_panel_signals?: string | null;
  llm_citation_likelihood?: string | null;
  recommendations?: string[];
}

interface GeoTargeting {
  multi_region?: boolean | null;
  hreflang_detected?: boolean | null;
  regions_targeted?: string[];
  local_business_schema?: boolean | null;
  local_seo_signal?: string | null;
  notes?: string | null;
}

interface AIGeoSectionProps {
  data: {
    ai_readiness?: AIReadiness | null;
    geo_targeting?: GeoTargeting | null;
    data_gaps?: string[];
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function signalColor(val?: string | null) {
  if (!val) return "text-[var(--text-3)]";
  const l = val.toLowerCase();
  if (l === "high" || l === "strong" || l === "comprehensive") return "text-emerald-400";
  if (l === "low" || l === "weak" || l === "none") return "text-red-400";
  return "text-amber-400";
}

function BoolRow({ label, value }: { label: string; value?: boolean | null }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-0 text-xs" style={{ borderColor: "var(--border-subtle)" }}>
      <span className="text-[var(--text-3)]">{label}</span>
      <span className={value ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
        {value ? "Yes" : "No"}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AIGeoSection({ data }: AIGeoSectionProps) {
  const ai = data.ai_readiness;
  const geo = data.geo_targeting;

  if (!ai && !geo) return null;

  return (
    <div id="ai-geo" className="flex flex-col gap-5 scroll-mt-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* AI Readiness card */}
        {ai && (
          <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Brain size={13} className="text-[var(--accent-cyan)]" />
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">AI Readiness</p>
              {ai.overall && (
                <span className={`ml-auto text-xs font-bold ${signalColor(ai.overall)}`}>{ai.overall}</span>
              )}
            </div>

            {/* Key signals */}
            <div className="mb-3">
              {ai.llm_citation_likelihood && (
                <div className="flex items-center justify-between py-1.5 border-b text-xs" style={{ borderColor: "var(--border-subtle)" }}>
                  <span className="text-[var(--text-3)]">LLM citation likelihood</span>
                  <span className={`font-semibold ${signalColor(ai.llm_citation_likelihood)}`}>{ai.llm_citation_likelihood}</span>
                </div>
              )}
              {ai.structured_data_quality && (
                <div className="flex items-center justify-between py-1.5 border-b text-xs" style={{ borderColor: "var(--border-subtle)" }}>
                  <span className="text-[var(--text-3)]">Structured data quality</span>
                  <span className={`font-semibold ${signalColor(ai.structured_data_quality)}`}>{ai.structured_data_quality}</span>
                </div>
              )}
              {ai.entity_disambiguation && (
                <div className="flex items-center justify-between py-1.5 border-b text-xs" style={{ borderColor: "var(--border-subtle)" }}>
                  <span className="text-[var(--text-3)]">Entity disambiguation</span>
                  <span className={`font-semibold ${signalColor(ai.entity_disambiguation)}`}>{ai.entity_disambiguation}</span>
                </div>
              )}
              <BoolRow label="FAQ schema" value={ai.faq_schema} />
              <BoolRow label="HowTo schema" value={ai.howto_schema} />
            </div>

            {ai.knowledge_panel_signals && (
              <p className="text-xs text-[var(--text-3)] italic mb-3">{ai.knowledge_panel_signals}</p>
            )}

            {ai.recommendations && ai.recommendations.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)] mb-2">Recommendations</p>
                <ol className="flex flex-col gap-1.5">
                  {ai.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-2)]">
                      <span className="shrink-0 font-bold text-[var(--accent-cyan)]">{i + 1}.</span>
                      {rec}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Geo Targeting card */}
        {geo && (
          <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Globe size={13} className="text-[var(--accent-amber)]" />
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">Geo Targeting</p>
              {geo.local_seo_signal && (
                <span className={`ml-auto text-xs font-bold ${signalColor(geo.local_seo_signal)}`}>{geo.local_seo_signal}</span>
              )}
            </div>

            <div className="mb-3">
              <BoolRow label="Multi-region" value={geo.multi_region} />
              <BoolRow label="Hreflang detected" value={geo.hreflang_detected} />
              <BoolRow label="Local business schema" value={geo.local_business_schema} />
            </div>

            {geo.regions_targeted && geo.regions_targeted.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)] mb-2">Regions Targeted</p>
                <div className="flex flex-wrap gap-1.5">
                  {geo.regions_targeted.map((region, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[11px] border" style={{ background: "var(--bg-2)", borderColor: "var(--border-subtle)", color: "var(--text-2)" }}>
                      {region}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {geo.notes && (
              <p className="text-xs text-[var(--text-3)] italic">{geo.notes}</p>
            )}
          </div>
        )}
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
