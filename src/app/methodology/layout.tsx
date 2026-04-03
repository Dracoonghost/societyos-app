import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { createBreadcrumbJsonLd, createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Methodology and Trust",
  description:
    "See how SocietyOS builds research briefs, simulates expert and audience perspectives, and where human validation still matters.",
  path: "/methodology",
});

const breadcrumbJsonLd = createBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Methodology", path: "/methodology" },
]);

export default function MethodologyLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      {children}
    </>
  );
}
