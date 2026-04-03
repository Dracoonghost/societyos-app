"use client";

export const dynamic = "force-dynamic";

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
  Star,
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
  classification_debug?: { system_prompt?: string; user_msg?: string; raw_response?: string };
}

interface MetaEntry {
  url: string; title?: string; h1?: string; description?: string;
  canonical?: string; status_code?: number | null; error?: string | null;
}
interface ShallowMetaResult {
  meta: MetaEntry[]; ok: number; total: number; duration_ms: number;
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
  fallback: boolean; error?: string; raw_response_preview?: string; duration_ms: number;
}

interface FetchContentResult {
  pages: Record<string, { method?: string; chars: number; preview: string | null }>;
  audit: {
    total: number; ok: number; httpx_count?: number; firecrawl_count?: number;
    fetch_methods?: Record<string, string>;
    pages: Array<{ url: string; method?: string; status?: string; chars: number; http_status?: number; error?: string }>;
    duration_ms: number; status: string; error?: string;
  };
}

interface FetchPageResult {
  url: string; method: string; chars: number; preview: string;
}

interface SerperResult {
  queries_run: number;
  query_keys: string[];
  results: Record<string, { organic?: { title: string; link: string; snippet: string }[]; news?: { title: string; link: string; snippet: string }[] }>;
  detected_category?: string;
  classification_debug?: { system_prompt?: string; user_msg?: string; raw_response?: string };
}

interface GithubResult {
  org_found?: boolean;
  public_repos_count?: number;
  org_repos?: { name: string; description: string; stars: number; language: string }[];
  search_repos?: { name: string; full_name: string; stars: number }[];
  error?: string;
}

interface NpmResult {
  total?: number;
  packages?: { name: string; description: string; version: string }[];
}

interface ScrapingPhaseResult {
  pages_count: number;
  pages_summary: Record<string, { method: string; chars: number }>;
  pages_content: Record<string, string>;
  serper_keys: string[];
  serper_results: Record<string, unknown>;
  github_signals: Record<string, unknown>;
  npm_signals: Record<string, unknown>;
  github_org_found: boolean | null;
  npm_total: number | null;
  audit: Record<string, unknown>;
  detected_category?: string;
  classification_debug?: { system_prompt?: string; user_msg?: string; raw_response?: string };
}


interface SynthesisResult {
  section_name: string;
  model_used: string;
  result: Record<string, unknown>;
  token_usage: { haiku_input_tokens?: number; haiku_output_tokens?: number; sonnet_input_tokens?: number; sonnet_output_tokens?: number };
  debug?: {
    context_sent: string;
    system_prompt: string;
    schema: Record<string, unknown>;
    raw_response: string;
    input_tokens?: number;
    output_tokens?: number;
  };
}

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const BUCKET_STYLES: Record<string, string> = {
  homepage:    "text-[var(--accent-amber)] bg-amber-950/30 border-amber-700/40",
  pricing:     "text-emerald-300 bg-emerald-950/30 border-emerald-700/40",
  comparison:  "text-emerald-300 bg-emerald-950/30 border-emerald-700/40",
  product:     "text-sky-300 bg-sky-950/30 border-sky-700/40",
  feature:     "text-sky-300 bg-sky-950/30 border-sky-700/40",
  solution:    "text-cyan-300 bg-cyan-950/30 border-cyan-700/40",
  proof:       "text-purple-300 bg-purple-950/30 border-purple-700/40",
  trust:       "text-blue-300 bg-blue-950/30 border-blue-700/40",
  integration: "text-indigo-300 bg-indigo-950/30 border-indigo-700/40",
  docs:        "text-[var(--text-3)] bg-[var(--bg-2)] border-[var(--border-subtle)]",
  updates:     "text-[var(--text-3)] bg-[var(--bg-2)] border-[var(--border-subtle)]",
  about:       "text-[var(--text-3)] bg-[var(--bg-2)] border-[var(--border-subtle)]",
  partner:     "text-[var(--text-3)] bg-[var(--bg-2)] border-[var(--border-subtle)]",
  other:       "text-[var(--text-3)] bg-[var(--bg-0)] border-[var(--border-subtle)]",
};
const bucketStyle = (b: string) => BUCKET_STYLES[b] ?? BUCKET_STYLES.other;

const scoreBg = (s: number) =>
  s >= 10 ? "text-emerald-300 bg-emerald-950/50"
  : s >= 5 ? "text-amber-300 bg-amber-950/50"
  : s >= 1 ? "text-sky-300 bg-sky-950/50"
  : s === 0 ? "text-[var(--text-3)] bg-[var(--bg-2)]"
  : "text-red-400 bg-red-950/30";

