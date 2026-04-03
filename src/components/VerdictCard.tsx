"use client";

/**
 * ============================================================
 * VerdictCard.tsx — Phase 4: The Final Verdict (v2)
 * ============================================================
 * Now properly renders multi-agent debate output with styled
 * agent blocks, color-coded by persona.
 * ============================================================
 */

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2,
    XCircle,
    RotateCcw,
    Sparkles,
    AlertTriangle,
} from "lucide-react";

interface VerdictCardProps {
    verdict: string;
    adText: string;
    onRestart: () => void;
}

/* Agent color map for styled blocks */
const AGENT_COLORS: Record<string, { color: string; emoji: string }> = {
    Kabir: { color: "#8b5cf6", emoji: "🚀" },
    Priya: { color: "#ec4899", emoji: "✨" },
    Rohan: { color: "#f59e0b", emoji: "💰" },
    Ananya: { color: "#22c55e", emoji: "🌿" },
    Arjun: { color: "#06b6d4", emoji: "🧐" },
    Aarav: { color: "#eab308", emoji: "📈" },
    Kiara: { color: "#f43f5e", emoji: "🎨" },
    Neha: { color: "#14b8a6", emoji: "🧘🏽" },
    Vikram: { color: "#3b82f6", emoji: "🤝" },
    Sneha: { color: "#d946ef", emoji: "🛍️" },
};

function getVibeResult(verdict: string): "pass" | "fail" | "mixed" {
    const lower = verdict.toLowerCase();

    /* Check for explicit result tags first (from Arjun's structured verdict) */
    if (lower.includes("passed ✅") || lower.includes("passed")) return "pass";
    if (lower.includes("failed ❌") || lower.includes("failed")) return "fail";
    if (lower.includes("mixed ⚡") || lower.includes("mixed")) return "mixed";

    const positiveWords = ["pass", "approved", "resonates", "fire", "love it", "great", "excellent", "authentic", "engaging"];
    const negativeWords = ["fail", "rejected", "cringe", "skip", "hate it", "boring", "tone-deaf", "generic", "disappointed"];

    const positiveCount = positiveWords.filter((w) => lower.includes(w)).length;
    const negativeCount = negativeWords.filter((w) => lower.includes(w)).length;

    if (positiveCount > negativeCount) return "pass";
    if (negativeCount > positiveCount) return "fail";
    return "mixed";
}

/**
 * Parse the debate output into agent sections.
 * Format: **AgentName (Role):**\nContent\n\n---\n\n**NextAgent...**
 */
function parseDebateSections(verdict: string): { name: string; role: string; text: string }[] {
    const sections = verdict.split("---");
    const parsed: { name: string; role: string; text: string }[] = [];

    for (const section of sections) {
        const trimmed = section.trim();
        if (!trimmed) continue;

        /* Try to extract **Name (Role):** pattern */
        const match = trimmed.match(/^\*\*(.+?)\s*\((.+?)\)\s*:\*\*\s*([\s\S]*)/);
        if (match) {
            parsed.push({
                name: match[1].trim(),
                role: match[2].trim(),
                text: match[3].trim(),
            });
        } else {
            /* Fallback: just add as generic text */
            parsed.push({
                name: "Panel",
                role: "Focus Group",
                text: trimmed,
            });
        }
    }

    return parsed;
}

