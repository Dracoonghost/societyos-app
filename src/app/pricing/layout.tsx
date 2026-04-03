import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Pricing",
  description:
    "Explore SocietyOS pricing for AI decision reviews, audience simulations, and exportable strategy artifacts.",
  path: "/pricing",
});

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SocietyOS",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://societyos.ai/pricing",
  description:
    "AI decision lab with strategic reviews, audience simulations, and decision-ready artifacts for founders and operators.",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
  },
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={softwareApplicationJsonLd} />
      {children}
    </>
  );
}
