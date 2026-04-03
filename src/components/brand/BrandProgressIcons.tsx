"use client";

/**
 * 6 inline SVG stage icons for the brand analysis progress screen.
 * Each accepts `state` prop: "done" | "active" | "pending"
 */

type IconState = "done" | "active" | "pending";

const COLORS: Record<IconState, { stroke: string; fill: string; opacity: string }> = {
  done:    { stroke: "rgb(52 211 153)",    fill: "rgb(6 78 59 / 0.25)",  opacity: "1" },     // emerald
  active:  { stroke: "rgb(251 191 36)",    fill: "rgb(120 53 15 / 0.25)", opacity: "1" },    // amber
  pending: { stroke: "rgb(100 116 139)",   fill: "rgb(30 41 59 / 0.25)", opacity: "0.4" },   // slate, dimmed
};

interface StageIconProps {
  state: IconState;
  size?: number;
}

/** Stage 1 — Magnifying glass scanning a globe */
export function IdentifyIcon({ state, size = 40 }: StageIconProps) {
  const c = COLORS[state];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ opacity: c.opacity }}>
      <circle cx="17" cy="17" r="10" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" />
      {/* Globe lines */}
      <ellipse cx="17" cy="17" rx="4" ry="10" stroke={c.stroke} strokeWidth="0.8" opacity="0.5" />
      <line x1="7" y1="17" x2="27" y2="17" stroke={c.stroke} strokeWidth="0.8" opacity="0.5" />
      <line x1="17" y1="7" x2="17" y2="27" stroke={c.stroke} strokeWidth="0.8" opacity="0.5" />
      {/* Handle */}
      <line x1="24.5" y1="24.5" x2="33" y2="33" stroke={c.stroke} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Stage 2 — Connected nodes (sitemap / crawl) */
export function CrawlIcon({ state, size = 40 }: StageIconProps) {
  const c = COLORS[state];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ opacity: c.opacity }}>
      {/* Lines connecting nodes */}
      <line x1="20" y1="8" x2="10" y2="20" stroke={c.stroke} strokeWidth="1" opacity="0.5" />
      <line x1="20" y1="8" x2="30" y2="20" stroke={c.stroke} strokeWidth="1" opacity="0.5" />
      <line x1="10" y1="20" x2="8" y2="32" stroke={c.stroke} strokeWidth="1" opacity="0.5" />
      <line x1="10" y1="20" x2="20" y2="32" stroke={c.stroke} strokeWidth="1" opacity="0.5" />
      <line x1="30" y1="20" x2="20" y2="32" stroke={c.stroke} strokeWidth="1" opacity="0.5" />
      <line x1="30" y1="20" x2="34" y2="32" stroke={c.stroke} strokeWidth="1" opacity="0.5" />
      {/* Nodes */}
      <circle cx="20" cy="8" r="3.5" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" />
      <circle cx="10" cy="20" r="3" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" />
      <circle cx="30" cy="20" r="3" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" />
      <circle cx="8" cy="32" r="2.5" fill={c.fill} stroke={c.stroke} strokeWidth="1" />
      <circle cx="20" cy="32" r="2.5" fill={c.fill} stroke={c.stroke} strokeWidth="1" />
      <circle cx="34" cy="32" r="2.5" fill={c.fill} stroke={c.stroke} strokeWidth="1" />
    </svg>
  );
}

/** Stage 3 — Bar chart / dashboard (core analysis) */
export function AnalyzeIcon({ state, size = 40 }: StageIconProps) {
  const c = COLORS[state];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ opacity: c.opacity }}>
      {/* Baseline */}
      <line x1="6" y1="34" x2="34" y2="34" stroke={c.stroke} strokeWidth="1.5" strokeLinecap="round" />
      {/* Bars */}
      <rect x="8" y="22" width="5" height="12" rx="1" fill={c.fill} stroke={c.stroke} strokeWidth="1" />
      <rect x="17" y="14" width="5" height="20" rx="1" fill={c.fill} stroke={c.stroke} strokeWidth="1" />
      <rect x="26" y="8" width="5" height="26" rx="1" fill={c.fill} stroke={c.stroke} strokeWidth="1" />
      {/* Trend line */}
      <polyline points="10.5,20 19.5,12 28.5,6" stroke={c.stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    </svg>
  );
}

/** Stage 4 — Social network nodes (discovering profiles) */
export function DiscoverIcon({ state, size = 40 }: StageIconProps) {
  const c = COLORS[state];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ opacity: c.opacity }}>
      {/* Lines from center */}
      <line x1="20" y1="20" x2="10" y2="8" stroke={c.stroke} strokeWidth="1" opacity="0.4" />
      <line x1="20" y1="20" x2="32" y2="10" stroke={c.stroke} strokeWidth="1" opacity="0.4" />
      <line x1="20" y1="20" x2="8" y2="30" stroke={c.stroke} strokeWidth="1" opacity="0.4" />
      <line x1="20" y1="20" x2="33" y2="32" stroke={c.stroke} strokeWidth="1" opacity="0.4" />
      <line x1="20" y1="20" x2="20" y2="36" stroke={c.stroke} strokeWidth="1" opacity="0.4" />
      {/* Center node (you) */}
      <circle cx="20" cy="20" r="4.5" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" />
      {/* Outer nodes (platforms) */}
      <circle cx="10" cy="8" r="2.5" fill={c.fill} stroke={c.stroke} strokeWidth="1" />
      <circle cx="32" cy="10" r="2.5" fill={c.fill} stroke={c.stroke} strokeWidth="1" />
      <circle cx="8" cy="30" r="2.5" fill={c.fill} stroke={c.stroke} strokeWidth="1" />
      <circle cx="33" cy="32" r="2.5" fill={c.fill} stroke={c.stroke} strokeWidth="1" />
      <circle cx="20" cy="36" r="2.5" fill={c.fill} stroke={c.stroke} strokeWidth="1" />
    </svg>
  );
}

/** Stage 5 — Layered stacks (deep analysis) */
export function DeepAnalyzeIcon({ state, size = 40 }: StageIconProps) {
  const c = COLORS[state];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ opacity: c.opacity }}>
      {/* Bottom layer */}
      <ellipse cx="20" cy="30" rx="14" ry="5" fill={c.fill} stroke={c.stroke} strokeWidth="1.2" />
      {/* Middle layer */}
      <ellipse cx="20" cy="22" rx="12" ry="4.5" fill={c.fill} stroke={c.stroke} strokeWidth="1.2" />
      {/* Top layer */}
      <ellipse cx="20" cy="14" rx="10" ry="4" fill={c.fill} stroke={c.stroke} strokeWidth="1.2" />
      {/* Eye / lens in top layer */}
      <circle cx="20" cy="14" r="2" fill="none" stroke={c.stroke} strokeWidth="1.5" />
      <circle cx="20" cy="14" r="0.8" fill={c.stroke} />
    </svg>
  );
}

/** Stage 6 — Shield with checkmark (finalize) */
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
