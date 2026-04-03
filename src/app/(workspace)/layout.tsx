import type { Metadata } from "next";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceShell>{children}</WorkspaceShell>
  );
}
