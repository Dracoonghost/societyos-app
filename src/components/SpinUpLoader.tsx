"use client";

/**
 * ============================================================
 * SpinUpLoader.tsx — Phase 2: The Loading State
 * ============================================================
 * Displays a pulsating purple orb with expanding rings
 * and cycles through initialization status messages.
 * ============================================================
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* Status messages that cycle during load */
const STATUS_MESSAGES = [
    "Initializing ChromaDB Memory...",
    "Loading Gen Z Persona Vectors...",
    "Waking up Gen Z Personas...",
    "Connecting to Hugging Face LLM...",
    "Assembling the Focus Group...",
    "Calibrating Vibe-Check Algorithms...",
];

export default function SpinUpLoader() {
    const [messageIndex, setMessageIndex] = useState(0);

    /* Cycle through status messages every 2 seconds */
    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((i) => (i + 1) % STATUS_MESSAGES.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex min-h-screen flex-col items-center justify-center gap-12 px-4"
        >
            {/* ---- Pulsating Orb with Rings ---- */}
            <div className="relative flex items-center justify-center">
                {/* Expanding ring layers */}
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full border border-purple-500/30"
                        style={{
                            width: 120 + i * 60,
                            height: 120 + i * 60,
                        }}
                        animate={{
                            scale: [0.8, 1.4, 0.8],
                            opacity: [0.4, 0, 0.4],
                        }}
                        transition={{
                            duration: 3,
                            delay: i * 0.6,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}

                {/* Outer glow halo */}
                <motion.div
                    className="absolute h-32 w-32 rounded-full"
                    style={{
                        background:
                            "radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)",
                    }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Core orb */}
                <motion.div
                    className="relative h-20 w-20 rounded-full"
                    style={{
                        background:
                            "radial-gradient(circle at 35% 35%, #c084fc, #7c3aed, #5b21b6)",
                        boxShadow:
                            "0 0 30px rgba(168,85,247,0.5), 0 0 60px rgba(168,85,247,0.2), inset 0 0 20px rgba(255,255,255,0.1)",
                    }}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                    {/* Shimmer highlight */}
                    <div
                        className="absolute inset-0 rounded-full"
                        style={{
                            background:
                                "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)",
                        }}
                    />
                </motion.div>
            </div>

            {/* ---- Status Text ---- */}
            <div className="text-center space-y-4">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={messageIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="text-lg font-medium text-purple-300"
                    >
                        {STATUS_MESSAGES[messageIndex]}
                    </motion.p>
                </AnimatePresence>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-1.5">
                    {STATUS_MESSAGES.map((_, i) => (
                        <motion.div
                            key={i}
                            className="h-1.5 rounded-full"
                            animate={{
                                width: i === messageIndex ? 24 : 6,
                                backgroundColor:
                                    i === messageIndex
                                        ? "rgba(168,85,247,0.9)"
                                        : "rgba(113,113,122,0.4)",
                            }}
                            transition={{ duration: 0.3 }}
                        />
                    ))}
                </div>

                <p className="text-sm text-zinc-500 mt-4">
                    This usually takes 10–20 seconds
                </p>
            </div>
        </motion.div>
    );
}
