import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import galaxyBand from "@/assets/images/early-support/galaxy-band.jpg";
import { FONT } from "./brand";
import TitleBandAtmosphere from "./TitleBandAtmosphere";

/**
 * Signed-in exit control: Hubble galaxy pill + white label.
 * Same asset and Ken Burns / atmosphere language as the title-band.
 * Not gold — gold liquid-glass is guest Sign in only.
 */
export default function GalaxySignOutButton({
  onClick,
  disabled = false,
  children = "Sign out",
}) {
  return (
    <Button
      className="btn-signout"
      type="button"
      variant="contained"
      disableElevation
      onClick={onClick}
      disabled={disabled}
      aria-label="Sign out"
      aria-busy={disabled || undefined}
      sx={{
        position: "relative",
        isolation: "isolate",
        overflow: "hidden",
        minWidth: { xs: 0, sm: 104 },
        px: { xs: "14px", sm: "20px" },
        py: { xs: "8px", sm: "10px" },
        borderRadius: "24px",
        fontFamily: FONT,
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: "0.01em",
        lineHeight: 1.25,
        textTransform: "none",
        color: "#fff",
        bgcolor: "#000",
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 2px 12px rgba(0, 10, 24, 0.32)",
        "&:hover": {
          bgcolor: "#000",
          boxShadow: "0 4px 16px rgba(0, 10, 24, 0.42)",
        },
        "&.Mui-disabled": {
          color: "#fff",
          opacity: 0.72,
        },
      }}
    >
      <Box
        aria-hidden
        className="es-galaxy-drift"
        sx={{
          position: "absolute",
          backgroundImage: `url(${galaxyBand})`,
          backgroundSize: "cover",
          backgroundPosition: "center 38%",
          backgroundRepeat: "no-repeat",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <Box aria-hidden className="es-signout-scrim" />
      <TitleBandAtmosphere compact />
      <Box
        component="span"
        className="btn-signout-label"
        sx={{
          position: "relative",
          zIndex: 3,
          color: "#fff",
          textShadow: "0 1px 12px rgba(0,0,0,0.45)",
        }}
      >
        {children}
      </Box>
    </Button>
  );
}
