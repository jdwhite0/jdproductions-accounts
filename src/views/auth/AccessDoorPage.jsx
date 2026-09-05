import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Copyright from "@/sections/auth/Copyright";
import { accessSignInUrl, accessSignUpUrl } from "@/utils/access-doors";
import { safeNextPath } from "@/utils/safe-next";

/**
 * Thin Accounts auth door. Magic-link cannot complete on this origin
 * (Clerk instance domain is getaccess.world only). Send users to ACCESS
 * with redirect_url back here. Do not embed Clerk email-link widgets.
 */
export default function AccessDoorPage({ mode = "sign-in" }) {
  const [params] = useSearchParams();
  const next = safeNextPath(params.get("next"), "/dashboard");
  const doorHref =
    mode === "sign-up"
      ? accessSignUpUrl({ next })
      : accessSignInUrl({ next });
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const isSignUp = mode === "sign-up";

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      navigate(next, { replace: true });
      return;
    }
    window.location.replace(doorHref);
  }, [doorHref, isLoaded, isSignedIn, navigate, next]);

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
          <Typography variant="h1">
            {isSignUp ? "Create your account" : "Sign in"}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Continue to ACCESS to {isSignUp ? "create your account" : "sign in"}.
            Your session returns here.
          </Typography>
        </Stack>

        <Button
          href={doorHref}
          variant="contained"
          fullWidth
          sx={{
            bgcolor: "#002244",
            textTransform: "none",
            fontSize: "15px",
            fontWeight: 600,
            py: 1.25,
            "&:hover": { bgcolor: "#001B36" },
          }}
        >
          Continue to sign {isSignUp ? "up" : "in"}
        </Button>
      </Box>

      <Copyright />
    </Stack>
  );
}
