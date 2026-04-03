"use client";

/**
 * ============================================================
 * NodeMatrix.tsx — Phase 3: The Simulation Matrix (v2)
 * ============================================================
 * Enhanced with:
 *  - Multiple nodes pulsating simultaneously
 *  - Dynamic SVG connection highlighting between active agents
 *  - Inter-agent connection lines that light up during debate
 *  - More lively "group chat" energy
 * ============================================================
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare } from "lucide-react";

/* ---- Agent Definitions ---- */
export interface Agent {
    id: string;
    name: string;
    role: string;
    emoji: string;
    color: string;
    colorRGB: string;
}

export const AGENTS: Agent[] = [
    {
        id: "kabir",
        name: "Kabir",
        role: "The Hype-Techie",
        emoji: "🚀",
        color: "#8b5cf6",
        colorRGB: "139,92,246",
    },
    {
        id: "ananya",
        name: "Ananya",
        role: "The Eco-Minimalist",
        emoji: "🌿",
        color: "#22c55e",
        colorRGB: "34,197,94",
    },
    {
        id: "rohan",
        name: "Rohan",
        role: "The Deal Hunter",
        emoji: "💰",
        color: "#f59e0b",
        colorRGB: "245,158,11",
    },
    {
        id: "priya",
        name: "Priya",
        role: "The Trendsetter",
        emoji: "✨",
        color: "#ec4899",
        colorRGB: "236,72,153",
    },
    {
        id: "arjun",
        name: "Arjun",
        role: "The Skeptic",
        emoji: "🧐",
        color: "#06b6d4",
        colorRGB: "6,182,212",
    },
    {
        id: "aarav",
        name: "Aarav",
        role: "The Hustle Culture Enthusiast",
        emoji: "📈",
        color: "#eab308",
        colorRGB: "234,179,8",
    },
    {
        id: "kiara",
        name: "Kiara",
        role: "The Visual Aesthete",
        emoji: "🎨",
        color: "#f43f5e",
        colorRGB: "244,63,94",
    },
    {
        id: "neha",
        name: "Neha",
        role: "The Wellness Advocate",
        emoji: "🧘🏽",
        color: "#14b8a6",
        colorRGB: "20,184,166",
    },
    {
        id: "vikram",
        name: "Vikram",
        role: "The Community Builder",
        emoji: "🤝",
        color: "#3b82f6",
        colorRGB: "59,130,246",
    },
    {
        id: "sneha",
        name: "Sneha",
        role: "The D2C Explorer",
        emoji: "🛍️",
        color: "#d946ef",
        colorRGB: "217,70,239",
    }
];

/* ---- Chat Message Type ---- */
export interface ChatMessage {
    agentId: string;
    text: string;
    timestamp: number;
}

/* ---- Agent output parser ---- */
const SECTION_LABELS = ["Understanding", "Reaction", "Scores", "Improvement", "Response"];
const SECTION_REGEX = new RegExp(`(${SECTION_LABELS.join("|")}):\\s*`, "g");

function stripCites(text: string): string {
    return text
        // Remove [UNVALIDATED] prefix from failed validation attempts
        .replace(/^\[UNVALIDATED\]\s*/i, "")
        // Remove CITE: with comma-separated multi-refs like CITE:T1-T20, S@t=60, F@t=50
        .replace(/\s*CITE:\s*[A-Za-z0-9@=#_\-]+(?:\s*,\s*[A-Za-z0-9@=#_\-]+)*/g, "")
        // Strip any CREATOR_INTENT prompt artifact echoed back by the model
        .replace(/\s*CREATOR_INTENT[^\n]*/gi, "")
        .trim();
}

interface ParsedSection {
    label: string;
    content: string;
}

function parseAgentOutput(text: string): ParsedSection[] {
    const parts: ParsedSection[] = [];
    let lastLabel = "";
    let lastIndex = 0;

    let match: RegExpExecArray | null;
    SECTION_REGEX.lastIndex = 0;
    while ((match = SECTION_REGEX.exec(text)) !== null) {
        if (lastLabel) {
            parts.push({ label: lastLabel, content: stripCites(text.slice(lastIndex, match.index)) });
        }
        lastLabel = match[1];
        lastIndex = match.index + match[0].length;
    }
    if (lastLabel) {
        parts.push({ label: lastLabel, content: stripCites(text.slice(lastIndex)) });
    }

    return parts.length > 0 ? parts : [{ label: "", content: text }];
}

function parseScores(raw: string): { label: string; value: number }[] {
    const scores: { label: string; value: number }[] = [];
    const re = /([A-Za-z]+):\s*(\d)\/5/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(raw)) !== null) {
        scores.push({ label: m[1], value: parseInt(m[2]) });
    }
    return scores;
}

