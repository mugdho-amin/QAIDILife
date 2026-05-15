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
    <div className="h-screen bg-background text-foreground overflow-hidden">
      <div className="flex h-full">
        <div className="hidden lg:block h-full">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <Topbar />
          <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8 animate-fade-in">
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
