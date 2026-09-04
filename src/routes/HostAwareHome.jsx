import { lazy } from "react";
import { Navigate } from "react-router-dom";

import Loadable from "@/components/Loadable";
import EarlySupportLayout from "@/layouts/EarlySupportLayout";
import { isInvestHost } from "@/utils/invest-host";

const Landing = Loadable(lazy(() => import("@/views/early-support/landing")));

/**
 * Host-aware `/`:
 * - invest.jdproductions.io (and www.invest.) → Early Support landing, no extra hop
 * - accounts.jdproductions.io (and everything else) → /dashboard (ProtectedAdmin)
 */
export default function HostAwareHome() {
  if (isInvestHost()) {
    return (
      <EarlySupportLayout>
        <Landing />
      </EarlySupportLayout>
    );
  }

  return <Navigate to="/dashboard" replace />;
}
