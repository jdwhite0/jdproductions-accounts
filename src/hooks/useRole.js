import { useUser } from "@clerk/clerk-react";
import { resolveRecruitingRole } from "../../lib/recruiting/roles.js";

/**
 * Role resolution for the JD Productions SaaS.
 * Founder/admin is granted via Clerk publicMetadata.role === 'admin'
 * (set in the Clerk dashboard or via the admin API). Everyone else is a member.
 * Recruiting staff are named with publicMetadata.recruitingRole. This hook only reads metadata.
 */
export default function useRole() {
  const { user, isLoaded } = useUser();
  const role = user?.publicMetadata?.role || "member";
  const isAdmin = role === "admin" || role === "founder";
  const entitlements = user?.publicMetadata?.entitlements || {};
  const recruitingRole = resolveRecruitingRole(user?.publicMetadata || null);
  const canRecruit = Boolean(recruitingRole);
  return {
    isLoaded,
    role,
    isAdmin,
    entitlements,
    user,
    recruitingRole,
    canRecruit,
  };
}
