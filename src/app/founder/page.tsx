"use client";

import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";

import FounderInputForm, { type FounderInput } from "@/components/founder/FounderInputForm";
import ResearchLoader from "@/components/founder/ResearchLoader";
import FounderPanel from "@/components/founder/FounderPanel";
import FounderChat from "@/components/founder/FounderChat";

const FOUNDER_API = "http://127.0.0.1:8000/api/founder";

type Phase = "input" | "researching" | "briefing" | "panel" | "chat";

interface Persona {
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

export default function FounderPage() {
  const [phase, setPhase] = useState<Phase>("input");
  const [sessionId, setSessionId] = useState<string>("");
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [initialAnalyses, setInitialAnalyses] = useState<Record<string, string>>({});
  const [researchPack, setResearchPack] = useState<string>("");

  const handleSubmit = async (input: FounderInput) => {
    setPhase("researching");

    // After ~4s move to briefing stage visually (API is still running)
    const briefingTimer = setTimeout(() => setPhase("briefing"), 4000);

    try {
      const res = await fetch(`${FOUNDER_API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: input.idea,
          industry: input.industry,
          stage: input.stage,
          target_market: input.target_market,
          ...(input.persona_ids.length > 0 && { persona_ids: input.persona_ids }),
        }),
      });

      clearTimeout(briefingTimer);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(err.detail || `Server error: ${res.status}`);
      }

      const data = await res.json();

      setSessionId(data.session_id);
      setPersonas(data.personas || []);
      setInitialAnalyses(data.initial_analyses || {});
      setResearchPack(data.research_pack || "");

      // Show briefing briefly before transitioning to panel
      setPhase("briefing");
      setTimeout(() => setPhase("panel"), 2000);
    } catch (err) {
      clearTimeout(briefingTimer);
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Analysis failed", { description: msg });
      setPhase("input");
    }
  };

  return (
    <main className="relative min-h-screen">
      {/* Grid background — matches rest of app */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(168,85,247,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168,85,247,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10">
      {/* Back to Campaign Mode — visible on input phase */}
      {phase === "input" && (
        <div className="fixed top-5 right-5 z-50">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-2 text-sm text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/40 transition-all duration-200"
          >
            <span>📺</span>
            Campaign Mode
          </Link>
        </div>
      )}

      <AnimatePresence mode="wait">
        {(phase === "input") && (
          <FounderInputForm key="input" onSubmit={handleSubmit} />
        )}

        {(phase === "researching" || phase === "briefing") && (
          <ResearchLoader
            key="loader"
            personas={personas}
            stage={phase === "researching" ? "researching" : "briefing"}
          />
        )}

        {phase === "panel" && (
          <FounderPanel
            key="panel"
            personas={personas}
            initialAnalyses={initialAnalyses}
            researchPack={researchPack}
            onOpenChat={() => setPhase("chat")}
          />
        )}

        {phase === "chat" && (
          <FounderChat
            key="chat"
            sessionId={sessionId}
            personas={personas}
          />
        )}
      </AnimatePresence>
      </div>
    </main>
  );
}
