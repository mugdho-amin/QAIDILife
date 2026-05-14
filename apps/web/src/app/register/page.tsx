"use client";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { useCartCount } from "@/hooks/useCart";

/** Register page styled like ARJO. */
export default function RegisterPage() {
  const cartCount = useCartCount();

  return (
    <div className="min-h-screen pb-24">
      <Header />
      <main className="px-4 py-12 sm:px-6">
        <div className="mx-auto w-full max-w-[1400px]">
          <div className="mb-6 text-sm text-ink/60">
            <span className="text-ink">Home</span> &gt; Register
          </div>
          <h1 className="text-2xl font-semibold">Register</h1>
          <div className="mt-8 max-w-md space-y-5">
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-ink/60">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
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
            <p className="text-sm text-ink/60">
              Your personal data will be used to support your experience
              throughout this website, to manage access to your account, and
              for other purposes described in our privacy policy.
            </p>
            <button className="h-11 w-full rounded bg-ink text-xs uppercase tracking-[0.3em] text-white">
              Register
            </button>
          </div>
        </div>
      </main>
      <Footer />
      <MobileNav cartCount={cartCount} active="login" />
    </div>
  );
}
