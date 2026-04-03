"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Activity, ArrowRight } from "lucide-react";

export default function DemoIndexPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-0)", color: "var(--text-1)" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-3)" }}>
            <ArrowLeft size={14} />
            Home
          </Link>
          <span style={{ color: "var(--border-default)" }}>/</span>
          <span className="text-sm font-semibold">Sample Outputs</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-14">
        <div className="mb-10">
          <h1 className="font-bold mb-3" style={{ fontSize: "1.8rem", letterSpacing: "-0.03em" }}>
            Sample Outputs
          </h1>
          <p className="text-base" style={{ color: "var(--text-3)", maxWidth: "480px" }}>
            See what a completed SocietyOS session looks like — no sign-up required. Both examples use realistic data from a real workflow run.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Sample Review */}
          <Link
            href="/demo/review"
            className="group rounded-xl p-6 flex flex-col gap-5 transition-all hover:opacity-90"
            style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--accent-amber-dim)" }}
            >
              <FileText size={18} style={{ color: "var(--accent-amber)" }} />
            </div>
            <div className="flex-1">
              <div
                className="text-xs font-medium mb-2 inline-block px-2 py-0.5 rounded"
                style={{ background: "var(--bg-2)", color: "var(--text-3)" }}
              >
                Strategic Review
              </div>
              <p className="font-semibold mb-2">Validate a SaaS idea</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>
                A full 7-advisor review of a developer productivity tool — including research pack, independent analyses, verdict, and a generated GTM strategy artifact.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--accent-amber)" }}>
              View sample
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Sample Simulation */}
          <Link
            href="/demo/simulation"
            className="group rounded-xl p-6 flex flex-col gap-5 transition-all hover:opacity-90"
            style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(56,178,125,0.12)" }}
            >
              <Activity size={18} style={{ color: "var(--accent-emerald)" }} />
            </div>
            <div className="flex-1">
              <div
                className="text-xs font-medium mb-2 inline-block px-2 py-0.5 rounded"
                style={{ background: "var(--bg-2)", color: "var(--text-3)" }}
              >
                Audience Simulation
              </div>
              <p className="font-semibold mb-2">Test an ad against real audience</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>
                A 5-person audience panel reacts to a SaaS ad — with individual reactions, comprehension scores, engagement ratings, and a group debate.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--accent-emerald)" }}>
              View sample
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>

        <div className="mt-10 pt-8" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <p className="text-sm mb-4" style={{ color: "var(--text-3)" }}>
            Ready to run your own? The Free tier includes 50 credits — enough for a full strategic review.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm px-4 py-2 rounded-lg font-medium"
              style={{ background: "var(--accent-amber)", color: "#000" }}
            >
              Get started free →
            </Link>
            <Link
              href="/methodology"
              className="text-sm px-4 py-2 rounded-lg"
              style={{ border: "1px solid var(--border-default)", color: "var(--text-3)" }}
            >
              How it works
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
