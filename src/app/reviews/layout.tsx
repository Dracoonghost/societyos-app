import type { ReactNode } from "react";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata = createNoIndexMetadata(
  "Reviews",
  "Private SocietyOS review workflow.",
);

export default function ReviewsLayout({ children }: { children: ReactNode }) {
  return children;
}
