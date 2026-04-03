"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/ui/sidebar";
import { Navbar } from "@/components/ui/navbar";

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-[var(--bg-0)]">
      <Sidebar user={user} onLogout={logout} />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden border-b border-[var(--border-subtle)] bg-[var(--bg-0)]">
          <Navbar user={user} onLogout={logout} />
        </div>

        <div className="flex-1 overflow-y-auto page-root dot-grid">{children}</div>
      </div>
    </div>
  );
}
