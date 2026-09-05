import { useEffect, useState } from "react";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSignIn } from "@clerk/clerk-react";
import Copyright from "@/sections/auth/Copyright";
import { safeNextPath } from "@/utils/safe-next";
import { consumeClerkTicket } from "@/utils/consume-clerk-ticket";

/**
 * Consumes a one-time Clerk sign-in token minted by ACCESS after Google /
 * magic-link on getaccess.world. Do not auto-bounce to ACCESS from here.
 */
export default function AuthTicket() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const next = safeNextPath(params.get("next"), "/dashboard");
  const ticket = params.get("ticket") || params.get("__clerk_ticket");

  useEffect(() => {
    if (!isLoaded) return;
    if (!ticket) {
      navigate(`/auth/login?next=${encodeURIComponent(next)}`, { replace: true });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const ok = await consumeClerkTicket({ signIn, setActive, ticket });
        if (cancelled) return;
        if (ok) {
          navigate(next, { replace: true });
          return;
        }
        setError("Sign in failed. Try again.");
      } catch {
        setError("Sign in failed. Try again.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, ticket, next, navigate, signIn, setActive]);

  return (
    <Stack
      sx={{
        height: 1,
        alignItems: "center",
        justifyContent: "space-between",
        gap: 3,
      }}
    >
      <Box sx={{ width: 1, maxWidth: 458, textAlign: "center" }}>
        <Typography variant="h1" sx={{ mb: 1.5 }}>
          Sign in
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {error || "Finishing sign in…"}
        </Typography>
        {error ? (
          <Button
            href={`/auth/login?next=${encodeURIComponent(next)}`}
            variant="contained"
            sx={{
              mt: 3,
              backgroundColor: "#002244",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#001B36" },
            }}
          >
            Try again
          </Button>
        ) : null}
      </Box>
      <Copyright />
    </Stack>
  );
}
