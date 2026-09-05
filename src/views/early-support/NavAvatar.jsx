import { Link as RouterLink } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";

/** Replaces guest Sign in. Links to Positions. */
export default function NavAvatar() {
  const { user } = useUser();
  const name = user?.fullName || user?.firstName || "Account";
  const src = user?.imageUrl || undefined;

  return (
    <IconButton
      component={RouterLink}
      to="/positions"
      aria-label={`${name} — Positions`}
      sx={{
        p: 0.25,
        flexShrink: 0,
        "&:hover": { opacity: 0.88 },
      }}
    >
      <Avatar
        alt={name}
        src={src}
        sx={{
          width: { xs: 28, sm: 32 },
          height: { xs: 28, sm: 32 },
          bgcolor: "#002244",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {name.slice(0, 1).toUpperCase()}
      </Avatar>
    </IconButton>
  );
}
