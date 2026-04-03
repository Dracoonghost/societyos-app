import type { ReactNode } from "react";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata = createNoIndexMetadata(
  "Simulations",
  "Private SocietyOS simulation workflow.",
);

export default function SimulationsLayout({ children }: { children: ReactNode }) {
  return children;
}
