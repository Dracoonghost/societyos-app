"use client";

import { ExternalLink, AlertCircle } from "lucide-react";

// ─── Platform config ─────────────────────────────────────────────────────────

const PLATFORMS: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  instagram:  { label: "Instagram",  color: "#E1306C", bgColor: "rgba(225,48,108,0.08)",  borderColor: "rgba(225,48,108,0.2)"  },
  tiktok:     { label: "TikTok",     color: "#69C9D0", bgColor: "rgba(105,201,208,0.08)", borderColor: "rgba(105,201,208,0.2)" },
  youtube:    { label: "YouTube",    color: "#FF0000", bgColor: "rgba(255,0,0,0.08)",      borderColor: "rgba(255,0,0,0.2)"     },
  pinterest:  { label: "Pinterest",  color: "#E60023", bgColor: "rgba(230,0,35,0.08)",    borderColor: "rgba(230,0,35,0.2)"    },
  twitter_x:  { label: "X / Twitter",color: "#e7e9ea", bgColor: "rgba(231,233,234,0.06)", borderColor: "rgba(231,233,234,0.15)"},
  linkedin:   { label: "LinkedIn",   color: "#0A66C2", bgColor: "rgba(10,102,194,0.08)",  borderColor: "rgba(10,102,194,0.2)"  },
  facebook:   { label: "Facebook",   color: "#1877F2", bgColor: "rgba(24,119,242,0.08)",  borderColor: "rgba(24,119,242,0.2)"  },
};

// ─── Platform icons (inline SVG paths) ───────────────────────────────────────

function PlatformIcon({ platform, color }: { platform: string; color: string }) {
  const size = 16;
  switch (platform) {
    case "instagram":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke={color} strokeWidth="2"/>
          <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2"/>
          <circle cx="17.5" cy="6.5" r="1" fill={color}/>
        </svg>
      );
    case "tiktok":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.73a4.85 4.85 0 01-1.01-.04z"/>
        </svg>
      );
    case "youtube":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.67 12 3.67 12 3.67s-7.5 0-9.38.38A3.02 3.02 0 00.5 6.19 31.6 31.6 0 000 12a31.6 31.6 0 00.5 5.81 3.02 3.02 0 002.12 2.14C4.5 20.33 12 20.33 12 20.33s7.5 0 9.38-.38a3.02 3.02 0 002.12-2.14A31.6 31.6 0 0024 12a31.6 31.6 0 00-.5-5.81zM9.75 15.5V8.5l6.25 3.5-6.25 3.5z"/>
        </svg>
      );
    case "pinterest":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.44 7.63 11.2-.1-.95-.2-2.4.04-3.44.22-.92 1.46-6.2 1.46-6.2s-.37-.75-.37-1.85c0-1.74 1.01-3.04 2.26-3.04 1.07 0 1.58.8 1.58 1.76 0 1.07-.68 2.68-1.04 4.17-.3 1.25.62 2.27 1.84 2.27 2.2 0 3.9-2.32 3.9-5.67 0-2.97-2.13-5.04-5.18-5.04-3.52 0-5.59 2.64-5.59 5.37 0 1.06.41 2.2.92 2.82a.37.37 0 01.08.36c-.09.39-.3 1.25-.34 1.42-.05.23-.17.28-.4.17-1.5-.7-2.44-2.9-2.44-4.66 0-3.8 2.76-7.29 7.96-7.29 4.18 0 7.42 2.98 7.42 6.96 0 4.15-2.62 7.49-6.25 7.49-1.22 0-2.37-.63-2.76-1.38l-.75 2.8c-.27 1.05-1 2.36-1.49 3.16.56.17 1.16.26 1.77.26 6.63 0 12-5.37 12-12S18.63 0 12 0z"/>
        </svg>
      );
    case "twitter_x":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      );
    case "linkedin":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      );
    default:
      return <span style={{ color, fontSize: 12, fontWeight: 700 }}>{platform[0].toUpperCase()}</span>;
  }
}

// ─── Single social platform card ─────────────────────────────────────────────

interface SocialPlatformData {
  status?: string;
  url?: string | null;
  handle?: string | null;
  followers?: string | null;
  subscribers?: string | null;
}