function scoreColor(v: number): string {
    if (v >= 4) return "#22c55e";
    if (v >= 3) return "#eab308";
    return "#ef4444";
}

function AgentMessageBody({ text, agentColor }: { text: string; agentColor: string }) {
    const sections = parseAgentOutput(text);

    if (sections.length === 1 && !sections[0].label) {
        // Fallback — no known sections found, render plain
        return <p className="text-sm text-zinc-300 leading-relaxed">{text}</p>;
    }

    return (
        <div className="space-y-2">
            {sections.map((s, i) => {
                if (s.label === "Scores") {
                    const scores = parseScores(s.content);
                    if (scores.length === 0) return null;
                    return (
                        <div key={i} className="flex flex-wrap gap-1.5 pt-0.5">
                            {scores.map((sc) => (
                                <span
                                    key={sc.label}
                                    className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800/80 border border-white/5 font-mono"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: scoreColor(sc.value) }} />
                                    <span className="text-zinc-400">{sc.label}</span>
                                    <span className="font-semibold" style={{ color: scoreColor(sc.value) }}>{sc.value}/5</span>
                                </span>
                            ))}
                        </div>
                    );
                }
                if (s.label === "Understanding") {
                    return (
                        <p key={i} className="text-xs text-zinc-500 italic leading-relaxed">
                            {s.content}
                        </p>
                    );
                }
                if (s.label === "Improvement") {
                    return (
                        <p key={i} className="text-xs text-amber-400/80 leading-relaxed border-l-2 border-amber-500/30 pl-2">
                            💡 {s.content}
                        </p>
                    );
                }
                // Reaction / Response
                return (
                    <p key={i} className="text-sm text-zinc-200 leading-relaxed">
                        {s.content}
                    </p>
                );
            })}
        </div>
    );
}

interface NodeMatrixProps {
    isThinking: boolean;
    messages: ChatMessage[];
    contentText: string;
}

/* ---- Pentagon layout positions ---- */
const getNodePositions = (cx: number, cy: number, radius: number) => {
    return AGENTS.map((_, i) => {
        const angle = (i * 2 * Math.PI) / AGENTS.length - Math.PI / 2;
        return {
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle),
        };
    });
};

