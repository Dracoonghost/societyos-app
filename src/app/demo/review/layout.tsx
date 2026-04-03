import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { createBreadcrumbJsonLd, createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Sample Strategic Review",
  description:
    "See a complete sample strategic review with research context, expert analysis, verdicts, and generated strategy artifacts.",
  path: "/demo/review",
});

const breadcrumbJsonLd = createBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Sample Outputs", path: "/demo" },
  { name: "Sample Strategic Review", path: "/demo/review" },
]);

export default function DemoReviewLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      {children}
    </>
  );
}
