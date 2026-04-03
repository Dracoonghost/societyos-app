"use client";

import { motion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Shared animated decorative elements for multiple pages             */
/* ------------------------------------------------------------------ */

/* ── Floating Orbs — ambient background decoration ── */
interface OrbConfig {
  x: string;
  y: string;
  size: number;
  color: string;
  delay: number;
  duration: number;
}

const DEFAULT_ORBS: OrbConfig[] = [
  { x: "10%", y: "20%", size: 180, color: "rgba(242,169,59,0.06)", delay: 0, duration: 6 },
  { x: "80%", y: "15%", size: 140, color: "rgba(56,178,125,0.05)", delay: 1.5, duration: 7 },
  { x: "70%", y: "70%", size: 160, color: "rgba(88,184,216,0.04)", delay: 0.8, duration: 8 },
  { x: "20%", y: "75%", size: 120, color: "rgba(223,107,87,0.04)", delay: 2, duration: 6.5 },
];

export function FloatingOrbs({ orbs = DEFAULT_ORBS }: { orbs?: OrbConfig[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            filter: "blur(40px)",
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [0.95, 1.08, 0.95],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}
    </div>
  );
}

/* ── Login page full-screen decoration — spread across entire viewport ── */

interface LoginCard {
  verdict: string;
  color: string;
  x: string;
  y: string;
  rotate: number;
  delay: number;
  bars?: number[];
  score?: { label: string; value: number };
}

/* Cards positioned using viewport %. The center (~35%-65% x, ~25%-75% y) is
   avoided so nothing overlaps the auth card. */
const LOGIN_CARDS: LoginCard[] = [
  // Top-left zone
  { verdict: "PROCEED", color: "#38b27d", x: "4%", y: "12%", rotate: -8, delay: 0.5 },
  { verdict: "TAM $4.2B", color: "#f2a93b", x: "18%", y: "32%", rotate: 5, delay: 0.8, score: { label: "Market", value: 84 } },
  // Bottom-left zone
  { verdict: "NPS 72", color: "#58b8d8", x: "6%", y: "68%", rotate: -3, delay: 1.1 },
  { verdict: "RISK LOW", color: "#38b27d", x: "20%", y: "85%", rotate: 7, delay: 1.3, bars: [0.8, 0.5, 0.9, 0.6] },
  // Top-right zone
  { verdict: "NO-GO", color: "#df6b57", x: "78%", y: "10%", rotate: 6, delay: 0.6, bars: [0.3, 0.6, 0.2, 0.5] },
  { verdict: "FIT 8.4", color: "#58b8d8", x: "70%", y: "30%", rotate: -5, delay: 0.9 },
  // Bottom-right zone
  { verdict: "CONDITIONAL", color: "#f2a93b", x: "75%", y: "70%", rotate: 3, delay: 1.0, score: { label: "Viability", value: 62 } },
  { verdict: "SHARE 68%", color: "#38b27d", x: "82%", y: "88%", rotate: -6, delay: 1.2 },
];

const LOGIN_DOTS = [
  // Scattered across all four corners and edges
  { x: "3%", y: "45%", size: 3, color: "#f2a93b", delay: 0.4 },
  { x: "12%", y: "8%", size: 2, color: "#38b27d", delay: 0.7 },
  { x: "25%", y: "55%", size: 4, color: "#58b8d8", delay: 1.0 },
  { x: "15%", y: "78%", size: 2, color: "#df6b57", delay: 0.5 },
  { x: "28%", y: "18%", size: 3, color: "#f2a93b", delay: 0.9 },
  { x: "8%", y: "92%", size: 2, color: "#38b27d", delay: 1.2 },
  { x: "22%", y: "42%", size: 3, color: "#58b8d8", delay: 0.6 },
  { x: "92%", y: "20%", size: 3, color: "#58b8d8", delay: 0.5 },
  { x: "85%", y: "45%", size: 2, color: "#f2a93b", delay: 0.8 },
  { x: "68%", y: "55%", size: 3, color: "#38b27d", delay: 1.1 },
  { x: "90%", y: "75%", size: 2, color: "#df6b57", delay: 0.6 },
  { x: "72%", y: "92%", size: 4, color: "#f2a93b", delay: 0.9 },
  { x: "95%", y: "55%", size: 2, color: "#58b8d8", delay: 1.3 },
  { x: "65%", y: "8%", size: 3, color: "#38b27d", delay: 0.7 },
  // Top and bottom center edges (just outside the card zone)
  { x: "45%", y: "5%", size: 3, color: "#f2a93b", delay: 0.8 },
  { x: "55%", y: "95%", size: 2, color: "#58b8d8", delay: 1.0 },
  { x: "40%", y: "92%", size: 3, color: "#38b27d", delay: 0.6 },
  { x: "58%", y: "6%", size: 2, color: "#df6b57", delay: 1.1 },
];

const LOGIN_CONNECTORS = [
  // Left-side connections
  { x1: "12%", y1: "18%", x2: "22%", y2: "32%", color: "#38b27d" },
  { x1: "22%", y1: "38%", x2: "12%", y2: "68%", color: "#f2a93b" },
  { x1: "12%", y1: "74%", x2: "24%", y2: "85%", color: "#58b8d8" },
  // Right-side connections
  { x1: "82%", y1: "16%", x2: "74%", y2: "30%", color: "#df6b57" },
  { x1: "74%", y1: "36%", x2: "79%", y2: "70%", color: "#58b8d8" },
  { x1: "79%", y1: "76%", x2: "86%", y2: "88%", color: "#f2a93b" },
  // Cross connections (top-left to top-right, bottom-left to bottom-right)
  { x1: "28%", y1: "14%", x2: "65%", y2: "12%", color: "#f2a93b" },
  { x1: "26%", y1: "87%", x2: "70%", y2: "90%", color: "#38b27d" },
];

const LOGIN_RINGS = [
  { x: "10%", y: "50%", color: "#f2a93b" },
  { x: "25%", y: "20%", color: "#38b27d" },
  { x: "88%", y: "38%", color: "#58b8d8" },
  { x: "75%", y: "82%", color: "#df6b57" },
];

function LoginMiniCard({ card, index }: { card: LoginCard; index: number }) {
  return (
    <motion.div
      className="absolute rounded-lg px-3 py-2"
      style={{
        left: card.x,
        top: card.y,
        background: `${card.color}08`,
        border: `1px solid ${card.color}18`,
        backdropFilter: "blur(8px)",
        maxWidth: 110,
      }}
      initial={{ opacity: 0, y: 20, rotate: 0, scale: 0.85 }}
      animate={{ opacity: 0.7, y: 0, rotate: card.rotate, scale: 1 }}
      transition={{ duration: 0.7, delay: card.delay, ease: "easeOut" }}
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3.5 + index * 0.7, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: card.color }} />
          <span className="text-[9px] font-bold tracking-wider" style={{ color: card.color }}>
            {card.verdict}
          </span>
        </div>

        {card.bars ? (
          <div className="mt-2 flex items-end gap-1" style={{ height: 16 }}>
            {card.bars.map((h, j) => (
              <motion.div
                key={j}
                className="flex-1 rounded-sm"
                style={{ background: `${card.color}35`, height: `${h * 100}%` }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.4, delay: card.delay + 0.3 + j * 0.08 }}
              />
            ))}
          </div>
        ) : card.score ? (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[7px]" style={{ color: `${card.color}60` }}>{card.score.label}</span>
              <span className="text-[8px] font-bold tabular-nums" style={{ color: card.color }}>{card.score.value}</span>
            </div>
            <div className="rounded-full overflow-hidden" style={{ height: 2, background: `${card.color}15` }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: card.color }}
                initial={{ width: 0 }}
                animate={{ width: `${card.score.value}%` }}
                transition={{ duration: 0.6, delay: card.delay + 0.4 }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-1.5 space-y-1">
            <div className="rounded-full" style={{ height: 2, width: 40, background: `${card.color}15` }} />
            <div className="rounded-full" style={{ height: 2, width: 28, background: `${card.color}10` }} />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export function LoginPageDecor() {
  return (
    <div className="pointer-events-none fixed inset-0 hidden lg:block overflow-hidden">
      {/* SVG connector lines */}
      <svg className="absolute inset-0 w-full h-full">
        {LOGIN_CONNECTORS.map((line, i) => (
          <motion.line
            key={`line-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={line.color}
            strokeWidth="0.5"
            strokeDasharray="3 4"
            initial={{ strokeOpacity: 0 }}
            animate={{ strokeOpacity: 0.15 }}
            transition={{ duration: 1, delay: 1.5 + i * 0.15 }}
          />
        ))}
      </svg>

      {/* Mini cards */}
      {LOGIN_CARDS.map((card, i) => (
        <LoginMiniCard key={i} card={card} index={i} />
      ))}

      {/* Floating dots */}
      {LOGIN_DOTS.map((dot, j) => (
        <motion.div
          key={`dot-${j}`}
          className="absolute rounded-full"
          style={{
            width: dot.size,
            height: dot.size,
            left: dot.x,
            top: dot.y,
            background: dot.color,
            boxShadow: `0 0 ${dot.size * 2}px ${dot.color}30`,
          }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{
            duration: 3 + (j % 3) * 0.5,
            repeat: Infinity,
            delay: dot.delay,
          }}
        />
      ))}

      {/* Pulsing rings */}
      {LOGIN_RINGS.map((ring, i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute rounded-full"
          style={{
            left: ring.x,
            top: ring.y,
            width: 24,
            height: 24,
            border: `1px solid ${ring.color}20`,
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            scale: [1, 2, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: 2 + i * 1.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ── Dashboard stats decoration — subtle line graph behind stats ── */
export function DashboardStatsDecor() {
  const points = "0,40 30,35 60,25 90,30 120,15 150,20 180,10 210,18 240,8";
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.5 }}
    >
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 240 50"
        preserveAspectRatio="none"
        style={{ height: "60%", opacity: 0.15 }}
      >
        <motion.polyline
          points={points}
          fill="none"
          stroke="#f2a93b"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.8, ease: "easeOut" }}
        />
        <linearGradient id="statsGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f2a93b" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#f2a93b" stopOpacity="0" />
        </linearGradient>
        <motion.polygon
          points={`0,50 ${points} 240,50`}
          fill="url(#statsGrad)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
        />
      </svg>
    </motion.div>
  );
}

/* ── Dashboard empty state decoration — constellation ── */
export function EmptyStateDecor() {
  const nodes = [
    { x: 60, y: 30, color: "#f2a93b" },
    { x: 180, y: 20, color: "#38b27d" },
    { x: 120, y: 70, color: "#58b8d8" },
    { x: 40, y: 80, color: "#df6b57" },
    { x: 200, y: 75, color: "#f2a93b" },
  ];

  const lines = [
    [0, 1],
    [0, 2],
    [1, 2],
    [2, 3],
    [2, 4],
    [1, 4],
  ];

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.4 }}
      transition={{ duration: 1.5, delay: 0.3 }}
    >
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 240 100">
        {lines.map(([a, b], i) => (
          <motion.line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.5 + i * 0.15 }}
          />
        ))}
        {nodes.map((n, i) => (
          <motion.circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={3}
            fill={n.color}
            fillOpacity={0.3}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
          />
        ))}
      </svg>
    </motion.div>
  );
}

/* ── Simulation metrics decoration — floating data particles ── */
export function SimMetricsDecor() {
  const particles = [
    { x: "5%", y: "20%", label: "Clarity", color: "#38b27d", delay: 0.3 },
    { x: "92%", y: "30%", label: "Resonance", color: "#f2a93b", delay: 0.6 },
    { x: "88%", y: "80%", label: "Trust", color: "#58b8d8", delay: 0.9 },
    { x: "8%", y: "75%", label: "Impact", color: "#df6b57", delay: 0.5 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden hidden sm:block">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute flex items-center gap-1.5 rounded-md px-2 py-1"
          style={{
            left: p.x,
            top: p.y,
            background: `${p.color}06`,
            border: `1px solid ${p.color}15`,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 0.5, delay: p.delay }}
        >
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3.5 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="flex items-center gap-1.5">
              <div
                className="w-1 h-1 rounded-full"
                style={{ background: p.color }}
              />
              <span
                className="text-[8px] font-medium tracking-wider uppercase"
                style={{ color: `${p.color}80` }}
              >
                {p.label}
              </span>
            </div>
          </motion.div>
        </motion.div>
      ))}

      {/* Scattered dots */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={`dot-${i}`}
          className="absolute rounded-full"
          style={{
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            left: `${15 + i * 14}%`,
            top: `${25 + (i % 3) * 25}%`,
            background: ["#f2a93b", "#38b27d", "#58b8d8", "#df6b57", "#f2a93b", "#38b27d"][i],
          }}
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  );
}
