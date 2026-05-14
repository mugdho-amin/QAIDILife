import Image from "next/image";
import Link from "next/link";

/** Homepage hero section with CTA. */
export function Hero() {
  const heroImage =
    process.env.NEXT_PUBLIC_HERO_IMAGE ?? "/images/banners/hero-lifestyle.svg";

  return (
    <section className="relative h-[70vh] w-full overflow-hidden bg-mist sm:h-[80vh]">
      <Image
        src={heroImage}
        alt="QAIDILife Lifestyle"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      <div className="absolute bottom-10 left-4 right-4 sm:left-12">
        <div className="max-w-none space-y-4 text-canvas">
          <p className="text-xs uppercase tracking-[0.4em]">New Drop</p>
          <h1 className="text-3xl font-semibold uppercase tracking-[0.2em] sm:text-5xl">
            Shadow Collection
          </h1>
          <Link
            href="/products"
            className="inline-flex h-12 items-center justify-center rounded-full bg-canvas px-6 text-xs uppercase tracking-[0.3em] text-ink"
          >
            Shop New Drop
          </Link>
        </div>
      </div>
    </section>
  );
}
