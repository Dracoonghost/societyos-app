"use client";

import { CheckCircle2, AlertTriangle, ShieldCheck, Smartphone, Zap, Eye } from "lucide-react";

// ---------------------------------------------------------------------------
// Types matching BRAND_SECTION_SCHEMAS["technical_analysis"]
// ---------------------------------------------------------------------------

interface TechStack {
  frontend_framework?: string | null;
  cms?: string | null;
  ecommerce_platform?: string | null;
  analytics?: string[];
  tag_managers?: string[];
  cdn?: string | null;
  hosting_signals?: string | null;
  other_tools?: string[];
}

interface TechReportProps {
  data: {
    tech_stack?: TechStack | null;
    performance_signals?: { overall?: string; uses_lazy_loading?: boolean; uses_image_optimization?: boolean; uses_caching_headers?: boolean; notes?: string } | null;
    security_signals?: { https?: boolean; security_headers_signal?: string; csp_present?: boolean; hsts_present?: boolean; notes?: string } | null;
    mobile_signals?: { appears_responsive?: boolean; viewport_meta?: boolean; notes?: string } | null;
    accessibility_signals?: { signal?: string; notes?: string } | null;
    notable_integrations?: string[];
    technical_strengths?: string[];
    technical_concerns?: string[];
    data_gaps?: string[];
  };
  /** Extracted signals from rawData — detected technologies list + security grade */
  extractedTech?: {
    all_detected_technologies?: string[];
    security?: { grade?: string; score?: number } | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function signalColor(val?: string | null) {
  if (!val) return "text-[var(--text-3)]";
  const l = val.toLowerCase();
  if (l.includes("fast") || l.includes("strong") || l.includes("good") || l.includes("high")) return "text-emerald-400";
  if (l.includes("slow") || l.includes("weak") || l.includes("poor") || l.includes("missing")) return "text-red-400";
  return "text-amber-400";
}

function BoolCheck({ label, value, notes }: { label: string; value?: boolean | null; notes?: string }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border" style={{ background: "var(--bg-2)", borderColor: "var(--border-subtle)" }}>
      <span className="text-xs text-[var(--text-2)]">{label}{notes ? <span className="text-[var(--text-3)] ml-1 font-normal">· {notes}</span> : null}</span>
      {value
        ? <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
        : <AlertTriangle size={13} className="text-red-400 shrink-0" />
      }
    </div>
  );
}

function chipColor(tech: string) {
  const l = tech.toLowerCase();
  if (l.includes("react") || l.includes("next")) return { bg: "rgba(88,184,216,0.1)", border: "rgba(88,184,216,0.2)" };
  if (l.includes("shopify") || l.includes("vue")) return { bg: "rgba(56,178,125,0.1)", border: "rgba(56,178,125,0.2)" };
  if (l.includes("wordpress") || l.includes("stripe")) return { bg: "rgba(88,184,216,0.1)", border: "rgba(88,184,216,0.2)" };
  if (l.includes("google") || l.includes("analytics")) return { bg: "rgba(242,169,59,0.1)", border: "rgba(242,169,59,0.2)" };
  return { bg: "var(--bg-2)", border: "var(--border-subtle)" };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TechReport({ data, extractedTech }: TechReportProps) {
  const ts = data.tech_stack;
  const perf = data.performance_signals;
  const sec = data.security_signals;
  const mob = data.mobile_signals;
  const a11y = data.accessibility_signals;

  // Build full tech list for the detected chips section
  const allTech: string[] = extractedTech?.all_detected_technologies?.length
    ? extractedTech.all_detected_technologies
    : [
        ts?.frontend_framework,
        ts?.cms,
        ts?.ecommerce_platform,
        ts?.cdn,
        ts?.hosting_signals,
        ...(ts?.analytics ?? []),
        ...(ts?.tag_managers ?? []),
        ...(ts?.other_tools ?? []),
      ].filter(Boolean) as string[];

  return (
    <div id="technical" className="flex flex-col gap-6 scroll-mt-20">
      {/* Detected technologies */}
      {allTech.length > 0 && (
        <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)] mb-3">Detected Technologies</p>
          <div className="flex flex-wrap gap-2">
            {allTech.map((tech, i) => {
              const c = chipColor(tech);
              return (
                <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-medium border" style={{ background: c.bg, borderColor: c.border, color: "var(--text-1)" }}>
                  {tech}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Tech stack breakdown */}
      {ts && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Framework", value: ts.frontend_framework },
            { label: "CMS", value: ts.cms },
            { label: "E-commerce", value: ts.ecommerce_platform },
            { label: "CDN", value: ts.cdn },
            { label: "Hosting", value: ts.hosting_signals },
            { label: "Analytics", value: ts.analytics?.join(", ") },
          ].filter(({ value }) => !!value).map(({ label, value }) => (
            <div key={label} className="rounded-xl p-4 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)] mb-1">{label}</p>
              <p className="text-sm font-medium text-[var(--text-1)]">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Signal cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Performance */}
        {perf && (
          <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={13} className={signalColor(perf.overall)} />
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">Performance</p>
              {perf.overall && <span className={`ml-auto text-xs font-bold ${signalColor(perf.overall)}`}>{perf.overall}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <BoolCheck label="Lazy loading" value={perf.uses_lazy_loading} />
              <BoolCheck label="Image optimisation" value={perf.uses_image_optimization} />
              <BoolCheck label="Caching headers" value={perf.uses_caching_headers} />
              {perf.notes && <p className="text-xs text-[var(--text-3)] mt-1">{perf.notes}</p>}
            </div>
          </div>
        )}

        {/* Security */}
        {sec && (
          <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={13} className={signalColor(sec.security_headers_signal)} />
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">Security</p>
              {extractedTech?.security?.grade && (
                <span className="ml-auto text-xs font-bold text-[var(--accent-cyan)]">Grade {extractedTech.security.grade}</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <BoolCheck label="HTTPS" value={sec.https} />
              <BoolCheck label="CSP header" value={sec.csp_present} />
              <BoolCheck label="HSTS" value={sec.hsts_present} />
              {sec.notes && <p className="text-xs text-[var(--text-3)] mt-1">{sec.notes}</p>}
            </div>
          </div>
        )}

        {/* Mobile */}
        {mob && (
          <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Smartphone size={13} className="text-[var(--accent-cyan)]" />
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">Mobile</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <BoolCheck label="Responsive design" value={mob.appears_responsive} />
              <BoolCheck label="Viewport meta" value={mob.viewport_meta} />
              {mob.notes && <p className="text-xs text-[var(--text-3)] mt-1">{mob.notes}</p>}
            </div>
          </div>
        )}

        {/* Accessibility */}
        {a11y && (
          <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Eye size={13} className={signalColor(a11y.signal)} />
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">Accessibility</p>
              {a11y.signal && <span className={`ml-auto text-xs font-bold ${signalColor(a11y.signal)}`}>{a11y.signal}</span>}
            </div>
            {a11y.notes && <p className="text-xs text-[var(--text-2)]">{a11y.notes}</p>}
          </div>
        )}
      </div>

      {/* Notable integrations */}
      {data.notable_integrations && data.notable_integrations.length > 0 && (
        <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)] mb-3">Notable Integrations</p>
          <div className="flex flex-wrap gap-2">
            {data.notable_integrations.map((int, i) => (
              <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-medium border" style={{ background: "var(--bg-2)", borderColor: "var(--border-subtle)", color: "var(--text-1)" }}>
                {int}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Strengths / concerns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.technical_strengths && data.technical_strengths.length > 0 && (
          <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3">Technical Strengths</p>
            <ul className="flex flex-col gap-1.5">
              {data.technical_strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-2)]">
                  <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-400" />{s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.technical_concerns && data.technical_concerns.length > 0 && (
          <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-3">Technical Concerns</p>
            <ul className="flex flex-col gap-1.5">
              {data.technical_concerns.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-2)]">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0 text-red-400" />{c}
                </li>
              ))}
            </ul>
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
