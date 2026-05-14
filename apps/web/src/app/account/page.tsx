"use client";

import { StaticPage } from "@/components/StaticPage";

/** My account placeholder. */
export default function AccountPage() {
  return (
    <StaticPage title="My Account" breadcrumb="My Account">
      Manage your profile, orders, and addresses here once authentication is
      enabled.
    </StaticPage>
  );
}
