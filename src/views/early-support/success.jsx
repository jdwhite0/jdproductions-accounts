import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TitleBand from "./TitleBand";
import TermsStampLink from "./TermsStampLink";
import { FONT, GOLD, INK, NAVY, SECONDARY, esCardSx } from "./brand";
import { SUCCESS_SUBHEAD, THANK_YOU_COPY } from "../../../lib/early-support/copy.js";
import { earlySupportNavChrome } from "@/utils/early-support-nav";

export default function EarlySupportSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { isLoaded, isSignedIn } = useAuth();
  const { showSignedInChrome, showSignIn } = earlySupportNavChrome({
    isLoaded,
    isSignedIn,
  });

  return (
    <Box>
      <TitleBand
        eyebrow="Early Support"
        title="Thank you"
        subtitle={SUCCESS_SUBHEAD}
      />
      <Card variant="outlined" sx={{ ...esCardSx, maxWidth: 640 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Typography
            sx={{
              color: GOLD,
              fontFamily: FONT,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontSize: 12,
              mb: 1.5,
            }}
          >
            Receipt and invoice
          </Typography>
          <Typography
            sx={{
              color: INK,
              fontFamily: FONT,
              fontSize: 16,
              lineHeight: 1.7,
              mb: 2,
            }}
          >
            {THANK_YOU_COPY} Stripe will email a payment receipt. An itemized
            invoice (charge line plus included items, terms <TermsStampLink />)
            is sent after the payment is confirmed by webhook — not by this
            browser page alone. A position becomes active only after that
            confirmation.
          </Typography>
          {sessionId && (
            <Typography
              sx={{
                color: SECONDARY,
                fontSize: 13,
                mb: 2,
                wordBreak: "break-all",
              }}
            >
              Checkout reference: {sessionId}
            </Typography>
          )}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            {showSignIn ? (
              <>
              <Button
                component={RouterLink}
                to="/auth/register?next=/positions"
                variant="contained"
                sx={{
                  bgcolor: NAVY,
                  textTransform: "none",
                  fontWeight: 700,
                  "&:hover": { bgcolor: "#001B36" },
                }}
              >
                Create an account to track your support
              </Button>
              <Button
                component={RouterLink}
                to="/auth/login?next=/positions"
                variant="outlined"
                sx={{
                  borderColor: NAVY,
                  color: NAVY,
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                Sign in to claim
              </Button>
              </>
            ) : null}
            {showSignedInChrome ? (
              <Button
                component={RouterLink}
                to="/positions"
                variant="contained"
                sx={{
                  bgcolor: NAVY,
                  textTransform: "none",
                  fontWeight: 700,
                  "&:hover": { bgcolor: "#001B36" },
                }}
              >
                View your Positions
              </Button>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
