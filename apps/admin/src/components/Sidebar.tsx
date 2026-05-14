"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Package, ScrollText, Settings, Shapes, Wallet,
  ChevronDown, Tags, PanelLeftClose, PanelLeft, ChevronLeft,
} from "lucide-react";
import { useState } from "react";
import { useSidebar } from "@/contexts/SidebarContext";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  {
    label: "Catalog", icon: Tags,
    children: [
      { href: "/products", label: "Products", icon: Package },
      { href: "/categories", label: "Categories", icon: Shapes },
    ],
  },
  { href: "/orders", label: "Orders", icon: ScrollText },
  { href: "/payments", label: "Payments", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ noHeader }: { noHeader?: boolean } = {}) {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();
  const [expanded, setExpanded] = useState<string | null>("Catalog");

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-mist bg-sidebar transition-all duration-300 ease-in-out relative",
        collapsed ? "w-16 lg:w-16" : "w-64",
      )}
    >
      {!noHeader && (
        <div className={cn("flex items-center border-b border-mist", collapsed ? "justify-center py-6" : "px-6 py-6")}>
          <button
            onClick={toggle}
            className="flex items-center justify-center rounded-xl hover:bg-sidebar-hover transition p-2"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4 text-sidebar-text" />
            ) : (
              <PanelLeftClose className="h-4 w-4 text-sidebar-text" />
            )}
          </button>
          {!collapsed && (
            <div className="ml-3">
              <div className="text-xs uppercase tracking-[0.4em] text-text-muted">QAIDILIFE</div>
              <div className="mt-1 text-lg font-semibold tracking-[0.2em] text-ink font-display">Admin</div>
            </div>
          )}
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {navItems.map((item) => {
          if ("children" in item && item.children) {
            const open = expanded === item.label;
            const hasActiveChild = item.children.some((c) => isActive(c.href));
            return (
              <div key={item.label}>
                {collapsed ? (
                  <div className="relative group">
                    <button
                      onClick={() => setExpanded(open ? null : item.label)}
                      className={cn(
                        "flex w-full items-center justify-center rounded-xl p-2.5 transition-all duration-200 mx-auto",
                        hasActiveChild ? "bg-black text-white dark:bg-white dark:text-black" : "text-sidebar-text hover:bg-sidebar-hover",
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                    </button>
                    <div className="absolute left-full top-0 ml-2 px-3 py-2 rounded-xl bg-ink text-canvas text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg">
                      {item.label}
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setExpanded(open ? null : item.label)}
                      className={cn(
                        "flex items-center transition-all duration-200 rounded-xl w-full gap-3 px-3 py-2.5 text-sm",
                        hasActiveChild ? "bg-black text-white dark:bg-white dark:text-black font-medium" : "text-sidebar-text hover:bg-sidebar-hover",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                      <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-200 ml-auto", open && "rotate-180")} />
                    </button>
                    <div className={cn("overflow-hidden transition-all duration-200", open ? "max-h-96 opacity-100 mt-0.5" : "max-h-0 opacity-0")}>
                      <div className="ml-2 space-y-0.5 border-l border-mist pl-3">
                        {item.children.map((child) => (
                          <Link key={child.href} href={child.href}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                              isActive(child.href)
                                ? "bg-black text-white dark:bg-white dark:text-black font-medium"
                                : "text-sidebar-text hover:bg-sidebar-hover",
                            )}
                          >
                            <child.icon className="h-3.5 w-3.5 shrink-0" />
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          }
          if ("href" in item) {
            const active = isActive(item.href!, item.exact);
            return (
              <div key={item.href} className="relative group">
                <Link href={item.href!}
                  className={cn(
                    "flex items-center transition-all duration-200 rounded-xl",
                    collapsed
                      ? "justify-center p-2.5 mx-auto"
                      : "gap-3 px-3 py-2.5 text-sm",
                    active
                      ? "bg-black text-white dark:bg-white dark:text-black font-medium shadow-sm"
                      : "text-sidebar-text hover:bg-sidebar-hover",
                  )}
                >
                  <item.icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
                  {!collapsed && item.label}
                </Link>
                {collapsed && (
                  <div className="absolute left-full top-0 ml-2 px-3 py-2 rounded-xl bg-ink text-canvas text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg pointer-events-none">
                    {item.label}
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}
      </nav>

      <div className={cn("border-t border-mist py-4 text-xs text-text-muted", collapsed ? "text-center px-0" : "px-6")}>
        {collapsed ? "v2" : "v2.0 Enterprise Console"}
      </div>
    </aside>
  );
}
