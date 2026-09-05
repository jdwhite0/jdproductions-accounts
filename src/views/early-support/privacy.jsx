import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import TitleBand from "./TitleBand";
import { FONT, INK, NAVY, SECONDARY, esCardSx } from "./brand";

export default function EarlySupportPrivacy() {
  return (
    <Box>
      <TitleBand
        eyebrow="Early Support"
        title="Privacy addendum"
        subtitle="How Early Support uses your email — early_support_v0."
      />
      <Card variant="outlined" sx={esCardSx}>
        <CardContent
          sx={{
            p: { xs: 2.5, md: 3.5 },
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Typography
            sx={{ color: INK, fontFamily: FONT, fontSize: 15, lineHeight: 1.7 }}
          >
            This addendum covers Early Support on accounts.jdproductions.io. It
            sits alongside the company privacy notice at{" "}
            <Link href="https://jdproductions.io/privacy.html">
              jdproductions.io/privacy.html
            </Link>
            .
          </Typography>
          <Box>
            <Typography
              sx={{ color: NAVY, fontFamily: FONT, fontWeight: 700, mb: 0.75 }}
            >
              What we collect
            </Typography>
            <Typography
              sx={{
                color: INK,
                fontFamily: FONT,
                fontSize: 15,
                lineHeight: 1.7,
              }}
            >
              Your email (required to pay as a guest), the amount and tier you
              choose, Stripe customer / checkout / payment identifiers, and —
              only if you later sign in — your Clerk user id so you can claim
              Positions. We do not store full card numbers.
            </Typography>
          </Box>
          <Box>
            <Typography
              sx={{ color: NAVY, fontFamily: FONT, fontWeight: 700, mb: 0.75 }}
            >
              Why
            </Typography>
            <Typography
              sx={{
                color: INK,
                fontFamily: FONT,
                fontSize: 15,
                lineHeight: 1.7,
              }}
            >
              To record your Early Support on the ledger, send the Stripe
              receipt and itemized invoice, confirm payment via Stripe webhooks,
              and (if you choose) attach the position to your JD Productions
              Accounts login. An account is optional.
            </Typography>
          </Box>
          <Box>
            <Typography
              sx={{ color: NAVY, fontFamily: FONT, fontWeight: 700, mb: 0.75 }}
            >
              Processors
            </Typography>
            <Typography
              sx={{
                color: INK,
                fontFamily: FONT,
                fontSize: 15,
                lineHeight: 1.7,
              }}
            >
              Stripe processes the payment and emails the receipt and invoice.
              Clerk is used only if you create or use an account. We do not sell
              this information.
            </Typography>
          </Box>
          <Typography sx={{ color: SECONDARY, fontFamily: FONT, fontSize: 13 }}>
            Questions: hello@jdproductions.io. Terms:{" "}
            <Link href="/early-support/terms" sx={{ color: NAVY }}>
              Early Support Terms (early_support_v0)
            </Link>
            .
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
