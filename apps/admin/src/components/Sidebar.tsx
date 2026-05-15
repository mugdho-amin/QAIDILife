"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Package, ScrollText, Settings, Shapes, Wallet,
  ChevronDown, Tags, PanelLeftClose, PanelLeft,
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

export function Sidebar({ noHeader }: { noHeader?: boolean } = { noHeader: false }) {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();
  const [expanded, setExpanded] = useState<string | null>("Catalog");

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out relative h-full",
        collapsed ? "w-16 lg:w-16" : "w-64",
      )}
    >
      <style>{`
        .sidebar-nav::-webkit-scrollbar { width: 3px; }
        .sidebar-nav::-webkit-scrollbar-thumb { background: transparent; border-radius: 2px; }
        .sidebar-nav:hover::-webkit-scrollbar-thumb { background: var(--border); }
      `}</style>

      {!noHeader && (
        <div className={cn("flex items-center border-b border-sidebar-border", collapsed ? "justify-center py-6" : "px-6 py-6")}>
          <button
            onClick={toggle}
            className="flex items-center justify-center rounded-xl hover:bg-sidebar-accent transition p-2"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4 text-sidebar-foreground" />
            ) : (
              <PanelLeftClose className="h-4 w-4 text-sidebar-foreground" />
            )}
          </button>
          {!collapsed && (
            <div className="ml-3">
              <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground">QAIDILIFE</div>
              <div className="mt-1 text-lg font-semibold tracking-[0.2em] text-foreground font-display">Admin</div>
            </div>
          )}
        </div>
      )}

      <nav className="sidebar-nav flex-1 overflow-y-auto px-2 py-3 space-y-1">
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
                        hasActiveChild
                          ? "bg-foreground/10 text-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent",
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                    </button>
                    <div className="absolute left-full top-0 ml-2 px-3 py-2 rounded-xl bg-foreground text-background text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg">
                      {item.label}
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setExpanded(open ? null : item.label)}
                      className={cn(
                        "flex items-center transition-all duration-200 rounded-xl w-full gap-3 px-3 py-2.5 text-sm relative",
                        hasActiveChild
                          ? "bg-foreground/10 text-foreground font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent",
                      )}
                    >
                      {hasActiveChild && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-foreground/30" />}
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                      <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-200 ml-auto", open && "rotate-180")} />
                    </button>
                    <div className={cn("overflow-hidden transition-all duration-200", open ? "max-h-96 opacity-100 mt-0.5" : "max-h-0 opacity-0")}>
                      <div className="ml-2 space-y-0.5 border-l border-sidebar-border pl-3">
                        {item.children.map((child) => (
                          <Link key={child.href} href={child.href}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 relative",
                              isActive(child.href)
                                ? "bg-foreground/10 text-foreground font-medium"
                                : "text-sidebar-foreground hover:bg-sidebar-accent",
                            )}
                          >
                            {isActive(child.href) && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-foreground/30" />}
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
                    "flex items-center transition-all duration-200 rounded-xl relative",
                    collapsed
                      ? "justify-center p-2.5 mx-auto"
                      : "gap-3 px-3 py-2.5 text-sm",
                    active
                      ? "bg-foreground/10 text-foreground font-medium shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                  )}
                >
                  {active && !collapsed && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-foreground/30" />}
                  <item.icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
                  {!collapsed && item.label}
                </Link>
                {collapsed && (
                  <div className="absolute left-full top-0 ml-2 px-3 py-2 rounded-xl bg-foreground text-background text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg pointer-events-none">
                    {item.label}
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}
      </nav>

      <div className={cn("border-t border-sidebar-border py-4 text-xs text-muted-foreground", collapsed ? "text-center px-0" : "px-6")}>
        {collapsed ? "v2" : "v2.0 Enterprise Console"}
      </div>
    </aside>
  );
}
