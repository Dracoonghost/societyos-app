"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  FlaskConical,
  Search,
  Building2,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StepStatus = "idle" | "running" | "success" | "error";
interface StepState<T> { status: StepStatus; result: T | null; error: string | null }

interface RouteEntry {
  url: string; path: string; bucket: string;
  score: number; depth: number; reasoning: string[]; selected: boolean;
}
interface FilteredRoute { url: string; reason: string }

interface RouteAnalysisResult {
  domain: string;
  sitemap_method: string; sitemap_url: string | null; sitemap_duration_ms: number;
  sitemap_route_count: number; normalized_route_count: number;
  normalized_cross_domain_dropped: number; normalized_dedup_dropped: number;
  filtered_route_count: number; filtered_out_count: number; important_count: number;
  classified_routes: RouteEntry[]; filtered_out: FilteredRoute[];
  important_routes: string[]; bucket_summary: Record<string, number>;
  total_duration_ms: number;
  config: { importance_threshold: number; depth_penalty_at: number; depth_penalty: number };
  detected_category?: string;
}

interface ShallowMetaResult {
  meta: { url: string; title?: string; h1?: string; description?: string; status_code?: number | null; error?: string | null }[];
  ok: number; total: number; duration_ms: number;
}

interface RescoredRoute {
  url: string; path: string; bucket: string;
  heuristic_score: number; meta_bonus: number; final_score: number;
  keep: boolean; reasoning: string[]; title?: string;
}
interface RescoreResult {
  rescored_routes: RescoredRoute[]; kept_routes: RescoredRoute[]; skipped_routes: RescoredRoute[];
  kept_count: number; skipped_count: number; duration_ms: number;
}

interface RerankedRoute {
  url: string; path: string; bucket: string;
  heuristic_score: number; priority: number; keep: boolean; reasoning: string;
}
interface RerankResult {
  reranked_routes: RerankedRoute[]; kept_routes: RerankedRoute[]; skipped_routes: RerankedRoute[];
  kept_count: number; skipped_count: number; model_used: string;
  fallback: boolean; error?: string; duration_ms: number;
}

interface FetchContentResult {
  pages: Record<string, { method?: string; chars: number; preview: string | null }>;
  audit: {
    total: number; ok: number;
    pages: Array<{ url: string; method?: string; status?: string; chars: number; http_status?: number; error?: string }>;
    duration_ms: number; status: string;
  };
}

interface SerperResult {
  queries_run: number; query_keys: string[];
  results: Record<string, { organic?: { title: string; link: string; snippet: string }[] }>;
  detected_category?: string;
}

interface ScrapingPhaseResult {
  brand_name: string;
  pages_count: number;
  pages_summary: Record<string, { method: string; chars: number }>;
  pages_content: Record<string, string>;
  serper_keys: string[];
  serper_results: Record<string, unknown>;
  github_signals: Record<string, unknown>;
  npm_signals: Record<string, unknown>;
  detected_category?: string;
  audit: Record<string, unknown>;
}

interface SocialDiscoveryResult {
  brand_name: string;
  brand_domain: string;
  platform_results: Record<string, { title: string; link: string; snippet: string }[]>;
  platforms_searched: string[];
  platforms_with_hits: string[];
}

interface CompetitorDiscoveryResult {
  brand_name: string;
  brand_domain: string;
  query_results: Record<string, { title: string; link: string; snippet: string }[]>;
  queries_run: number;
  total_hits: number;
}

interface SynthesisResult {
  section_name: string;
  model_used: string;
  tier: string;
  duration_ms: number;
  result: Record<string, unknown>;
  token_usage: Record<string, number>;
  context_keys_sent: string[];
}

interface ExtractSignalsResult {
  brand_url: string;
  http_status: number;
  seo_signals: {
    title: string | null; title_length: number; title_ok: boolean;
    meta_description: string | null; meta_description_length: number; meta_description_ok: boolean;
    has_canonical: boolean; canonical_url: string | null;
    h1_count: number; h1_texts: string[]; h2_count: number; h2_texts: string[]; h1_ok: boolean;
    has_og_title: boolean; has_og_description: boolean; has_og_image: boolean; has_twitter_card: boolean;
    has_viewport_meta: boolean; robots_meta: string | null; is_indexable: boolean;
    schema_types: string[]; has_faq_schema: boolean; has_product_schema: boolean; has_org_schema: boolean;
    total_images: number; images_with_alt: number; image_alt_coverage_pct: number;
    internal_link_count: number; external_link_count: number;
    hreflang_locales: string[]; is_multilingual: boolean;
    sitemap_route_count: number;
  };
  pagespeed: {
    strategy: string;
    scores: { performance: number | null; accessibility: number | null; best_practices: number | null; seo: number | null };
    core_web_vitals: { lcp_ms: number | null; lcp_display: string | null; cls: number | null; fcp_ms: number | null; tbt_ms: number | null };
    opportunities: { id: string; title: string; savings: string | null }[];
  } | Record<string, never>;
  tech_signals: {
    all_detected_technologies: string[];
    frontend_framework: string | null; cms: string | null; ecommerce_platform: string | null;
    analytics_tools: string[]; other_tools: string[]; cdn: string | null;
    hosting_signal: string | null; powered_by: string | null;
    security: {
      https_signal: boolean; grade: string; score: number;
      headers_present: string[]; hsts: boolean; csp: boolean;
    };
    caching: { cache_control: string | null; uses_etag: boolean };
  };
}

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const BUCKET_STYLES: Record<string, string> = {
  homepage: "text-[var(--accent-amber)] bg-amber-950/30 border-amber-700/40",
  pricing:  "text-emerald-300 bg-emerald-950/30 border-emerald-700/40",
  product:  "text-sky-300 bg-sky-950/30 border-sky-700/40",
  feature:  "text-sky-300 bg-sky-950/30 border-sky-700/40",
  about:    "text-[var(--text-3)] bg-[var(--bg-2)] border-[var(--border-subtle)]",
  docs:     "text-[var(--text-3)] bg-[var(--bg-2)] border-[var(--border-subtle)]",
  other:    "text-[var(--text-3)] bg-[var(--bg-0)] border-[var(--border-subtle)]",
};
const bucketStyle = (b: string) => BUCKET_STYLES[b] ?? BUCKET_STYLES.other;

