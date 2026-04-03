"use client";

import { motion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Animated decision-card visualization for the landing hero          */
/* ------------------------------------------------------------------ */

const CARDS = [
  {
    verdict: "NO-GO",
    color: "#df6b57",
    bg: "rgba(223, 107, 87, 0.06)",
    border: "rgba(223, 107, 87, 0.18)",
    offsetX: -20,
    offsetY: 60,
    rotate: -6,
    scale: 0.88,
    z: 1,
  },
  {
    verdict: "CONDITIONAL",
    color: "#f2a93b",
    bg: "rgba(242, 169, 59, 0.06)",
    border: "rgba(242, 169, 59, 0.18)",
    offsetX: 6,
    offsetY: 30,
    rotate: -2,
    scale: 0.94,
    z: 2,
  },
  {
    verdict: "PROCEED",
    color: "#38b27d",
    bg: "rgba(56, 178, 125, 0.08)",
    border: "rgba(56, 178, 125, 0.22)",
    offsetX: 32,
    offsetY: 0,
    rotate: 2,
    scale: 1,
    z: 3,
  },
];

const BAR_SETS = [
  [0.3, 0.5, 0.2, 0.6, 0.4],
  [0.6, 0.4, 0.7, 0.3, 0.8],
  [0.8, 0.6, 0.9, 0.5, 0.7],
];

const TEXT_LINES = [
  [85, 70, 60],
  [75, 90, 55],
  [90, 65, 80],
];

const SCORES = [
  { label: "Risk", value: 78 },
  { label: "Viability", value: 62 },
  { label: "Confidence", value: 85 },
];

/* Floating metric pills around the cards */
const FLOATING_PILLS = [
  { label: "Market Fit", value: "8.4", x: -60, y: -20, color: "#38b27d", delay: 1.8 },
  { label: "Risk Score", value: "3.2", x: 240, y: 10, color: "#df6b57", delay: 2.1 },
  { label: "TAM", value: "$4.2B", x: 220, y: 320, color: "#f2a93b", delay: 2.4 },
  { label: "NPS Est.", value: "72", x: -50, y: 280, color: "#58b8d8", delay: 2.0 },
];

/* Floating dots / particles */
const PARTICLES = [
  { x: -40, y: 60, size: 4, color: "#f2a93b", delay: 0.5 },
  { x: 270, y: 80, size: 3, color: "#38b27d", delay: 0.8 },
  { x: 260, y: 220, size: 5, color: "#58b8d8", delay: 1.0 },
  { x: -20, y: 180, size: 3, color: "#df6b57", delay: 0.6 },
  { x: 130, y: -30, size: 4, color: "#f2a93b", delay: 0.9 },
  { x: 100, y: 370, size: 3, color: "#38b27d", delay: 1.1 },
  { x: -50, y: 140, size: 2, color: "#58b8d8", delay: 0.7 },
  { x: 280, y: 160, size: 2, color: "#f2a93b", delay: 1.3 },
];

/* Connector lines from cards to pills */
const CONNECTORS = [
  { x1: 60, y1: 30, x2: -10, y2: 0, color: "#38b27d" },
  { x1: 240, y1: 50, x2: 270, y2: 30, color: "#df6b57" },
  { x1: 200, y1: 300, x2: 250, y2: 330, color: "#f2a93b" },
  { x1: 40, y1: 260, x2: -10, y2: 290, color: "#58b8d8" },
];

export function HeroDecisionViz() {
  return (
    <div className="relative w-full h-full min-h-[480px] flex items-center justify-center">
      {/* Ambient glow behind cards */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 320,
          height: 320,
          background:
            "radial-gradient(circle, rgba(242,169,59,0.10) 0%, rgba(56,178,125,0.05) 40%, transparent 70%)",
          filter: "blur(50px)",
        }}
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Secondary glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 200,
          height: 200,
          top: "15%",
          right: "-5%",
          background:
            "radial-gradient(circle, rgba(88,184,216,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="relative" style={{ width: 280, height: 380 }}>

        {/* SVG connector lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: 340, height: 400, left: -30, top: -10, overflow: "visible" }}
        >
          {CONNECTORS.map((line, i) => (
            <motion.line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={line.color}
              strokeWidth={1}
              strokeDasharray="4 4"
              strokeOpacity={0}
              initial={{ strokeOpacity: 0, pathLength: 0 }}
              animate={{ strokeOpacity: 0.25, pathLength: 1 }}
              transition={{ duration: 0.8, delay: 2.0 + i * 0.15, ease: "easeOut" }}
            />
          ))}
        </svg>

        {/* Floating particles */}
        {PARTICLES.map((p, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: p.x,
              top: p.y,
              background: p.color,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}40`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 0.6, 0.3, 0.6], scale: 1 }}
            transition={{
              opacity: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: p.delay },
              scale: { duration: 0.4, delay: p.delay },
            }}
          />
        ))}

        {/* Floating metric pills */}
        {FLOATING_PILLS.map((pill, i) => (
          <motion.div
            key={`pill-${i}`}
            className="absolute rounded-lg flex items-center gap-2 px-2.5 py-1.5"
            style={{
              left: pill.x,
              top: pill.y,
              background: `${pill.color}08`,
              border: `1px solid ${pill.color}20`,
              backdropFilter: "blur(8px)",
              zIndex: 5,
            }}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: pill.delay, ease: "easeOut" }}
          >
            {/* Float */}
            <motion.div
              className="flex items-center gap-2"
              animate={{ y: [0, -3, 0] }}
              transition={{
                duration: 3 + i * 0.7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            >
              <span
                className="text-[9px] font-medium whitespace-nowrap"
                style={{ color: `${pill.color}90` }}
              >
                {pill.label}
              </span>
              <span
                className="text-[10px] font-bold tabular-nums whitespace-nowrap"
                style={{ color: pill.color }}
              >
                {pill.value}
              </span>
            </motion.div>
          </motion.div>
        ))}

        {/* Card stack */}
        {CARDS.map((card, i) => (
          <motion.div
            key={card.verdict}
            className="absolute top-0 left-0 w-full"
            style={{ zIndex: card.z }}
            initial={{ opacity: 0, x: 60, y: card.offsetY + 30, rotate: 0, scale: card.scale }}
            animate={{ opacity: 1, x: card.offsetX, y: card.offsetY, rotate: card.rotate, scale: card.scale }}
            transition={{
              duration: 0.7,
              delay: 0.3 + i * 0.2,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 3.5 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.4,
              }}
            >
              <div
                className="rounded-xl overflow-hidden backdrop-blur-sm"
                style={{
                  background: card.bg,
                  border: `1px solid ${card.border}`,
                  boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${card.border}`,
                  width: 220,
                  padding: "16px",
                }}
              >
                {/* Verdict badge */}
                <motion.div
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 mb-4"
                  style={{
                    background: `${card.color}15`,
                    border: `1px solid ${card.color}30`,
                  }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [0.8, 1.05, 1], opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.8 + i * 0.2 }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: card.color }}
                  />
                  <span
                    className="text-[10px] font-bold tracking-widest"
                    style={{ color: card.color }}
                  >
                    {card.verdict}
                  </span>
                </motion.div>

                {/* Fake text lines */}
                <div className="space-y-2 mb-4">
                  {TEXT_LINES[i].map((w, j) => (
                    <motion.div
                      key={j}
                      className="rounded-full"
                      style={{
                        height: 4,
                        width: `${w}%`,
                        background: "rgba(255,255,255,0.06)",
                      }}
                      initial={{ scaleX: 0, originX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{
                        duration: 0.5,
                        delay: 1.0 + i * 0.2 + j * 0.1,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                </div>

                {/* Mini bar chart */}
                <div
                  className="rounded-lg p-2.5 mb-3"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div className="flex items-end gap-1.5" style={{ height: 32 }}>
                    {BAR_SETS[i].map((h, j) => (
                      <motion.div
                        key={j}
                        className="flex-1 rounded-sm"
                        style={{
                          background: `${card.color}40`,
                          originY: 1,
                        }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1, height: `${h * 100}%` }}
                        transition={{
                          duration: 0.4,
                          delay: 1.2 + i * 0.2 + j * 0.08,
                          ease: "easeOut",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Score indicator */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    {SCORES[i].label}
                  </span>
                  <div className="flex items-center gap-2">
                    <div
                      className="rounded-full overflow-hidden"
                      style={{
                        width: 48,
                        height: 3,
                        background: "rgba(255,255,255,0.06)",
                      }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: card.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${SCORES[i].value}%` }}
                        transition={{
                          duration: 0.6,
                          delay: 1.4 + i * 0.2,
                          ease: "easeOut",
                        }}
                      />
                    </div>
                    <motion.span
                      className="text-[10px] font-semibold tabular-nums"
                      style={{ color: card.color }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.6 + i * 0.2 }}
                    >
                      {SCORES[i].value}
                    </motion.span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}

        {/* Mini advisor avatars row — below the cards */}
        <motion.div
          className="absolute flex items-center gap-1"
          style={{ bottom: -45, left: 30, zIndex: 10 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 2.2 }}
        >
          {["#f2a93b", "#38b27d", "#58b8d8", "#df6b57", "#f2a93b", "#38b27d", "#58b8d8"].map(
            (c, i) => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  width: 22,
                  height: 22,
                  background: `${c}15`,
                  border: `1.5px solid ${c}40`,
                  marginLeft: i > 0 ? -6 : 0,
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 2.3 + i * 0.08 }}
              >
                <div
                  className="w-full h-full rounded-full flex items-center justify-center"
                  style={{ fontSize: 9 }}
                >
                  {["🧠", "📊", "🎯", "⚡", "💡", "🔍", "🛡️"][i]}
                </div>
              </motion.div>
            )
          )}
          <motion.span
            className="text-[9px] font-medium ml-2 whitespace-nowrap"
            style={{ color: "rgba(255,255,255,0.3)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.8 }}
          >
            7 advisors
          </motion.span>
        </motion.div>

        {/* "Synthesizing..." label top-right */}
        <motion.div
          className="absolute flex items-center gap-1.5 rounded-md px-2 py-1"
          style={{
            top: -35,
            right: -30,
            background: "rgba(242,169,59,0.06)",
            border: "1px solid rgba(242,169,59,0.12)",
            zIndex: 10,
          }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 2.5 }}
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#f2a93b" }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span
            className="text-[9px] font-medium whitespace-nowrap"
            style={{ color: "rgba(242,169,59,0.7)" }}
          >
            Synthesizing...
          </span>
        </motion.div>
      </div>
    </div>
  );
}
