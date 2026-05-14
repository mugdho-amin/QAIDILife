"use client";

import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { useCartCount } from "@/hooks/useCart";

/** Shared shell for simple content pages. */
export function StaticPage({
  title,
  breadcrumb,
  children,
  active,
}: {
  title: string;
  breadcrumb: string;
  children?: ReactNode;
  active?: "home" | "categories" | "cart" | "whatsapp" | "login";
}) {
  const cartCount = useCartCount();

  return (
    <div className="min-h-screen pb-24">
      <Header />
      <main className="px-4 py-12 sm:px-6">
        <div className="mx-auto w-full max-w-[1400px] space-y-4">
          <div className="text-sm text-ink/60">
            <span className="text-ink">Home</span> &gt; {breadcrumb}
          </div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {children ? (
            <div className="text-sm leading-7 text-ink/70">{children}</div>
          ) : null}
        </div>
      </main>
      <Footer />
      <MobileNav cartCount={cartCount} active={active} />
    </div>
  );
}