const scoreBg = (s: number) =>
  s >= 10 ? "text-emerald-300 bg-emerald-950/50"
  : s >= 5 ? "text-amber-300 bg-amber-950/50"
  : s >= 1 ? "text-sky-300 bg-sky-950/50"
  : "text-[var(--text-3)] bg-[var(--bg-2)]";

const BRAND_SECTIONS = [
  "brand_overview", "seo_analysis", "technical_analysis", "ai_geo_analysis",
  "issue_checks", "social_media_discovery", "social_analysis",
  "competitor_discovery", "brand_summary",
] as const;
type BrandSection = typeof BRAND_SECTIONS[number];

// ---------------------------------------------------------------------------
// Shared UI components
// ---------------------------------------------------------------------------

function StepStatusBadge({ status }: { status: StepStatus }) {
  if (status === "idle") return <span className="text-xs text-[var(--text-3)]">idle</span>;
  if (status === "running") return <span className="flex items-center gap-1 text-xs text-amber-400"><Loader2 size={11} className="animate-spin" />running</span>;
  if (status === "success") return <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 size={11} />done</span>;
  return <span className="flex items-center gap-1 text-xs text-red-400"><XCircle size={11} />error</span>;
}

function StatChip({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center px-4 py-2 rounded-lg bg-[var(--bg-0)] border border-[var(--border-subtle)]">
      <span className={`text-sm font-bold font-mono ${accent ? "text-[var(--accent-amber)]" : "text-[var(--text-1)]"}`}>{value}</span>
      <span className="text-[10px] text-[var(--text-3)] mt-0.5">{label}</span>
    </div>
  );
}

