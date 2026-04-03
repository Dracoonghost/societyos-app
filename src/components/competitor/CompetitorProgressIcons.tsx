"use client";

/**
 * 6 inline SVG stage icons for the competitor analysis progress screen.
 * Each accepts `state` prop: "done" | "active" | "pending"
 */

type IconState = "done" | "active" | "pending";

const COLORS: Record<IconState, { stroke: string; fill: string; opacity: string }> = {
  done:    { stroke: "rgb(52 211 153)",    fill: "rgb(6 78 59 / 0.25)",   opacity: "1" },   // emerald
  active:  { stroke: "rgb(251 191 36)",    fill: "rgb(120 53 15 / 0.25)", opacity: "1" },   // amber
  pending: { stroke: "rgb(100 116 139)",   fill: "rgb(30 41 59 / 0.25)",  opacity: "0.4" }, // slate, dimmed
};

interface StageIconProps {
  state: IconState;
  size?: number;
}

/** Stage 1 — Target / crosshair (classifying competitor type) */
export function ClassifyIcon({ state, size = 40 }: StageIconProps) {
  const c = COLORS[state];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ opacity: c.opacity }}>
      {/* Outer ring */}
      <circle cx="20" cy="20" r="14" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" />
      {/* Middle ring */}
      <circle cx="20" cy="20" r="8" fill="none" stroke={c.stroke} strokeWidth="1" opacity="0.6" />
      {/* Inner dot */}
      <circle cx="20" cy="20" r="2.5" fill={c.stroke} />
      {/* Crosshair lines */}
      <line x1="20" y1="4" x2="20" y2="10" stroke={c.stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="30" x2="20" y2="36" stroke={c.stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4" y1="20" x2="10" y2="20" stroke={c.stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="30" y1="20" x2="36" y2="20" stroke={c.stroke} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Stage 2 — Spider web / crawl nodes (scraping pages) */
export function ScrapeIcon({ state, size = 40 }: StageIconProps) {
  const c = COLORS[state];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ opacity: c.opacity }}>
      {/* Radial lines from center */}
      <line x1="20" y1="20" x2="20" y2="6" stroke={c.stroke} strokeWidth="1" opacity="0.5" />
      <line x1="20" y1="20" x2="32" y2="12" stroke={c.stroke} strokeWidth="1" opacity="0.5" />
      <line x1="20" y1="20" x2="34" y2="24" stroke={c.stroke} strokeWidth="1" opacity="0.5" />
      <line x1="20" y1="20" x2="28" y2="34" stroke={c.stroke} strokeWidth="1" opacity="0.5" />
      <line x1="20" y1="20" x2="12" y2="34" stroke={c.stroke} strokeWidth="1" opacity="0.5" />
      <line x1="20" y1="20" x2="6" y2="24" stroke={c.stroke} strokeWidth="1" opacity="0.5" />
      <line x1="20" y1="20" x2="8" y2="12" stroke={c.stroke} strokeWidth="1" opacity="0.5" />
      {/* Concentric web rings */}
      <circle cx="20" cy="20" r="6" fill="none" stroke={c.stroke} strokeWidth="0.8" opacity="0.4" />
      <circle cx="20" cy="20" r="12" fill="none" stroke={c.stroke} strokeWidth="0.8" opacity="0.3" />
      {/* Outer nodes */}
      <circle cx="20" cy="6" r="2.5" fill={c.fill} stroke={c.stroke} strokeWidth="1.2" />
      <circle cx="32" cy="12" r="2" fill={c.fill} stroke={c.stroke} strokeWidth="1.2" />
      <circle cx="34" cy="24" r="2" fill={c.fill} stroke={c.stroke} strokeWidth="1.2" />
      <circle cx="28" cy="34" r="2" fill={c.fill} stroke={c.stroke} strokeWidth="1.2" />
      {/* Center node */}
      <circle cx="20" cy="20" r="3.5" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" />
    </svg>
  );
}

