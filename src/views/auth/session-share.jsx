import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useSearchParams } from "react-router-dom";
import {
  SESSION_SHARE_MESSAGE,
  parseSessionShareParent,
} from "@/utils/session-share";

function postToParent(parent, payload) {
  if (!parent || window.parent === window) return;
  try {
    window.parent.postMessage(payload, parent);
  } catch {
    /* closed */
  }
}

/**
 * Hidden iframe target on accounts.jdproductions.io.
 * Mint/post a ticket to invest.*, or sign out this origin when asked.
 * Do not auto-redirect to ACCESS.
 */
export default function AuthSessionShare() {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const [params] = useSearchParams();
  const parent = parseSessionShareParent(params.get("parent"));
  const signOutIntent = params.get("intent") === "signout";

  useEffect(() => {
    if (!isLoaded || !parent) return;
    let cancelled = false;

    (async () => {
      if (signOutIntent) {
        if (isSignedIn) {
          try {
            await signOut();
          } catch {
            /* still tell parent we tried */
          }
        }
        if (!cancelled) {
          postToParent(parent, {
            type: SESSION_SHARE_MESSAGE,
            signedOut: true,
          });
        }
        return;
      }

      if (!isSignedIn) {
        postToParent(parent, {
          type: SESSION_SHARE_MESSAGE,
          signedIn: false,
        });
        return;
      }

      try {
        const bearer = await getToken();
        if (!bearer) throw new Error("no_token");
        const res = await fetch("/api/auth/sign-in-token", {
          method: "POST",
          headers: { Authorization: `Bearer ${bearer}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ticket) throw new Error("mint_failed");
        if (cancelled) return;
        postToParent(parent, {
          type: SESSION_SHARE_MESSAGE,
          ticket: data.ticket,
        });
      } catch {
        if (!cancelled) {
          postToParent(parent, {
            type: SESSION_SHARE_MESSAGE,
            signedIn: false,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, parent, signOutIntent, getToken, signOut]);

  return null;
}
