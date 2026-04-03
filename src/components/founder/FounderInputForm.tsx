"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Lightbulb, ChevronDown, Briefcase, TrendingUp, Users, Zap, CheckCircle2 } from "lucide-react";

const FOUNDER_API = "http://127.0.0.1:8000/api/founder";

export interface FounderInput {
  idea: string;
  industry: string;
  stage: string;
  target_market: string;
  persona_ids: string[];
}

interface AdvisorMeta {
  id: string;
  name: string;
  archetype: string;
  tagline: string;
  color: string;
  emoji: string;
  inspired_by?: string;
  strengths?: string[];
  expertise?: string[];
}

interface FounderInputFormProps {
  onSubmit: (input: FounderInput) => void;
}

const STAGES = [
  { value: "", label: "Select stage..." },
  { value: "idea", label: "💡 Idea — pre-validation" },
  { value: "mvp", label: "🛠️ MVP — early users" },
  { value: "revenue", label: "📈 Revenue — scaling" },
];

export default function FounderInputForm({ onSubmit }: FounderInputFormProps) {
  const [idea, setIdea] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState("");
  const [targetMarket, setTargetMarket] = useState("");

  const [advisors, setAdvisors] = useState<AdvisorMeta[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`${FOUNDER_API}/personas`)
      .then((r) => r.json())
      .then((data) => {
        const list: AdvisorMeta[] = data.personas || [];
        setAdvisors(list);
        setSelectedIds(new Set(list.map((p) => p.id)));
      })
      .catch(() => {
        // silently fail — all advisors will be used by default
      });
  }, []);

  const toggleAdvisor = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) return prev; // must keep at least one
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const canSubmit = idea.trim().length >= 20;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      idea: idea.trim(),
      industry,
      stage,
      target_market: targetMarket,
      persona_ids: selectedIds.size === advisors.length ? [] : Array.from(selectedIds),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex min-h-screen items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-1.5 text-sm text-purple-300">
            <Briefcase className="h-3.5 w-3.5" />
            Founder Mode
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="shimmer-text">Convene the Board</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Pitch your idea to 7 archetypal advisors. Get deep analysis, then open the floor for discussion.
          </p>
        </motion.div>

        {/* Idea textarea */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="glass-card rounded-2xl p-1">
            <div className="px-4 pt-4 pb-1 flex items-center gap-2 text-xs text-zinc-500">
              <Lightbulb className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-purple-300/70 font-medium">Your Business Idea</span>
            </div>
            <Textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe your business idea in detail. What is it? Who is it for? What problem does it solve? The more context you give, the sharper the board's analysis."
              className="min-h-[200px] resize-none border-0 bg-transparent text-base placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 p-5 pt-2"
            />
            <div className="px-5 pb-3 flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                {idea.length} characters
                {idea.length > 0 && idea.length < 20 && (
                  <span className="text-amber-400/70 ml-2">(min. 20 characters)</span>
                )}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Optional context (collapsible) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
        >
          <button
            onClick={() => setShowContext(!showContext)}
            className="w-full flex items-center justify-between glass-card rounded-xl px-5 py-3 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-400" />
              Additional Context
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">Optional</span>
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showContext ? "rotate-180" : ""}`} />
          </button>

          {showContext && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 space-y-3"
            >
              {/* Industry */}
              <div className="glass-card rounded-xl p-3">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  Industry / Sector
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. B2B SaaS, Consumer, Fintech, Healthcare..."
                  className="w-full bg-transparent border-none outline-none text-sm text-zinc-200 placeholder:text-zinc-600 focus:ring-0"
                />
              </div>

              {/* Stage */}
              <div className="glass-card rounded-xl p-3">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Current Stage
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-sm text-zinc-200 focus:ring-0 appearance-none cursor-pointer"
                >
                  {STAGES.map((s) => (
                    <option key={s.value} value={s.value} className="bg-zinc-900">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Market */}
              <div className="glass-card rounded-xl p-3">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Target Market
                </label>
                <input
                  type="text"
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value)}
                  placeholder="e.g. SMB finance teams in the US, indie game developers..."
                  className="w-full bg-transparent border-none outline-none text-sm text-zinc-200 placeholder:text-zinc-600 focus:ring-0"
                />
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Advisor selector */}
        {advisors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.44 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Users className="h-4 w-4 text-purple-400" />
                Choose Your Advisors
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">{selectedIds.size} of {advisors.length} selected</span>
                {selectedIds.size < advisors.length && (
                  <button
                    onClick={() => setSelectedIds(new Set(advisors.map((a) => a.id)))}
                    className="text-xs text-purple-400/70 hover:text-purple-300 transition-colors"
                  >
                    Select all
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {advisors.map((advisor) => {
                const selected = selectedIds.has(advisor.id);
                return (
                  <button
                    key={advisor.id}
                    onClick={() => toggleAdvisor(advisor.id)}
                    className="relative text-left rounded-xl p-3.5 border transition-all duration-200 group"
                    style={{
                      background: selected ? `${advisor.color}10` : "rgba(255,255,255,0.02)",
                      borderColor: selected ? `${advisor.color}40` : "rgba(255,255,255,0.06)",
                    }}
                  >
                    {/* Selected checkmark */}
                    <div
                      className="absolute top-2.5 right-2.5 transition-opacity duration-200"
                      style={{ opacity: selected ? 1 : 0 }}
                    >
                      <CheckCircle2
                        className="h-3.5 w-3.5"
                        style={{ color: advisor.color }}
                      />
                    </div>

                    {/* Avatar + name row */}
                    <div className="flex items-center gap-2.5 mb-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                        style={{
                          background: `${advisor.color}20`,
                          border: `1.5px solid ${advisor.color}${selected ? "70" : "30"}`,
                        }}
                      >
                        {advisor.emoji}
                      </div>
                      <div className="min-w-0">
                        <div
                          className="text-sm font-semibold leading-tight transition-colors"
                          style={{ color: selected ? advisor.color : "#a1a1aa" }}
                        >
                          {advisor.name}
                        </div>
                        <div className="text-[10px] text-zinc-600 leading-tight truncate">
                          {advisor.archetype.replace("The ", "")}
                        </div>
                      </div>
                    </div>

                    {/* Inspired by */}
                    {advisor.inspired_by && (
                      <div className="text-[10px] text-zinc-600 mb-2.5">
                        Inspired by{" "}
                        <span className="text-zinc-400">{advisor.inspired_by}</span>
                      </div>
                    )}

                    {/* Domain expertise — primary, always visible */}
                    {advisor.expertise && advisor.expertise.length > 0 && (
                      <div className="mb-2">
                        <div className="text-[9px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
                          Domains
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {advisor.expertise.map((d) => (
                            <span
                              key={d}
                              className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                              style={{
                                background: selected ? `${advisor.color}18` : "rgba(255,255,255,0.04)",
                                color: selected ? advisor.color : "#71717a",
                                border: `1px solid ${advisor.color}${selected ? "35" : "10"}`,
                              }}
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Strengths — methodology, secondary */}
                    {advisor.strengths && advisor.strengths.length > 0 && (
                      <div>
                        <div className="text-[9px] font-medium text-zinc-600 uppercase tracking-wider mb-1">
                          Approach
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {advisor.strengths.map((s) => (
                            <span
                              key={s}
                              className="text-[9px] px-1.5 py-0.5 rounded-full"
                              style={{
                                background: "rgba(255,255,255,0.03)",
                                color: "#52525b",
                                border: "1px solid rgba(255,255,255,0.06)",
                              }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center"
        >
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            size="lg"
            className={`
              relative group px-10 py-6 text-base font-semibold rounded-xl transition-all duration-300
              ${canSubmit
                ? "bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 hover:from-purple-500 hover:via-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02]"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              }
            `}
          >
            {canSubmit && (
              <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
            )}
            <Zap className="h-5 w-5 mr-2" />
            Convene the Board
            {selectedIds.size > 0 && selectedIds.size < (advisors.length || 7) && (
              <span className="ml-2 text-xs opacity-75">({selectedIds.size} advisors)</span>
            )}
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.62 }}
          className="text-center text-xs text-zinc-600"
        >
          Research phase · {selectedIds.size || 7} advisor analyses · Live discussion
        </motion.p>
      </div>
    </motion.div>
  );
}
