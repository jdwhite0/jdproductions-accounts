import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import galaxyBand from "@/assets/images/early-support/galaxy-band.jpg";
import { FONT, FONT_DISPLAY, GOLD, TITLE_ON_BAND } from "./brand";

/**
 * Solution B title-band: vivid Hubble NGC 1300 strip behind the headline only.
 * Solid edges — no milky feather mask. Light type on the dark band.
 * Image: NASA/ESA Hubble (public domain), cropped to a horizontal band.
 */
export default function TitleBand({
  eyebrow = "Early Support",
  title,
  subtitle,
}) {
  return (
    <Box
      sx={{
        position: "relative",
        mb: { xs: 3, md: 4 },
        mx: { xs: -2, sm: -3 },
        overflow: "hidden",
        bgcolor: "#000",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${galaxyBand})`,
          backgroundSize: "cover",
          backgroundPosition: "center 38%",
          backgroundRepeat: "no-repeat",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          px: { xs: 2.5, sm: 3.5, md: 4.5 },
          py: { xs: 3.5, md: 4.5 },
          maxWidth: 760,
        }}
      >
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.25 }}
        >
          <Typography
            component="p"
            sx={{
              color: GOLD,
              fontFamily: FONT,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontSize: 12,
            }}
          >
            {eyebrow}
          </Typography>
          <Box sx={{ width: 36, height: 1, bgcolor: GOLD }} />
        </Box>
        <Typography
          component="h1"
          className="es-display"
          sx={{
            color: TITLE_ON_BAND,
            fontFamily: FONT_DISPLAY,
            fontWeight: 400,
            fontSize: { xs: 36, md: 52 },
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            sx={{
              mt: 1.25,
              color: "rgba(247,247,248,0.88)",
              fontFamily: FONT,
              fontSize: { xs: 16, md: 18 },
              maxWidth: 560,
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
