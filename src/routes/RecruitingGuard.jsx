import { Navigate, Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import useRole from "@/hooks/useRole";

/** Signed-in recruiting staff. Founder/admin resolve as platform admin. Members do not. */
export default function RecruitingGuard() {
  const { isLoaded, canRecruit } = useRole();
  if (!isLoaded) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  return canRecruit ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