function SocialCard({ platform, data }: { platform: string; data: SocialPlatformData | string }) {
  const config = PLATFORMS[platform] ?? { label: platform, color: "#888", bgColor: "rgba(136,136,136,0.08)", borderColor: "rgba(136,136,136,0.2)" };

  // Handle legacy string format ("active | inactive | not found")
  const isLegacyString = typeof data === "string";
  const status = isLegacyString ? data : (data?.status ?? "not found");
  const url = isLegacyString ? null : (data?.url ?? null);
  const handle = isLegacyString ? null : (data?.handle ?? null);
  const count = isLegacyString ? null : (data?.followers ?? data?.subscribers ?? null);

  const isActive = status === "active";
  const isInactive = status === "inactive";
  const isNotFound = !isActive && !isInactive;

  if (isNotFound) {
    return (
      <div
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border opacity-40"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-1)" }}
      >
        <PlatformIcon platform={platform} color="var(--text-3)" />
        <span className="text-xs text-[var(--text-3)]">{config.label}</span>
        <span className="ml-auto text-[10px] text-[var(--text-3)] italic">not found</span>
      </div>
    );
  }

  const card = (
    <div
      className="flex items-center gap-3 px-3 py-3 rounded-lg border transition-all"
      style={{
        borderColor: isActive ? config.borderColor : "var(--border-subtle)",
        backgroundColor: isActive ? config.bgColor : "var(--bg-1)",
        opacity: isInactive ? 0.55 : 1,
      }}
    >
      <div className="shrink-0">
        <PlatformIcon platform={platform} color={isActive ? config.color : "var(--text-3)"} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-[var(--text-1)]">{config.label}</span>
          {isInactive && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-2)] text-[var(--text-3)] uppercase tracking-wide border border-[var(--border-subtle)]">
              inactive
            </span>
          )}
        </div>
        {handle && (
          <p className="text-[11px] text-[var(--text-3)] truncate mt-0.5">{handle}</p>
        )}
      </div>

      {count && (
        <div className="shrink-0 text-right">
          <span className="text-sm font-bold" style={{ color: isActive ? config.color : "var(--text-2)" }}>
            {count}
          </span>
          <p className="text-[9px] text-[var(--text-3)] uppercase tracking-wide">
            {platform === "youtube" ? "subs" : "followers"}
          </p>
        </div>
      )}

      {url && isActive && (
        <ExternalLink size={11} className="shrink-0 text-[var(--text-3)]" />
      )}
    </div>
  );

  if (url && isActive) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block hover:scale-[1.01] transition-transform">
        {card}
      </a>
    );
  }
  return card;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function humanize(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function SentimentBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    positive: "text-emerald-400 bg-emerald-950/40 border-emerald-800/40",
    negative: "text-red-400 bg-red-950/40 border-red-800/40",
    mixed:    "text-yellow-400 bg-yellow-950/40 border-yellow-800/40",
    insufficient_data: "text-[var(--text-3)] bg-[var(--bg-2)] border-[var(--border-subtle)]",
  };
  return (
    <span className={`px-2.5 py-1 rounded-md border text-xs font-semibold uppercase tracking-wide ${map[value] ?? map.mixed}`}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

function TagList({ items }: { items: string[] }) {
  if (!items.length) return <span className="text-[var(--text-3)] text-sm">—</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={i} className="px-2.5 py-1 rounded-md bg-[var(--bg-2)] border border-[var(--border-subtle)] text-xs text-[var(--text-2)]">
          {item}
        </span>
      ))}
    </div>
  );
}

