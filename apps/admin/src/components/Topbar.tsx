"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLogout, useGetIdentity } from "@refinedev/core";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Bell, LogOut, Search, User, Sun, Moon, Menu, Settings, ChevronDown, X,
} from "lucide-react";
import { MobileDrawer } from "./MobileDrawer";
import { Sidebar } from "./Sidebar";

export function Topbar() {
  const router = useRouter();
  const { data: user } = useGetIdentity<any>();
  const { mutate: logoutMutate } = useLogout();
  const { theme, toggle: toggleTheme } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = (q: string) => {
    if (q.trim()) router.push(`/products?q=${encodeURIComponent(q.trim())}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <>
      <MobileDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
        <Sidebar noHeader />
      </MobileDrawer>

      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-mist bg-panel/80 backdrop-blur-md px-3 py-2.5 lg:px-6 lg:py-3">
        {/* Left: mobile hamburger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-mist bg-canvas hover:bg-accent-soft transition lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Search: desktop */}
          {searchOpen ? (
            <div className="hidden md:flex items-center gap-2 rounded-lg border border-mist bg-canvas px-3 py-1.5 text-sm animate-scale-in">
              <Search className="h-4 w-4 text-text-muted shrink-0" />
              <input
                type="search"
                placeholder="Search products, orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch(searchQuery);
                  if (e.key === "Escape") setSearchOpen(false);
                }}
                className="w-48 lg:w-64 bg-transparent text-sm text-ink outline-none"
                autoFocus
              />
              <button onClick={() => setSearchOpen(false)} className="text-text-muted hover:text-ink">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 rounded-lg border border-mist bg-canvas px-3 py-1.5 text-sm text-text-muted hover:text-ink hover:border-ink/20 transition"
            >
              <Search className="h-4 w-4" />
              <span className="hidden lg:inline">Search...</span>
              <kbd className="rounded border border-mist px-1 py-0.5 text-[10px] leading-none">⌘K</kbd>
            </button>
          )}

          {/* Mobile search button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-mist bg-canvas hover:bg-accent-soft transition"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 lg:gap-2">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-mist bg-canvas hover:bg-accent-soft transition"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-mist bg-canvas hover:bg-accent-soft transition"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>
            {notifOpen && (
              <div className="fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 rounded-xl border border-mist bg-panel shadow-dialog animate-scale-in z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-mist">
                  <p className="text-sm font-semibold text-ink">Notifications</p>
                  <button onClick={() => setNotifOpen(false)} className="text-text-muted hover:text-ink transition p-1 rounded-lg hover:bg-accent-soft sm:hidden" aria-label="Close notifications">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-6 text-center text-sm text-text-muted">
                  <p>No new notifications</p>
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-lg border border-mist bg-canvas px-2 py-1.5 hover:bg-accent-soft transition"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-xs font-semibold text-ink">
                {(user?.name ?? user?.email ?? "A")[0].toUpperCase()}
              </div>
              <span className="hidden text-sm font-medium text-ink sm:inline max-w-[80px] truncate">
                {user?.name ?? "Admin"}
              </span>
              <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-text-muted" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-mist bg-panel shadow-dialog animate-scale-in overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-mist">
                  <p className="text-sm font-medium text-ink truncate">{user?.name ?? "Admin"}</p>
                  <p className="text-xs text-text-muted mt-0.5 truncate">{user?.email ?? ""}</p>
                </div>
                <div className="p-1.5">
                  <button onClick={() => { router.push("/settings"); setUserMenuOpen(false); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink hover:bg-accent-soft transition"
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </button>
                  <button onClick={() => { logoutMutate(); setUserMenuOpen(false); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/5 transition"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-overlay pt-16 px-4 md:hidden">
          <div className="w-full max-w-md rounded-xl border border-mist bg-panel shadow-dialog animate-scale-in overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-mist">
              <Search className="h-4 w-4 text-text-muted shrink-0" />
              <input
                type="search"
                placeholder="Search products, orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(searchQuery); }}
                className="flex-1 bg-transparent text-sm text-ink outline-none"
                autoFocus
              />
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-text-muted hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 text-center text-sm text-text-muted">
              Search products by name or orders by phone
            </div>
          </div>
        </div>
      )}
    </>
  );
}
