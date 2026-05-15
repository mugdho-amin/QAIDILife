"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useIsAuthenticated } from "@refinedev/core";

interface AdminGateProps {
  children: ReactNode;
}

export function AdminGate({ children }: AdminGateProps) {
  const router = useRouter();
  const { data, isLoading } = useIsAuthenticated();

  useEffect(() => {
    if (!isLoading && !data?.authenticated) {
      router.push("/login");
    }
  }, [data, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
          <p className="text-sm text-muted-foreground">Loading console...</p>
        </div>
      </div>
    );
  }

  if (!data?.authenticated) return null;

  return <>{children}</>;
}
