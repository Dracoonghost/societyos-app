"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Compass, Shield, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { FirebaseError } from "firebase/app";
import { LoginPageDecor, FloatingOrbs } from "@/components/ui/DecorativeViz";

type Mode = "signin" | "signup" | "reset";

function getErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Incorrect email or password.";
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      case "auth/too-many-requests":
        return "Too many attempts. Try again later.";
      case "auth/popup-closed-by-user":
        return "Sign-in popup was closed.";
      default:
        return err.message;
    }
  }
  return "Something went wrong. Please try again.";
}

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
        router.push("/");
      } else if (mode === "signup") {
        await signUp(email, password, displayName || undefined);
        router.push("/");
      } else if (mode === "reset") {
        await resetPassword(email);
        setResetSent(true);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: "var(--bg-0)" }}>
      {/* Dot grid + ambient */}
      <div className="pointer-events-none fixed inset-0 dot-grid" />
      <div className="pointer-events-none fixed inset-0 ambient-glow-hero" />
      <FloatingOrbs orbs={[
        { x: "12%", y: "25%", size: 180, color: "rgba(242,169,59,0.05)", delay: 0, duration: 7 },
        { x: "88%", y: "20%", size: 160, color: "rgba(56,178,125,0.04)", delay: 1, duration: 8 },
        { x: "82%", y: "75%", size: 140, color: "rgba(88,184,216,0.04)", delay: 2, duration: 6 },
      ]} />
      <LoginPageDecor />

      {/* Top bar */}
      <div className="relative z-10 flex-shrink-0 flex items-center justify-between px-6 h-14">
        <Link href="/" className="navbar-logo">
          <img src="/logo.svg" alt="SocietyOS" className="h-6 w-auto" />
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs transition-colors"
          style={{ color: "var(--text-3)" }}
        >
          <ArrowLeft size={13} />
          Back
        </Link>
      </div>

      {/* 2-col main */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 relative z-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left: value copy */}
          <div className="hidden lg:block">
            <p className="section-label mb-4">AI Decision Lab</p>
            <h2
              className="font-bold mb-4 leading-tight"
              style={{ fontSize: "clamp(1.6rem, 2.5vw, 2.25rem)", letterSpacing: "-0.03em" }}
            >
              Validate decisions before you build, launch, or spend.
            </h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--text-2)" }}>
              Get expert-lens critique, audience reaction modeling, and research-backed insights — in minutes.
            </p>
            <ul className="space-y-3.5">
              {[
                "Strategic Review — Expert lens critique of ideas, features, and pitches",
                "Audience Simulation — Reaction modeling before you run an ad or launch",
                "Competitor Analysis — See how your positioning compares",
                "Artifacts — Final reports, GTM strategies, and pitch drafts",
              ].map((bullet) => (
                <li key={bullet} className="flex items-start gap-2.5">
                  <Check size={13} className="flex-shrink-0 mt-0.5" style={{ color: "var(--accent-amber)" }} />
                  <span className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{bullet}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 pt-6" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                50 free credits to start. No card required.
              </p>
            </div>
          </div>

          {/* Right: auth card */}
          <motion.div
            className="relative w-full max-w-[400px] mx-auto"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
        {/* Wordmark */}
        <div className="mb-10 text-center">
          <Link href="/" className="inline-block">
            <img src="/logo.svg" alt="SocietyOS" className="h-8 w-auto" />
          </Link>
          <p className="mt-2 text-xs tracking-widest uppercase" style={{ color: "var(--text-3)", letterSpacing: "0.1em" }}>
            AI Decision Lab
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7"
          style={{
            background: "var(--bg-1)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 32px 80px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.03)",
          }}
        >
          {/* Mode tabs */}
          {mode !== "reset" && (
            <div
              className="flex rounded-lg p-1 mb-6"
              style={{ background: "var(--bg-0)" }}
            >
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(""); }}
                  className="flex-1 rounded-md py-2 text-sm font-medium transition-all duration-150"
                  style={
                    mode === m
                      ? {
                          background: "var(--accent-amber)",
                          color: "var(--bg-0)",
                          boxShadow: "0 1px 4px rgba(242, 169, 59, 0.2)",
                        }
                      : {
                          color: "var(--text-3)",
                          background: "transparent",
                        }
                  }
                >
                  {m === "signin" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>
          )}

          {/* Reset — sent state */}
          {mode === "reset" && resetSent ? (
            <div className="text-center py-4">
              <div
                className="w-11 h-11 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: "var(--accent-emerald-dim)" }}
              >
                <Shield size={18} className="text-[var(--accent-emerald)]" />
              </div>
              <p className="text-sm font-medium mb-1.5">Check your email</p>
              <p className="text-xs mb-5" style={{ color: "var(--text-3)" }}>
                A password reset link has been sent to {email}
              </p>
              <button
                onClick={() => { setMode("signin"); setResetSent(false); }}
                className="text-xs font-medium text-[var(--accent-amber)] hover:underline"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
              {mode === "reset" && (
                <div className="mb-2">
                  <p className="text-sm font-medium mb-1">Reset password</p>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>
                    Enter your email and we&apos;ll send a reset link.
                  </p>
                </div>
              )}

              {mode === "signup" && (
                <div>
                  <label className="input-label">Name (optional)</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="input-field"
                  />
                </div>
              )}

              <div>
                <label className="input-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input-field"
                />
              </div>

              {mode !== "reset" && (
                <div>
                  <label className="input-label">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;"
                    required
                    className="input-field"
                  />
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => { setMode("reset"); setError(""); }}
                      className="mt-2 text-xs transition-colors hover:text-[var(--accent-amber)]"
                      style={{ color: "var(--text-3)" }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
              )}

              {error && (
                <p
                  className="rounded-lg px-3 py-2.5 text-xs"
                  style={{
                    border: "1px solid rgba(223, 107, 87, 0.25)",
                    background: "rgba(223, 107, 87, 0.08)",
                    color: "var(--accent-coral)",
                  }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-1"
                style={{ padding: "0.75rem 1rem", opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : mode === "signin" ? (
                  "Sign In"
                ) : mode === "signup" ? (
                  "Create Account"
                ) : (
                  "Send Reset Email"
                )}
              </button>
            </form>
          )}

          {/* Google OAuth */}
          {mode !== "reset" && !resetSent && (
            <>
              <div className="my-5 flex items-center gap-3">
                <div className="flex-1" style={{ borderTop: "1px solid var(--border-subtle)" }} />
                <span className="text-xs" style={{ color: "var(--text-3)" }}>or</span>
                <div className="flex-1" style={{ borderTop: "1px solid var(--border-subtle)" }} />
              </div>

              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 rounded-lg py-3 text-sm font-medium transition-all"
                style={{
                  border: "1px solid var(--border-default)",
                  background: "transparent",
                  color: "var(--text-2)",
                  opacity: loading ? 0.5 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.borderColor = "var(--border-strong)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "var(--border-default)";
                }}
              >
                <GoogleIcon />
                Continue with Google
              </button>
            </>
          )}
        </div>

        {/* Trust cue */}
        <p className="text-center mt-6 text-xs flex items-center justify-center gap-1.5" style={{ color: "var(--text-3)" }}>
          <Shield size={11} />
          Secured with Firebase Authentication
        </p>
      </motion.div>

        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
      <path d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
      <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
      <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.314 0-9.822-3.416-11.42-8.205l-6.517 5.022C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
      <path d="M43.611 20.083H42V20H24v8h11.303a11.946 11.946 0 01-4.087 5.571l.001-.001 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
    </svg>
  );
}
