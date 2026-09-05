// @mui
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

// @third-party
import { Navigate, Link as RouterLink, useSearchParams } from "react-router-dom";
import { SignedIn } from "@clerk/clerk-react";

// @project
import Copyright from "@/sections/auth/Copyright";
import { accessSignInUrl, accessSignUpUrl } from "@/utils/access-doors";
import { safeNextPath } from "@/utils/safe-next";

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
            Create an account to track your Early Support.
          </Typography>
        </Stack>

        <Button
          href={accessSignUpUrl({ next })}
          variant="contained"
          fullWidth
          sx={{
            py: 1.4,
            backgroundColor: "#002244",
            textTransform: "none",
            fontSize: "15px",
            fontWeight: 600,
            borderRadius: "10px",
            "&:hover": { backgroundColor: "#001B36" },
          }}
        >
          Create an account
        </Button>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2, textAlign: "center" }}
        >
          We&apos;ll email a sign-in link, or you can continue with Google.
        </Typography>

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
