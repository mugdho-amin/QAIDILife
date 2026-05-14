import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Hind_Siliguri, Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const hind = Hind_Siliguri({
  variable: "--font-hind",
  subsets: ["bengali", "latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://qaidilife.com",
  ),
  title: {
    default: "QAIDILife",
    template: "%s | QAIDILife",
  },
  description:
    "QAIDILife is a premium Bangladeshi clothing brand with minimalist, mobile-first shopping.",
  openGraph: {
    title: "QAIDILife",
    description:
      "Premium essentials for Bengali wardrobes. Minimal, bold, and built for mobile.",
    type: "website",
    locale: "bn_BD",
    url: "https://qaidilife.com",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "QAIDILife",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QAIDILife",
    description:
      "Premium essentials for Bengali wardrobes. Minimal, bold, and built for mobile.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
};

/** Root layout for QAIDILife storefront. */
export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="bn"
      className={`${inter.variable} ${hind.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-canvas text-ink font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
