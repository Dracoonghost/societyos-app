"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface BillingPlan {
  id: string;
  name: string;
  price_usd: number;
  billing_cycle: string;
  monthly_credits: number;
  credit_rollover: boolean;
  features: string[];
}

export interface UserBilling {
  plan_id: string;
  plan_name: string;
  plan_status: string;
  credits_remaining: number;
  credits_used_this_period: number;
  period_start: string | null;
  period_end: string | null;
}

interface BillingContextType {
  billing: UserBilling | null;
  loading: boolean;
  refreshBilling: () => Promise<void>;
}

const BillingContext = createContext<BillingContextType | null>(null);

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const { user, getIdToken } = useAuth();
  const [billing, setBilling] = useState<UserBilling | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshBilling = useCallback(async () => {
    if (!user) { setBilling(null); return; }
    const token = await getIdToken();
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/billing/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBilling(data.billing);
      }
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [user, getIdToken]);

  useEffect(() => {
    refreshBilling();
  }, [refreshBilling]);

  return (
    <BillingContext.Provider value={{ billing, loading, refreshBilling }}>
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error("useBilling must be used within BillingProvider");
  return ctx;
}
