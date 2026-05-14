"use client";

import type { ReactNode } from "react";
import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router";
import { authProvider } from "@/lib/refine/auth-provider";
import { dataProvider } from "@/lib/refine/data-provider";
import { notificationProvider } from "@/lib/refine/notification-provider";

interface RefineProviderProps {
  children: ReactNode;
}

export function RefineProvider({ children }: RefineProviderProps) {
  return (
    <Refine
      routerProvider={routerProvider}
      authProvider={authProvider}
      dataProvider={dataProvider}
      notificationProvider={notificationProvider}
      resources={[
        {
          name: "catalog/products",
          list: "/products",
          create: "/products/new",
          edit: "/products/:id",
          meta: { parent: "Catalog" },
        },
        {
          name: "catalog/categories",
          list: "/categories",
          meta: { parent: "Catalog" },
        },
        {
          name: "orders",
          list: "/orders",
          show: "/orders/:id",
        },
        {
          name: "payments",
          list: "/payments",
        },
        {
          name: "settings",
          list: "/settings",
        },
      ]}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
        title: { text: "QAIDILife Admin", icon: undefined },
      }}
    >
      {children}
    </Refine>
  );
}
