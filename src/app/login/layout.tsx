import type { ReactNode } from "react";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata = createNoIndexMetadata(
  "Login",
  "Access your SocietyOS workspace.",
);

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
