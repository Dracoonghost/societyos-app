"use client";

// ---------------------------------------------------------------------------
// PerformanceGauges — Lighthouse scores + Core Web Vitals
// Consumes extracted_signals.pagespeed from the backend
// ---------------------------------------------------------------------------

interface LighthouseScores {
  performance?: number | null;
  accessibility?: number | null;
  best_practices?: number | null;
  seo?: number | null;
}

interface CoreWebVitals {
  lcp?: string | null;  // Largest Contentful Paint
  fid?: string | null;  // First Input Delay (deprecated, kept for compat)
  inp?: string | null;  // Interaction to Next Paint
  cls?: string | null;  // Cumulative Layout Shift
  fcp?: string | null;  // First Contentful Paint
  ttfb?: string | null; // Time to First Byte
  speed_index?: string | null;
  tbt?: string | null;  // Total Blocking Time
}

interface PagespeedData {
  lighthouse_scores?: LighthouseScores | null;
  core_web_vitals?: CoreWebVitals | null;
  page_url?: string | null;
  strategy?: string | null;
}

interface PerformanceGaugesProps {
  pagespeed?: PagespeedData | null;
}

// ---------------------------------------------------------------------------
// Circular SVG gauge
// ---------------------------------------------------------------------------

function scoreColor(score?: number | null): string {
  if (score === null || score === undefined) return "#6b7280";
  if (score >= 90) return "#34d399"; // emerald
  if (score >= 50) return "#fbbf24"; // amber
  return "#f87171"; // red
}

function scoreLabel(score?: number | null): string {
  if (score === null || score === undefined) return "—";
  if (score >= 90) return "Good";
  if (score >= 50) return "Needs improvement";
  return "Poor";
}

function Gauge({ score, label }: { score?: number | null; label: string }) {
  const size = 88;
  const cx = size / 2;
  const r = 34;
  const circumference = 2 * Math.PI * r;
  const pct = score !== null && score !== undefined ? score / 100 : 0;
  const dash = pct * circumference;
  const color = scoreColor(score);
  const displayScore = score !== null && score !== undefined ? Math.round(score) : null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle
            cx={cx} cy={cx} r={r}
            fill="none"
            strokeWidth={7}
            stroke="rgba(255,255,255,0.06)"
          />
          {/* Arc */}
          <circle
            cx={cx} cy={cx} r={r}
            fill="none"
            strokeWidth={7}
            stroke={color}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ transition: "stroke-dasharray 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold" style={{ color }}>
            {displayScore ?? "—"}
          </span>
        </div>
      </div>
      <p className="text-[11px] font-semibold text-center text-[var(--text-2)]">{label}</p>
      {score !== null && score !== undefined && (
        <p className="text-[10px] text-[var(--text-3)]">{scoreLabel(score)}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CWV table row
// ---------------------------------------------------------------------------

function cwvPass(val: string | null | undefined): boolean | null {
  if (!val) return null;
  const n = parseFloat(val);
  if (isNaN(n)) return null;
  return n <= 2.5; // rough heuristic for "fast" signals
}

function CWVRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "var(--border-subtle)" }}>
      <span className="text-xs text-[var(--text-3)]">{label}</span>
      <span className="text-xs font-semibold text-[var(--text-1)]">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function PerformanceGauges({ pagespeed }: PerformanceGaugesProps) {
  if (!pagespeed) return null;
  const scores = pagespeed.lighthouse_scores;
  const cwv = pagespeed.core_web_vitals;

  const hasScores = scores && Object.values(scores).some((v) => v !== null && v !== undefined);
  const hasCwv = cwv && Object.values(cwv).some((v) => v !== null && v !== undefined);

  if (!hasScores && !hasCwv) return null;

  return (
    <div id="performance" className="flex flex-col gap-5 scroll-mt-20">
      {/* Lighthouse gauges */}
      {hasScores && (
        <div className="rounded-xl p-6 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">Lighthouse Scores</p>
              {pagespeed.strategy && (
                <p className="text-[10px] text-[var(--text-3)] mt-0.5 capitalize">{pagespeed.strategy}</p>
              )}
            </div>
            {pagespeed.page_url && (
              <a href={pagespeed.page_url} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-[var(--accent-cyan)] hover:underline truncate max-w-xs">
                {pagespeed.page_url}
              </a>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 justify-items-center">
            <Gauge score={scores?.performance} label="Performance" />
            <Gauge score={scores?.accessibility} label="Accessibility" />
            <Gauge score={scores?.best_practices} label="Best Practices" />
            <Gauge score={scores?.seo} label="SEO" />
          </div>
        </div>
      )}

      {/* Core Web Vitals */}
      {hasCwv && (
        <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)] mb-3">Core Web Vitals</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            <div>
              <CWVRow label="LCP — Largest Contentful Paint" value={cwv?.lcp} />
              <CWVRow label="INP — Interaction to Next Paint" value={cwv?.inp} />
              <CWVRow label="CLS — Cumulative Layout Shift" value={cwv?.cls} />
            </div>
            <div>
              <CWVRow label="FCP — First Contentful Paint" value={cwv?.fcp} />
              <CWVRow label="TBT — Total Blocking Time" value={cwv?.tbt} />
              <CWVRow label="TTFB — Time to First Byte" value={cwv?.ttfb} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
