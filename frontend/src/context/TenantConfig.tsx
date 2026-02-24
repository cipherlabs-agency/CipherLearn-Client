"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { getTenantSlug } from "@/utils/subdomain";

// ============================================================
// Types
// ============================================================

export interface TenantFeatures {
  qrAttendance: boolean;
  assignments: boolean;
  fees: boolean;
  studyMaterials: boolean;
  announcements: boolean;
  videos: boolean;
}

export interface TenantConfig {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  logoInitials: string;
  primaryColor: string;
  accentColor: string;
  contactEmail: string;
  subscriptionStatus:
    | "ACTIVE"
    | "TRIAL"
    | "SUSPENDED"
    | "CANCELLED"
    | "EXPIRED";
  features: TenantFeatures;
}

type TenantState =
  | { status: "loading" }
  | { status: "found"; config: TenantConfig }
  | { status: "not_found" }
  | { status: "suspended"; config: TenantConfig }
  | { status: "expired"; config: TenantConfig };

const TenantConfigContext = createContext<TenantConfig | null>(null);

// ============================================================
// Status Pages (inline — keeps bundle small)
// ============================================================

function TenantNotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="text-center max-w-md space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto text-3xl">
          🔍
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Organization not found
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          We couldn&apos;t find the organization you&apos;re looking for. Please
          check the URL or contact your administrator.
        </p>
        <p className="text-sm text-muted-foreground">
          If you believe this is an error, please reach out to{" "}
          <a
            href="mailto:support@cipherlearn.com"
            className="text-primary underline underline-offset-2"
          >
            support@cipherlearn.com
          </a>
        </p>
      </div>
    </div>
  );
}

function TenantSuspendedPage({ config }: { config: TenantConfig }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="text-center max-w-md space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto text-3xl">
          ⚠️
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Account Suspended
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          <strong>{config.name}</strong>&apos;s account has been temporarily
          suspended. Please contact your administrator for assistance.
        </p>
        <a
          href={`mailto:${config.contactEmail}`}
          className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
        >
          Contact Administrator
        </a>
      </div>
    </div>
  );
}

function TenantExpiredPage({ config }: { config: TenantConfig }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="text-center max-w-md space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto text-3xl">
          📅
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Subscription Expired
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          <strong>{config.name}</strong>&apos;s subscription has expired.
          Please renew your plan to continue using CipherLearn.
        </p>
        <a
          href={`mailto:${config.contactEmail}`}
          className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
        >
          Contact Administrator
        </a>
      </div>
    </div>
  );
}

// ============================================================
// Provider
// ============================================================

export function TenantConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<TenantState>({ status: "loading" });

  const fetchTenantConfig = useCallback(async () => {
    try {
      const slug = getTenantSlug();
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${baseUrl}/tenant/config?slug=${slug}`);

      if (!res.ok) {
        if (res.status === 404) {
          setState({ status: "not_found" });
          return;
        }
        // On other errors (5xx), fall through to not_found
        setState({ status: "not_found" });
        return;
      }

      const json = await res.json();
      if (!json.success || !json.data) {
        setState({ status: "not_found" });
        return;
      }

      const config: TenantConfig = json.data;

      if (config.subscriptionStatus === "SUSPENDED") {
        setState({ status: "suspended", config });
        return;
      }

      if (
        config.subscriptionStatus === "EXPIRED" ||
        config.subscriptionStatus === "CANCELLED"
      ) {
        setState({ status: "expired", config });
        return;
      }

      // Inject tenant CSS variables
      if (typeof document !== "undefined") {
        document.documentElement.style.setProperty(
          "--tenant-primary",
          config.primaryColor
        );
        document.documentElement.style.setProperty(
          "--tenant-accent",
          config.accentColor
        );
      }

      setState({ status: "found", config });
    } catch {
      // Network error — don't block the app in dev mode
      const isDev =
        process.env.NODE_ENV === "development" ||
        process.env.NEXT_PUBLIC_TENANT_SLUG === "default";

      if (isDev) {
        // In dev, render with a placeholder config so the app still loads
        const fallback: TenantConfig = {
          id: 1,
          name: process.env.NEXT_PUBLIC_APP_NAME || "CipherLearn",
          slug: "default",
          logo: null,
          logoInitials: "CL",
          primaryColor: "#0F766E",
          accentColor: "#F59E0B",
          contactEmail: "admin@cipherlearn.com",
          subscriptionStatus: "ACTIVE",
          features: {
            qrAttendance: true,
            assignments: true,
            fees: true,
            studyMaterials: true,
            announcements: true,
            videos: true,
          },
        };
        setState({ status: "found", config: fallback });
      } else {
        setState({ status: "not_found" });
      }
    }
  }, []);

  useEffect(() => {
    fetchTenantConfig();
  }, [fetchTenantConfig]);

  if (state.status === "loading") {
    return null; // or a full-page skeleton
  }

  if (state.status === "not_found") {
    return <TenantNotFoundPage />;
  }

  if (state.status === "suspended") {
    return <TenantSuspendedPage config={state.config} />;
  }

  if (state.status === "expired") {
    return <TenantExpiredPage config={state.config} />;
  }

  return (
    <TenantConfigContext.Provider value={state.config}>
      {children}
    </TenantConfigContext.Provider>
  );
}

// ============================================================
// Hooks
// ============================================================

export function useTenantConfig(): TenantConfig {
  const ctx = useContext(TenantConfigContext);
  if (!ctx) {
    throw new Error("useTenantConfig must be used inside TenantConfigProvider");
  }
  return ctx;
}
