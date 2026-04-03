import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { createBreadcrumbJsonLd, createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Sample Audience Simulation",
  description:
    "Explore a sample audience simulation with persona reactions, engagement scores, and panel debate insights.",
  path: "/demo/simulation",
});

const breadcrumbJsonLd = createBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Sample Outputs", path: "/demo" },
  { name: "Sample Audience Simulation", path: "/demo/simulation" },
]);

export default function DemoSimulationLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      {children}
    </>
  );
}
