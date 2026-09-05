import { useEffect } from "react";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";
import { useAuth, useClerk } from "@clerk/clerk-react";

import Copyright from "@/sections/auth/Copyright";
import { satelliteReturnUrl } from "@/utils/clerk-satellite";

/**
 * Satellite auth must run on the ACCESS primary. Do not embed Clerk SignIn /
 * SignUp widgets here — buildSignInUrl / buildSignUpUrl append the Clerk sync
 * handshake so the session is recognized when the user returns.
 */
export default function SatelliteAuthRedirect({
  mode,
  next,
  title,
  subtitle,
  message,
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const { buildSignInUrl, buildSignUpUrl } = useClerk();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      navigate(next, { replace: true });
      return;
    }

    const redirectUrl = satelliteReturnUrl(window.location.origin, next);
    const destination =
      mode === "signup"
        ? buildSignUpUrl({ redirectUrl })
        : buildSignInUrl({ redirectUrl });
    window.location.assign(destination);
  }, [
    isLoaded,
    isSignedIn,
    mode,
    next,
    navigate,
    buildSignInUrl,
    buildSignUpUrl,
  ]);

  return (
    <Stack
      sx={{
        height: 1,
        alignItems: "center",
        justifyContent: "space-between",
        gap: 3,
      }}
    >
      <Box sx={{ width: 1, maxWidth: 458 }}>
        <Stack
          sx={{
            gap: { xs: 1, sm: 1.5 },
            textAlign: "center",
            mb: { xs: 3, sm: 5 },
          }}
        >
          <Typography variant="h1">{title}</Typography>
          <Typography variant="body1" color="text.secondary">
            {subtitle}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        </Stack>
      </Box>

      <Copyright />
    </Stack>
  );
}
