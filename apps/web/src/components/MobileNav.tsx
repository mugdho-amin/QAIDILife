"use client";

import Link from "next/link";
import { Grid2X2, Home, MessageCircle, ShoppingBag, User } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const whatsappNumber =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "8801700000000";

/** Props for the mobile bottom navigation. */
export interface MobileNavProps {
  /** Current cart item count. */
  cartCount: number;
  /** Active route label. */
  active?: "home" | "categories" | "cart" | "whatsapp" | "login";
}

/** Sticky mobile bottom navigation bar. */
export function MobileNav({ cartCount, active }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-mist bg-canvas sm:hidden">
      <div className="grid grid-cols-5 items-center">
        <NavItem
          href="/products"
          label="Category"
          icon={<Grid2X2 className="h-5 w-5" />}
          active={active === "categories"}
        />
        <NavItem
          href={`https://wa.me/${whatsappNumber}`}
          label="Contact"
          icon={<MessageCircle className="h-5 w-5" />}
          active={active === "whatsapp"}
        />
        <div className="flex items-center justify-center">
          <Link
            href="/"
            className="relative -mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#b07a5a] text-white shadow-lg"
            aria-label="Home"
          >
            <Home className="h-5 w-5" />
          </Link>
        </div>
        <NavItem
          href="/checkout"
          label="Cart"
          icon={<ShoppingBag className="h-5 w-5" />}
          active={active === "cart"}
          badge={cartCount}
        />
        <NavItem
          href="/login"
          label="Login"
          icon={<User className="h-5 w-5" />}
          active={active === "login"}
        />
      </div>
    </nav>
  );
}

/** Props for a single nav item. */
interface NavItemProps {
  /** Destination URL. */
  href: string;
  /** Label text. */
  label: string;
  /** Icon element. */
  icon: ReactNode;
  /** Active state. */
  active?: boolean;
  /** Optional badge count. */
  badge?: number;
}

/** Render a single nav item. */
function NavItem({ href, label, icon, active, badge }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex flex-col items-center gap-1 py-3 text-[11px] uppercase tracking-[0.22em]",
        active ? "text-ink" : "text-ink/60",
      )}
    >
      {icon}
      <span>{label}</span>
      {badge && badge > 0 ? (
        <span className="absolute right-6 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[10px] text-canvas">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
