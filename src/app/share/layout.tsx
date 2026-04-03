import type { ReactNode } from "react";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata = createNoIndexMetadata(
  "Shared Report",
  "Read-only shared SocietyOS report.",
);

export default function ShareLayout({ children }: { children: ReactNode }) {
  return children;
}
