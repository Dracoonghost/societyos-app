"use client";

import {
  FileText,
  Layers,
  DollarSign,
  TrendingUp,
  Building2,
  Users,
  Briefcase,
  Code2,
  Lightbulb,
  Bug,
} from "lucide-react";

export type SectionKey =
  | "executive_summary"
  | "product_overview"
  | "pricing_and_packaging"
  | "gtm_and_positioning"
  | "funding_and_company"
  | "customer_and_social_proof"
  | "job_postings_intel"
  | "community_and_developer_presence"
  | "tactical_recommendations"
  | "debug";

interface TabDef {
  key: SectionKey;
  label: string;
  icon: React.ReactNode;
  alwaysShow?: boolean;
  separator?: boolean;
}

const ALL_TABS: TabDef[] = [
  { key: "executive_summary",                label: "Summary",   icon: <FileText size={13} /> },
  { key: "product_overview",                 label: "Product",   icon: <Layers size={13} /> },
  { key: "pricing_and_packaging",            label: "Pricing",   icon: <DollarSign size={13} /> },
  { key: "gtm_and_positioning",              label: "GTM",       icon: <TrendingUp size={13} /> },
  { key: "funding_and_company",              label: "Funding",   icon: <Building2 size={13} /> },
  { key: "customer_and_social_proof",        label: "Customers", icon: <Users size={13} /> },
  { key: "job_postings_intel",               label: "Job Intel", icon: <Briefcase size={13} /> },
  { key: "community_and_developer_presence", label: "Community", icon: <Code2 size={13} /> },
  { key: "tactical_recommendations",         label: "Playbook",  icon: <Lightbulb size={13} /> },
  { key: "debug", label: "Debug", icon: <Bug size={13} />, alwaysShow: true, separator: true },
];

interface SectionTabsProps {
  activeSection: SectionKey;
  onChange: (key: SectionKey) => void;
  generatedSections: string[];
}

export function SectionTabs({ activeSection, onChange, generatedSections }: SectionTabsProps) {
  const generated = new Set(generatedSections);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-px scrollbar-none">
      {ALL_TABS.map((tab) => {
        const isActive = activeSection === tab.key;
        const isReady = tab.alwaysShow || generated.has(tab.key);
        return (
          <div key={tab.key} className="flex items-center gap-1 shrink-0">
            {tab.separator && (
              <div className="w-px h-4 bg-[var(--border-default)] mx-1 shrink-0" />
            )}
            <button
              onClick={() => onChange(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-[var(--bg-2)] text-[var(--text-1)] border border-[var(--border-default)] shadow-sm"
                  : tab.key === "debug"
                  ? "text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--bg-1)] border border-transparent opacity-60 hover:opacity-100"
                  : "text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--bg-1)] border border-transparent"
              }`}
            >
              <span className={isActive ? "text-[var(--accent-amber)]" : tab.key === "debug" ? "text-[var(--text-3)]" : ""}>{tab.icon}</span>
              {tab.label}
              {!tab.alwaysShow && isReady && !isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-amber)] shrink-0" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export { ALL_TABS };
