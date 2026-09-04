import { lazy } from "react";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

// @project
import Loadable from "@/components/Loadable";
import AdminLayout from "@/layouts/AdminLayout";
import HostAwareHome from "@/routes/HostAwareHome";
import RoleGuard from "@/routes/RoleGuard";

// Member views
const Overview = Loadable(lazy(() => import("@/views/member/overview")));
const Jyson = Loadable(lazy(() => import("@/views/member/jyson")));
const Products = Loadable(lazy(() => import("@/views/member/products")));
const TheMode = Loadable(lazy(() => import("@/views/member/the-mode")));
const Services = Loadable(lazy(() => import("@/views/member/services")));
const Concierge = Loadable(lazy(() => import("@/views/member/concierge")));
const Billing = Loadable(lazy(() => import("@/views/member/billing")));
const EmailPreferences = Loadable(
  lazy(() => import("@/views/member/email-preferences")),
);
const Account = Loadable(lazy(() => import("@/views/member/account")));
const Support = Loadable(lazy(() => import("@/views/member/support")));
const Changelog = Loadable(lazy(() => import("@/views/member/changelog")));
const PositionsPage = Loadable(lazy(() => import("@/views/member/positions")));
const AdminPositionsStub = Loadable(
  lazy(() => import("@/views/stubs/admin-positions")),
);

// Founder / admin views
const FounderOverview = Loadable(
  lazy(() => import("@/views/founder/overview")),
);
const FounderAccounts = Loadable(
  lazy(() => import("@/views/founder/accounts")),
);
const FounderSubscriptions = Loadable(
  lazy(() => import("@/views/founder/subscriptions")),
);
const FounderSystem = Loadable(lazy(() => import("@/views/founder/system")));

// Auth gate — only signed-in users reach the dashboard; others go to /auth/login
function ProtectedAdmin() {
  return (
    <>
      <SignedIn>
        <AdminLayout />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

const MainRoutes = {
  path: "/",
  children: [
    // invest. root → Early Support (no ProtectedAdmin). accounts. `/` → /dashboard.
    { index: true, element: <HostAwareHome /> },
    {
      element: <ProtectedAdmin />,
      children: [
        // Member
        { path: "dashboard", element: <Overview /> },
        { path: "jyson", element: <Jyson /> },
        { path: "products", element: <Products /> },
        { path: "the-mode", element: <TheMode /> },
        { path: "services", element: <Services /> },
        { path: "concierge", element: <Concierge /> },
        { path: "billing", element: <Billing /> },
        { path: "email-preferences", element: <EmailPreferences /> },
        { path: "account", element: <Account /> },
        { path: "positions", element: <PositionsPage /> },
        { path: "support", element: <Support /> },
        { path: "changelog", element: <Changelog /> },

        // Founder / admin (role-gated)
        {
          path: "admin",
          element: <RoleGuard />,
          children: [
            { index: true, element: <FounderOverview /> },
            { path: "accounts", element: <FounderAccounts /> },
            { path: "subscriptions", element: <FounderSubscriptions /> },
            { path: "system", element: <FounderSystem /> },
            { path: "positions", element: <AdminPositionsStub /> },
          ],
        },
      ],
    },
  ],
};

export default MainRoutes;
