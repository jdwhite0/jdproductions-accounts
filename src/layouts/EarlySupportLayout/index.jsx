import { useEffect, useState } from "react";
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
import NavLogo from "@/views/early-support/NavLogo";
import "@/views/early-support/es.css";
import { BG, FONT, INK, NAVY, SECONDARY } from "@/views/early-support/brand";

export default function EarlySupportLayout({ children }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Box
      className="es-root"
      sx={{ minHeight: "100vh", bgcolor: BG, color: INK }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        className={scrolled ? "es-nav is-scrolled" : "es-nav"}
        sx={{
          bgcolor: BG,
          color: NAVY,
          borderBottom: scrolled
            ? "1px solid rgba(10, 10, 12, 0.08)"
            : "1px solid transparent",
          boxShadow: scrolled
            ? "inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 12px rgba(10,10,20,0.04)"
            : "none",
        }}
      >
        <Toolbar
          sx={{
            justifyContent: "space-between",
            minHeight: { xs: 64, md: 72 },
          }}
        >
          <NavLogo />
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <SignedOut>
              <Button
                className="btn-signin"
                component={RouterLink}
                to="/auth/login?next=/positions"
                variant="contained"
                disableElevation
                sx={{
                  /* jdproductions.io .nav-buttons .btn-signin / .btn-signin-m */
                  minWidth: 116,
                  px: "24px",
                  py: "10px",
                  borderRadius: "24px",
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                  lineHeight: 1.25,
                  textTransform: "none",
                  color: "#fff",
                  backgroundColor: "transparent",
                  backgroundImage:
                    "linear-gradient(135deg, rgba(255,194,14,0.92), rgba(224,165,0,0.92))",
                  border: "1px solid rgba(255,194,14,0.65)",
                  boxShadow:
                    "0 2px 12px rgba(255,194,14,0.28), inset 0 1px 0 rgba(255,255,255,0.45)",
                  backdropFilter: "blur(12px) saturate(160%)",
                  WebkitBackdropFilter: "blur(12px) saturate(160%)",
                  "&:hover": {
                    backgroundColor: "transparent",
                    backgroundImage:
                      "linear-gradient(135deg, #ffc20e, #e0a500)",
                    boxShadow:
                      "0 4px 16px rgba(255,194,14,0.4), inset 0 1px 0 rgba(255,255,255,0.5)",
                  },
                }}
              >
                Sign in
              </Button>
            </SignedOut>
            <SignedIn>
              <Button
                component={RouterLink}
                to="/positions"
                sx={{
                  color: NAVY,
                  fontWeight: 600,
                  textTransform: "none",
                  fontFamily: FONT,
                }}
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
        {children ?? <Outlet />}
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
            <Typography
              variant="caption"
              sx={{ color: SECONDARY, fontFamily: FONT }}
            >
              © {new Date().getFullYear()} JD Productions Inc. Early Support
              terms: early_support_v0.
            </Typography>
            <Stack direction="row" spacing={2}>
              <Link
                component={RouterLink}
                to="/early-support/terms"
                underline="hover"
                sx={{ color: SECONDARY, fontSize: 13, fontFamily: FONT }}
              >
                Terms
              </Link>
              <Link
                component={RouterLink}
                to="/early-support/privacy"
                underline="hover"
                sx={{ color: SECONDARY, fontSize: 13, fontFamily: FONT }}
              >
                Privacy
              </Link>
              <Link
                href="https://jdproductions.io"
                underline="hover"
                sx={{ color: SECONDARY, fontSize: 13, fontFamily: FONT }}
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