export default function VerdictCard({ verdict, adText, onRestart }: VerdictCardProps) {
    const vibeResult = getVibeResult(verdict);
    const debateSections = parseDebateSections(verdict);
    const hasMultipleAgents = debateSections.length > 1;

    const badgeConfig = {
        pass: {
            icon: CheckCircle2,
            label: "Vibe Check Passed ✅",
            color: "text-emerald-400",
            borderColor: "border-emerald-500/30",
            bgColor: "bg-emerald-500/10",
            glowColor: "rgba(52,211,153,0.15)",
        },
        fail: {
            icon: XCircle,
            label: "Vibe Check Failed ❌",
            color: "text-red-400",
            borderColor: "border-red-500/30",
            bgColor: "bg-red-500/10",
            glowColor: "rgba(239,68,68,0.15)",
        },
        mixed: {
            icon: AlertTriangle,
            label: "Mixed Vibes ⚡",
            color: "text-amber-400",
            borderColor: "border-amber-500/30",
            bgColor: "bg-amber-500/10",
            glowColor: "rgba(245,158,11,0.15)",
        },
    };

    const badge = badgeConfig[vibeResult];
    const BadgeIcon = badge.icon;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onRestart}
            />

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl glass-card"
                style={{
                    boxShadow: `0 0 60px ${badge.glowColor}, 0 0 120px rgba(168,85,247,0.08)`,
                }}
            >
                <div className="p-8 sm:p-10 space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
                            className="inline-flex"
                        >
                            <div
                                className={`inline-flex items-center gap-2.5 rounded-full ${badge.bgColor} ${badge.borderColor} border px-5 py-2.5`}
                            >
                                <BadgeIcon className={`h-5 w-5 ${badge.color}`} />
                                <span className={`text-sm font-semibold ${badge.color}`}>
                                    {badge.label}
                                </span>
                            </div>
                        </motion.div>

                        <h2 className="text-2xl sm:text-3xl font-bold">
                            <span className="shimmer-text">Final Verdict</span>
                        </h2>

                        <p className="text-sm text-zinc-500">
                            Ad tested: &quot;{adText.slice(0, 80)}
                            {adText.length > 80 ? "..." : ""}&quot;
                        </p>
                    </div>

                    {/* Debate Content */}
                    {hasMultipleAgents ? (
                        /* ---- Multi-agent debate view ---- */
                        <div className="space-y-4">
                            {debateSections.map((section, i) => {
                                const agentMeta = AGENT_COLORS[section.name];
                                const accentColor = agentMeta?.color || "#a855f7";
                                const emoji = agentMeta?.emoji || "💬";

                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                                        className="rounded-xl bg-zinc-900/60 border border-white/5 p-5"
                                        style={{ borderLeftColor: accentColor, borderLeftWidth: "3px" }}
                                    >
                                        {/* Agent header */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-lg">{emoji}</span>
                                            <span className="text-sm font-bold" style={{ color: accentColor }}>
                                                {section.name}
                                            </span>
                                            <span className="text-xs text-zinc-500">{section.role}</span>
                                        </div>

                                        {/* Agent response */}
                                        <div className="text-sm text-zinc-300 leading-relaxed space-y-2">
                                            {section.text.split("\n").map((line, j) => {
                                                const trimmedLine = line.trim();
                                                if (!trimmedLine) return null;

                                                /* Style bullet points */
                                                if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("• ")) {
                                                    return (
                                                        <p key={j} className="pl-4 text-zinc-400">
                                                            {trimmedLine}
                                                        </p>
                                                    );
                                                }

                                                /* Style headers like "What Worked:" */
                                                if (trimmedLine.endsWith(":") && trimmedLine.length < 40) {
                                                    return (
                                                        <p key={j} className="font-semibold text-zinc-200 mt-2">
                                                            {trimmedLine}
                                                        </p>
                                                    );
                                                }

                                                return <p key={j}>{trimmedLine}</p>;
                                            })}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        /* ---- Single-block fallback (error messages, etc.) ---- */
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="rounded-2xl bg-zinc-900/60 border border-white/5 p-6"
                        >
                            <div className="flex items-start gap-3">
                                <Sparkles className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    {verdict.split("\n").map((paragraph, i) => (
                                        <p
                                            key={i}
                                            className="text-sm text-zinc-300 leading-relaxed mb-3 last:mb-0"
                                        >
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Restart Button */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex justify-center pt-2"
                    >
                        <Button
                            onClick={onRestart}
                            size="lg"
                            className="bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 hover:from-purple-500 hover:via-violet-500 hover:to-fuchsia-500 text-white rounded-xl px-8 py-5 font-semibold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-[1.02] transition-all duration-300"
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Run Another Simulation
                        </Button>
                    </motion.div>
                </div>
            </motion.div>
        </motion.div>
    );
}
