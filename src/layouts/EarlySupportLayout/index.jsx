import { Outlet, Link as RouterLink } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import LogoMain from "@/components/logo/LogoMain";
import { BG, INK, NAVY, SECONDARY } from "@/views/early-support/brand";

export default function EarlySupportLayout() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: BG, color: INK }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ bgcolor: BG, color: NAVY, borderBottom: "1px solid #E6E8EC" }}
      >
        <Toolbar
          sx={{
            justifyContent: "space-between",
            minHeight: { xs: 64, md: 72 },
          }}
        >
          <Box
            component={RouterLink}
            to="/early-support"
            sx={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            <LogoMain />
          </Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Button
              component={RouterLink}
              to="/early-support"
              sx={{ color: NAVY, fontWeight: 600, textTransform: "none" }}
            >
              Early Support
            </Button>
            <SignedOut>
              <Button
                component={RouterLink}
                to="/auth/login?next=/positions"
                variant="outlined"
                sx={{
                  borderColor: NAVY,
                  color: NAVY,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Sign in
              </Button>
            </SignedOut>
            <SignedIn>
              <Button
                component={RouterLink}
                to="/positions"
                sx={{ color: NAVY, fontWeight: 600, textTransform: "none" }}
              >
                Positions
              </Button>
              <UserButton
                afterSignOutUrl="/auth/login"
                appearance={{
                  elements: { avatarBox: { width: 36, height: 36 } },
                }}
              />
            </SignedIn>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        <Outlet />
      </Container>
      <Box
        component="footer"
        sx={{ borderTop: "1px solid #E6E8EC", py: 3, mt: 6 }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              justifyContent: "space-between",
              alignItems: { sm: "center" },
            }}
          >
            <Typography variant="caption" sx={{ color: SECONDARY }}>
              © {new Date().getFullYear()} JD Productions Inc. Early Support
              terms: early_support_v0.
            </Typography>
            <Stack direction="row" spacing={2}>
              <Link
                component={RouterLink}
                to="/early-support/terms"
                underline="hover"
                sx={{ color: SECONDARY, fontSize: 13 }}
              >
                Terms
              </Link>
              <Link
                component={RouterLink}
                to="/early-support/privacy"
                underline="hover"
                sx={{ color: SECONDARY, fontSize: 13 }}
              >
                Privacy
              </Link>
              <Link
                href="https://jdproductions.io"
                underline="hover"
                sx={{ color: SECONDARY, fontSize: 13 }}
              >
                jdproductions.io
              </Link>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