/** Stage 3 — Magnifying glass over data table (core analysis: product/pricing/GTM) */
export function CoreAnalysisIcon({ state, size = 40 }: StageIconProps) {
  const c = COLORS[state];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ opacity: c.opacity }}>
      {/* Background card */}
      <rect x="5" y="9" width="24" height="22" rx="2.5" fill={c.fill} stroke={c.stroke} strokeWidth="1.2" />
      {/* Table rows */}
      <line x1="9" y1="15" x2="25" y2="15" stroke={c.stroke} strokeWidth="0.8" opacity="0.5" />
      <line x1="9" y1="19.5" x2="22" y2="19.5" stroke={c.stroke} strokeWidth="0.8" opacity="0.5" />
      <line x1="9" y1="24" x2="25" y2="24" stroke={c.stroke} strokeWidth="0.8" opacity="0.5" />
      {/* Magnifying glass */}
      <circle cx="29" cy="26" r="7" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" />
      <line x1="34" y1="31" x2="38" y2="35" stroke={c.stroke} strokeWidth="2" strokeLinecap="round" />
      {/* Lens glint */}
      <circle cx="27" cy="24" r="1.5" fill="none" stroke={c.stroke} strokeWidth="0.8" opacity="0.6" />
    </svg>
  );
}

/** Stage 4 — Stack of layers (deep analysis: jobs/community) */
export function DeepAnalysisIcon({ state, size = 40 }: StageIconProps) {
  const c = COLORS[state];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ opacity: c.opacity }}>
      {/* Bottom layer */}
      <ellipse cx="20" cy="31" rx="14" ry="5" fill={c.fill} stroke={c.stroke} strokeWidth="1.2" />
      {/* Middle layer */}
      <ellipse cx="20" cy="22" rx="11" ry="4.5" fill={c.fill} stroke={c.stroke} strokeWidth="1.2" />
      {/* Top layer */}
      <ellipse cx="20" cy="14" rx="8.5" ry="4" fill={c.fill} stroke={c.stroke} strokeWidth="1.2" />
      {/* Search dot on top */}
      <circle cx="20" cy="14" r="2" fill="none" stroke={c.stroke} strokeWidth="1.5" />
      <circle cx="20" cy="14" r="0.7" fill={c.stroke} />
    </svg>
  );
}

/** Stage 5 — Document with summary lines (executive summary) */
export function ExecSummaryIcon({ state, size = 40 }: StageIconProps) {
  const c = COLORS[state];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ opacity: c.opacity }}>
      {/* Document */}
      <path
        d="M9 5 L27 5 L35 13 L35 36 L9 36 Z"
        fill={c.fill}
        stroke={c.stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Dog-ear fold */}
      <path d="M27 5 L27 13 L35 13" fill="none" stroke={c.stroke} strokeWidth="1" opacity="0.6" />
      {/* Text lines */}
      <line x1="14" y1="18" x2="30" y2="18" stroke={c.stroke} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      <line x1="14" y1="22" x2="30" y2="22" stroke={c.stroke} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      <line x1="14" y1="26" x2="24" y2="26" stroke={c.stroke} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      {/* Star / highlight on top */}
      <circle cx="14" cy="18" r="2" fill={c.stroke} opacity="0.3" />
    </svg>
  );
}

/** Stage 6 — Lightning bolt / checkmark shield (strategic recommendations) */
export function FinalizeIcon({ state, size = 40 }: StageIconProps) {
  const c = COLORS[state];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ opacity: c.opacity }}>
      {/* Shield */}
      <path
        d="M20 4 L34 10 L34 22 C34 30 27 36 20 38 C13 36 6 30 6 22 L6 10 Z"
        fill={c.fill}
        stroke={c.stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Checkmark */}
      <polyline
        points="13,20 18,26 28,14"
        stroke={c.stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
