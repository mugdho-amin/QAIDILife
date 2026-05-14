"use client";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { useCartCount } from "@/hooks/useCart";

/** About QAIDILife page. */
export default function AboutPage() {
  const cartCount = useCartCount();

  return (
    <div className="min-h-screen pb-24">
      <Header />
      <main className="px-4 py-12 sm:px-6">
        <div className="mx-auto w-full max-w-[1400px] space-y-4">
          <div className="text-sm text-ink/60">
            <span className="text-ink">Home</span> &gt; About Us
          </div>
          <h1 className="text-2xl font-semibold">About Us</h1>
          <p className="text-sm leading-7 text-ink/70">
            QAIDILife delivers premium essentials crafted for modern wardrobes,
            grounded in clean lines and a refined palette. We focus on everyday
            staples that feel elevated without losing comfort.
          </p>
        </div>
      </main>
      <Footer />
      <MobileNav cartCount={cartCount} />
    </div>
  );
}
