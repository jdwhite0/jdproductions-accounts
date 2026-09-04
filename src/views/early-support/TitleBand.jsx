import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import galaxyBand from "@/assets/images/early-support/galaxy-band.jpg";
import { GOLD, NAVY } from "./brand";

/**
 * Title-band galaxy only — vivid Hubble NGC 1300 strip behind the headline,
 * feathered into the white page. Not a full-bleed wallpaper.
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
        pt: { xs: 3, md: 4 },
        pb: { xs: 4, md: 5 },
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          left: { xs: -16, sm: -24 },
          right: { xs: -16, sm: -24 },
          top: 0,
          bottom: 0,
          backgroundImage: `url(${galaxyBand})`,
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
          backgroundRepeat: "no-repeat",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, #000 22%, #000 78%, transparent 100%), linear-gradient(to right, transparent 0%, #000 6%, #000 94%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, #000 22%, #000 78%, transparent 100%), linear-gradient(to right, transparent 0%, #000 6%, #000 94%, transparent 100%)",
          WebkitMaskComposite: "source-in",
          maskComposite: "intersect",
          pointerEvents: "none",
        }}
      />
      <Box sx={{ position: "relative", zIndex: 1, maxWidth: 720 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1 }}>
          <Typography
            component="p"
            sx={{
              color: GOLD,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontSize: 12,
              textShadow: "0 1px 2px rgba(255,255,255,0.85)",
            }}
          >
            {eyebrow}
          </Typography>
          <Box sx={{ width: 36, height: 2, bgcolor: GOLD, borderRadius: 1 }} />
        </Box>
        <Typography
          component="h1"
          sx={{
            color: NAVY,
            fontWeight: 700,
            fontSize: { xs: 32, md: 42 },
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            textShadow: "0 1px 8px rgba(255,255,255,0.9)",
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            sx={{
              mt: 1.25,
              color: NAVY,
              fontSize: { xs: 16, md: 18 },
              maxWidth: 560,
              fontWeight: 500,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
