import { lazy } from "react";
import { Navigate } from "react-router-dom";

import Loadable from "@/components/Loadable";
import EarlySupportLayout from "@/layouts/EarlySupportLayout";
import { investPathDestination } from "@/utils/invest-host";

const Landing = Loadable(lazy(() => import("@/views/early-support/landing")));
const Success = Loadable(lazy(() => import("@/views/early-support/success")));
const Terms = Loadable(lazy(() => import("@/views/early-support/terms")));
const Privacy = Loadable(lazy(() => import("@/views/early-support/privacy")));

const EarlySupportRoutes = {
  path: "/early-support",
  element: <EarlySupportLayout />,
  children: [
    { index: true, element: <Landing /> },
    { path: "success", element: <Success /> },
    { path: "terms", element: <Terms /> },
    { path: "privacy", element: <Privacy /> },
  ],
};

function InvestPathRedirect() {
  return <Navigate to={investPathDestination()} replace />;
}

/** `/invest` is not a separate page. */
export const InvestRedirect = {
  path: "/invest",
  element: <InvestPathRedirect />,
};

export default EarlySupportRoutes;

export default EarlySupportRoutes;
