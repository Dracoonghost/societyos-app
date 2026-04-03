"use client";

import { useState } from "react";
import {
  CheckCircle2, XCircle, MinusCircle, AlertCircle,
  Clock, Database, Cpu, ChevronDown, ChevronRight, ExternalLink,
  Globe, FileText,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function ms(n?: number | null) {
  if (n === null || n === undefined) return "—";
  if (n < 1000) return `${n}ms`;
  return `${(n / 1000).toFixed(1)}s`;
}

function StatusDot({ status }: { status?: string | null }) {
  if (status === "success" || status === "ok")
    return <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />;
  if (status === "error" || status === "exception" || status === "failed")
    return <XCircle size={12} className="text-red-400 shrink-0" />;
  if (status === "skipped" || status === "disabled" || status === "not_found" || status === "fallback")
    return <MinusCircle size={12} className="text-[var(--text-3)] shrink-0" />;
  return <AlertCircle size={12} className="text-amber-400 shrink-0" />;
}

function StatusPill({ status }: { status?: string | null }) {
  const color =
    status === "success" || status === "ok"
      ? "text-emerald-400 bg-emerald-950/30 border-emerald-800/30"
      : status === "error" || status === "exception" || status === "failed"
        ? "text-red-400 bg-red-950/30 border-red-800/30"
        : status === "skipped" || status === "disabled" || status === "fallback"
          ? "text-[var(--text-3)] bg-[var(--bg-2)] border-[var(--border-subtle)]"
          : "text-amber-400 bg-amber-950/30 border-amber-800/30";
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${color}`}>
      {status ?? "pending"}
    </span>
  );
}

function Collapse({ label, children, defaultOpen = false }: {
  label: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[10px] text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors py-0.5"
      >
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        {label}
      </button>
      {open && <div className="mt-1.5 ml-3">{children}</div>}
    </div>
  );
}

function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="text-[10px] text-[var(--text-2)] bg-[var(--bg-1)] border border-[var(--border-subtle)] rounded p-2 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

// ---------------------------------------------------------------------------
// Phase 1 — Routes card (sitemap discovery)
// ---------------------------------------------------------------------------

interface RoutesAudit {
  method?: string;
  sitemap_url?: string | null;
  total_found?: number;
  selected?: string[];
  selected_count?: number;
  duration_ms?: number;
  status?: string;
}

function RoutesCard({ routes }: { routes: RoutesAudit }) {
  return (
    <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-2)]">
        <Globe size={12} className="text-[var(--text-3)] shrink-0" />
        <span className="text-xs font-semibold text-[var(--text-1)] flex-1">Sitemap Discovery</span>
        <StatusPill status={routes.status} />
        {routes.selected_count !== undefined && (
          <span className="text-[10px] text-[var(--text-3)]">{routes.selected_count} routes selected</span>
        )}
        <span className="text-[10px] text-[var(--text-3)]">{ms(routes.duration_ms)}</span>
      </div>

      {/* Body */}
      <div className="px-3 py-2.5 flex flex-col gap-2">
        {/* Key-value summary */}
        <div className="grid gap-1">
          {routes.method && (
            <div className="flex gap-2 text-[10px]">
              <span className="text-[var(--text-3)] w-24 shrink-0">method</span>
              <span className="text-[var(--text-2)] font-mono">{routes.method}</span>
            </div>
          )}
          {routes.sitemap_url && (
            <div className="flex gap-2 text-[10px] items-start">
              <span className="text-[var(--text-3)] w-24 shrink-0">sitemap url</span>
              <a
                href={routes.sitemap_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent-amber)] hover:underline flex items-center gap-0.5 font-mono break-all"
              >
                <ExternalLink size={9} className="shrink-0" />
                {routes.sitemap_url}
              </a>
            </div>
          )}
          {routes.total_found !== undefined && (
            <div className="flex gap-2 text-[10px]">
              <span className="text-[var(--text-3)] w-24 shrink-0">total found</span>
              <span className="text-[var(--text-2)] font-mono">{routes.total_found}</span>
            </div>
          )}
        </div>

        {/* Selected routes list */}
        {routes.selected && routes.selected.length > 0 && (
          <Collapse label={`Selected routes (${routes.selected.length})`}>
            <div className="flex flex-col gap-0.5">
              {routes.selected.map((url, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-[var(--text-3)] w-4 shrink-0">{i + 1}.</span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-2)] hover:text-[var(--accent-amber)] transition-colors font-mono truncate"
                  >
                    {url}
                  </a>
                </div>
              ))}
            </div>
          </Collapse>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase 1 — Firecrawl card (page content)
// ---------------------------------------------------------------------------

interface FirecrawlPage {
  url: string;
  status: string;
  http_status?: number;
  chars?: number;
  error?: string;
}

interface FirecrawlAudit {
  total?: number;
  ok?: number;
  pages?: FirecrawlPage[];
  duration_ms?: number;
  status?: string;
  error?: string;
}

function FirecrawlCard({ firecrawl }: { firecrawl: FirecrawlAudit }) {
  const pages = firecrawl.pages ?? [];
  const errors = pages.filter((p) => p.status === "error");
  const empty = pages.filter((p) => p.status === "empty");

  return (
    <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-2)]">
        <FileText size={12} className="text-[var(--text-3)] shrink-0" />
        <span className="text-xs font-semibold text-[var(--text-1)] flex-1">Firecrawl — Page Content</span>
        <StatusPill status={firecrawl.status} />
        {firecrawl.ok !== undefined && firecrawl.total !== undefined && (
          <span className="text-[10px] text-[var(--text-3)]">{firecrawl.ok}/{firecrawl.total} ok</span>
        )}
        <span className="text-[10px] text-[var(--text-3)]">{ms(firecrawl.duration_ms)}</span>
      </div>

      {/* Body */}
      <div className="px-3 py-2.5 flex flex-col gap-2">
        {firecrawl.error && (
          <p className="text-[10px] text-amber-400/80">{firecrawl.error}</p>
        )}

        {errors.length > 0 && (
          <p className="text-[10px] text-red-400/70">{errors.length} page(s) failed to scrape</p>
        )}
        {empty.length > 0 && (
          <p className="text-[10px] text-amber-400/70">{empty.length} page(s) returned empty content</p>
        )}

        {pages.length > 0 && (
          <Collapse label={`Pages (${pages.length})`} defaultOpen={pages.length <= 5}>
            <div className="flex flex-col gap-1">
              {pages.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] py-0.5">
                  <StatusDot status={p.status} />
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-2)] hover:text-[var(--accent-amber)] transition-colors font-mono flex-1 truncate"
                  >
                    {p.url}
                  </a>
                  {p.chars !== undefined && p.chars > 0 && (
                    <span className="text-[var(--text-3)] shrink-0">{p.chars.toLocaleString()} chars</span>
                  )}
                  {p.http_status && p.http_status !== 200 && (
                    <span className="text-red-400/80 shrink-0">HTTP {p.http_status}</span>
                  )}
                  {p.error && (
                    <span className="text-red-400/80 shrink-0 truncate max-w-[200px]">{p.error}</span>
                  )}
                </div>
              ))}
            </div>
          </Collapse>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scraper group section
// ---------------------------------------------------------------------------

interface SerperQueryRow_Props {
  q: {
    query: string;
    results_count?: number;
    results_preview?: { url?: string; title?: string; snippet?: string }[];
  };
}

function SerperQueryRow({ q }: SerperQueryRow_Props) {
  return (
    <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-2)]">
        <span className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider shrink-0">SERPER</span>
        <span className="text-xs text-[var(--text-2)] font-mono flex-1 truncate">{q.query}</span>
        <span className="text-[10px] text-[var(--text-3)] shrink-0">{q.results_count ?? 0} results</span>
      </div>
      {q.results_preview && q.results_preview.length > 0 && (
        <div className="px-3 py-2 divide-y divide-[var(--border-subtle)]">
          {q.results_preview.map((r, i) => (
            <div key={i} className="py-1.5 first:pt-0 last:pb-0">
              <div className="flex items-start gap-1.5">
                <span className="text-[10px] text-[var(--text-3)] shrink-0 mt-px">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-[var(--accent-amber)] hover:underline flex items-center gap-0.5 truncate">
                      <ExternalLink size={9} className="shrink-0" />
                      {r.url}
                    </a>
                  )}
                  {r.title && <p className="text-[10px] text-[var(--text-2)] mt-0.5">{r.title}</p>}
                  {r.snippet && <p className="text-[10px] text-[var(--text-3)] mt-0.5 italic">{r.snippet}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ActorEntry {
  actor?: string;
  tool?: string;
  status?: string | null;
  items?: number;
  chars?: number;
  error?: string | null;
  skip_reason?: string;
  input?: unknown;
  run_id?: string | null;
  apify_run_url?: string | null;
  sample_output?: unknown[];
  duration_ms?: number;
}

function ActorCard({ name, entry }: { name: string; entry: ActorEntry }) {
  const actorId = entry.actor ?? entry.tool ?? name;
  const count = entry.items ?? entry.chars;
  const unit = entry.chars !== undefined && entry.items === undefined ? "chars" : "items";

  return (
    <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-2)]">
        <StatusDot status={entry.status} />
        <span className="text-xs font-semibold text-[var(--text-1)] flex-1">{name}</span>
        <StatusPill status={entry.status} />
        {count !== undefined && (
          <span className="text-[10px] text-[var(--text-3)]">{count} {unit}</span>
        )}
        {entry.duration_ms !== undefined && (
          <span className="text-[10px] text-[var(--text-3)]">{ms(entry.duration_ms)}</span>
        )}
      </div>
      <div className="px-3 py-2.5 flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono text-[var(--text-3)]">{actorId}</span>
          {entry.apify_run_url && (
            <a href={entry.apify_run_url} target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-[var(--accent-amber)] hover:underline flex items-center gap-0.5">
              <ExternalLink size={9} />
              view run
            </a>
          )}
          {entry.run_id && !entry.apify_run_url && (
            <span className="text-[10px] text-[var(--text-3)] font-mono">run: {entry.run_id}</span>
          )}
        </div>
        {entry.skip_reason && (
          <p className="text-[10px] text-amber-400/80">Skipped: {entry.skip_reason}</p>
        )}
        {entry.error && (
          <p className="text-[10px] text-red-400/80 break-all">{entry.error}</p>
        )}
        {entry.input !== undefined && entry.input !== null && (
          <Collapse label="Input sent">
            <JsonBlock data={entry.input} />
          </Collapse>
        )}
        {entry.sample_output && entry.sample_output.length > 0 && (
          <Collapse label={`Sample output (${entry.sample_output.length} of ${count ?? "?"} items)`}>
            <JsonBlock data={entry.sample_output} />
          </Collapse>
        )}
        {entry.status === "success" && !entry.error && (!count || count === 0) && (
          <p className="text-[10px] text-amber-400/70">Actor succeeded but returned 0 items</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generic scraper group — handles both Phase 1 (routes/firecrawl) and
// future phases (discovery/actors/serper)
// ---------------------------------------------------------------------------

interface ScraperGroup {
  // Phase 1
  routes?: RoutesAudit;
  firecrawl?: FirecrawlAudit;
  // Future phases
  discovery?: {
    serper_queries?: { query: string; results_count?: number; results_preview?: { url?: string; title?: string; snippet?: string }[] }[];
    [key: string]: unknown;
  };
  actors?: Record<string, ActorEntry>;
  duration_ms?: number;
  [key: string]: unknown;
}

function ScraperSection({ name, group }: { name: string; group: ScraperGroup | null }) {
  if (!group) return null;

  const isPhase1 = "routes" in group || "firecrawl" in group;

  // Infer overall group status
  let groupStatus: string | null = null;
  if (isPhase1) {
    const routeOk = group.routes?.status === "success" || group.routes?.status === "fallback";
    const crawlOk = group.firecrawl?.status === "success";
    groupStatus = routeOk && crawlOk ? "success" : routeOk || crawlOk ? "success" : "error";
  } else {
    const actorEntries = group.actors
      ? Object.values(group.actors)
      : Object.values(group).filter((v) => v && typeof v === "object" &&
          ("status" in (v as object) || "actor" in (v as object)));
    const statuses = (actorEntries as ActorEntry[]).map((a) => a.status);
    const hasError = statuses.some((s) => s === "error" || s === "exception");
    groupStatus = hasError ? "error" : actorEntries.length > 0 ? "success" : null;
  }

  const totalDuration = isPhase1
    ? (group.routes?.duration_ms ?? 0) + (group.firecrawl?.duration_ms ?? 0)
    : group.duration_ms;

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-1)] overflow-hidden">
      {/* Group header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-2)] border-b border-[var(--border-subtle)]">
        <StatusDot status={groupStatus} />
        <span className="text-sm font-bold text-[var(--text-1)] flex-1 capitalize">{name.replace(/_/g, " ")}</span>
        <span className="text-[10px] text-[var(--text-3)]">{ms(totalDuration)}</span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Phase 1: routes + firecrawl cards */}
        {isPhase1 && (
          <>
            {group.routes && <RoutesCard routes={group.routes} />}
            {group.firecrawl && <FirecrawlCard firecrawl={group.firecrawl} />}
          </>
        )}

        {/* Future phases: serper queries */}
        {!isPhase1 && group.discovery?.serper_queries && group.discovery.serper_queries.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-1.5">
              Search Queries ({group.discovery.serper_queries.length})
            </p>
            <div className="flex flex-col gap-2">
              {group.discovery.serper_queries.map((q, i) => (
                <SerperQueryRow key={i} q={q} />
              ))}
            </div>
          </div>
        )}

        {/* Future phases: discovery kv */}
        {!isPhase1 && group.discovery && (() => {
          const kvEntries = Object.entries(group.discovery).filter(([k, v]) =>
            k !== "serper_queries" && v !== null && v !== undefined && typeof v !== "object"
          );
          if (kvEntries.length === 0) return null;
          return (
            <div className="p-2.5 rounded-lg bg-[var(--bg-2)] border border-[var(--border-subtle)]">
              <p className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-1.5">Discovery Results</p>
              <div className="grid gap-1">
                {kvEntries.map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-[10px]">
                    <span className="text-[var(--text-3)] shrink-0 w-40 truncate">{k.replace(/_/g, " ")}</span>
                    <span className="text-[var(--text-2)] font-mono break-all">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Future phases: actor cards */}
        {!isPhase1 && (() => {
          const SKIP_KEYS = new Set(["discovery", "duration_ms", "status", "error"]);
          const actorEntries: [string, ActorEntry][] = [];
          if (group.actors) {
            actorEntries.push(...Object.entries(group.actors) as [string, ActorEntry][]);
          } else {
            for (const [k, v] of Object.entries(group)) {
              if (!SKIP_KEYS.has(k) && v && typeof v === "object" &&
                ("status" in (v as object) || "actor" in (v as object) || "tool" in (v as object))) {
                actorEntries.push([k, v as ActorEntry]);
              }
            }
          }
          if (actorEntries.length === 0) return null;
          return (
            <div>
              <p className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-1.5">
                Actor Calls ({actorEntries.length})
              </p>
              <div className="flex flex-col gap-2">
                {actorEntries.map(([k, entry]) => (
                  <ActorCard key={k} name={k} entry={entry} />
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Synthesis table
// ---------------------------------------------------------------------------

interface SynthesisEntry {
  duration_ms?: number;
  status?: string;
  error?: string;
  prompt_chars?: number;
  output_keys?: string[];
}

interface SynthesisAudit {
  model?: string;
  sections?: Record<string, SynthesisEntry>;
  total_sections?: number;
  duration_ms?: number;
}

function SynthesisSection({ synthesis, aiInsights }: {
  synthesis: SynthesisAudit;
  aiInsights?: Record<string, unknown>;
}) {
  const sections: Record<string, SynthesisEntry> = synthesis.sections
    ?? (synthesis as Record<string, SynthesisEntry>);

  const sectionEntries = Object.entries(sections).filter(
    ([k]) => !["model", "sections", "total_sections", "duration_ms"].includes(k)
  );

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-1)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-2)] border-b border-[var(--border-subtle)]">
        <Cpu size={13} className="text-[var(--accent-amber)]" />
        <span className="text-sm font-bold text-[var(--text-1)]">AI Synthesis</span>
        {synthesis.model && (
          <span className="text-[10px] text-[var(--text-3)] font-mono ml-1">{synthesis.model}</span>
        )}
        <span className="ml-auto text-[10px] text-[var(--text-3)]">
          {synthesis.total_sections ?? sectionEntries.length} sections · {ms(synthesis.duration_ms)}
        </span>
      </div>
      <div className="divide-y divide-[var(--border-subtle)]">
        {sectionEntries.map(([section, entry]) => {
          const output = aiInsights?.[section] as Record<string, unknown> | undefined;
          return (
            <div key={section} className="px-4 py-2.5">
              <div className="flex items-center gap-3">
                <StatusDot status={entry.status} />
                <span className="text-xs text-[var(--text-2)] flex-1 capitalize">{section.replace(/_/g, " ")}</span>
                {entry.prompt_chars && (
                  <span className="text-[10px] text-[var(--text-3)]">prompt {(entry.prompt_chars / 1000).toFixed(1)}k chars</span>
                )}
                <span className="text-[10px] text-[var(--text-3)]">{ms(entry.duration_ms)}</span>
                <StatusPill status={entry.status} />
              </div>
              {entry.error && (
                <p className="text-[10px] text-red-400/80 mt-1 ml-5">{entry.error}</p>
              )}
              {output && (
                <div className="mt-1.5 ml-5">
                  <Collapse label={`Output (${entry.output_keys?.length ?? Object.keys(output as object).length} keys)`}>
                    <JsonBlock data={output} />
                  </Collapse>
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
// Main DebugPanel
// ---------------------------------------------------------------------------

interface AuditLog {
  pipeline_started_at?: string;
  total_duration_ms?: number;
  cache_used?: boolean;
  cache_source_id?: string;
  scraping?: Record<string, unknown> | null;
  synthesis?: SynthesisAudit | null;
}

interface DebugPanelProps {
  auditLog: AuditLog | null | undefined;
  reportId: string;
  aiInsights?: Record<string, unknown>;
}

export function DebugPanel({ auditLog, reportId, aiInsights }: DebugPanelProps) {
  if (!auditLog) {
    return (
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-1)] p-6 text-sm text-[var(--text-3)]">
        No audit log for this report. Re-scrape to generate one.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary bar */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-1)] px-5 py-4 flex flex-wrap gap-6 items-center text-sm">
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-[var(--text-3)]" />
          <span className="text-[var(--text-3)]">Total time</span>
          <span className="font-semibold text-[var(--text-1)]">{ms(auditLog.total_duration_ms)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Database size={13} className="text-[var(--text-3)]" />
          <span className="text-[var(--text-3)]">Raw cache</span>
          {auditLog.cache_used
            ? <span className="text-emerald-400 font-semibold text-xs">HIT</span>
            : <span className="text-[var(--text-2)] font-semibold text-xs">MISS — fresh scrape</span>}
          {auditLog.cache_source_id && (
            <span className="text-[10px] text-[var(--text-3)] font-mono">({auditLog.cache_source_id})</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[var(--text-3)]">report</span>
          <span className="text-[10px] text-[var(--text-3)] font-mono">{reportId}</span>
        </div>
        {auditLog.pipeline_started_at && (
          <span className="text-[10px] text-[var(--text-3)] font-mono ml-auto">{auditLog.pipeline_started_at}</span>
        )}
      </div>

      {/* Scraping groups */}
      {auditLog.scraping && (() => {
        const s = auditLog.scraping as Record<string, unknown>;

        // Cache-hit: scraping was skipped
        const isCacheHit = s.cache_used === true && !s.competitor && !s.own;
        if (isCacheHit) {
          const sourceId = s.cache_source_id ? String(s.cache_source_id) : null;
          return (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-1)] px-5 py-4 flex items-start gap-3">
              <Database size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-1)]">Scraping skipped — cached raw data used</p>
                {!!s.cache_scraped_at && (
                  <p className="text-[10px] text-[var(--text-3)] mt-0.5">scraped at: {String(s.cache_scraped_at)}</p>
                )}
                {sourceId && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-[var(--text-3)]">Tool calls happened in source report:</span>
                    <a
                      href={`/competitor-analysis/${sourceId}?tab=debug`}
                      className="text-[10px] text-[var(--accent-amber)] hover:underline font-mono flex items-center gap-0.5"
                    >
                      <ExternalLink size={9} />
                      {sourceId}
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Full scrape: render each group
        const SKIP = new Set(["cache_used", "duration_ms"]);
        const groups = Object.entries(s).filter(([k]) => !SKIP.has(k));
        if (groups.length === 0) return null;
        return (
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider">
              Scraping ({groups.length} group{groups.length !== 1 ? "s" : ""})
            </p>
            {groups.map(([name, group]) => (
              <ScraperSection key={name} name={name} group={group as ScraperGroup | null} />
            ))}
          </div>
        );
      })()}

      {/* AI synthesis */}
      {auditLog.synthesis && Object.keys(auditLog.synthesis).length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider">AI Synthesis</p>
          <SynthesisSection synthesis={auditLog.synthesis} aiInsights={aiInsights} />
        </div>
      )}
    </div>
  );
}