function GitHubPresenceCard({ presence }: { presence: Record<string, unknown> }) {
  const found = Boolean(presence.org_found);
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-2)] p-3.5 space-y-2">
      <div className="flex items-center gap-2">
        <svg width={14} height={14} viewBox="0 0 24 24" fill="var(--text-2)">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
        </svg>
        <span className="text-xs font-medium text-[var(--text-1)]">GitHub</span>
        {found ? (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 uppercase tracking-wide ml-auto">
            found
          </span>
        ) : (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-1)] text-[var(--text-3)] border border-[var(--border-subtle)] uppercase tracking-wide ml-auto">
            not found
          </span>
        )}
      </div>
      {found && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          {presence.public_repos_count !== undefined && (
            <div>
              <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wide">Public repos</p>
              <p className="text-sm font-bold text-[var(--text-1)]">{String(presence.public_repos_count)}</p>
            </div>
          )}
          {presence.sdk_or_cli_published !== undefined && (
            <div>
              <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wide">SDK / CLI</p>
              <p className="text-sm font-bold text-[var(--text-1)]">{presence.sdk_or_cli_published ? "Yes" : "No"}</p>
            </div>
          )}
        </div>
      )}
      {Array.isArray(presence.most_starred_repos) && presence.most_starred_repos.length > 0 && (
        <div>
          <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wide mb-1">Top repos</p>
          <div className="flex flex-wrap gap-1.5">
            {(presence.most_starred_repos as string[]).map((r, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-[var(--bg-1)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-2)] font-mono">{r}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CommunitySectionPanelProps {
  data: Record<string, unknown> | null | undefined;
}

export function CommunitySectionPanel({ data }: CommunitySectionPanelProps) {
  if (!data) {
    return (
      <div className="pt-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 rounded bg-[var(--bg-2)] animate-pulse" style={{ width: `${60 + i * 10}%` }} />
        ))}
      </div>
    );
  }

  const socialPresence = data.social_presence as Record<string, SocialPlatformData | string> | undefined;
  const githubPresence = data.github_presence as Record<string, unknown> | undefined;
  const redditSentiment = data.reddit_sentiment as string | undefined;
  const redditThemes = data.reddit_themes as string[] | undefined;
  const hnMentions = data.hn_mentions as string[] | undefined;
  const dataGaps = data.data_gaps as string[] | undefined;

  // Remaining fields to render generically (exclude handled ones)
  const HANDLED = new Set(["social_presence", "github_presence", "reddit_sentiment", "reddit_themes", "hn_mentions", "data_gaps"]);
  const otherEntries = Object.entries(data).filter(([k]) => !HANDLED.has(k));

  const activeSocials = socialPresence
    ? Object.entries(socialPresence).filter(([, v]) => {
        const status = typeof v === "string" ? v : v?.status;
        return status !== "not found";
      })
    : [];

  const notFoundSocials = socialPresence
    ? Object.entries(socialPresence).filter(([, v]) => {
        const status = typeof v === "string" ? v : v?.status;
        return status === "not found";
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Social presence */}
      {socialPresence && (
        <div>
          <p className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-3">
            Social Presence
          </p>
          {activeSocials.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {activeSocials.map(([platform, platData]) => (
                <SocialCard key={platform} platform={platform} data={platData} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-3)] italic">No active social profiles found.</p>
          )}
          {notFoundSocials.length > 0 && (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {notFoundSocials.map(([platform, platData]) => (
                <SocialCard key={platform} platform={platform} data={platData} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* GitHub */}
      {githubPresence && (
        <div>
          <p className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-3">
            Developer Community
          </p>
          <GitHubPresenceCard presence={githubPresence} />
        </div>
      )}

      {/* Reddit */}
      {(redditSentiment || (Array.isArray(redditThemes) && redditThemes.length > 0)) && (
        <div>
          <p className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-3">
            Reddit Signals
          </p>
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-2)] p-3.5 space-y-3">
            {redditSentiment && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-3)]">Sentiment</span>
                <SentimentBadge value={redditSentiment} />
              </div>
            )}
            {Array.isArray(redditThemes) && redditThemes.length > 0 && (
              <div>
                <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wide mb-2">Themes</p>
                <TagList items={redditThemes} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* HN mentions */}
      {Array.isArray(hnMentions) && hnMentions.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider mb-3">
            Hacker News
          </p>
          <TagList items={hnMentions} />
        </div>
      )}

      {/* Other fields */}
      {otherEntries.length > 0 && (
        <div className="grid gap-4">
          {otherEntries.map(([key, value]) => (
            <div key={key} className="grid gap-1.5">
              <dt className="text-[10px] font-semibold text-[var(--text-3)] uppercase tracking-wider">
                {humanize(key)}
              </dt>
              <dd>
                {Array.isArray(value) ? (
                  value.length > 0 ? <TagList items={value as string[]} /> : <span className="text-sm text-[var(--text-3)]">—</span>
                ) : value === null || value === undefined || value === "" ? (
                  <span className="text-sm text-[var(--text-3)]">—</span>
                ) : (
                  <span className="text-sm text-[var(--text-2)]">{String(value)}</span>
                )}
              </dd>
            </div>
          ))}
        </div>
      )}

      {/* Data gaps */}
      {Array.isArray(dataGaps) && dataGaps.length > 0 && (
        <div className="rounded-lg p-3.5 flex items-start gap-2.5 border border-[var(--accent-amber)]/20 bg-[var(--accent-amber)]/5">
          <AlertCircle size={13} className="text-[var(--accent-amber)] shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-amber)] mb-1.5">
              Data Gaps
            </p>
            <ul className="space-y-1">
              {dataGaps.map((gap, i) => (
                <li key={i} className="text-xs text-[var(--text-3)] flex gap-1.5">
                  <span className="text-[var(--accent-amber)] shrink-0">·</span>
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
