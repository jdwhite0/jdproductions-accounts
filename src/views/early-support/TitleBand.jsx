import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import galaxyBand from "@/assets/images/early-support/galaxy-band.jpg";
import { CARD_RADIUS, FONT, GOLD, TITLE_ON_BAND } from "./brand";
import TitleBandAtmosphere from "./TitleBandAtmosphere";

/**
 * Solution B title-band: vivid Hubble NGC 1300 strip behind the headline only.
 * Solid edges — no milky feather mask. Bold Inter title on the dark band.
 * Same galaxy asset; slow Ken Burns + soft starfield (static if reduced-motion).
 * Image: NASA/ESA Hubble (public domain), cropped to a horizontal band.
 */
export default function TitleBand({
  eyebrow,
  title,
  subtitle,
}) {
  return (
    <Box
      className="es-title-band"
      sx={{
        position: "relative",
        width: "100%",
        mb: { xs: 3, md: 4 },
        overflow: "hidden",
        borderRadius: CARD_RADIUS,
        bgcolor: "#000",
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
        }}
      />
      <TitleBandAtmosphere />
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          px: { xs: 2.5, sm: 3.5, md: 4.5 },
          py: { xs: 3.5, md: 4.5 },
          maxWidth: 760,
        }}
      >
        {eyebrow ? (
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.25 }}
          >
            <Typography
              component="p"
              sx={{
                color: GOLD,
                fontFamily: FONT,
                fontWeight: 700,
                letterSpacing: { xs: "0.08em", sm: "0.1em" },
                textTransform: "uppercase",
                fontSize: 12,
              }}
            >
              {eyebrow}
            </Typography>
            <Box sx={{ width: 36, height: 1, bgcolor: GOLD }} />
          </Box>
        ) : null}
        <Typography
          component="h1"
          className="es-title-hero"
          sx={{
            color: TITLE_ON_BAND,
            fontFamily: FONT,
            fontWeight: 800,
            fontStyle: "normal",
            fontSynthesis: "none",
            fontSize: { xs: 34, md: 50 },
            lineHeight: 1.08,
            letterSpacing: "-0.036em",
            textShadow: "0 1px 18px rgba(0,0,0,0.35)",
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
