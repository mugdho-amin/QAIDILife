"use client";

import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/AdminShell";
import { PageHeader } from "@/components/PageHeader";

/** Settings page for admin console. */
export default function SettingsPage() {
  return (
    <AdminGate>
      <AdminShell>
        <PageHeader
          title="Settings"
          subtitle="Admin access, environment values, and app shells."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-mist bg-panel p-6 shadow-panel">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink">
              Admin Access
            </h3>
            <p className="mt-3 text-sm text-ink/60">
              Configure the primary admin credentials in the API environment
              variables.
            </p>
            <div className="mt-4 rounded-2xl bg-canvas p-4 text-xs text-ink/70">
              ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_JWT_SECRET
            </div>
          </section>
          <section className="rounded-3xl border border-mist bg-panel p-6 shadow-panel">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink">
              Mobile Shells
            </h3>
            <p className="mt-3 text-sm text-ink/60">
              Use Capacitor to package this admin panel for Android and iOS. For
              Windows, install the PWA.
            </p>
            <div className="mt-4 rounded-2xl bg-canvas p-4 text-xs text-ink/70">
              pnpm cap:sync, pnpm cap:android, pnpm cap:ios
            </div>
          </section>
        </div>
      </AdminShell>
    </AdminGate>
  );
}
