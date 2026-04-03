"use client";

import { TrendingUp, Users, Globe, Target, Zap } from "lucide-react";

interface BrandOverviewProps {
  data: {
    company_name?: string;
    one_liner?: string;
    what_they_do?: string;
    mission_statement?: string;
    target_customer?: string;
    business_model?: string;
    founded_year?: string | number | null;
    hq_location?: string | null;
    team_size_signal?: string | null;
    funding_status?: string | null;
    key_products_or_features?: string[];
    unique_value_proposition?: string;
    brand_personality_signals?: string[];
    data_gaps?: string[];
  };
}

export function BrandOverview({ data }: BrandOverviewProps) {
  return (
    <div id="overview" className="flex flex-col gap-6 scroll-mt-20">
      {/* Hero card */}
      <div
        className="rounded-xl p-6 border"
        style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}
      >
        <h2 className="text-lg font-bold text-[var(--text-1)] mb-1">
          {data.company_name || "Brand Overview"}
        </h2>
        {data.one_liner && (
          <p className="text-sm text-[var(--accent-amber)] font-medium mb-3">{data.one_liner}</p>
        )}
        {data.what_they_do && (
          <p className="text-sm text-[var(--text-2)] leading-relaxed">{data.what_they_do}</p>
        )}
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Business Model", value: data.business_model, icon: Zap },
          { label: "Founded", value: data.founded_year ? String(data.founded_year) : null, icon: Globe },
          { label: "HQ", value: data.hq_location, icon: Globe },
          { label: "Team Size", value: data.team_size_signal, icon: Users },
          { label: "Funding", value: data.funding_status, icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl p-4 border flex flex-col gap-2"
            style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}
          >
            <div className="flex items-center gap-2">
              <Icon size={12} className="text-[var(--text-3)]" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">{label}</p>
            </div>
            <p className="text-sm font-medium text-[var(--text-1)]">{value || "—"}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Target customer */}
        {data.target_customer && (
          <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Users size={13} className="text-[var(--accent-cyan)]" />
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">Target Customer</p>
            </div>
            <p className="text-sm text-[var(--text-2)]">{data.target_customer}</p>
          </div>
        )}

        {/* UVP */}
        {data.unique_value_proposition && (
          <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={13} className="text-[var(--accent-amber)]" />
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">Unique Value Proposition</p>
            </div>
            <p className="text-sm text-[var(--text-2)]">{data.unique_value_proposition}</p>
          </div>
        )}

        {/* Mission */}
        {data.mission_statement && (
          <div className="rounded-xl p-5 border md:col-span-2" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Target size={13} className="text-[var(--accent-emerald)]" />
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">Mission</p>
            </div>
            <p className="text-sm text-[var(--text-2)] italic">&ldquo;{data.mission_statement}&rdquo;</p>
          </div>
        )}
      </div>

      {/* Key products */}
      {data.key_products_or_features && data.key_products_or_features.length > 0 && (
        <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)] mb-3">Key Products & Features</p>
          <div className="flex flex-wrap gap-2">
            {data.key_products_or_features.map((feat, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-1)] border"
                style={{ background: "var(--bg-2)", borderColor: "var(--border-default)" }}
              >
                {feat}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Brand personality */}
      {data.brand_personality_signals && data.brand_personality_signals.length > 0 && (
        <div className="rounded-xl p-5 border" style={{ background: "var(--bg-1)", borderColor: "var(--border-subtle)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)] mb-3">Brand Personality</p>
          <div className="flex flex-wrap gap-2">
            {data.brand_personality_signals.map((p, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium border"
                style={{ background: "var(--bg-2)", borderColor: "var(--border-subtle)", color: "var(--text-2)" }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Data gaps */}
      {data.data_gaps && data.data_gaps.length > 0 && (
        <div className="rounded-xl p-4 border border-dashed" style={{ borderColor: "var(--border-subtle)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)] mb-2">Data Gaps</p>
          <ul className="flex flex-col gap-1">
            {data.data_gaps.map((gap, i) => (
              <li key={i} className="text-xs text-[var(--text-3)] flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0 opacity-50">·</span>
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
