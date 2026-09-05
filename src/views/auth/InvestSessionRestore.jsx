import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth, useSignIn } from "@clerk/clerk-react";
import { consumeClerkTicket } from "@/utils/consume-clerk-ticket";
import { isInvestHost } from "@/utils/invest-host";
import {
  SESSION_SHARE_TIMEOUT_MS,
  accountsSessionShareUrl,
  clearSessionShareSkip,
  isSessionShareSkipped,
  markSessionShareSkipped,
  parseSessionShareMessage,
  shouldRestoreInvestSession,
} from "@/utils/session-share";

const InvestSessionRestoreContext = createContext({
  restorePending: false,
  signOutAcrossHosts: async () => {},
});

export function useInvestSessionRestore() {
  return useContext(InvestSessionRestoreContext);
}

export default function InvestSessionRestoreProvider({ children }) {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const [iframeSrc, setIframeSrc] = useState(null);
  const [restorePending, setRestorePending] = useState(() => isInvestHost());

  useEffect(() => {
    if (!isLoaded || !signInLoaded) return;
    if (isSignedIn) {
      clearSessionShareSkip();
      setIframeSrc(null);
      setRestorePending(false);
      return;
    }

    const pathname =
      typeof window !== "undefined" ? window.location.pathname : "";
    const restore = shouldRestoreInvestSession({
      pathname,
      isLoaded: true,
      isSignedIn: false,
      skipped: isSessionShareSkipped(),
    });
    if (!restore) {
      setIframeSrc(null);
      setRestorePending(false);
      return;
    }

    setRestorePending(true);
    setIframeSrc(accountsSessionShareUrl());
    const timer = window.setTimeout(() => {
      markSessionShareSkipped();
      setIframeSrc(null);
      setRestorePending(false);
    }, SESSION_SHARE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [isLoaded, signInLoaded, isSignedIn]);

  useEffect(() => {
    if (!iframeSrc) return undefined;

    async function onMessage(event) {
      const parsed = parseSessionShareMessage(event.data, event.origin);
      if (!parsed) return;
      if (parsed.kind === "ticket") {
        try {
          const ok = await consumeClerkTicket({
            signIn,
            setActive,
            ticket: parsed.ticket,
          });
          if (ok) {
            clearSessionShareSkip();
            setIframeSrc(null);
            setRestorePending(false);
            return;
          }
        } catch {
          /* fall through */
        }
        markSessionShareSkipped();
        setIframeSrc(null);
        setRestorePending(false);
        return;
      }
      markSessionShareSkipped();
      setIframeSrc(null);
      setRestorePending(false);
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [iframeSrc, signIn, setActive]);

  const value = useMemo(
    () => ({
      restorePending: Boolean(isInvestHost() && restorePending && !isSignedIn),
      signOutAcrossHosts: async (redirectUrl) => {
        markSessionShareSkipped();
        if (isInvestHost()) {
          await new Promise((resolve) => {
            const logout = document.createElement("iframe");
            logout.src = accountsSessionShareUrl({ intent: "signout" });
            logout.title = "";
            logout.setAttribute("aria-hidden", "true");
            logout.style.cssText =
              "position:absolute;width:0;height:0;border:0;visibility:hidden";
            const done = () => {
              window.removeEventListener("message", onMessage);
              logout.remove();
              resolve();
            };
            const timer = window.setTimeout(done, 2500);
            function onMessage(event) {
              const parsed = parseSessionShareMessage(event.data, event.origin);
              if (parsed?.kind !== "signed-out") return;
              window.clearTimeout(timer);
              done();
            }
            window.addEventListener("message", onMessage);
            document.body.appendChild(logout);
          });
        }
        await signOut({ redirectUrl });
      },
    }),
    [restorePending, isSignedIn, signOut],
  );

  return (
    <InvestSessionRestoreContext.Provider value={value}>
      {children}
      {iframeSrc ? (
        <iframe
          src={iframeSrc}
          title="Restore session"
          aria-hidden
          tabIndex={-1}
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            border: 0,
            visibility: "hidden",
          }}
        />
      ) : null}
    </InvestSessionRestoreContext.Provider>
  );
}
