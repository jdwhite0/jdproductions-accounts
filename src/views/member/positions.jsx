import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  IconArrowDownLeft,
  IconFileText,
  IconNorthStar,
} from "@tabler/icons-react";
import TitleBand from "@/views/early-support/TitleBand";
import {
  GOLD,
  INK,
  NAVY,
  SECONDARY,
  SOFT,
  esCardSx,
} from "@/views/early-support/brand";
import {
  PRIORITY_CARD_COPY,
  TERMS_VERSION,
  THANK_YOU_COPY,
  formatUsdFromCents,
} from "../../../lib/early-support/copy.js";

export default function PositionsPage() {
  const { getToken } = useAuth();
  const [positions, setPositions] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const token = await getToken();
        if (!token) throw new Error("Sign in to view Positions.");
        await fetch("/api/positions/claim", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const res = await fetch("/api/positions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(
            data.message || data.error || "Could not load positions.",
          );
        if (!cancelled) {
          setPositions(data.positions || []);
          setActivity(data.activity || []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load positions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  const featured = useMemo(() => {
    return positions.find((p) => p.status === "active") || positions[0] || null;
  }, [positions]);

  return (
    <Box>
      <TitleBand eyebrow="Early Support" title="Your Early Support" />

      {loading && (
        <Typography sx={{ color: SECONDARY }}>
          Loading your positions…
        </Typography>
      )}
      {error && (
        <Typography sx={{ color: "error.main" }} role="alert">
          {error}
        </Typography>
      )}

      {!loading && !featured && (
        <Card variant="outlined" sx={{ ...esCardSx, maxWidth: 640 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography sx={{ color: NAVY, fontWeight: 700, mb: 1 }}>
              No Early Support position yet
            </Typography>
            <Typography sx={{ color: INK, mb: 2, lineHeight: 1.7 }}>
              Pay first — an account was optional. If you already paid with this
              email, we attach guest positions when the email on your login is
              verified.
            </Typography>
            <Button
              component={RouterLink}
              to="/early-support"
              variant="contained"
              sx={{
                bgcolor: NAVY,
                textTransform: "none",
                fontWeight: 700,
                "&:hover": { bgcolor: "#001B36" },
              }}
            >
              Go to Early Support
            </Button>
          </CardContent>
        </Card>
      )}

      {featured && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "minmax(0, 1.5fr) minmax(240px, 0.7fr)",
            },
            gap: 2.5,
            alignItems: "start",
          }}
        >
          <Stack spacing={2.5}>
            <PositionCard position={featured} />
            <ActivityCard items={activity} />
          </Stack>
          <PriorityCard />
        </Box>
      )}
    </Box>
  );
}

function PositionCard({ position }) {
  const status = position.status || "pending";
  const date = position.created_at ? new Date(position.created_at) : null;
  return (
    <Card variant="outlined" sx={esCardSx}>
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Typography
          sx={{
            color: NAVY,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontSize: 12,
            mb: 1.5,
          }}
        >
          Your position
        </Typography>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center", mb: 2, flexWrap: "wrap" }}
        >
          <Typography
            sx={{
              color: NAVY,
              fontWeight: 700,
              fontSize: { xs: 36, md: 44 },
              lineHeight: 1,
            }}
          >
            {formatUsdFromCents(position.amount_cents, position.currency)}
          </Typography>
          <Box
            sx={{
              px: 1.25,
              py: 0.35,
              borderRadius: 999,
              border: `1.5px solid ${GOLD}`,
              color: GOLD,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          >
            {status.toUpperCase()}
          </Box>
        </Stack>
        <DetailRow label="Status" value={capitalize(status)} />
        <DetailRow
          label="Date"
          value={
            date
              ? date.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"
          }
        />
        <DetailRow
          label="Terms version"
          value={
            <Box
              component="span"
              sx={{ fontFamily: "ui-monospace, monospace" }}
            >
              {position.terms_version || TERMS_VERSION}
            </Box>
          }
        />
        {status === "pending" && (
          <Typography
            sx={{ mt: 2, color: SECONDARY, fontSize: 14, lineHeight: 1.6 }}
          >
            Payment is not active yet. Positions become active only after Stripe
            confirms the charge to this app — not when Checkout returns success
            in the browser.
          </Typography>
        )}
        {status === "active" && (
          <Typography sx={{ mt: 2, color: NAVY, fontSize: 14 }}>
            {THANK_YOU_COPY}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityCard({ items }) {
  return (
    <Card variant="outlined" sx={esCardSx}>
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Typography
          sx={{
            color: NAVY,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontSize: 12,
            mb: 2,
          }}
        >
          Recent activity
        </Typography>
        {(!items || items.length === 0) && (
          <Typography sx={{ color: SECONDARY, fontSize: 14 }}>
            Activity appears after checkout and confirmed payment.
          </Typography>
        )}
        <Stack spacing={1.75}>
          {(items || []).slice(0, 8).map((item) => (
            <Stack
              key={item.id}
              direction="row"
              spacing={1.5}
              sx={{ alignItems: "flex-start" }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  bgcolor: SOFT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: NAVY,
                  flexShrink: 0,
                }}
              >
                <ActivityIcon type={item.type} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ color: NAVY, fontWeight: 600, fontSize: 14 }}>
                  {item.title}
                </Typography>
                <Typography sx={{ color: SECONDARY, fontSize: 13 }}>
                  {item.subtitle}
                </Typography>
              </Box>
              <Typography
                sx={{ color: SECONDARY, fontSize: 12, whiteSpace: "nowrap" }}
              >
                {item.occurred_at
                  ? new Date(item.occurred_at).toLocaleString()
                  : ""}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

function PriorityCard() {
  return (
    <Card variant="outlined" sx={{ ...esCardSx, minHeight: 220 }}>
      <CardContent
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 2,
          justifyContent: "center",
          minHeight: 220,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: `1.5px solid ${GOLD}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: GOLD,
          }}
        >
          <IconNorthStar size={26} />
        </Box>
        <Typography
          sx={{ color: NAVY, fontWeight: 600, fontSize: 16, lineHeight: 1.5 }}
        >
          {PRIORITY_CARD_COPY}
        </Typography>
      </CardContent>
    </Card>
  );
}

function ActivityIcon({ type }) {
  if (type === "payment_received") return <IconArrowDownLeft size={18} />;
  if (type === "terms_accepted") return <IconFileText size={18} />;
  return <IconNorthStar size={18} />;
}

function DetailRow({ label, value }) {
  return (
    <Stack
      direction="row"
      sx={{
        py: 0.75,
        borderBottom: "1px solid #F0F1F3",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Typography sx={{ color: SECONDARY, fontSize: 14 }}>{label}</Typography>
      <Typography sx={{ color: NAVY, fontSize: 14, fontWeight: 600 }}>
        {value}
      </Typography>
    </Stack>
  );
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}
