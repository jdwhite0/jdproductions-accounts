import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import TitleBand from "./TitleBand";
import {
  CARD_BORDER,
  FONT,
  GOLD,
  INK,
  NAVY,
  SECONDARY,
  SOFT,
  esCardSx,
} from "./brand";
import {
  CONTINUE_ACCEPTS,
  CUSTOM_TIER,
  IMPORTANT_DISCLOSURE_BODY,
  IMPORTANT_DISCLOSURE_TITLE,
  LANDING_BODY,
  LANDING_HEADLINE,
  LANDING_SUBHEAD,
  STRIPE_FEES_DISCLOSURE,
  TIERS,
  WHAT_YOU_RECEIVE,
  formatUsdFromCents,
} from "../../../lib/early-support/copy.js";

const TIER_LIST = [TIERS.starter, TIERS.standard, TIERS.anchor];

export default function EarlySupportLanding() {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const [tier, setTier] = useState("standard");
  const [customAmount, setCustomAmount] = useState("750");
  const [email, setEmail] = useState(
    user?.primaryEmailAddress?.emailAddress || "",
  );
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout(event) {
    event.preventDefault();
    setError("");
    if (!accepted) {
      setError("Please accept the Early Support Terms to continue.");
      return;
    }
    setLoading(true);
    try {
      const headers = { "Content-Type": "application/json" };
      if (isSignedIn) {
        const token = await getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      }
      const body = {
        email,
        tier,
        accepted_terms: true,
      };
      if (tier === "custom") {
        const dollars = Number(customAmount);
        if (!Number.isFinite(dollars) || dollars <= 0) {
          throw new Error("Enter a custom amount in US dollars.");
        }
        body.amount_cents = Math.round(dollars * 100);
      }
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new Error(
          data.message || data.error || "Could not start checkout.",
        );
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || "Could not start checkout.");
      setLoading(false);
    }
  }

  return (
    <Box>
      <TitleBand
        eyebrow="Early Support"
        title={LANDING_HEADLINE}
        subtitle={LANDING_SUBHEAD}
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 1.4fr) minmax(280px, 0.8fr)",
          },
          gap: 2.5,
          alignItems: "start",
        }}
      >
        <Stack spacing={2.5}>
          <Card variant="outlined" sx={esCardSx}>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Typography
                sx={{
                  color: INK,
                  fontFamily: FONT,
                  fontSize: 16,
                  lineHeight: 1.7,
                }}
              >
                {LANDING_BODY}
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ ...esCardSx, borderColor: GOLD }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Typography
                sx={{
                  color: GOLD,
                  fontFamily: FONT,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontSize: 12,
                  mb: 1,
                }}
              >
                {IMPORTANT_DISCLOSURE_TITLE}
              </Typography>
              <Typography
                sx={{
                  color: NAVY,
                  fontFamily: FONT,
                  fontSize: 15,
                  lineHeight: 1.7,
                }}
              >
                {IMPORTANT_DISCLOSURE_BODY}
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={esCardSx}>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Typography
                sx={{
                  color: NAVY,
                  fontFamily: FONT,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontSize: 12,
                  mb: 1.5,
                }}
              >
                What you receive
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5, color: INK }}>
                {WHAT_YOU_RECEIVE.map((item) => (
                  <Typography
                    component="li"
                    key={item}
                    sx={{ mb: 0.75, fontSize: 15, lineHeight: 1.6 }}
                  >
                    {item}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Stack>

        <Card
          variant="outlined"
          sx={esCardSx}
          component="form"
          onSubmit={startCheckout}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Typography
              sx={{
                color: NAVY,
                fontFamily: FONT,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontSize: 12,
                mb: 2,
              }}
            >
              Amount
            </Typography>
            <Stack spacing={1.25}>
              {TIER_LIST.map((item) => (
                <TierButton
                  key={item.key}
                  selected={tier === item.key}
                  onClick={() => setTier(item.key)}
                  label={item.label}
                  amount={formatUsdFromCents(item.amountCents)}
                  hint={item.hint}
                />
              ))}
              <TierButton
                selected={tier === "custom"}
                onClick={() => setTier("custom")}
                label={CUSTOM_TIER.label}
                amount="Your amount"
                hint={CUSTOM_TIER.hint}
              />
              {tier === "custom" && (
                <TextField
                  label="Custom amount (USD)"
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  inputProps={{ min: 10, step: 1 }}
                  size="small"
                />
              )}
              <TextField
                label="Email for receipt and invoice"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                size="small"
                helperText="Required. A JD Productions Accounts login is optional afterward."
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    sx={{ color: NAVY, "&.Mui-checked": { color: NAVY } }}
                  />
                }
                label={
                  <Typography
                    sx={{ fontSize: 13, color: SECONDARY, lineHeight: 1.5 }}
                  >
                    {CONTINUE_ACCEPTS}{" "}
                    <Link component={RouterLink} to="/early-support/terms">
                      Terms
                    </Link>{" "}
                    ·{" "}
                    <Link component={RouterLink} to="/early-support/privacy">
                      Privacy
                    </Link>
                  </Typography>
                }
              />
              <Typography sx={{ fontSize: 13, color: SECONDARY }}>
                {STRIPE_FEES_DISCLOSURE}
              </Typography>
              {error && (
                <Typography
                  sx={{ color: "error.main", fontSize: 14 }}
                  role="alert"
                >
                  {error}
                </Typography>
              )}
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !accepted}
                sx={{
                  bgcolor: NAVY,
                  color: "#fff",
                  fontFamily: FONT,
                  textTransform: "none",
                  fontWeight: 700,
                  py: 1.25,
                  "&:hover": { bgcolor: "#001B36" },
                }}
              >
                {loading ? "Redirecting to Stripe…" : "Continue to checkout"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

function TierButton({ selected, onClick, label, amount, hint }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        textAlign: "left",
        cursor: "pointer",
        borderRadius: "10px",
        border: selected ? `2px solid ${NAVY}` : `1px solid ${CARD_BORDER}`,
        bgcolor: selected ? SOFT : "#fff",
        px: 1.75,
        py: 1.25,
        font: "inherit",
      }}
    >
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "baseline", gap: 1 }}
      >
        <Typography sx={{ color: NAVY, fontWeight: 700 }}>{label}</Typography>
        <Typography sx={{ color: NAVY, fontWeight: 700 }}>{amount}</Typography>
      </Stack>
      <Typography sx={{ color: SECONDARY, fontSize: 12, mt: 0.25 }}>
        {hint}
      </Typography>
    </Box>
  );
}
