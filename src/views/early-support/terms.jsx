import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import TitleBand from "./TitleBand";
import { FONT, INK, NAVY, SECONDARY, esCardSx } from "./brand";
import { TERMS_SUBHEAD } from "../../../lib/early-support/copy.js";

const sections = [
  {
    title: "Definition",
    body: "Early Support is voluntary support to JD Productions Inc. It records your support, emails a Stripe receipt and an itemized invoice, and may include priority consideration when counsel later offers a formal instrument. It is not equity, shares, a SAFE, or any other security. It is not a guaranteed return. It is not a charitable donation or 501(c)(3) contribution. Any later instrument is a separate, counsel-prepared step; nothing converts silently. Terms version: early_support_v0.",
  },
  {
    title: "What you receive",
    body: "A ledger record of your Early Support position; a Stripe payment receipt by email; an itemized invoice by email; acknowledgment of these Early Support Terms (early_support_v0); and priority consideration when a counsel-prepared offering exists. Priority is not a guaranteed allocation.",
  },
  {
    title: "What this is not",
    body: "Early Support is not equity, shares, stock, a SAFE, or a security. It is not an investment offering and does not promise a return, ROI percentage, or repayment. It is not tax-deductible as a charitable gift. Tax treatment is between you and your advisor.",
  },
  {
    title: "Amount first, account optional",
    body: "You may complete Early Support with your email. An account is not required to pay. If you later create an account with the same verified email, you can track that support under Positions.",
  },
  {
    title: "Money confirmation",
    body: "A position becomes active only after Stripe confirms the payment to this application via a signed webhook. Returning from Checkout in the browser is not money truth and does not by itself activate a position.",
  },
  {
    title: "Processor",
    body: "Payments are processed by Stripe. Stripe’s processor fees apply. JD Productions Inc. is the payee.",
  },
];

export default function EarlySupportTerms() {
  return (
    <Box>
      <TitleBand
        eyebrow="Early Support"
        title="Early Support Terms"
        subtitle={TERMS_SUBHEAD}
      />
      <Card variant="outlined" sx={esCardSx}>
        <CardContent
          sx={{
            p: { xs: 2.5, md: 3.5 },
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
          }}
        >
          {sections.map((section) => (
            <Box key={section.title}>
              <Typography
                sx={{
                  color: NAVY,
                  fontFamily: FONT,
                  fontWeight: 700,
                  mb: 0.75,
                }}
              >
                {section.title}
              </Typography>
              <Typography
                sx={{
                  color: INK,
                  fontFamily: FONT,
                  fontSize: 15,
                  lineHeight: 1.7,
                }}
              >
                {section.body}
              </Typography>
            </Box>
          ))}
          <Typography
            sx={{
              color: SECONDARY,
              fontFamily: FONT,
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            Related:{" "}
            <Link href="/early-support/privacy" sx={{ color: NAVY }}>
              Early Support Privacy addendum
            </Link>
            . Company site terms also live at{" "}
            <Link
              href="https://jdproductions.io/terms.html"
              sx={{ color: NAVY }}
            >
              jdproductions.io/terms.html
            </Link>
            .
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