function JsonView({ data, label = "Raw JSON" }: { data: unknown; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-xs text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors">
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}{label}
      </button>
      {open && (
        <pre className="mt-2 text-[10px] leading-relaxed text-[var(--text-3)] bg-[var(--bg-0)] rounded-lg p-3 overflow-x-auto max-h-72 scrollbar-thin">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

function StepCard({ number, title, description, status, error, canRun, onRun, children, accent }: {
  number: number | string; title: string; description: string;
  status: StepStatus; error: string | null; canRun: boolean; onRun: () => void;
  children?: React.ReactNode;
  accent?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const border = status === "success" ? "border-emerald-800/40" : status === "error" ? "border-red-800/40" : status === "running" ? "border-amber-800/40" : accent ? "border-[var(--accent-cyan)]/30" : "border-[var(--border-subtle)]";
  const badge = status === "success" ? "bg-emerald-900/40 text-emerald-400" : status === "error" ? "bg-red-900/40 text-red-400" : status === "running" ? "bg-amber-900/40 text-amber-400" : accent ? "bg-cyan-900/30 text-[var(--accent-cyan)]" : "bg-[var(--bg-2)] text-[var(--text-3)]";
  const btnColor = accent ? "bg-[var(--accent-cyan)] text-[#0b0f14]" : "bg-[var(--accent-amber)] text-[#0b0f14]";
  return (
    <div className={`rounded-xl border bg-[var(--bg-1)] overflow-hidden transition-colors ${border}`}>
      <div className="flex items-center gap-3 px-5 py-4">
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${badge}`}>{number}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-1)]">{title}</p>
          <p className="text-xs text-[var(--text-3)] mt-0.5">{description}</p>
        </div>
        <StepStatusBadge status={status} />
        <button onClick={onRun} disabled={!canRun || status === "running"}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${btnColor} text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0`}>
          {status === "running" ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
          {status === "success" ? "Re-run" : "Run"}
        </button>
        {(status === "success" || status === "error") && (
          <button onClick={() => setOpen(!open)} className="text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors">
            {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
        )}
      </div>
      {error && (
        <div className="px-5 pb-4">
          <p className="text-xs text-red-400 bg-red-950/20 rounded-lg px-3 py-2 font-mono break-all">{error}</p>
        </div>
      )}
      {children && open && (
        <div className="px-5 pb-5 border-t border-[var(--border-subtle)] pt-4">{children}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Route Analysis output
// ---------------------------------------------------------------------------

function RouteRow({ route }: { route: RouteEntry }) {
  const [exp, setExp] = useState(false);
  return (
    <div className="px-3 py-2 hover:bg-[var(--bg-1)] transition-colors rounded">
      <div className="flex items-center gap-2 min-w-0">
        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${scoreBg(route.score)}`}>
          {route.score > 0 ? `+${route.score}` : route.score}
        </span>
        <span className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border shrink-0 ${bucketStyle(route.bucket)}`}>{route.bucket}</span>
        <span className="text-xs text-[var(--text-2)] font-mono truncate flex-1 min-w-0">{route.path}</span>
        {route.reasoning.length > 0 && (
          <button onClick={() => setExp(!exp)} className="text-[10px] text-[var(--text-3)] hover:text-[var(--accent-amber)] shrink-0 transition-colors">
            {exp ? "▲" : `${route.reasoning.length} rules`}
          </button>
        )}
      </div>
      {exp && (
        <div className="mt-1.5 ml-2 flex flex-wrap gap-1">
          {route.reasoning.map((r, i) => (
            <span key={i} className="text-[9px] text-[var(--text-3)] bg-[var(--bg-0)] border border-[var(--border-subtle)] rounded px-1.5 py-0.5 font-mono">{r}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function CollapsibleRouteList({ title, routes, defaultOpen = false, showReason = false }: {
  title: string; routes: RouteEntry[] | FilteredRoute[]; defaultOpen?: boolean; showReason?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [q, setQ] = useState("");
  const isFiltered = showReason;
  const list = isFiltered
    ? (routes as FilteredRoute[]).filter(r => !q || r.url.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q))
    : (routes as RouteEntry[]).filter(r => !q || r.url.toLowerCase().includes(q) || r.bucket.toLowerCase().includes(q));

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-0)] hover:bg-[var(--bg-1)] transition-colors">
        <span className="text-xs font-semibold text-[var(--text-2)]">{title}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--text-3)] font-mono">{routes.length}</span>
          {open ? <ChevronDown size={13} className="text-[var(--text-3)]" /> : <ChevronRight size={13} className="text-[var(--text-3)]" />}
        </div>
      </button>
      {open && (
        <div>
          {routes.length > 10 && (
            <div className="px-3 pt-2 pb-1">
              <div className="relative">
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
                <input value={q} onChange={e => setQ(e.target.value.toLowerCase())} placeholder="Filter…"
                  className="w-full bg-[var(--bg-0)] border border-[var(--border-subtle)] rounded-lg pl-7 pr-3 py-1.5 text-xs text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors" />
              </div>
            </div>
          )}
          <div className="max-h-[400px] overflow-y-auto scrollbar-thin divide-y divide-[var(--border-subtle)]/40">
            {isFiltered
              ? (list as FilteredRoute[]).map((r, i) => (
                  <div key={i} className="px-3 py-2 flex items-start gap-2">
                    <span className="text-[9px] text-red-400 bg-red-950/20 border border-red-800/30 rounded px-1.5 py-0.5 font-mono shrink-0 mt-px">{r.reason}</span>
                    <span className="text-xs text-[var(--text-3)] font-mono truncate">{r.url}</span>
                  </div>
                ))
              : (list as RouteEntry[]).map((r, i) => <RouteRow key={i} route={r} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Social discovery output
// ---------------------------------------------------------------------------

function SocialDiscoveryOutput({ result }: { result: SocialDiscoveryResult }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatChip label="platforms searched" value={result.platforms_searched.length} />
        <StatChip label="platforms with hits" value={result.platforms_with_hits.length} accent />
      </div>
      <div className="flex flex-wrap gap-2">
        {result.platforms_searched.map(p => {
          const hasHits = result.platforms_with_hits.includes(p);
          return (
            <span key={p} className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${hasHits ? "text-emerald-300 bg-emerald-950/30 border-emerald-700/40" : "text-[var(--text-3)] bg-[var(--bg-2)] border-[var(--border-subtle)]"}`}>
              {p.replace("_", "/")}
            </span>
          );
        })}
      </div>
      {result.platforms_with_hits.map(platform => {
        const hits = result.platform_results[platform] ?? [];
        return (
          <div key={platform} className="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
            <div className="px-4 py-2 bg-[var(--bg-0)] flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-300">{platform.replace("_", "/")}</span>
              <span className="text-[10px] text-[var(--text-3)] font-mono">{hits.length} results</span>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]/40 max-h-40 overflow-y-auto scrollbar-thin">
              {hits.map((h, i) => (
                <div key={i} className="px-3 py-2">
                  <p className="text-xs text-[var(--text-1)] font-medium truncate">{h.title}</p>
                  <p className="text-[10px] text-[var(--accent-cyan)] truncate">{h.link}</p>
                  <p className="text-[10px] text-[var(--text-3)] line-clamp-1">{h.snippet}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Competitor discovery output
// ---------------------------------------------------------------------------

function CompetitorDiscoveryOutput({ result }: { result: CompetitorDiscoveryResult }) {
  const entries = Object.entries(result.query_results);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatChip label="queries run" value={result.queries_run} />
        <StatChip label="total hits" value={result.total_hits} accent />
      </div>
      {entries.map(([query, hits]) => (
        <div key={query} className="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
          <div className="px-4 py-2 bg-[var(--bg-0)] flex items-center justify-between">
            <span className="text-[10px] font-mono text-[var(--text-2)] truncate max-w-xs">&ldquo;{query}&rdquo;</span>
            <span className="text-[10px] text-[var(--text-3)] font-mono shrink-0 ml-2">{Array.isArray(hits) ? hits.length : 0} results</span>
          </div>
          {Array.isArray(hits) && hits.length > 0 && (
            <div className="divide-y divide-[var(--border-subtle)]/40 max-h-32 overflow-y-auto scrollbar-thin">
              {hits.slice(0, 5).map((h, i) => (
                <div key={i} className="px-3 py-1.5 text-[10px]">
                  <p className="text-[var(--text-1)] font-medium truncate">{h.title}</p>
                  <p className="text-[var(--accent-cyan)] truncate">{h.link}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Extract Signals output
// ---------------------------------------------------------------------------

function ScoreBar({ score, label }: { score: number | null; label: string }) {
  if (score === null) return null;
  const color = score >= 90 ? "bg-emerald-500" : score >= 50 ? "bg-amber-400" : "bg-red-400";
  const textColor = score >= 90 ? "text-emerald-300" : score >= 50 ? "text-amber-300" : "text-red-400";
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-[var(--text-3)] w-28 shrink-0">{label}</span>
      <div className="flex-1 bg-[var(--bg-0)] rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold font-mono w-8 text-right ${textColor}`}>{score}</span>
    </div>
  );
}

function ExtractSignalsOutput({ result }: { result: ExtractSignalsResult }) {
  const seo = result.seo_signals;
  const psi = result.pagespeed as ExtractSignalsResult["pagespeed"];
  const tech = result.tech_signals;
  const hasPsi = psi && "scores" in psi && psi.scores;
  return (
    <div className="space-y-5">
      {/* SEO signals */}
      <div>
        <p className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-3">SEO Signals</p>
        <div className="grid grid-cols-2 gap-3 text-[11px] bg-[var(--bg-0)] rounded-lg p-4 border border-[var(--border-subtle)]">
          <div>
            <span className="text-[var(--text-3)]">Title:</span>{" "}
            <span className={`font-medium ${seo.title_ok ? "text-emerald-300" : "text-amber-300"}`}>
              {seo.title ? `"${seo.title.slice(0, 50)}${seo.title.length > 50 ? "…" : ""}" (${seo.title_length}c)` : "missing"}
            </span>
          </div>
          <div>
            <span className="text-[var(--text-3)]">Meta desc:</span>{" "}
            <span className={`font-medium ${seo.meta_description_ok ? "text-emerald-300" : "text-amber-300"}`}>
              {seo.meta_description ? `${seo.meta_description_length}c` : "missing"}
            </span>
          </div>
          <div>
            <span className="text-[var(--text-3)]">H1 tags:</span>{" "}
            <span className={`font-medium ${seo.h1_ok ? "text-emerald-300" : "text-amber-300"}`}>{seo.h1_count} {seo.h1_ok ? "✓" : "⚠"}</span>
            {seo.h1_texts.length > 0 && <span className="text-[var(--text-3)] ml-1">{seo.h1_texts[0].slice(0, 30)}</span>}
          </div>
          <div>
            <span className="text-[var(--text-3)]">Canonical:</span>{" "}
            <span className={`font-medium ${seo.has_canonical ? "text-emerald-300" : "text-amber-300"}`}>{seo.has_canonical ? "present" : "missing"}</span>
          </div>
          <div>
            <span className="text-[var(--text-3)]">Images alt:</span>{" "}
            <span className={`font-medium ${seo.image_alt_coverage_pct >= 90 ? "text-emerald-300" : "text-amber-300"}`}>
              {seo.images_with_alt}/{seo.total_images} ({seo.image_alt_coverage_pct}%)
            </span>
          </div>
          <div>
            <span className="text-[var(--text-3)]">Indexable:</span>{" "}
            <span className={`font-medium ${seo.is_indexable ? "text-emerald-300" : "text-red-400"}`}>{seo.is_indexable ? "yes" : "noindex detected"}</span>
          </div>
        </div>
        {/* Schema badges */}
        {seo.schema_types.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {seo.schema_types.map(t => (
              <span key={t} className="text-[9px] px-2 py-1 rounded bg-[var(--bg-0)] border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] font-mono">{t}</span>
            ))}
          </div>
        )}
        {/* OG chips */}
        <div className="flex flex-wrap gap-2 mt-2">
          {(["og:title", "og:description", "og:image", "twitter:card"] as const).map(tag => {
            const present = tag === "og:title" ? seo.has_og_title : tag === "og:description" ? seo.has_og_description : tag === "og:image" ? seo.has_og_image : seo.has_twitter_card;
            return (
              <span key={tag} className={`text-[9px] px-2 py-0.5 rounded border font-mono ${present ? "text-emerald-300 border-emerald-700/40 bg-emerald-950/20" : "text-[var(--text-3)] border-[var(--border-subtle)] bg-[var(--bg-2)]"}`}>{tag}</span>
            );
          })}
        </div>
      </div>

      {/* PageSpeed */}
      {hasPsi ? (
        <div>
          <p className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-3">Lighthouse Scores (mobile)</p>
          <div className="space-y-2 bg-[var(--bg-0)] rounded-lg p-4 border border-[var(--border-subtle)]">
            <ScoreBar score={(psi as ExtractSignalsResult["pagespeed"] & { scores: Record<string, number | null> }).scores.performance} label="Performance" />
            <ScoreBar score={(psi as ExtractSignalsResult["pagespeed"] & { scores: Record<string, number | null> }).scores.seo} label="SEO" />
            <ScoreBar score={(psi as ExtractSignalsResult["pagespeed"] & { scores: Record<string, number | null> }).scores.accessibility} label="Accessibility" />
            <ScoreBar score={(psi as ExtractSignalsResult["pagespeed"] & { scores: Record<string, number | null> }).scores.best_practices} label="Best Practices" />
          </div>
          {(() => {
            const cwv = (psi as ExtractSignalsResult["pagespeed"] & { core_web_vitals: Record<string, string | number | null> }).core_web_vitals;
            return (
              <div className="flex flex-wrap gap-2 mt-2">
                {cwv.lcp_display != null && <StatChip label="LCP" value={String(cwv.lcp_display)} />}
                {cwv.cls != null && <StatChip label="CLS" value={String(cwv.cls)} />}
                {cwv.tbt_ms != null && <StatChip label="TBT" value={`${cwv.tbt_ms}ms`} />}
                {cwv.fcp_display != null && <StatChip label="FCP" value={String(cwv.fcp_display)} />}
              </div>
            );
          })()}
        </div>
      ) : (
        <p className="text-xs text-[var(--text-3)] italic">PageSpeed Insights unavailable (rate-limited or site blocked PSI).</p>
      )}

      {/* Tech Stack */}
      <div>
        <p className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-3">Tech Stack (Wappalyzer)</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {tech.frontend_framework && <StatChip label="framework" value={tech.frontend_framework} accent />}
          {tech.cms && <StatChip label="CMS" value={tech.cms} />}
          {tech.ecommerce_platform && <StatChip label="ecommerce" value={tech.ecommerce_platform} />}
          {tech.cdn && <StatChip label="CDN" value={tech.cdn.replace(/_/g, " ")} />}
          <StatChip label="security" value={tech.security.grade} accent={tech.security.grade === "strong"} />
          <StatChip label="sec headers" value={`${tech.security.score}/10`} />
        </div>
        {tech.analytics_tools.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tech.analytics_tools.map(t => (
              <span key={t} className="text-[9px] px-2 py-1 rounded bg-[var(--bg-0)] border border-amber-700/30 text-amber-300 font-mono">{t}</span>
            ))}
          </div>
        )}
        {tech.all_detected_technologies.length > 0 && (
          <JsonView data={tech.all_detected_technologies} label={`All ${tech.all_detected_technologies.length} detected technologies`} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scraping Phase output
// ---------------------------------------------------------------------------

function ScrapingPhaseOutput({ result }: { result: ScrapingPhaseResult }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatChip label="brand" value={result.brand_name} accent />
        <StatChip label="pages" value={result.pages_count} accent />
        <StatChip label="serper queries" value={result.serper_keys.length} />
        <StatChip label="category" value={result.detected_category ?? "auto"} />
      </div>
      <div className="rounded-lg border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]/40 max-h-60 overflow-y-auto scrollbar-thin">
        {Object.entries(result.pages_summary).map(([url, info], i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2 text-[10px]">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${info.chars > 0 ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span className="text-[var(--text-3)] font-mono truncate flex-1 min-w-0">{url}</span>
            <span className="text-[var(--text-2)] font-mono shrink-0">{info.chars.toLocaleString()}c</span>
            <span className="text-[var(--text-3)] shrink-0">{info.method}</span>
          </div>
        ))}
      </div>
      <JsonView data={{ serper_keys: result.serper_keys, audit: result.audit }} label="Audit & Serper keys" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Synthesis output
// ---------------------------------------------------------------------------

function SynthesisOutput({ result }: { result: SynthesisResult }) {
  const inputTokenKey = Object.keys(result.token_usage).find(k => k.includes("input")) ?? "";
  const outputTokenKey = Object.keys(result.token_usage).find(k => k.includes("output")) ?? "";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatChip label="section" value={result.section_name} accent />
        <StatChip label="tier" value={result.tier} />
        <StatChip label="model" value={result.model_used.split("-").slice(0, 3).join("-")} />
        <StatChip label="time" value={`${result.duration_ms}ms`} />
        {inputTokenKey && <StatChip label="in tokens" value={result.token_usage[inputTokenKey] ?? 0} />}
        {outputTokenKey && <StatChip label="out tokens" value={result.token_usage[outputTokenKey] ?? 0} accent />}
      </div>
      <div>
        <p className="text-[10px] text-[var(--text-3)] mb-2 uppercase tracking-wider">Context keys sent to LLM</p>
        <div className="flex flex-wrap gap-1.5">
          {result.context_keys_sent.map(k => (
            <span key={k} className="text-[9px] font-mono px-2 py-1 rounded bg-[var(--bg-0)] border border-[var(--border-subtle)] text-[var(--text-3)]">{k}</span>
          ))}
        </div>
      </div>
      <JsonView data={result.result} label="Section result JSON" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function BrandLabPage() {
  const { user } = useAuth();
  const tokenRef = useRef("");

  const [brandUrl, setBrandUrl] = useState("");

  // Shared pipeline steps (reuse competitor debug endpoints)
  const [step0, setStep0] = useState<StepState<{ detected_category: string; flags: Record<string, boolean> }>>({ status: "idle", result: null, error: null });
  const [step1, setStep1] = useState<StepState<RouteAnalysisResult>>({ status: "idle", result: null, error: null });
  const [step2, setStep2] = useState<StepState<ShallowMetaResult>>({ status: "idle", result: null, error: null });
  const [step3, setStep3] = useState<StepState<RescoreResult>>({ status: "idle", result: null, error: null });
  const [step4, setStep4] = useState<StepState<RerankResult>>({ status: "idle", result: null, error: null });
  const [step5, setStep5] = useState<StepState<FetchContentResult>>({ status: "idle", result: null, error: null });
  const [step6, setStep6] = useState<StepState<SerperResult>>({ status: "idle", result: null, error: null });

  // Brand-specific steps
  const [stepExtract, setStepExtract] = useState<StepState<ExtractSignalsResult>>({ status: "idle", result: null, error: null });
  const [step7, setStep7] = useState<StepState<SocialDiscoveryResult>>({ status: "idle", result: null, error: null });
  const [step8, setStep8] = useState<StepState<CompetitorDiscoveryResult>>({ status: "idle", result: null, error: null });
  const [step9, setStep9] = useState<StepState<ScrapingPhaseResult>>({ status: "idle", result: null, error: null });
  const [step10, setStep10] = useState<StepState<SynthesisResult>>({ status: "idle", result: null, error: null });
  const [synthSection, setSynthSection] = useState<BrandSection>("brand_overview");

  const getToken = useCallback(async () => {
    if (!user) return "";
    const { getIdToken } = await import("firebase/auth");
    const t = await getIdToken(user as Parameters<typeof getIdToken>[0]);
    tokenRef.current = t;
    return t;
  }, [user]);

  function resetAll() {
    [setStep0, setStep1, setStep2, setStep3, setStep4, setStep5, setStep6, setStepExtract, setStep7, setStep8, setStep9, setStep10].forEach(set =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (set as any)({ status: "idle", result: null, error: null })
    );
  }

  async function post(path: string, body: unknown): Promise<unknown> {
    const token = await getToken();
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`${res.status}: ${text}`);
    }
    return res.json();
  }

  function getDomain(url: string): string {
    return url.replace(/https?:\/\/(www\.)?/, "").split("/")[0];
  }
  function getBrandName(url: string): string {
    return getDomain(url).split(".")[0];
  }

  // ── Step 0: Detect Pipeline ───────────────────────────────────────────────
  async function runStep0() {
    if (!brandUrl.trim()) return;
    setStep0({ status: "running", result: null, error: null });
    [setStep1, setStep2, setStep3, setStep4, setStep5, setStep6, setStepExtract, setStep7, setStep8, setStep9, setStep10].forEach(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (set: any) => set({ status: "idle", result: null, error: null })
    );
    try {
      const data = await post("/api/competitor-analysis/debug/detect-pipeline", { url: brandUrl.trim() }) as { detected_category: string; flags: Record<string, boolean> };
      setStep0({ status: "success", result: data, error: null });
    } catch (e: unknown) {
      setStep0({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 1: Route Analysis ────────────────────────────────────────────────
  async function runStep1() {
    if (!brandUrl.trim()) return;
    setStep1({ status: "running", result: null, error: null });
    try {
      const data = await post("/api/competitor-analysis/debug/analyze-routes", { url: brandUrl.trim() }) as RouteAnalysisResult;
      setStep1({ status: "success", result: data, error: null });
    } catch (e: unknown) {
      setStep1({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 2: Shallow Meta ──────────────────────────────────────────────────
  async function runStep2() {
    if (!step1.result) return;
    setStep2({ status: "running", result: null, error: null });
    try {
      const data = await post("/api/competitor-analysis/debug/shallow-meta", { routes: step1.result.important_routes }) as ShallowMetaResult;
      setStep2({ status: "success", result: data, error: null });
    } catch (e: unknown) {
      setStep2({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 3: Metadata Rescore ──────────────────────────────────────────────
  async function runStep3() {
    if (!step1.result || !step2.result) return;
    setStep3({ status: "running", result: null, error: null });
    try {
      const candidates = step1.result.classified_routes.filter(r => r.selected);
      const data = await post("/api/competitor-analysis/debug/rescore", {
        domain: step1.result.domain, candidates, meta: step2.result.meta,
      }) as RescoreResult;
      setStep3({ status: "success", result: data, error: null });
    } catch (e: unknown) {
      setStep3({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 4: Claude Haiku Re-rank ──────────────────────────────────────────
  async function runStep4() {
    if (!step3.result || !step2.result || !step1.result) return;
    setStep4({ status: "running", result: null, error: null });
    try {
      const data = await post("/api/competitor-analysis/debug/rerank", {
        domain: step1.result.domain,
        candidates: step3.result.kept_routes,
        meta: step2.result.meta,
      }) as RerankResult;
      setStep4({ status: "success", result: data, error: null });
    } catch (e: unknown) {
      setStep4({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 5: Fetch Content (batch) ─────────────────────────────────────────
  async function runStep5() {
    if (!step4.result) return;
    setStep5({ status: "running", result: null, error: null });
    try {
      const routes = step4.result.kept_routes.map(r => r.url);
      const data = await post("/api/competitor-analysis/debug/fetch-content", { routes }) as FetchContentResult;
      setStep5({ status: "success", result: data, error: null });
    } catch (e: unknown) {
      setStep5({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 6: Serper Standard Enrichment ────────────────────────────────────
  async function runStep6() {
    if (!brandUrl.trim()) return;
    setStep6({ status: "running", result: null, error: null });
    const domain = step1.result?.domain ?? getDomain(brandUrl);
    const name = getBrandName(brandUrl);
    try {
      const data = await post("/api/competitor-analysis/debug/serper", {
        competitor_name: name,
        competitor_domain: domain,
        category: step0.result?.detected_category ?? null,
      }) as SerperResult;
      setStep6({ status: "success", result: data, error: null });
    } catch (e: unknown) {
      setStep6({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Extract Signals: SEO + PageSpeed + Tech (brand-specific, independent) ──
  async function runStepExtract() {
    if (!brandUrl.trim()) return;
    setStepExtract({ status: "running", result: null, error: null });
    try {
      const data = await post("/api/brands/debug/extract-signals", { brand_url: brandUrl.trim() }) as ExtractSignalsResult;
      setStepExtract({ status: "success", result: data, error: null });
    } catch (e: unknown) {
      setStepExtract({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 7: Social Discovery ──────────────────────────────────────────────
  async function runStep7() {
    if (!brandUrl.trim()) return;
    setStep7({ status: "running", result: null, error: null });
    const domain = step1.result?.domain ?? getDomain(brandUrl);
    const name = getBrandName(brandUrl);
    try {
      const data = await post("/api/brands/debug/social-discovery", {
        brand_name: name, brand_domain: domain,
      }) as SocialDiscoveryResult;
      setStep7({ status: "success", result: data, error: null });
    } catch (e: unknown) {
      setStep7({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 8: Competitor Discovery ──────────────────────────────────────────
  async function runStep8() {
    if (!brandUrl.trim()) return;
    setStep8({ status: "running", result: null, error: null });
    const domain = step1.result?.domain ?? getDomain(brandUrl);
    const name = getBrandName(brandUrl);
    try {
      const data = await post("/api/brands/debug/competitor-discovery", {
        brand_name: name, brand_domain: domain,
      }) as CompetitorDiscoveryResult;
      setStep8({ status: "success", result: data, error: null });
    } catch (e: unknown) {
      setStep8({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 9: Full Scraping Phase ───────────────────────────────────────────
  async function runStep9() {
    if (!brandUrl.trim()) return;
    setStep9({ status: "running", result: null, error: null });
    try {
      const data = await post("/api/brands/debug/scraping-phase", {
        brand_url: brandUrl.trim(),
        category: step0.result?.detected_category ?? undefined,
      }) as ScrapingPhaseResult;
      setStep9({ status: "success", result: data, error: null });
    } catch (e: unknown) {
      setStep9({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 10: Brand Section Synthesis ──────────────────────────────────────
  async function runStep10() {
    if (!step9.result) return;
    setStep10({ status: "running", result: null, error: null });
    const domain = step1.result?.domain ?? getDomain(brandUrl);
    const name = step9.result.brand_name || getBrandName(brandUrl);
    try {
      const data = await post("/api/brands/debug/synthesize-section", {
        section_name: synthSection,
        brand_name: name,
        brand_url: brandUrl.trim(),
        raw_data: {
          pages: step9.result.pages_content ?? step9.result.pages_summary,
          serper_results: step9.result.serper_results ?? step6.result?.results ?? {},
          github_signals: step9.result.github_signals ?? {},
          npm_signals: step9.result.npm_signals ?? {},
        },
        social_results:             step7.result?.platform_results ?? {},
        competitor_serper_results:  step8.result?.query_results ?? {},
        // Pass pre-extracted structured signals if available
        seo_signals:  stepExtract.result?.seo_signals ?? {},
        pagespeed:    stepExtract.result?.pagespeed ?? {},
        tech_signals: stepExtract.result?.tech_signals ?? {},
      }) as SynthesisResult;
      setStep10({ status: "success", result: data, error: null });
    } catch (e: unknown) {
      setStep10({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
    void domain; // suppress unused warning
  }

  const s1 = step1.result;
  const s2 = step2.result;
  const s3 = step3.result;
  const s4 = step4.result;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/my-brand" className="text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <Building2 size={16} className="text-[var(--accent-cyan)]" />
        <div>
          <h1 className="text-lg font-bold text-[var(--text-1)]">My Brand — Pipeline Lab</h1>
          <p className="text-xs text-[var(--text-3)]">
            10 steps · Shared scraping pipeline → Brand-specific social &amp; competitor discovery → AI synthesis
          </p>
        </div>
        <div className="ml-auto">
          <FlaskConical size={16} className="text-[var(--accent-amber)]" />
        </div>
      </div>

      {/* Input */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-1)] p-5 mb-5">
        <p className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-3">Brand URL</p>
        <div className="flex gap-3">
          <input
            type="url"
            placeholder="https://yourbrand.com/"
            className="flex-1 bg-[var(--bg-0)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
            value={brandUrl}
            onChange={(e) => setBrandUrl(e.target.value)}
          />
          <button
            onClick={resetAll}
            className="px-5 py-3 rounded-lg border border-[var(--border-subtle)] text-[var(--text-2)] hover:bg-[var(--bg-1)] hover:text-[var(--text-1)] text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Step 0 */}
      <StepCard
        number={0} title="Detect Brand Pipeline"
        description="Fetches homepage to auto-detect the business category and configure downstream steps."
        status={step0.status} error={step0.error}
        canRun={Boolean(brandUrl.trim())} onRun={runStep0}
      >
        {step0.result && (
          <div className="flex flex-wrap gap-2">
            <StatChip label="category" value={step0.result.detected_category} accent />
            {Object.entries(step0.result.flags).map(([f, enabled]) => (
              <StatChip key={f} label={`${f} integration`} value={enabled ? "enabled" : "disabled"} />
            ))}
          </div>
        )}
      </StepCard>

      {step0.status === "success" && (
        <div className="flex flex-col gap-3 mt-3">

          {/* ── SHARED SCRAPING PIPELINE ── */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            <span className="text-[10px] text-[var(--text-3)] uppercase tracking-wider font-semibold">Shared Scraping Pipeline</span>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>

          <StepCard
            number={1} title="Route Analysis"
            description="Sitemap fetch → normalize → filter → classify → heuristic score → select important routes"
            status={step1.status} error={step1.error}
            canRun={Boolean(brandUrl.trim())} onRun={runStep1}
          >
            {s1 && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <StatChip label="category" value={s1.detected_category ?? "auto"} accent />
                  <StatChip label="sitemap routes" value={s1.sitemap_route_count} />
                  <StatChip label="after filter" value={s1.filtered_route_count} />
                  <StatChip label="important" value={s1.important_count} accent />
                  <StatChip label="time" value={`${s1.total_duration_ms}ms`} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(s1.bucket_summary).sort((a, b) => b[1] - a[1]).map(([b, c]) => (
                    <span key={b} className={`text-[10px] font-medium px-2 py-1 rounded border ${bucketStyle(b)}`}>{b} <span className="font-mono font-bold">{c}</span></span>
                  ))}
                </div>
                <CollapsibleRouteList title="Important Routes" routes={s1.classified_routes.filter(r => r.selected)} defaultOpen={true} />
                <CollapsibleRouteList title="All Scored Routes" routes={s1.classified_routes} />
                <CollapsibleRouteList title="Filtered Out" routes={s1.filtered_out} showReason={true} />
              </div>
            )}
          </StepCard>

          <StepCard
            number={2} title="Shallow Meta Fetch"
            description={s1 ? `Fetch title/H1/description for ${s1.important_count} routes (no Firecrawl — fast)` : "Run Step 1 first"}
            status={step2.status} error={step2.error}
            canRun={step1.status === "success"} onRun={runStep2}
          >
            {s2 && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <StatChip label="fetched" value={`${s2.ok}/${s2.total}`} accent />
                  <StatChip label="failed" value={s2.total - s2.ok} />
                  <StatChip label="time" value={`${s2.duration_ms}ms`} />
                </div>
                <div className="bg-[var(--bg-0)] rounded-lg divide-y divide-[var(--border-subtle)] max-h-64 overflow-y-auto scrollbar-thin">
                  {s2.meta.map((m, i) => (
                    <div key={i} className="px-3 py-2 space-y-0.5">
                      <p className="text-[10px] text-[var(--text-3)] font-mono truncate">{m.url}</p>
                      {m.title && <p className="text-xs text-[var(--text-1)] font-medium truncate">{m.title}</p>}
                      {m.description && <p className="text-[10px] text-[var(--text-3)] line-clamp-1">{m.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </StepCard>

          <StepCard
            number={3} title="Metadata Rescore"
            description={s2 ? `Apply keyword rules to title/H1/desc for ${s1?.important_count ?? 0} candidates (instant)` : "Run Steps 1–2 first"}
            status={step3.status} error={step3.error}
            canRun={step2.status === "success"} onRun={runStep3}
          >
            {step3.result && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <StatChip label="kept" value={step3.result.kept_count} accent />
                  <StatChip label="skipped" value={step3.result.skipped_count} />
                  <StatChip label="time" value={`${step3.result.duration_ms}ms`} />
                </div>
              </div>
            )}
          </StepCard>

          <StepCard
            number={4} title="Claude Haiku Re-rank"
            description={s3 ? `LLM reviews ${s3.kept_count} candidates → priority score + reasoning` : "Run Steps 1–3 first"}
            status={step4.status} error={step4.error}
            canRun={step3.status === "success"} onRun={runStep4}
          >
            {step4.result && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <StatChip label="kept" value={step4.result.kept_count} accent />
                  <StatChip label="skipped" value={step4.result.skipped_count} />
                  <StatChip label="time" value={`${step4.result.duration_ms}ms`} />
                  <StatChip label="model" value={step4.result.model_used.split("-").slice(0, 3).join("-")} />
                </div>
                {step4.result.fallback && (
                  <p className="text-xs text-amber-400">⚠ Fallback used — LLM re-rank failed, using Step 3 order.</p>
                )}
              </div>
            )}
          </StepCard>

          <StepCard
            number={5} title="Fetch Page Content (batch)"
            description={s4 ? `httpx-first batch fetch of ${s4.kept_count} selected routes` : "Run Steps 1–4 first"}
            status={step5.status} error={step5.error}
            canRun={step4.status === "success"} onRun={runStep5}
          >
            {step5.result && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <StatChip label="scraped" value={`${step5.result.audit.ok}/${step5.result.audit.total}`} accent />
                  <StatChip label="status" value={step5.result.audit.status} />
                  <StatChip label="time" value={`${step5.result.audit.duration_ms}ms`} />
                </div>
                <div className="bg-[var(--bg-0)] rounded-lg divide-y divide-[var(--border-subtle)] max-h-48 overflow-y-auto scrollbar-thin">
                  {step5.result.audit.pages.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-[10px]">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.status === "ok" ? "bg-emerald-400" : "bg-amber-400"}`} />
                      <span className="text-[var(--text-3)] font-mono truncate flex-1 min-w-0">{p.url}</span>
                      <span className="text-[var(--text-2)] font-mono shrink-0">{p.chars.toLocaleString()}c</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </StepCard>

          {/* ── ENRICHMENT ── */}
          <div className="flex items-center gap-3 py-1 mt-1">
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            <span className="text-[10px] text-[var(--text-3)] uppercase tracking-wider font-semibold">Enrichment (independent — run anytime)</span>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>

          <StepCard
            number={6} title="Serper Standard Enrichment"
            description="Run the standard Serper query set (news, press, SEO, reviews, reddit) for the brand domain."
            status={step6.status} error={step6.error}
            canRun={Boolean(brandUrl.trim())} onRun={runStep6}
          >
            {step6.result && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <StatChip label="category" value={step6.result.detected_category ?? "auto"} accent />
                  <StatChip label="queries returned" value={step6.result.queries_run} accent />
                </div>
                <div className="rounded-lg border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] max-h-48 overflow-y-auto scrollbar-thin">
                  {step6.result.query_keys.map(k => {
                    const res = step6.result!.results[k];
                    const items = (res?.organic ?? []).length;
                    return (
                      <div key={k} className="flex items-center gap-3 px-3 py-2 text-[10px]">
                        <span className="font-mono text-[var(--text-3)] w-40 truncate shrink-0">{k}</span>
                        <span className="text-[var(--text-2)]">{items} results</span>
                      </div>
                    );
                  })}
                </div>
                <JsonView data={step6.result.results} label="Full Serper results JSON" />
              </div>
            )}
          </StepCard>

          {/* ── BRAND-SPECIFIC ── */}
          <div className="flex items-center gap-3 py-1 mt-1">
            <div className="flex-1 h-px bg-[var(--accent-cyan)]/20" />
            <span className="text-[10px] text-[var(--accent-cyan)] uppercase tracking-wider font-semibold">Brand-Specific Discovery</span>
            <div className="flex-1 h-px bg-[var(--accent-cyan)]/20" />
          </div>

          <StepCard
            number="6b" title="Extract SEO &amp; Tech Signals"
            description="BeautifulSoup SEO parse + Google PageSpeed Insights + Wappalyzer fingerprinting. ~5-10s. Independent of scraping steps."
            status={stepExtract.status} error={stepExtract.error}
            canRun={Boolean(brandUrl.trim())} onRun={runStepExtract}
            accent
          >
            {stepExtract.result && <ExtractSignalsOutput result={stepExtract.result} />}
          </StepCard>

          <StepCard
            number={7} title="Social Profile Discovery"
            description="Run SOCIAL_SERPER_QUERIES for Twitter/X, LinkedIn, Instagram, Facebook, YouTube, TikTok, GitHub in parallel."
            status={step7.status} error={step7.error}
            canRun={Boolean(brandUrl.trim())} onRun={runStep7}
            accent
          >
            {step7.result && <SocialDiscoveryOutput result={step7.result} />}
          </StepCard>

          <StepCard
            number={8} title="Competitor Discovery"
            description="Run 5 COMPETITOR_DISCOVERY_QUERIES (alternatives, competitors, vs, better than, domain) to surface competitors."
            status={step8.status} error={step8.error}
            canRun={Boolean(brandUrl.trim())} onRun={runStep8}
            accent
          >
            {step8.result && <CompetitorDiscoveryOutput result={step8.result} />}
          </StepCard>

          {/* ── FULL PHASE 1 ── */}
          <div className="flex items-center gap-3 py-1 mt-1">
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            <span className="text-[10px] text-[var(--text-3)] uppercase tracking-wider font-semibold">End-to-End Phase 1 + Synthesis</span>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>

          <StepCard
            number={9} title="Full Scraping Phase (end-to-end)"
            description="Routes → fetch → Serper → GitHub → npm. No DB write. This is what run_brand_analysis_job() runs."
            status={step9.status} error={step9.error}
            canRun={Boolean(brandUrl.trim())} onRun={runStep9}
          >
            {step9.result && <ScrapingPhaseOutput result={step9.result} />}
          </StepCard>

          <StepCard
            number={10} title="Brand Section Synthesis"
            description={step9.result
              ? `Run a single brand LLM synthesis section with data from Steps 6–9.`
              : "Run Step 9 (full scraping phase) first."}
            status={step10.status} error={step10.error}
            canRun={step9.status === "success"} onRun={runStep10}
            accent
          >
            <div className="mb-4">
              <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider mb-2">Section to synthesize</p>
              <div className="flex flex-wrap gap-2">
                {BRAND_SECTIONS.map(sec => (
                  <button
                    key={sec}
                    onClick={() => setSynthSection(sec)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors ${
                      synthSection === sec
                        ? "border-[var(--accent-cyan)] text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10"
                        : "border-[var(--border-subtle)] text-[var(--text-3)] hover:text-[var(--text-2)]"
                    }`}
                  >
                    {sec.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
            {step10.result && <SynthesisOutput result={step10.result} />}
          </StepCard>

        </div>
      )}
    </div>
  );
}
