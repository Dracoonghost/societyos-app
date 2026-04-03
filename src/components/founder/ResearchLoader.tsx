"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Persona {
  id: string;
  name: string;
  emoji: string;
  color: string;
  archetype: string;
}

interface ResearchLoaderProps {
  personas?: Persona[];
  stage: "researching" | "briefing";
}

const RESEARCH_MESSAGES = [
  "Mapping the competitive landscape...",
  "Identifying target customer segments...",
  "Stress-testing the business model...",
  "Scanning market trends and tailwinds...",
  "Sizing addressable opportunities...",
  "Analyzing structural risks...",
  "Compiling the strategic brief...",
];

const BRIEFING_MESSAGES = [
  "Distributing research to the board...",
  "Advisors are reviewing the brief...",
  "Board members forming their positions...",
  "Collecting independent assessments...",
];

export default function ResearchLoader({ personas = [], stage }: ResearchLoaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [activatedPersonas, setActivatedPersonas] = useState<Set<string>>(new Set());

  const messages = stage === "researching" ? RESEARCH_MESSAGES : BRIEFING_MESSAGES;

  // Cycle status messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [messages.length]);

  // Light up personas one by one during briefing stage
  useEffect(() => {
    if (stage !== "briefing" || personas.length === 0) return;
    setActivatedPersonas(new Set());
    personas.forEach((p, i) => {
      setTimeout(() => {
        setActivatedPersonas((prev) => new Set([...prev, p.id]));
      }, i * 800 + 300);
    });
  }, [stage, personas]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="flex flex-col items-center gap-10 max-w-lg w-full">
        {/* Central orb */}
        <div className="relative flex items-center justify-center">
          {/* Rings */}
          {[1, 2, 3].map((ring) => (
            <div
              key={ring}
              className="absolute rounded-full border border-purple-500/20"
              style={{
                width: `${60 + ring * 40}px`,
                height: `${60 + ring * 40}px`,
                animation: `rings ${1.8 + ring * 0.4}s ease-out infinite`,
                animationDelay: `${ring * 0.3}s`,
              }}
            />
          ))}
          {/* Core orb */}
          <div
            className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center orb-breathe"
            style={{
              background: "radial-gradient(circle at 35% 35%, #c084fc, #a855f7, #7c3aed)",
              boxShadow: "0 0 32px rgba(168, 85, 247, 0.5), 0 0 64px rgba(168, 85, 247, 0.2)",
            }}
          >
            <span className="text-2xl">
              {stage === "researching" ? "🔬" : "📋"}
            </span>
          </div>
        </div>

        {/* Stage label */}
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-purple-400/80 uppercase tracking-widest">
            {stage === "researching" ? "Phase 1 — Research" : "Phase 2 — Briefing the Board"}
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={msgIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
              className="text-lg text-zinc-300 font-medium"
            >
              {messages[msgIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Persona avatars (shown in briefing stage) */}
        {stage === "briefing" && personas.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap justify-center gap-4"
          >
            {personas.map((p) => {
              const active = activatedPersonas.has(p.id);
              return (
                <motion.div
                  key={p.id}
                  animate={active ? { scale: [1, 1.15, 1], opacity: 1 } : { opacity: 0.25 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-lg transition-all duration-300"
                    style={{
                      background: active
                        ? `radial-gradient(circle at 35% 35%, ${p.color}80, ${p.color}40)`
                        : "rgba(39, 39, 42, 0.6)",
                      border: `2px solid ${active ? p.color : "rgba(113,113,122,0.3)"}`,
                      boxShadow: active ? `0 0 12px ${p.color}60` : "none",
                    }}
                  >
                    {p.emoji}
                  </div>
                  <span className="text-[10px] text-zinc-500 text-center w-16 leading-tight">
                    {p.name.split(" ")[0]}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Progress dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-purple-500/40"
              style={{
                animation: `orb-breathe ${1.2 + i * 0.2}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
