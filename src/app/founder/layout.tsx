import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Founder Panel",
  description:
    "Pressure-test a startup idea with AI founder personas, research-backed briefs, and guided follow-up discussion.",
  path: "/founder",
});

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SocietyOS Founder Panel",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://societyos.ai/founder",
  description:
    "Pressure-test startup ideas with AI founder personas, research-backed briefs, and decision support workflows.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function FounderLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={softwareApplicationJsonLd} />
      {children}
    </>
  );
}
