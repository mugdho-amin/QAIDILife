"use client";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { useCartCount } from "@/hooks/useCart";

/** Login page styled like ARJO. */
export default function LoginPage() {
  const cartCount = useCartCount();

  return (
    <div className="min-h-screen pb-24">
      <Header />
      <main className="px-4 py-12 sm:px-6">
        <div className="mx-auto w-full max-w-[1400px]">
          <div className="mb-6 text-sm text-ink/60">
            <span className="text-ink">Home</span> &gt; Sign in
          </div>
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <div className="mt-8 max-w-md space-y-5">
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-ink/60">
                Username or Email
              </label>
              <input
                type="text"
                placeholder="Username or email"
                className="mt-3 h-11 w-full rounded border border-[#e5dfd9] px-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-ink/60">
                Password
              </label>
              <input
                type="password"
                placeholder="Password"
                className="mt-3 h-11 w-full rounded border border-[#e5dfd9] px-3 text-sm"
              />
            </div>
            <label className="flex items-center gap-3 text-sm text-ink/70">
              <input type="checkbox" className="h-4 w-4" />
              Remember me
            </label>
            <button className="h-11 w-full rounded bg-ink text-xs uppercase tracking-[0.3em] text-white">
              Sign in
            </button>
            <div className="text-sm text-ink/60">Forgot your password?</div>
          </div>
        </div>
      </main>
      <Footer />
      <MobileNav cartCount={cartCount} active="login" />
    </div>
  );
}
