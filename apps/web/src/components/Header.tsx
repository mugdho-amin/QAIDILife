"use client";

import Link from "next/link";
import { Menu, Search, ShoppingCart, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { CartDrawer } from "@/components/CartDrawer";

const navItems = [
  { label: "T-Shirt", href: "/products?category=t-shirt" },
  {
    label: "Winter", href: "/products?category=winter",
    children: [
      { label: "Jacket", href: "/products?category=jacket" },
      { label: "Shacket", href: "/products?category=shacket" },
      { label: "OverShirt", href: "/products?category=overshirt" },
      { label: "Ribbed Knit Jacket", href: "/products?category=ribbed-knit" },
      { label: "Transit Jacket", href: "/products?category=transit-jacket" },
    ],
  },
  {
    label: "Shirts", href: "/products?category=shirts",
    children: [
      { label: "Classic Fit", href: "/products?category=classic-fit" },
      { label: "Slim Fit", href: "/products?category=slim-fit" },
      { label: "Q Ben collar", href: "/products?category=q-ben-collar" },
    ],
  },
  { label: "Knit Polos", href: "/products?category=knit-polos" },
  { label: "Pant", href: "/products?category=pant" },
  { label: "Panjabi", href: "/products?category=panjabi" },
  { label: "Katua", href: "/products?category=katua" },
];

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [showEmptyToast, setShowEmptyToast] = useState(false);
  const [hideTop, setHideTop] = useState(false);
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();

  const handleCartClick = () => {
    if (itemCount > 0) {
      setCartOpen(true);
    } else {
      setShowEmptyToast(true);
      setTimeout(() => setShowEmptyToast(false), 2000);
    }
  };

  useEffect(() => {
    const handleScroll = () => setHideTop(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-white">
      <div className="sm:hidden">
        <MobileHeader onSearch={() => setSearchOpen(true)} onCart={handleCartClick} cartCount={itemCount} wishlistCount={wishlistCount} />
      </div>
      <div className="hidden sm:block">
        <DesktopHeader hideTop={hideTop} onSearch={() => setSearchOpen(true)} onCart={handleCartClick} cartCount={itemCount} wishlistCount={wishlistCount} />
      </div>
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/30 pt-24" onClick={() => setSearchOpen(false)} role="presentation">
          <div className="flex w-[min(720px,90vw)] items-center gap-3 rounded-full bg-white px-5 py-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <Search className="h-4 w-4 text-ink/60" />
            <input type="search" placeholder="Search products..." autoFocus className="w-full text-sm outline-none" />
          </div>
        </div>
      )}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      {showEmptyToast && (
        <div className="fixed top-4 right-4 z-[100] w-72 pointer-events-none animate-slide-in-right">
          <div className="rounded-xl border border-mist bg-white px-4 py-3 text-sm text-ink shadow-lg">
            <p className="text-xs font-medium">Cart</p>
            <p className="text-xs text-ink/60 mt-0.5">Your cart is empty</p>
          </div>
        </div>
      )}
    </header>
  );
}

function MobileHeader({ onSearch, onCart, cartCount, wishlistCount }: { onSearch: () => void; onCart: () => void; cartCount: number; wishlistCount: number }) {
  return (
    <div className="border-b border-black/10">
      <div className="flex items-center justify-between px-4 py-2 text-[11px] text-ink/70">
        <div className="flex items-center gap-4">
          <Link href="/login">Sign in</Link>
          <Link href="/register">Register</Link>
        </div>
      </div>
      <div className="flex h-12 items-center justify-between px-4">
        <button aria-label="Open menu" className="flex h-9 w-9 items-center justify-center">
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/" className="text-lg font-semibold tracking-[0.4em]">QAIDILIFE</Link>
        <div className="flex items-center gap-2">
          <button aria-label="Wishlist" className="relative flex h-9 w-9 items-center justify-center">
            <Heart className="h-4 w-4" />
            {wishlistCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[9px] text-white">{wishlistCount}</span>}
          </button>
          <button aria-label="Cart" onClick={onCart} className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#e5dfd9]">
            <ShoppingCart className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ink text-[9px] text-white font-medium px-0.5">{cartCount}</span>
          </button>
          <button aria-label="Search" className="flex h-9 w-9 items-center justify-center" onClick={onSearch}>
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function DesktopHeader({ hideTop, onSearch, onCart, cartCount, wishlistCount }: { hideTop: boolean; onSearch: () => void; onCart: () => void; cartCount: number; wishlistCount: number }) {
  return (
    <div className="w-full">
      <div className={`border-b border-black/10 text-xs text-ink/70 transition-all duration-300 ${hideTop ? "max-h-0 -translate-y-4 opacity-0" : "max-h-10"}`}>
        <div className="mx-auto flex max-w-[1400px] items-center justify-end gap-4 px-6 py-2">
          <Link href="/login" className="hover:text-ink">Sign in</Link>
          <span className="text-black/20">|</span>
          <Link href="/register" className="hover:text-ink">Register</Link>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="text-2xl font-semibold tracking-[0.5em]">QAIDILIFE</Link>
        <nav className="flex flex-1 items-center justify-center gap-6 text-xs font-semibold uppercase tracking-[0.2em] text-ink/80">
          {navItems.map((item) => (
            <div key={item.label} className="relative group">
              <Link href={item.href} className="transition-opacity hover:opacity-60">{item.label}</Link>
              {item.children && (
                <div className="absolute left-0 top-full hidden min-w-[180px] rounded border border-[#e5dfd9] bg-white py-2 text-[11px] uppercase tracking-[0.18em] text-ink/70 shadow-lg group-hover:block">
                  {item.children.map((child) => (
                    <Link key={child.label} href={child.href} className="block px-4 py-2 hover:bg-[#f7f4f1]">{child.label}</Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button aria-label="Wishlist" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#e5dfd9] hover:bg-black/5 transition">
            <Heart className="h-4 w-4" />
            {wishlistCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[9px] text-white font-medium">{wishlistCount}</span>}
          </button>
          <button aria-label="Cart" onClick={onCart} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#e5dfd9] hover:bg-black/5 transition">
            <ShoppingCart className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ink text-[9px] text-white font-medium px-0.5">{cartCount}</span>
          </button>
          <button aria-label="Search" onClick={onSearch} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5dfd9] hover:bg-black/5 transition">
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