// ---------------------------------------------------------------------------
// Shared components
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
      {open && <pre className="mt-2 text-[10px] leading-relaxed text-[var(--text-3)] bg-[var(--bg-0)] rounded-lg p-3 overflow-x-auto max-h-72 scrollbar-thin">{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}

function StepCard({ number, title, description, status, error, canRun, onRun, children }: {
  number: number; title: string; description: string;
  status: StepStatus; error: string | null; canRun: boolean; onRun: () => void;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const border = status === "success" ? "border-emerald-800/40" : status === "error" ? "border-red-800/40" : status === "running" ? "border-amber-800/40" : "border-[var(--border-subtle)]";
  const badge = status === "success" ? "bg-emerald-900/40 text-emerald-400" : status === "error" ? "bg-red-900/40 text-red-400" : status === "running" ? "bg-amber-900/40 text-amber-400" : "bg-[var(--bg-2)] text-[var(--text-3)]";
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-amber)] text-[#0b0f14] text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
          {status === "running" ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
          {status === "success" ? "Re-run" : "Run"}
        </button>
        {(status === "success" || status === "error") && (
          <button onClick={() => setOpen(!open)} className="text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors">
            {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
        )}
      </div>
      {error && <div className="px-5 pb-4"><p className="text-xs text-red-400 bg-red-950/20 rounded-lg px-3 py-2 font-mono break-all">{error}</p></div>}
      {children && open && <div className="px-5 pb-5 border-t border-[var(--border-subtle)] pt-4">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 output — Route Analysis
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
        {route.depth > 3 && <span className="text-[9px] text-[var(--text-3)] shrink-0">d:{route.depth}</span>}
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

function RoutesSection({ title, routes, defaultOpen = false, showReason = false }: {
  title: string; routes: RouteEntry[] | FilteredRoute[]; defaultOpen?: boolean; showReason?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [q, setQ] = useState("");
  const isFiltered = showReason;
  const list = isFiltered
    ? (routes as FilteredRoute[]).filter(r => !q || r.url.toLowerCase().includes(q.toLowerCase()) || r.reason.toLowerCase().includes(q.toLowerCase()))
    : (routes as RouteEntry[]).filter(r => !q || r.url.toLowerCase().includes(q.toLowerCase()) || r.bucket.toLowerCase().includes(q.toLowerCase()));

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
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Filter routes…"
                  className="w-full bg-[var(--bg-0)] border border-[var(--border-subtle)] rounded-lg pl-7 pr-3 py-1.5 text-xs text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors" />
              </div>
            </div>
          )}
          <div className="max-h-[480px] overflow-y-auto scrollbar-thin divide-y divide-[var(--border-subtle)]/40">
            {isFiltered
              ? (list as FilteredRoute[]).map((r, i) => (
                  <div key={i} className="px-3 py-2 flex items-start gap-2">
                    <span className="text-[9px] text-red-400 bg-red-950/20 border border-red-800/30 rounded px-1.5 py-0.5 font-mono shrink-0 mt-px">{r.reason}</span>
                    <span className="text-xs text-[var(--text-3)] font-mono truncate">{r.url}</span>
                  </div>
                ))
              : (list as RouteEntry[]).map((r, i) => <RouteRow key={i} route={r} />)}
            {list.length === 0 && <p className="px-3 py-4 text-xs text-[var(--text-3)] text-center">No results for &quot;{q}&quot;</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function Step1Output({ result }: { result: RouteAnalysisResult }) {
  const important = result.classified_routes.filter(r => r.selected);
  const bucketEntries = Object.entries(result.bucket_summary).sort((a, b) => b[1] - a[1]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatChip label="category" value={result.detected_category ?? "manual"} accent />
        <StatChip label="sitemap" value={result.sitemap_route_count} />
        <StatChip label="normalized" value={result.normalized_route_count} />
        <StatChip label="after filter" value={result.filtered_route_count} />
        <StatChip label="important" value={result.important_count} accent />
        <StatChip label="time" value={`${result.total_duration_ms}ms`} />
      </div>
      <div className="flex items-center gap-2 flex-wrap text-[10px] text-[var(--text-3)] font-mono">
        <span className="bg-[var(--bg-0)] border border-[var(--border-subtle)] rounded px-2 py-1">method: {result.sitemap_method}</span>
        {result.sitemap_url && <span className="bg-[var(--bg-0)] border border-[var(--border-subtle)] rounded px-2 py-1 truncate max-w-xs">{result.sitemap_url}</span>}
        <span className="bg-[var(--bg-0)] border border-[var(--border-subtle)] rounded px-2 py-1">threshold: score ≥ {result.config.importance_threshold}</span>
        {result.normalized_dedup_dropped > 0 && <span>{result.normalized_dedup_dropped} dupes dropped</span>}
      </div>
      <div>
        <p className="text-[10px] text-[var(--text-3)] mb-2 uppercase tracking-wider">Buckets</p>
        <div className="flex flex-wrap gap-1.5">
          {bucketEntries.map(([bucket, count]) => (
            <span key={bucket} className={`text-[10px] font-medium px-2 py-1 rounded border ${bucketStyle(bucket)}`}>
              {bucket} <span className="font-mono font-bold">{count}</span>
            </span>
          ))}
        </div>
      </div>
      <RoutesSection title="Important Routes" routes={important} defaultOpen={true} />
      <RoutesSection title="All Scored Routes" routes={result.classified_routes} />
      <RoutesSection title="Filtered Out" routes={result.filtered_out} showReason={true} />
      <JsonView data={{ config: result.config, bucket_summary: result.bucket_summary }} label="Config JSON" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 output — Shallow Meta
// ---------------------------------------------------------------------------

function Step2Output({ result }: { result: ShallowMetaResult }) {
  const [q, setQ] = useState("");
  const list = result.meta.filter(m => !q || m.url.toLowerCase().includes(q.toLowerCase()) || (m.title || "").toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatChip label="fetched" value={`${result.ok}/${result.total}`} accent />
        <StatChip label="time" value={`${result.duration_ms}ms`} />
        <StatChip label="failed" value={result.total - result.ok} />
      </div>
      {result.meta.length > 8 && (
        <div className="relative">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Filter by URL or title…"
            className="w-full bg-[var(--bg-0)] border border-[var(--border-subtle)] rounded-lg pl-7 pr-3 py-1.5 text-xs text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors" />
        </div>
      )}
      <div className="bg-[var(--bg-0)] rounded-lg divide-y divide-[var(--border-subtle)] max-h-[480px] overflow-y-auto scrollbar-thin">
        {list.map((m, i) => {
          const ok = m.status_code === 200;
          const dot = ok ? "bg-emerald-400" : m.error ? "bg-red-400" : "bg-amber-400";
          return (
            <div key={i} className="px-3 py-2.5 space-y-1">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                <span className="text-[10px] text-[var(--text-3)] font-mono truncate flex-1 min-w-0">{m.url}</span>
                {m.status_code && <span className="text-[10px] text-[var(--text-3)] shrink-0">{m.status_code}</span>}
              </div>
              {m.error
                ? <p className="text-[10px] text-red-400 ml-4 font-mono">{m.error}</p>
                : (
                  <div className="ml-4 space-y-0.5">
                    {m.title && <p className="text-[11px] text-[var(--text-1)] font-medium truncate">{m.title}</p>}
                    {m.h1 && m.h1 !== m.title && <p className="text-[10px] text-[var(--text-2)] truncate">H1: {m.h1}</p>}
                    {m.description && <p className="text-[10px] text-[var(--text-3)] line-clamp-2">{m.description}</p>}
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 output — Metadata Rescore
// ---------------------------------------------------------------------------

const finalScoreBg = (s: number) =>
  s >= 12 ? "text-emerald-300 bg-emerald-950/50"
  : s >= 7 ? "text-amber-300 bg-amber-950/50"
  : s >= 3 ? "text-sky-300 bg-sky-950/50"
  : "text-[var(--text-3)] bg-[var(--bg-2)]";

function RescoredRow({ route }: { route: RescoredRoute }) {
  const [exp, setExp] = useState(false);
  return (
    <div className="px-3 py-2 hover:bg-[var(--bg-1)] transition-colors rounded">
      <div className="flex items-center gap-2 min-w-0">
        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 min-w-[22px] text-center ${finalScoreBg(route.final_score)}`}>{route.final_score}</span>
        <span className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border shrink-0 ${bucketStyle(route.bucket)}`}>{route.bucket}</span>
        <span className="text-xs text-[var(--text-2)] font-mono truncate flex-1 min-w-0">{route.path || route.url}</span>
        {route.meta_bonus !== 0 && (
          <span className={`text-[9px] font-mono shrink-0 ${route.meta_bonus > 0 ? "text-emerald-400" : "text-red-400"}`}>
            {route.meta_bonus > 0 ? `+${route.meta_bonus}` : route.meta_bonus}
          </span>
        )}
        <span className="text-[9px] text-[var(--text-3)] font-mono shrink-0">h:{route.heuristic_score}</span>
        {route.reasoning.length > 0 && (
          <button onClick={() => setExp(!exp)} className="text-[10px] text-[var(--text-3)] hover:text-[var(--accent-amber)] shrink-0 transition-colors">
            {exp ? "▲" : `${route.reasoning.length}r`}
          </button>
        )}
      </div>
      {route.title && <p className="mt-0.5 ml-2 text-[10px] text-[var(--text-3)] italic truncate">{route.title}</p>}
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

function RescoredSection({ title, routes, defaultOpen = false }: { title: string; routes: RescoredRoute[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [q, setQ] = useState("");
  const list = routes.filter(r => !q || r.url.toLowerCase().includes(q.toLowerCase()) || r.bucket.toLowerCase().includes(q.toLowerCase()));
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
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Filter…"
                  className="w-full bg-[var(--bg-0)] border border-[var(--border-subtle)] rounded-lg pl-7 pr-3 py-1.5 text-xs text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors" />
              </div>
            </div>
          )}
          <div className="max-h-[480px] overflow-y-auto scrollbar-thin divide-y divide-[var(--border-subtle)]/40">
            {list.map((r, i) => <RescoredRow key={i} route={r} />)}
            {list.length === 0 && <p className="px-3 py-4 text-xs text-[var(--text-3)] text-center">No results</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function Step3Output({ result }: { result: RescoreResult }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatChip label="kept" value={result.kept_count} accent />
        <StatChip label="skipped" value={result.skipped_count} />
        <StatChip label="time" value={`${result.duration_ms}ms`} />
        <div className="flex flex-col items-center px-4 py-2 rounded-lg bg-[var(--bg-0)] border border-[var(--border-subtle)]">
          <span className="text-[10px] font-mono text-emerald-400">instant</span>
          <span className="text-[10px] text-[var(--text-3)] mt-0.5">method</span>
        </div>
      </div>
      <p className="text-[10px] text-[var(--text-3)]">Score = heuristic (Step 1) + meta bonus (title/H1/description keyword rules). Shown as: final · <span className="text-emerald-400">+bonus</span> · h:heuristic</p>
      <RescoredSection title="Kept Routes" routes={result.kept_routes} defaultOpen={true} />
      <RescoredSection title="Skipped" routes={result.skipped_routes} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 output — Claude Haiku Re-rank
// ---------------------------------------------------------------------------

const priorityBg = (p: number) =>
  p >= 9 ? "text-emerald-300 bg-emerald-950/50"
  : p >= 7 ? "text-amber-300 bg-amber-950/50"
  : p >= 5 ? "text-sky-300 bg-sky-950/50"
  : "text-[var(--text-3)] bg-[var(--bg-2)]";

function RerankedRow({ route }: { route: RerankedRoute }) {
  const [exp, setExp] = useState(false);
  return (
    <div className="px-3 py-2 hover:bg-[var(--bg-1)] transition-colors rounded">
      <div className="flex items-center gap-2 min-w-0">
        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 min-w-[22px] text-center ${priorityBg(route.priority)}`}>{route.priority}</span>
        <span className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border shrink-0 ${bucketStyle(route.bucket)}`}>{route.bucket}</span>
        <span className="text-xs text-[var(--text-2)] font-mono truncate flex-1 min-w-0">{route.path || route.url}</span>
        <span className="text-[9px] text-[var(--text-3)] font-mono shrink-0">score:{route.heuristic_score}</span>
        {route.reasoning && (
          <button onClick={() => setExp(!exp)} className="text-[10px] text-[var(--text-3)] hover:text-[var(--accent-amber)] shrink-0 transition-colors">
            {exp ? "▲" : "why"}
          </button>
        )}
      </div>
      {exp && <p className="mt-1 ml-2 text-[10px] text-[var(--text-3)] italic">{route.reasoning}</p>}
    </div>
  );
}

function RerankedSection({ title, routes, defaultOpen = false }: { title: string; routes: RerankedRoute[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [q, setQ] = useState("");
  const list = routes.filter(r => !q || r.url.toLowerCase().includes(q.toLowerCase()) || r.bucket.toLowerCase().includes(q.toLowerCase()));
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
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Filter…"
                  className="w-full bg-[var(--bg-0)] border border-[var(--border-subtle)] rounded-lg pl-7 pr-3 py-1.5 text-xs text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors" />
              </div>
            </div>
          )}
          <div className="max-h-[480px] overflow-y-auto scrollbar-thin divide-y divide-[var(--border-subtle)]/40">
            {list.map((r, i) => <RerankedRow key={i} route={r} />)}
            {list.length === 0 && <p className="px-3 py-4 text-xs text-[var(--text-3)] text-center">No results</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function Step4Output({ result }: { result: RerankResult }) {
  if (result.fallback || result.error) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-red-400 bg-red-950/20 rounded-lg px-3 py-2 font-mono">{result.error}</p>
        {result.fallback && <p className="text-xs text-[var(--text-3)]">Fallback: use metadata-scored ordering from Step 3 instead.</p>}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatChip label="kept" value={result.kept_count} accent />
        <StatChip label="skipped" value={result.skipped_count} />
        <StatChip label="time" value={`${result.duration_ms}ms`} />
        <div className="flex flex-col items-center px-4 py-2 rounded-lg bg-[var(--bg-0)] border border-[var(--border-subtle)]">
          <span className="text-[10px] font-mono text-[var(--text-2)] truncate max-w-[140px]">{result.model_used.split("-").slice(0, 3).join("-")}</span>
          <span className="text-[10px] text-[var(--text-3)] mt-0.5">model</span>
        </div>
      </div>
      <RerankedSection title="Kept by Haiku" routes={result.kept_routes} defaultOpen={true} />
      <RerankedSection title="Skipped by Haiku" routes={result.skipped_routes} />
      {result.raw_response_preview && (
        <JsonView data={result.raw_response_preview} label="Raw LLM response preview" />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5 output — Fetch Content
// ---------------------------------------------------------------------------

function Step5Output({ result }: { result: FetchContentResult }) {
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatChip label="scraped" value={`${result.audit.ok}/${result.audit.total}`} accent />
        <StatChip label="status" value={result.audit.status} />
        <StatChip label="time" value={`${result.audit.duration_ms}ms`} />
      </div>
      <div className="bg-[var(--bg-0)] rounded-lg divide-y divide-[var(--border-subtle)] max-h-80 overflow-y-auto scrollbar-thin">
        {result.audit.pages.map((p, i) => {
          const dot = p.status === "ok" ? "bg-emerald-400" : p.status === "empty" ? "bg-amber-400" : "bg-red-400";
          const preview = result.pages[p.url]?.preview;
          const isExp = expandedUrl === p.url;
          return (
            <div key={i} className="px-3 py-2">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                <span className="text-xs text-[var(--text-2)] font-mono truncate flex-1 min-w-0">{p.url}</span>
                <span className="text-[10px] text-[var(--text-3)] shrink-0 font-mono">{p.chars.toLocaleString()}c</span>
                {p.http_status && <span className="text-[10px] text-[var(--text-3)] shrink-0">{p.http_status}</span>}
                {preview && <button onClick={() => setExpandedUrl(isExp ? null : p.url)} className="text-[10px] text-[var(--text-3)] hover:text-[var(--accent-amber)] shrink-0 transition-colors">{isExp ? "hide" : "preview"}</button>}
              </div>
              {p.error && <p className="text-[10px] text-red-400 ml-4 mt-0.5 font-mono">{p.error}</p>}
              {isExp && preview && <pre className="mt-2 ml-4 text-[10px] text-[var(--text-3)] bg-[var(--bg-1)] rounded p-2 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto scrollbar-thin">{preview}</pre>}
            </div>
          );
        })}
      </div>
      <JsonView data={result.audit} label="Audit JSON" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function CompetitorDebugPage() {
  const { user } = useAuth();
  const tokenRef = useRef("");

  const [competitorUrl, setCompetitorUrl] = useState("");
  const [ownUrl, setOwnUrl] = useState("");

  const [step0, setStep0] = useState<StepState<{ detected_category: string, flags: Record<string, boolean> }>>({ status: "idle", result: null, error: null });
  const [step1, setStep1] = useState<StepState<RouteAnalysisResult>>({ status: "idle", result: null, error: null });
  const [step2, setStep2] = useState<StepState<ShallowMetaResult>>({ status: "idle", result: null, error: null });
  const [step3, setStep3] = useState<StepState<RescoreResult>>({ status: "idle", result: null, error: null });
  const [step4, setStep4] = useState<StepState<RerankResult>>({ status: "idle", result: null, error: null });
  const [step5, setStep5] = useState<StepState<FetchContentResult>>({ status: "idle", result: null, error: null });
  const [step6, setStep6] = useState<StepState<FetchPageResult>>({ status: "idle", result: null, error: null });
  const [step7, setStep7] = useState<StepState<SerperResult>>({ status: "idle", result: null, error: null });
  const [step8, setStep8] = useState<StepState<GithubResult>>({ status: "idle", result: null, error: null });
  const [step9, setStep9] = useState<StepState<NpmResult>>({ status: "idle", result: null, error: null });
  const [step10, setStep10] = useState<StepState<ScrapingPhaseResult>>({ status: "idle", result: null, error: null });
  const [step11, setStep11] = useState<StepState<SynthesisResult>>({ status: "idle", result: null, error: null });
  const [synthSection, setSynthSection] = useState("product_overview");

  const getToken = useCallback(async () => {
    if (!user) return "";
    const { getIdToken } = await import("firebase/auth");
    const t = await getIdToken(user as Parameters<typeof getIdToken>[0]);
    tokenRef.current = t;
    return t;
  }, [user]);

  function resetAll() {
    setStep1({ status: "idle", result: null, error: null });
    setStep2({ status: "idle", result: null, error: null });
    setStep3({ status: "idle", result: null, error: null });
    setStep4({ status: "idle", result: null, error: null });
    setStep5({ status: "idle", result: null, error: null });
    setStep6({ status: "idle", result: null, error: null });
    setStep7({ status: "idle", result: null, error: null });
    setStep8({ status: "idle", result: null, error: null });
    setStep9({ status: "idle", result: null, error: null });
    setStep10({ status: "idle", result: null, error: null });
    setStep11({ status: "idle", result: null, error: null });
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

  // ── Step 0: Initialize Pipeline ───────────────────────────────────────────
  async function runStep0() {
    if (!competitorUrl.trim()) return;
    setStep0({ status: "running", result: null, error: null });
    resetAll();
    try {
      const data = await post("/api/competitor-analysis/debug/detect-pipeline", { url: competitorUrl.trim() }) as { detected_category: string, flags: Record<string, boolean> };
      setStep0({ status: "success", result: data, error: null });
    } catch (e: any) {
      setStep0({ status: "error", result: null, error: e.message });
    }
  }

  // ── Step 1: Route Analysis ────────────────────────────────────────────────
  async function runStep1() {
    if (!competitorUrl.trim()) return;
    setStep1({ status: "running", result: null, error: null });
    setStep2({ status: "idle", result: null, error: null });
    setStep3({ status: "idle", result: null, error: null });
    setStep4({ status: "idle", result: null, error: null });
    try {
      const data = await post("/api/competitor-analysis/debug/analyze-routes", { url: competitorUrl.trim() }) as RouteAnalysisResult;
      setStep1({ status: "success", result: data, error: null });
    } catch (e: unknown) {
      setStep1({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 2: Shallow Meta ──────────────────────────────────────────────────
  async function runStep2() {
    if (!step1.result) return;
    setStep2({ status: "running", result: null, error: null });
    setStep3({ status: "idle", result: null, error: null });
    setStep4({ status: "idle", result: null, error: null });
    try {
      const data = await post("/api/competitor-analysis/debug/shallow-meta", {
        routes: step1.result.important_routes,
      }) as ShallowMetaResult;
      setStep2({ status: "success", result: data, error: null });
    } catch (e: unknown) {
      setStep2({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 3: Metadata Rescore ──────────────────────────────────────────────
  async function runStep3() {
    if (!step1.result || !step2.result) return;
    setStep3({ status: "running", result: null, error: null });
    setStep4({ status: "idle", result: null, error: null });
    setStep5({ status: "idle", result: null, error: null });
    try {
      const candidates = step1.result.classified_routes.filter(r => r.selected);
      const data = await post("/api/competitor-analysis/debug/rescore", {
        domain: step1.result.domain,
        candidates,
        meta: step2.result.meta,
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
    setStep5({ status: "idle", result: null, error: null });
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

  // ── Step 5: Fetch Content (httpx-first) ──────────────────────────────────
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

  // ── Step 6: Single-page fetch ─────────────────────────────────────────────
  async function runStep6() {
    if (!competitorUrl.trim()) return;
    setStep6({ status: "running", result: null, error: null });
    const url = step5.result ? Object.keys(step5.result.pages)[0] ?? competitorUrl : (step4.result?.kept_routes[0]?.url ?? competitorUrl);
    try {
      const data = await post("/api/competitor-analysis/debug/fetch-page", { url }) as FetchPageResult;
      setStep6({ status: "success", result: data, error: null });
    } catch (e: unknown) {
      setStep6({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 7: Serper enrichment ─────────────────────────────────────────────
  async function runStep7() {
    if (!competitorUrl.trim()) return;
    setStep7({ status: "running", result: null, error: null });
    const domain = step1.result?.domain ?? competitorUrl.replace(/https?:\/\/(www\.)?/, "").split("/")[0];
    const name = domain.split(".")[0];
    try {
      const detectedCategory = step1.result?.detected_category ?? null;
      const data = await post("/api/competitor-analysis/debug/serper", { competitor_name: name, competitor_domain: domain, category: detectedCategory }) as SerperResult;
      setStep7({ status: "success", result: data, error: null });
    } catch (e: unknown) {
      setStep7({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 8: GitHub signals ────────────────────────────────────────────────
  async function runStep8() {
    if (!competitorUrl.trim()) return;
    setStep8({ status: "running", result: null, error: null });
    const domain = step1.result?.domain ?? competitorUrl.replace(/https?:\/\/(www\.)?/, "").split("/")[0];
    const org = domain.split(".")[0];
    try {
      const data = await post("/api/competitor-analysis/debug/github", { org_name: org }) as GithubResult;
      setStep8({ status: "success", result: data, error: null });
    } catch (e: unknown) {
      setStep8({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 9: npm signals ───────────────────────────────────────────────────
  async function runStep9() {
    if (!competitorUrl.trim()) return;
    setStep9({ status: "running", result: null, error: null });
    const domain = step1.result?.domain ?? competitorUrl.replace(/https?:\/\/(www\.)?/, "").split("/")[0];
    const pkg = domain.split(".")[0];
    try {
      const data = await post("/api/competitor-analysis/debug/npm", { package_name: pkg }) as NpmResult;
      setStep9({ status: "success", result: data, error: null });
    } catch (e: unknown) {
      setStep9({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 10: Full Phase 1 (scraping-phase) ────────────────────────────────
  async function runStep10() {
    if (!competitorUrl.trim()) return;
    setStep10({ status: "running", result: null, error: null });
    try {
      const data = await post("/api/competitor-analysis/debug/scraping-phase", {
        competitor_url: competitorUrl.trim(),
        own_url: ownUrl.trim() || undefined,
      }) as ScrapingPhaseResult;
      setStep10({ status: "success", result: data, error: null });
    } catch (e: unknown) {
      setStep10({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // ── Step 11: Synthesis — single section ───────────────────────────────────
  async function runStep11() {
    if (!step10.result) return;
    setStep11({ status: "running", result: null, error: null });
    const domain = step1.result?.domain ?? competitorUrl.replace(/https?:\/\/(www\.)?/, "").split("/")[0];
    try {
      const data = await post("/api/competitor-analysis/debug/synthesize-section", {
        section_name: synthSection,
        raw_data: { pages: step10.result.pages_content ?? step10.result.pages_summary, serper_results: step10.result.serper_results ?? step7.result?.results ?? {}, github_signals: step10.result.github_signals ?? step8.result ?? {}, npm_signals: step10.result.npm_signals ?? step9.result ?? {} },
        input_data: { competitor_name: domain.split(".")[0], competitor_url: competitorUrl.trim() },
      }) as SynthesisResult;
      setStep11({ status: "success", result: data, error: null });
    } catch (e: unknown) {
      setStep11({ status: "error", result: null, error: e instanceof Error ? e.message : String(e) });
    }
  }

  const s1 = step1.result;
  const s2 = step2.result;
  const s3 = step3.result;
  const s4 = step4.result;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/competitor-analysis" className="text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors"><ArrowLeft size={16} /></Link>
        <FlaskConical size={16} className="text-[var(--accent-amber)]" />
        <div>
          <h1 className="text-lg font-bold text-[var(--text-1)]">Competitor Analysis — Debug Lab</h1>
          <p className="text-xs text-[var(--text-3)]">12 steps · Phase 1: route analysis → fetch → Serper → GitHub/npm · Phase 2: AI synthesis per section</p>
        </div>
      </div>

      {/* Config */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-1)] p-5 mb-5">
        <p className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-3">Input</p>
        <div className="flex gap-3">
          <input
            type="url"
            placeholder="https://sensesindia.in/"
            className="flex-1 bg-[var(--bg-1)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors"
            value={competitorUrl}
            onChange={(e) => setCompetitorUrl(e.target.value)}
          />
          <button onClick={resetAll} className="px-5 py-3 rounded-lg border border-[var(--border-subtle)] text-[var(--text-2)] hover:bg-[var(--bg-1)] hover:text-[var(--text-1)] text-sm font-semibold transition-colors flex items-center gap-2">
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <StepCard number={0} title="Detect Target Pipeline"
        description="Analyzes the homepage to auto-detect the business category and configure the pipeline's integration sequence."
        status={step0.status} error={step0.error} canRun={Boolean(competitorUrl.trim())} onRun={runStep0}>
        {step0.result && (
          <div className="flex flex-wrap gap-2">
            <StatChip label="pipeline category" value={step0.result.detected_category} accent />
            {Object.entries(step0.result.flags).map(([f, enabled]) => (
              <StatChip key={f} label={`integration ${f}`} value={enabled ? "enabled" : "disabled"} />
            ))}
          </div>
        )}
      </StepCard>

      {/* Pipeline steps */}
      {step0.status === "success" && (
        <div className="flex flex-col gap-3">

        <StepCard number={1} title="Route Analysis"
          description="Full sitemap fetch → normalize → hard filter → classify → score → prioritize"
          status={step1.status} error={step1.error} canRun={Boolean(competitorUrl.trim())} onRun={runStep1}>
          {s1 && <Step1Output result={s1} />}
        </StepCard>

        <StepCard number={2} title="Shallow Meta Fetch"
          description={s1 ? `Fetch title / H1 / description for ${s1.important_count} important routes (free — no Firecrawl)` : "Fetch page metadata for important routes (run Step 1 first)"}
          status={step2.status} error={step2.error} canRun={step1.status === "success"} onRun={runStep2}>
          {s2 && <Step2Output result={s2} />}
        </StepCard>

        <StepCard number={3} title="Metadata Rescore"
          description={s2 ? `Apply keyword rules to title/H1/description for ${s1?.important_count ?? 0} candidates → adjusted scores (instant)` : "Re-score candidates using page metadata signals (run Steps 1 & 2 first)"}
          status={step3.status} error={step3.error} canRun={step2.status === "success"} onRun={runStep3}>
          {s3 && <Step3Output result={s3} />}
        </StepCard>

        <StepCard number={4} title="Claude Haiku Re-rank"
          description={s3 ? `LLM reviews ${s3.kept_count} candidates with metadata context → priority 1–10 + reasoning per route` : "LLM reviews scored candidates with page context (run Steps 1–3 first)"}
          status={step4.status} error={step4.error} canRun={step3.status === "success"} onRun={runStep4}>
          {s4 && <Step4Output result={s4} />}
        </StepCard>

        <StepCard number={5} title="Fetch Page Content (batch)"
          description={s4 ? `httpx-first fetch of ${s4.kept_count} Haiku-selected routes (Firecrawl fallback for key pages)` : "Batch page fetch for Haiku-selected routes (run Steps 1–4 first)"}
          status={step5.status} error={step5.error} canRun={step4.status === "success"} onRun={runStep5}>
          {step5.result && <Step5Output result={step5.result} />}
        </StepCard>

        {/* ── DIVIDER ── */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          <span className="text-[10px] text-[var(--text-3)] uppercase tracking-wider font-semibold">Enrichment (independent — can run anytime)</span>
          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
        </div>

        <StepCard number={6} title="Fetch Single Page"
          description="Test httpx-first + Firecrawl fallback for one URL. Uses first route from Step 5 if available."
          status={step6.status} error={step6.error} canRun={Boolean(competitorUrl.trim())} onRun={runStep6}>
          {step6.result && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <StatChip label="method" value={step6.result.method} accent={step6.result.method === "firecrawl"} />
                <StatChip label="chars" value={step6.result.chars.toLocaleString()} />
              </div>
              {step6.result.preview && (
                <pre className="text-[10px] text-[var(--text-3)] bg-[var(--bg-0)] rounded-lg p-3 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto scrollbar-thin">{step6.result.preview}</pre>
              )}
            </div>
          )}
        </StepCard>

        <StepCard number={7} title="Serper Enrichment"
          description={`Run all configured Serper queries in parallel. Requires SERPER_API_KEY. ~$0.01 per run.`}
          status={step7.status} error={step7.error} canRun={Boolean(competitorUrl.trim())} onRun={runStep7}>
          {step7.result && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <StatChip label="category" value={step7.result.detected_category ?? "manual"} accent />
                <StatChip label="queries returned" value={`${step7.result.queries_run}/${step7.result.query_keys.length}`} accent />
              </div>

              {step7.result.classification_debug?.system_prompt && (
                <div className="mt-2 p-3 bg-[var(--bg-0)] rounded-lg border border-[var(--border-subtle)] space-y-2">
                  <p className="text-[10px] text-[var(--text-3)] font-semibold uppercase tracking-wider">Classification Prompt (Step 0)</p>
                  <pre className="text-[10px] text-[var(--text-3)] whitespace-pre-wrap max-h-32 overflow-y-auto font-mono scrollbar-thin">
                    {step7.result.classification_debug.system_prompt}
                    {"\n\n"}
                    {step7.result.classification_debug.user_msg?.slice(0, 500)}...
                  </pre>
                  <div className="pt-2 border-t border-[var(--border-subtle)]">
                    <span className="text-[10px] font-semibold text-[var(--text-2)] mr-2">LLM Output:</span>
                    <span className="text-[11px] text-[var(--accent-amber)] font-mono">{step7.result.classification_debug.raw_response}</span>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] max-h-72 overflow-y-auto scrollbar-thin">
                {step7.result.query_keys.map(k => {
                  const res = step7.result!.results[k];
                  const items = (res?.organic ?? res?.news ?? []).length;
                  return (
                    <div key={k} className="flex items-center gap-3 px-3 py-2 text-[10px]">
                      <span className="font-mono text-[var(--text-3)] w-40 truncate shrink-0">{k}</span>
                      <span className="text-[var(--text-2)] flex-1">{items} results</span>
                    </div>
                  );
                })}
              </div>
              <JsonView data={step7.result.results} label="Full results JSON" />
            </div>
          )}
        </StepCard>

        {step0.result?.flags.github && (
          <StepCard number={8} title="GitHub Enrichment"
            description="Searches GitHub for repos belonging to the brand name to extract team size proxies and tech stack."
            status={step8.status} error={step8.error} canRun={Boolean(competitorUrl.trim())} onRun={runStep8}>
            {step8.result && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {step8.result.org_found ? <StatChip label="org matched" value="yes" accent /> : <StatChip label="org matched" value="no" />}
                  <StatChip label="public repos" value={step8.result.public_repos_count ?? 0} accent={(step8.result.public_repos_count ?? 0) > 0} />
                </div>
                {(step8.result.org_repos ?? []).length > 0 && (
                  <div className="rounded-lg border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
                    {(step8.result.org_repos ?? []).slice(0, 5).map((r, i) => (
                      <div key={i} className="flex items-start gap-3 px-3 py-2 text-[10px]">
                        <span className="font-mono text-[var(--accent-amber)] whitespace-nowrap">{r.name}</span>
                        <span className="text-[var(--text-3)] flex-1">{r.description}</span>
                        <span className="text-[var(--text-2)] whitespace-nowrap shrink-0">{r.language || "-"}</span>
                        <div className="flex items-center gap-1 text-[var(--text-3)] shrink-0 w-8 justify-end">
                          <Star size={10} /><span>{r.stars}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </StepCard>
        )}

        {step0.result?.flags.npm && (
          <StepCard number={9} title="NPM Packages"
            description="Finds CLI tools, SDKs, or libraries maintained by the brand. Proxy for developer adoption."
            status={step9.status} error={step9.error} canRun={Boolean(competitorUrl.trim())} onRun={runStep9}>
            {step9.result && (
              <div className="space-y-3">
                <StatChip label="packages found" value={step9.result.total ?? 0} accent={(step9.result.total ?? 0) > 0} />
                {(step9.result.packages ?? []).length > 0 && (
                  <div className="rounded-lg border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
                    {(step9.result.packages ?? []).map((p, i) => (
                      <div key={i} className="flex items-start gap-3 px-3 py-2 text-[10px]">
                        <span className="font-mono text-[var(--text-2)] shrink-0">{p.name}</span>
                        <span className="text-[var(--text-3)] flex-1 truncate">{p.description}</span>
                        <span className="text-[var(--text-3)] shrink-0">{p.version}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </StepCard>
        )}

        {/* ── DIVIDER ── */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          <span className="text-[10px] text-[var(--text-3)] uppercase tracking-wider font-semibold">Phase 1 End-to-End + Phase 2 Synthesis</span>
          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
        </div>

        <StepCard number={10} title="Full Phase 1 Scraping Run"
          description="Routes + page fetch + Serper + GitHub + npm — all in one call. No DB writes. Shows pages summary + enrichment stats."
          status={step10.status} error={step10.error} canRun={Boolean(competitorUrl.trim())} onRun={runStep10}>
          {step10.result && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <StatChip label="category" value={step10.result.detected_category ?? "manual"} accent />
                {typeof step10.result.audit?.pipeline_name === "string" && <StatChip label="pipeline" value={step10.result.audit.pipeline_name} accent />}
                <StatChip label="pages fetched" value={step10.result.pages_count} accent />
                <StatChip label="serper queries" value={step10.result.serper_keys.length} />
                <StatChip label="github org" value={step10.result.github_org_found === true ? "found" : step10.result.github_org_found === false ? "not found" : "skipped"} />
                <StatChip label="npm packages" value={step10.result.npm_total ?? "skipped"} />
              </div>

              {Array.isArray(step10.result.audit?.steps_executed) && (
                <div className="mt-2 p-3 bg-[var(--bg-0)] rounded-lg border border-[var(--border-subtle)] space-y-2">
                  <p className="text-[10px] text-[var(--text-3)] font-semibold uppercase tracking-wider">Executed Pipeline Steps</p>
                  <div className="flex flex-wrap gap-2">
                    {(step10.result.audit.steps_executed as Array<{step: string, status: string}>).map((s, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--bg-1)] border border-[var(--border-default)]">
                        <CheckCircle2 size={10} className={s.status === "success" ? "text-emerald-500" : "text-red-500"} />
                        <span className="font-mono text-[9px] text-[var(--text-2)]">{s.step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step10.result.classification_debug?.system_prompt && (
                <div className="mt-2 p-3 bg-[var(--bg-0)] rounded-lg border border-[var(--border-subtle)] space-y-2">
                  <p className="text-[10px] text-[var(--text-3)] font-semibold uppercase tracking-wider">Classification Prompt (Step 0)</p>
                  <pre className="text-[10px] text-[var(--text-3)] whitespace-pre-wrap max-h-32 overflow-y-auto font-mono scrollbar-thin">
                    {step10.result.classification_debug.system_prompt}
                    {"\n\n"}
                    {step10.result.classification_debug.user_msg?.slice(0, 500)}...
                  </pre>
                  <div className="pt-2 border-t border-[var(--border-subtle)]">
                    <span className="text-[10px] font-semibold text-[var(--text-2)] mr-2">LLM Output:</span>
                    <span className="text-[11px] text-[var(--accent-amber)] font-mono">{step10.result.classification_debug.raw_response}</span>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] max-h-72 overflow-y-auto scrollbar-thin">
                {Object.entries(step10.result.pages_summary).map(([url, info]) => (
                  <div key={url} className="flex items-center gap-3 px-3 py-2 text-[10px]">
                    <span className={`shrink-0 font-mono text-[9px] px-1 py-0.5 rounded ${info.method === "firecrawl" ? "text-amber-300 bg-amber-950/30" : info.method === "httpx" ? "text-emerald-300 bg-emerald-950/30" : "text-[var(--text-3)] bg-[var(--bg-2)]"}`}>{info.method}</span>
                    <span className="text-[var(--text-2)] flex-1 truncate font-mono">{url}</span>
                    <span className="text-[var(--text-3)] shrink-0">{info.chars.toLocaleString()}c</span>
                  </div>
                ))}
              </div>
              <JsonView data={step10.result.audit} label="Audit JSON" />
            </div>
          )}
        </StepCard>

        <StepCard number={11} title="AI Synthesis — Single Section"
          description="Test one synthesis section with data from Steps 7–10 above. Requires ANTHROPIC_API_KEY. Run Step 10 first."
          status={step11.status} error={step11.error} canRun={step10.status === "success"} onRun={runStep11}>
          <div className="mb-3">
            <label className="text-[10px] text-[var(--text-3)] mb-1 block">Section to synthesize</label>
            <select value={synthSection} onChange={e => setSynthSection(e.target.value)}
              className="bg-[var(--bg-0)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-xs text-[var(--text-1)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors">
              {["product_overview","pricing_and_packaging","gtm_and_positioning","funding_and_company",
                "customer_and_social_proof","job_postings_intel","community_and_developer_presence",
                "executive_summary","tactical_recommendations"].map(s => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          {step11.result && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <StatChip label="model" value={step11.result.model_used.includes("haiku") ? "Haiku" : "Sonnet"} accent={step11.result.model_used.includes("sonnet")} />
                {step11.result.debug?.input_tokens != null && <StatChip label="tokens in" value={step11.result.debug.input_tokens!} />}
                {step11.result.debug?.output_tokens != null && <StatChip label="tokens out" value={step11.result.debug.output_tokens!} />}
              </div>

              {/* Context sent to model */}
              {step11.result.debug?.context_sent && (
                <div className="rounded-lg border border-sky-800/40 bg-sky-950/10 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-sky-950/20 border-b border-sky-800/30">
                    <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">Context sent to model</span>
                    <span className="text-[10px] text-sky-400/60 ml-auto font-mono">{step11.result.debug.context_sent.length.toLocaleString()} chars</span>
                  </div>
                  <pre className="text-[10px] text-sky-200/70 p-3 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto scrollbar-thin">{step11.result.debug.context_sent}</pre>
                </div>
              )}

              {/* Raw model response */}
              {step11.result.debug?.raw_response && (
                <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/10 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-950/20 border-b border-emerald-800/30">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Raw model response</span>
                    <span className="text-[10px] text-emerald-400/60 ml-auto font-mono">{step11.result.debug.raw_response.length.toLocaleString()} chars</span>
                  </div>
                  <pre className="text-[10px] text-emerald-200/70 p-3 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto scrollbar-thin">{step11.result.debug.raw_response}</pre>
                </div>
              )}

              {/* Parsed result */}
              <JsonView data={step11.result.result} label={`Parsed output — ${synthSection.replace(/_/g, " ")}`} />

              {/* Extras */}
              <div className="flex gap-2 flex-wrap">
                {step11.result.debug?.system_prompt && <JsonView data={step11.result.debug.system_prompt} label="System prompt" />}
                {step11.result.debug?.schema && <JsonView data={step11.result.debug.schema} label="Expected schema" />}
              </div>
            </div>
          )}
        </StepCard>
      
        </div>
      )}
    </div>
  );
}
