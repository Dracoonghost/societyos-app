"use client";

import { ExternalLink, CheckCircle2, XCircle, Twitter, Linkedin, Instagram, Facebook, Youtube, Github } from "lucide-react";

// ---------------------------------------------------------------------------
// Types matching BRAND_SECTION_SCHEMAS["social_media_discovery"] + ["social_analysis"]
// ---------------------------------------------------------------------------

interface SocialDiscoveryPlatform {
  found: boolean;
  url?: string | null;
  handle?: string | null;
  company_slug?: string | null;
  channel_name?: string | null;
  org_name?: string | null;
  page_name?: string | null;
  evidence?: string | null;
}

interface SocialAnalysisBreakdown {
  platform: string;
  activity_signal?: string;
  content_themes?: string[];
  engagement_signal?: string;
  audience_alignment?: string;
  notes?: string;
}

interface SocialCardsProps {
  /** social_media_discovery section — platform objects at top level, not nested */
  discoveryData?: {
    twitter_x?: SocialDiscoveryPlatform;
    linkedin?: SocialDiscoveryPlatform;
    instagram?: SocialDiscoveryPlatform;
    facebook?: SocialDiscoveryPlatform;
    youtube?: SocialDiscoveryPlatform;
    tiktok?: SocialDiscoveryPlatform;
    github?: SocialDiscoveryPlatform;
    other_platforms?: { platform: string; url?: string; evidence?: string }[];
    data_gaps?: string[];
  };
  /** social_analysis section */
  analysisData?: {
    overall_social_presence?: string | null;
    primary_platform?: string | null;
    platforms_breakdown?: SocialAnalysisBreakdown[];
    content_strategy_signal?: string | null;
    brand_voice_on_social?: string | null;
    social_strengths?: string[];
    social_gaps?: string[];
    recommendations?: string[];
    data_gaps?: string[];
  };
}

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  twitter_x: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  github: Github,
};

const PLATFORM_LABELS: Record<string, string> = {
  twitter_x: "Twitter / X",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  tiktok: "TikTok",
  github: "GitHub",
};

const PLATFORM_KEYS = ["twitter_x", "linkedin", "instagram", "facebook", "youtube", "tiktok", "github"] as const;
type PlatformKey = typeof PLATFORM_KEYS[number];

function TikTokIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.79a8.18 8.18 0 0 0 4.78 1.52V6.87a4.85 4.85 0 0 1-1.01-.18z" />
    </svg>
  );
}

function PlatformIcon({ platform, size = 14 }: { platform: string; size?: number }) {
  if (platform === "tiktok") return <TikTokIcon size={size} />;
  const Icon = PLATFORM_ICONS[platform];
  if (!Icon) return null;
  return <Icon size={size} />;
}

function signalColor(val?: string | null) {
  if (!val) return "text-[var(--text-3)]";
  const l = val.toLowerCase();
  if (l.includes("strong") || l.includes("high") || l.includes("active")) return "text-emerald-400";
  if (l.includes("weak") || l.includes("low") || l.includes("absent") || l.includes("none")) return "text-red-400";
  return "text-amber-400";
}

