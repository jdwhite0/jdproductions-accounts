import { useSearchParams } from "react-router-dom";

import { safeNextPath } from "@/utils/safe-next";
import SatelliteAuthRedirect from "@/views/auth/SatelliteAuthRedirect";

/***************************  AUTH - REGISTER  ***************************/

export default function Register() {
  const [params] = useSearchParams();
  const next = safeNextPath(params.get("next"), "/dashboard");

  return (
    <SatelliteAuthRedirect
      mode="signup"
      next={next}
      title="Create your account"
      subtitle="Get started with JD Productions."
      message="Redirecting to sign up…"
    />
  );
}
