import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { createBreadcrumbJsonLd, createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Sample Outputs",
  description:
    "Review sample SocietyOS outputs, including a strategic review and an audience simulation, before starting your own workflow.",
  path: "/demo",
});

const breadcrumbJsonLd = createBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Sample Outputs", path: "/demo" },
]);

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      {children}
    </>
  );
}