export function SocialCards({ discoveryData, analysisData }: SocialCardsProps) {
  // Extract found platforms from top-level keys
  const platformCards = PLATFORM_KEYS
    .map((key) => ({ key, info: discoveryData?.[key as PlatformKey] }))
    .filter(({ info }) => info !== undefined && info !== null);

  return (
    <div id="social" className="flex flex-col gap-6 scroll-mt-20">
      {/* Overall presence + meta */}
      {(analysisData?.overall_social_presence || analysisData?.primary_platform) && (
        <div className="rounded-xl p-5 border flex items-center gap-6 flex-wrap" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
          {analysisData.overall_social_presence && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)] mb-0.5">Social Presence</p>
              <p className={`text-sm font-bold ${signalColor(analysisData.overall_social_presence)}`}>{analysisData.overall_social_presence}</p>
            </div>
          )}
          {analysisData.primary_platform && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)] mb-0.5">Primary Platform</p>
              <p className="text-sm font-medium text-[var(--text-1)]">{PLATFORM_LABELS[analysisData.primary_platform] || analysisData.primary_platform}</p>
            </div>
          )}
          {analysisData.content_strategy_signal && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)] mb-0.5">Content Strategy</p>
              <p className={`text-sm font-medium ${signalColor(analysisData.content_strategy_signal)}`}>{analysisData.content_strategy_signal}</p>
            </div>
          )}
          {analysisData.brand_voice_on_social && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)] mb-0.5">Brand Voice</p>
              <p className="text-sm text-[var(--text-2)]">{analysisData.brand_voice_on_social}</p>
            </div>
          )}
        </div>
      )}

      {/* Platform cards */}
      {platformCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {platformCards.map(({ key, info }) => {
            if (!info) return null;
            const breakdown = analysisData?.platforms_breakdown?.find(
              (b) => b.platform.toLowerCase().replace(/[\s/]/g, "_") === key ||
                     b.platform.toLowerCase().includes(key.replace("_x", ""))
            );
            const handle = info.handle || info.company_slug || info.channel_name || info.org_name || info.page_name;
            return (
              <div
                key={key}
                className="rounded-xl border flex flex-col overflow-hidden"
                style={{
                  background: "var(--bg-1)",
                  borderColor: "var(--border-subtle)",
                  opacity: info.found ? 1 : 0.55,
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  <div className="flex items-center gap-2">
                    <PlatformIcon platform={key} size={14} />
                    <span className="text-sm font-semibold text-[var(--text-1)]">
                      {PLATFORM_LABELS[key] || key}
                    </span>
                  </div>
                  {info.found ? (
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  ) : (
                    <XCircle size={14} className="text-[var(--text-3)]" />
                  )}
                </div>

                <div className="flex flex-col gap-2 p-4 flex-1">
                  {info.found && info.url && (
                    <a
                      href={info.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-[var(--accent-cyan)] hover:underline truncate"
                    >
                      <ExternalLink size={10} />
                      {info.url}
                    </a>
                  )}
                  {info.found && handle && (
                    <p className="text-xs text-[var(--text-3)]">{handle.startsWith("@") ? handle : `@${handle}`}</p>
                  )}
                  {!info.found && (
                    <p className="text-xs text-[var(--text-3)]">Not found</p>
                  )}

                  {breakdown && (
                    <>
                      {breakdown.activity_signal && (
                        <div>
                          <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider">Activity</p>
                          <p className={`text-sm font-medium ${signalColor(breakdown.activity_signal)}`}>{breakdown.activity_signal}</p>
                        </div>
                      )}
                      {breakdown.engagement_signal && (
                        <div>
                          <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider">Engagement</p>
                          <p className="text-sm text-[var(--text-2)]">{breakdown.engagement_signal}</p>
                        </div>
                      )}
                      {breakdown.content_themes && breakdown.content_themes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {breakdown.content_themes.map((t, i) => (
                            <span key={i} className="px-2 py-0.5 rounded text-[10px] border" style={{ background: "var(--bg-2)", borderColor: "var(--border-subtle)", color: "var(--text-2)" }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      {breakdown.notes && (
                        <p className="text-xs text-[var(--text-3)] mt-1">{breakdown.notes}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Other platforms */}
      {discoveryData?.other_platforms && discoveryData.other_platforms.length > 0 && (
        <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)] mb-3">Other Platforms</p>
          <ul className="flex flex-col gap-2">
            {discoveryData.other_platforms.map((p, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-[var(--text-2)]">
                <span className="font-medium text-[var(--text-1)]">{p.platform}</span>
                {p.url && (
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--accent-cyan)] hover:underline flex items-center gap-1">
                    <ExternalLink size={10} /> {p.url}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Strengths / gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysisData?.social_strengths && analysisData.social_strengths.length > 0 && (
          <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3">Social Strengths</p>
            <ul className="flex flex-col gap-1.5">
              {analysisData.social_strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-2)]">
                  <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-400" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysisData?.social_gaps && analysisData.social_gaps.length > 0 && (
          <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3">Social Gaps</p>
            <ul className="flex flex-col gap-1.5">
              {analysisData.social_gaps.map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-2)]">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-amber-400" />
                  {g}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {analysisData?.recommendations && analysisData.recommendations.length > 0 && (
        <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-cyan)] mb-3">Recommendations</p>
          <ol className="flex flex-col gap-2">
            {analysisData.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[var(--text-2)]">
                <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-[var(--accent-cyan)]" style={{ background: "rgba(88,184,216,0.12)" }}>
                  {i + 1}
                </span>
                {rec}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

