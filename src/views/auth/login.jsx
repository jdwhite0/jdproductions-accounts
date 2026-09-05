// @mui
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

// @third-party
import { useSearchParams } from "react-router-dom";
import { SignIn } from "@clerk/clerk-react";

// @project
import Copyright from "@/sections/auth/Copyright";
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

/***************************  AUTH - LOGIN  ***************************/

export default function Login() {
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
      <Box sx={{ width: 1, maxWidth: 458 }}>
        <Stack
          sx={{
            gap: { xs: 1, sm: 1.5 },
            textAlign: "center",
            mb: { xs: 3, sm: 5 },
          }}
        >
          <Typography variant="h1">Sign in</Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back to JD Productions.
          </Typography>
        </Stack>

        <SignIn
          routing="hash"
          signUpUrl={`/auth/register?next=${encodeURIComponent(next)}`}
          fallbackRedirectUrl={next}
          appearance={clerkAppearance}
        />
      </Box>

      <Copyright />
    </Stack>
  );
}
