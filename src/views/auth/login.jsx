import { useSearchParams } from "react-router-dom";

import { safeNextPath } from "@/utils/safe-next";
import SatelliteAuthRedirect from "@/views/auth/SatelliteAuthRedirect";

/***************************  AUTH - LOGIN  ***************************/

export default function Login() {
  const [params] = useSearchParams();
  const next = safeNextPath(params.get("next"), "/dashboard");

  return (
    <SatelliteAuthRedirect
      mode="signin"
      next={next}
      title="Sign in"
      subtitle="Welcome back to JD Productions."
      message="Redirecting to sign in…"
    />
  );
}
