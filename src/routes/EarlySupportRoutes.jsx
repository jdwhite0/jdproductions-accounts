import { lazy } from "react";
import { Navigate } from "react-router-dom";

import Loadable from "@/components/Loadable";
import EarlySupportLayout from "@/layouts/EarlySupportLayout";

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

export const InvestRedirect = {
  path: "/invest",
  element: <Navigate to="/early-support" replace />,
};

export default EarlySupportRoutes;
