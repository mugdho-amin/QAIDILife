"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";

export interface AdminShellProps {
  children: ReactNode;
}

function ShellContent({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="flex min-h-screen">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <div className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
        )}>
          <Topbar />
          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8 animate-fade-in max-w-full overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <SidebarProvider>
      <ShellContent>{children}</ShellContent>
    </SidebarProvider>
  );
}

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}
