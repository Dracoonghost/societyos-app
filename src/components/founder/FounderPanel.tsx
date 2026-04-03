"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageSquare, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Persona {
  id: string;
  name: string;
  archetype: string;
  tagline: string;
  color: string;
  emoji: string;
}

interface FounderPanelProps {
  personas: Persona[];
  initialAnalyses: Record<string, string>;
  researchPack: string;
  onOpenChat: () => void;
}

function renderAnalysis(text: string) {
  // Turn **Section** into styled headers and newlines into paragraphs
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (/^\*\*(.+)\*\*$/.test(line.trim())) {
      const heading = line.trim().replace(/\*\*/g, "");
      return (
        <p key={i} className="text-xs font-semibold text-zinc-300 mt-3 mb-1 uppercase tracking-wide">
          {heading}
        </p>
      );
    }
    if (line.trim() === "") return <br key={i} />;
    // Bold inline **text**
    const parts = line.split(/\*\*(.+?)\*\*/g);
    return (
      <p key={i} className="text-sm text-zinc-400 leading-relaxed">
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j} className="text-zinc-200">{part}</strong> : part
        )}
      </p>
    );
  });
}

function PersonaCard({ persona, analysis }: { persona: Persona; analysis: string }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl overflow-hidden"
      style={{ borderLeft: `3px solid ${persona.color}` }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${persona.color}50, ${persona.color}20)`,
              border: `1.5px solid ${persona.color}60`,
            }}
          >
            {persona.emoji}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-100">{persona.name}</span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: `${persona.color}20`,
                  color: persona.color,
                  border: `1px solid ${persona.color}40`,
                }}
              >
                {persona.archetype}
              </span>
            </div>
            <p className="text-xs text-zinc-500 italic mt-0.5">"{persona.tagline}"</p>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-zinc-500 transition-transform duration-200 flex-shrink-0 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Analysis body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-1 border-t border-white/5 pt-4">
              {renderAnalysis(analysis)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FounderPanel({
  personas,
  initialAnalyses,
  researchPack,
  onOpenChat,
}: FounderPanelProps) {
  const [showResearch, setShowResearch] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen px-4 py-12"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-1.5 text-sm text-purple-300">
            <BookOpen className="h-3.5 w-3.5" />
            Board Analysis Complete
          </div>
          <h2 className="text-3xl font-bold text-zinc-100">
            The Board Has Reviewed Your Idea
          </h2>
          <p className="text-zinc-500 max-w-lg mx-auto">
            7 advisors have studied the research and formed independent assessments. Open the discussion to ask follow-up questions.
          </p>
        </motion.div>

        {/* Research Pack toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={() => setShowResearch(!showResearch)}
            className="w-full flex items-center justify-between glass-card rounded-xl px-5 py-3 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-400" />
              Research Pack
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Shared brief
              </span>
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showResearch ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showResearch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 glass-card rounded-xl p-5">
                  <pre className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed font-mono">
                    {researchPack}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Persona analysis cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {personas.map((persona, i) => (
            <motion.div
              key={persona.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
            >
              <PersonaCard
                persona={persona}
                analysis={initialAnalyses[persona.id] || "Analysis unavailable."}
              />
            </motion.div>
          ))}
        </div>

        {/* Open Discussion CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col items-center gap-3"
        >
          <p className="text-sm text-zinc-500">
            Have follow-up questions? Challenge an advisor's take? Open the floor.
          </p>
          <Button
            onClick={onOpenChat}
            size="lg"
            className="relative group px-10 py-6 text-base font-semibold rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 hover:from-purple-500 hover:via-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] transition-all duration-300"
          >
            <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
            <MessageSquare className="h-5 w-5 mr-2" />
            Open Discussion
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