export default function NodeMatrix({
    isThinking,
    messages,
    contentText,
}: NodeMatrixProps) {
    /* Track MULTIPLE active nodes at once */
    const [activeNodes, setActiveNodes] = useState<Set<number>>(new Set());
    /* Track which connection pairs are highlighted */
    const [activeConnections, setActiveConnections] = useState<[number, number][]>([]);
    /* Label for the status bar */
    const [statusText, setStatusText] = useState("Starting debate...");

    const chatContainerRef = useRef<HTMLDivElement>(null);

    /**
     * Simulate dynamic multi-agent activity while thinking:
     *  - 2-3 nodes pulse at once
     *  - Connections between active nodes light up
     *  - Status text shows which agents are interacting
     */
    useEffect(() => {
        if (!isThinking) {
            setActiveNodes(new Set());
            setActiveConnections([]);
            setStatusText("Debate complete");
            return;
        }

        const debatePatterns = [
            { nodes: [0, 3], status: "🚀 Kabir and ✨ Priya are arguing about aesthetics..." },
            { nodes: [1, 2], status: "🌿 Ananya is challenging 💰 Rohan on sustainability..." },
            { nodes: [0, 4], status: "🧐 Arjun is fact-checking 🚀 Kabir's claims..." },
            { nodes: [1, 3], status: "🌿 Ananya and ✨ Priya are bonding over vibes..." },
            { nodes: [2, 4], status: "💰 Rohan and 🧐 Arjun are crunching the numbers..." },
            { nodes: [0, 1, 2], status: "🚀 Kabir, 🌿 Ananya, and 💰 Rohan in a three-way debate..." },
            { nodes: [3, 4], status: "✨ Priya is questioning 🧐 Arjun's skepticism..." },
            { nodes: [0, 2, 3], status: "The panel is getting heated! 🔥" },
            { nodes: [1, 4], status: "🌿 Ananya challenges 🧐 Arjun to back up his data..." },
            { nodes: [0, 1, 3, 4], status: "Almost everyone is chiming in now! 📢" },
        ];

        let patternIndex = 0;
        const interval = setInterval(() => {
            const pattern = debatePatterns[patternIndex % debatePatterns.length];
            setActiveNodes(new Set(pattern.nodes));
            setStatusText(pattern.status);

            /* Build connections between all active nodes */
            const connections: [number, number][] = [];
            for (let i = 0; i < pattern.nodes.length; i++) {
                for (let j = i + 1; j < pattern.nodes.length; j++) {
                    connections.push([pattern.nodes[i], pattern.nodes[j]]);
                }
            }
            setActiveConnections(connections);

            patternIndex++;
        }, 2200);

        return () => clearInterval(interval);
    }, [isThinking]);

    /* Auto-scroll chat on new messages */
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
                chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    /* SVG layout constants */
    const svgW = 500;
    const svgH = 500;
    const centerX = svgW / 2;
    const centerY = svgH / 2;
    const nodeRadius = 170;
    const positions = getNodePositions(centerX, centerY, nodeRadius);

    /**
     * Check if a connection between two nodes is currently active
     */
    const isConnectionActive = (i: number, j: number) => {
        return activeConnections.some(
            ([a, b]) => (a === i && b === j) || (a === j && b === i)
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="flex min-h-screen flex-col lg:flex-row items-center justify-center gap-6 px-4 py-8"
        >
            {/* ================ LEFT: Node Graph ================ */}
            <div className="relative flex-shrink-0">
                <svg
                    viewBox={`0 0 ${svgW} ${svgH}`}
                    className="w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] lg:w-[480px] lg:h-[480px]"
                >
                    {/* SVG Definitions for glow filters */}
                    <defs>
                        {AGENTS.map((agent) => (
                            <filter key={agent.id} id={`glow-${agent.id}`}>
                                <feGaussianBlur stdDeviation="6" result="blur" />
                                <feFlood floodColor={agent.color} floodOpacity="0.6" />
                                <feComposite in2="blur" operator="in" />
                                <feMerge>
                                    <feMergeNode />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        ))}
                        <filter id="glow-center">
                            <feGaussianBlur stdDeviation="8" result="blur" />
                            <feFlood floodColor="#a855f7" floodOpacity="0.5" />
                            <feComposite in2="blur" operator="in" />
                            <feMerge>
                                <feMergeNode />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* ---- Hub connections: each node to center ---- */}
                    {positions.map((pos, i) => {
                        const isActive = activeNodes.has(i) && isThinking;
                        const agent = AGENTS[i];
                        return (
                            <motion.line
                                key={`hub-${i}`}
                                x1={centerX}
                                y1={centerY}
                                x2={pos.x}
                                y2={pos.y}
                                stroke={isActive ? agent.color : "rgba(113,113,122,0.15)"}
                                strokeWidth={isActive ? 2 : 0.8}
                                strokeDasharray={isActive ? "0" : "6 4"}
                                animate={{
                                    stroke: isActive ? agent.color : "rgba(113,113,122,0.15)",
                                    strokeWidth: isActive ? 2 : 0.8,
                                }}
                                transition={{ duration: 0.4 }}
                            />
                        );
                    })}

                    {/* ---- Peer-to-peer connections (highlighted when agents interact) ---- */}
                    {positions.map((pos, i) =>
                        positions.map((pos2, j) => {
                            if (j <= i) return null;
                            const active = isConnectionActive(i, j) && isThinking;
                            const agentA = AGENTS[i];
                            const agentB = AGENTS[j];
                            return (
                                <motion.line
                                    key={`peer-${i}-${j}`}
                                    x1={pos.x}
                                    y1={pos.y}
                                    x2={pos2.x}
                                    y2={pos2.y}
                                    animate={{
                                        stroke: active
                                            ? `url(#grad-${i}-${j})`
                                            : "rgba(113,113,122,0.04)",
                                        strokeWidth: active ? 2 : 0.3,
                                        opacity: active ? 1 : 0.5,
                                    }}
                                    stroke={active ? agentA.color : "rgba(113,113,122,0.04)"}
                                    strokeWidth={active ? 2 : 0.3}
                                    transition={{ duration: 0.5 }}
                                />
                            );
                        })
                    )}

                    {/* ---- Center Hub (the Ad) ---- */}
                    <motion.circle
                        cx={centerX}
                        cy={centerY}
                        r={32}
                        fill="rgba(24,24,27,0.8)"
                        stroke="#a855f7"
                        strokeWidth={2}
                        filter="url(#glow-center)"
                        animate={
                            isThinking
                                ? { strokeOpacity: [0.4, 1, 0.4], r: [32, 34, 32] }
                                : { strokeOpacity: 0.6 }
                        }
                        transition={
                            isThinking
                                ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                                : {}
                        }
                    />
                    <text
                        x={centerX}
                        y={centerY}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#c084fc"
                        fontSize="13"
                        fontWeight="600"
                    >
                        ASSET
                    </text>

                    {/* ---- Agent Nodes ---- */}
                    {positions.map((pos, i) => {
                        const agent = AGENTS[i];
                        const isActive = activeNodes.has(i) && isThinking;
                        return (
                            <g key={agent.id}>
                                {/* Pulse rings for active nodes */}
                                {isActive && (
                                    <>
                                        <motion.circle
                                            cx={pos.x}
                                            cy={pos.y}
                                            r={30}
                                            fill="none"
                                            stroke={agent.color}
                                            strokeWidth={1.5}
                                            animate={{ r: [30, 50], opacity: [0.6, 0] }}
                                            transition={{
                                                duration: 1.5,
                                                repeat: Infinity,
                                                ease: "easeOut",
                                            }}
                                        />
                                        <motion.circle
                                            cx={pos.x}
                                            cy={pos.y}
                                            r={30}
                                            fill="none"
                                            stroke={agent.color}
                                            strokeWidth={1}
                                            animate={{ r: [30, 60], opacity: [0.3, 0] }}
                                            transition={{
                                                duration: 2,
                                                delay: 0.4,
                                                repeat: Infinity,
                                                ease: "easeOut",
                                            }}
                                        />
                                    </>
                                )}

                                {/* Node circle */}
                                <motion.circle
                                    cx={pos.x}
                                    cy={pos.y}
                                    r={28}
                                    fill="rgba(24,24,27,0.9)"
                                    stroke={agent.color}
                                    strokeWidth={isActive ? 2.5 : 1.5}
                                    filter={isActive ? `url(#glow-${agent.id})` : undefined}
                                    animate={
                                        isActive
                                            ? { scale: [1, 1.06, 1], strokeWidth: [2, 3, 2] }
                                            : { scale: 1 }
                                    }
                                    transition={
                                        isActive
                                            ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                                            : {}
                                    }
                                    style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                                />

                                {/* Emoji */}
                                <text
                                    x={pos.x}
                                    y={pos.y - 2}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fontSize="20"
                                >
                                    {agent.emoji}
                                </text>

                                {/* Name & role labels */}
                                <text
                                    x={pos.x}
                                    y={pos.y + 44}
                                    textAnchor="middle"
                                    fill={isActive ? agent.color : "#a1a1aa"}
                                    fontSize="11"
                                    fontWeight={isActive ? "600" : "400"}
                                >
                                    {agent.name}
                                </text>
                                <text
                                    x={pos.x}
                                    y={pos.y + 58}
                                    textAnchor="middle"
                                    fill="#71717a"
                                    fontSize="9"
                                >
                                    {agent.role}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                {/* Dynamic status bar */}
                <div className="text-center mt-2 h-6">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={statusText}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.3 }}
                            className="text-sm font-medium text-purple-300"
                        >
                            {statusText}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>

            {/* ================ RIGHT: Chat Feed ================ */}
            <div className="w-full max-w-md lg:max-w-lg flex flex-col glass-card rounded-2xl overflow-hidden h-[480px]">
                {/* Chat header */}
                <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5">
                    <MessageSquare className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium text-zinc-300">
                        Focus Group Debate
                    </span>
                    <span className="ml-auto text-xs text-zinc-500">
                        {messages.length} messages
                    </span>
                </div>

                {/* Chat messages */}
                <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-4 space-y-3"
                >
                    {/* Initial system message */}
                    <div className="text-center py-2">
                        <span className="text-xs text-zinc-600 bg-zinc-800/50 px-3 py-1 rounded-full">
                            Analyzing: &quot;{contentText.slice(0, 60)}
                            {contentText.length > 60 ? "..." : ""}&quot;
                        </span>
                    </div>

                    <AnimatePresence initial={false}>
                        {messages.map((msg, i) => {
                            if (!msg) return null;
                            const agent = AGENTS.find((a) => a.id === msg.agentId);
                            if (!agent) return null;
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="flex items-start gap-3"
                                >
                                    <div
                                        className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm border"
                                        style={{
                                            backgroundColor: `rgba(${agent.colorRGB}, 0.1)`,
                                            borderColor: `rgba(${agent.colorRGB}, 0.3)`,
                                        }}
                                    >
                                        {agent.emoji}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2 mb-0.5">
                                            <span
                                                className="text-sm font-semibold"
                                                style={{ color: agent.color }}
                                            >
                                                {agent.name}
                                            </span>
                                            <span className="text-[10px] text-zinc-600">
                                                {agent.role}
                                            </span>
                                        </div>
                                        <AgentMessageBody text={msg.text} agentColor={agent.color} />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Typing indicator */}
                    {isThinking && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2 pl-11"
                        >
                            <div className="flex gap-1">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="h-1.5 w-1.5 rounded-full bg-purple-400"
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{
                                            duration: 1,
                                            delay: i * 0.2,
                                            repeat: Infinity,
                                        }}
                                    />
                                ))}
                            </div>
                            <span className="text-xs text-zinc-500">
                                Agents are debating...
                            </span>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
