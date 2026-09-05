// @mui
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

// @third-party
import { Navigate, Link as RouterLink, useSearchParams } from "react-router-dom";
import { SignUp, SignedIn } from "@clerk/clerk-react";

// @project
import Copyright from "@/sections/auth/Copyright";
import ClerkWidgetBoundary from "@/views/auth/ClerkWidgetBoundary";
import { safeNextPath } from "@/utils/safe-next";

const clerkAppearance = {
  variables: {
    colorPrimary: "#002244",
    colorText: "#1B1B1F",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "10px",
  },
  elements: {
    rootBox: { width: "100%" },
    cardBox: { width: "100%", boxShadow: "none" },
    card: {
      boxShadow: "none",
      border: "none",
      padding: 0,
      background: "transparent",
    },
    headerTitle: { display: "none" },
    headerSubtitle: { display: "none" },
    footer: { display: "none" },
    formButtonPrimary: {
      backgroundColor: "#002244",
      textTransform: "none",
      fontSize: "15px",
      fontWeight: 600,
      "&:hover": { backgroundColor: "#001B36" },
    },
    socialButtonsBlockButton: { borderRadius: "10px" },
  },
};

/***************************  AUTH - REGISTER  ***************************/

export default function Register() {
  const [params] = useSearchParams();
  const next = safeNextPath(params.get("next"), "/dashboard");

  return (
    <Stack
      sx={{
        height: 1,
        alignItems: "center",
        justifyContent: "space-between",
        gap: 3,
      }}
    >
      <SignedIn>
        <Navigate to={next} replace />
      </SignedIn>
      <Box sx={{ width: 1, maxWidth: 458 }}>
          <Stack
            sx={{
              gap: { xs: 1, sm: 1.5 },
              textAlign: "center",
              mb: { xs: 3, sm: 5 },
            }}
          >
            <Typography variant="h1">Create your account</Typography>
            <Typography variant="body1" color="text.secondary">
              First time here is fine. You can also create an account after
              Early Support.
            </Typography>
          </Stack>

          <ClerkWidgetBoundary>
          <SignUp
            routing="hash"
            signInUrl={`/auth/login?next=${encodeURIComponent(next)}`}
            fallbackRedirectUrl={next}
            forceRedirectUrl={next}
            appearance={clerkAppearance}
          />
          </ClerkWidgetBoundary>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 3, textAlign: "center" }}
          >
            Already have an account?{" "}
            <Link
              component={RouterLink}
              to={`/auth/login?next=${encodeURIComponent(next)}`}
              underline="hover"
            >
              Sign in
            </Link>
          </Typography>
        </Box>

      <Copyright />
    </Stack>
  );
}
