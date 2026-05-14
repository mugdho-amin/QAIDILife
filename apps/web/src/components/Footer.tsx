"use client";

import Link from "next/link";

/** QAIDILife footer styled to match the reference layout. */
export function Footer() {
  return (
    <footer className="mt-16 border-t border-mist bg-[#f7f4f1]">
      <div className="mx-auto max-w-[1400px] px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div className="space-y-4 text-sm text-ink/70">
            <Link
              href="/"
              className="text-xl font-semibold tracking-[0.5em] text-ink"
            >
              QAIDILIFE
            </Link>
            <div className="text-sm font-semibold">Hotline Free 24/7:</div>
            <div className="text-lg font-semibold text-ink">+8809611900372</div>
            <div className="space-y-2 text-sm">
              <div className="font-semibold">OUTLET</div>
              <div>Banani: Level 3, House 45, Road 11, Banani</div>
              <div>Mirpur 1: Level 4, Rupayan Latifa Shamsuddin Square, Mirpur -1
                (Opposite of Sony Square)</div>
            </div>
            <div>Email: info@arjobd.com</div>
            <div>Phone: +8809611900371</div>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/80">
              Information & Services
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-ink/70">
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/about">About Us</Link>
              </li>
              <li>
                <Link href="/contact">Contact Us</Link>
              </li>
              <li>
                <Link href="/blog">Blog</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/80">
              My Account & Payments
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-ink/70">
              <li>
                <Link href="/community-guidelines">Community Guidelines</Link>
              </li>
              <li>
                <Link href="/privacy-policy">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms">Terms and Conditions</Link>
              </li>
              <li>
                <Link href="/refund-policy">Refund & Return Policy</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/80">
              Sign Up For Newsletter
            </h4>
            <div className="mt-4 flex gap-2">
              <input
                type="email"
                placeholder="Your Email Address..."
                className="h-11 flex-1 rounded border border-[#e5dfd9] bg-white px-3 text-sm"
              />
              <button className="h-11 rounded bg-[#1f1f1f] px-4 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                Subscribe
              </button>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-[#e5dfd9] pt-4 text-xs text-ink/60">
          Copyright {"\u00A9"} {new Date().getFullYear()}, QAIDILIFE All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
