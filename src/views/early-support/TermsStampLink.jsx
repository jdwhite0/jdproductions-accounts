import { Link as RouterLink } from "react-router-dom";
import Link from "@mui/material/Link";
import { TERMS_VERSION } from "../../../lib/early-support/copy.js";

export const TERMS_HREF = "/early-support/terms";

/** Same-tab RouterLink for the `early_support_v0` stamp — matches landing Terms. */
export default function TermsStampLink({ underline, sx }) {
  return (
    <Link component={RouterLink} to={TERMS_HREF} underline={underline} sx={sx}>
      {TERMS_VERSION}
    </Link>
  );
}

/** Replace the first TERMS_VERSION occurrence in `text` with a Terms stamp link. */
export function linkTermsStamp(text, linkProps) {
  const i = String(text).indexOf(TERMS_VERSION);
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <TermsStampLink {...linkProps} />
      {text.slice(i + TERMS_VERSION.length)}
    </>
  );
}
