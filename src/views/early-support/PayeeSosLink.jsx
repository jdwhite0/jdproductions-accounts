import Link from "@mui/material/Link";
import { NAVY } from "./brand";
import {
  ALABAMA_SOS_ENTITY_URL,
  PAYEE_NAME,
} from "../../../lib/early-support/copy.js";

/** Quiet inline link: company name → official Alabama SOS entity record. */
export default function PayeeSosLink({ underline = "always", sx }) {
  return (
    <Link
      href={ALABAMA_SOS_ENTITY_URL}
      target="_blank"
      rel="noopener noreferrer"
      underline={underline}
      sx={{
        color: NAVY,
        fontFamily: "inherit",
        fontWeight: "inherit",
        textUnderlineOffset: "2px",
        ...sx,
      }}
    >
      {PAYEE_NAME}
    </Link>
  );
}
