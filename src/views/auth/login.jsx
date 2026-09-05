// @mui
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

// @project
import Copyright from "@/sections/auth/Copyright";
import { accessSignInUrl, accessWaitlistUrl } from "@/utils/access-doors";

/***************************  AUTH - LOGIN  ***************************/

export default function Login() {
  const signInHref = accessSignInUrl();
  const waitlistHref = accessWaitlistUrl();

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
            JD Productions uses ACCESS for identity — the same account as
            JYSON and the rest of the network.
          </Typography>
        </Stack>

        <Button
          href={signInHref}
          variant="contained"
          fullWidth
          size="large"
          sx={{
            backgroundColor: "#002244",
            textTransform: "none",
            fontSize: "15px",
            fontWeight: 600,
            py: 1.5,
            borderRadius: "10px",
            "&:hover": { backgroundColor: "#001B36" },
          }}
        >
          Sign in with ACCESS
        </Button>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 3, textAlign: "center" }}
        >
          New here?{" "}
          <Link href={waitlistHref} underline="hover">
            Request access
          </Link>
        </Typography>
      </Box>

      <Copyright />
    </Stack>
  );
}
