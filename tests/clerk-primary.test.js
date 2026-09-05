import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readRepo(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("ClerkProvider is primary mode on this origin, not a satellite", () => {
  const main = readRepo("src/main.jsx");
  assert.doesNotMatch(main, /isSatellite=\{true\}/);
  assert.doesNotMatch(main, /isSatellite=\{/);
  assert.doesNotMatch(main, /VITE_CLERK_DOMAIN/);
  assert.doesNotMatch(main, /VITE_CLERK_SIGN_IN_URL/);
  assert.doesNotMatch(main, /VITE_CLERK_SIGN_UP_URL/);
  assert.doesNotMatch(main, /pk_test_/);
  assert.doesNotMatch(main, /getaccess\.world\/sign-in/);
  assert.doesNotMatch(main, /getaccess\.world\/sign-up/);
  assert.match(main, /signInUrl="\/auth\/login"/);
  assert.match(main, /signUpUrl="\/auth\/register"/);
  assert.match(main, /afterSignOutUrl="\/auth\/login"/);
  assert.match(main, /signInFallbackRedirectUrl="\/dashboard"/);
  assert.match(main, /signUpFallbackRedirectUrl="\/dashboard"/);
  assert.match(main, /pk_live_/);
});

test("login and register are click-only ACCESS doors, not embedded widgets", () => {
  const login = readRepo("src/views/auth/login.jsx");
  const register = readRepo("src/views/auth/register.jsx");

  assert.doesNotMatch(login, /<SignIn/);
  assert.doesNotMatch(register, /<SignUp/);
  assert.match(login, /accessSignInUrl/);
  assert.match(register, /accessSignUpUrl/);
  assert.match(login, /safeNextPath/);
  assert.match(register, /safeNextPath/);
  assert.match(login, /<SignedIn>/);
  assert.match(login, /<Navigate to=\{next\} replace \/>/);
  assert.doesNotMatch(login, /JYSON/);
  assert.doesNotMatch(login, /identity pool/);
  assert.doesNotMatch(login, /Sign in with ACCESS/);
  assert.doesNotMatch(login, /Continue on ACCESS/);
  assert.doesNotMatch(login, /SatelliteAuthRedirect/);
  assert.doesNotMatch(register, /Continue on ACCESS/);
  assert.doesNotMatch(login, /AccessDoorPage/);
  assert.doesNotMatch(register, /SatelliteAuthRedirect/);
  assert.doesNotMatch(register, /AccessDoorPage/);
});

test("login and register never auto-redirect to ACCESS on page load", () => {
  const login = readRepo("src/views/auth/login.jsx");
  const register = readRepo("src/views/auth/register.jsx");

  assert.doesNotMatch(login, /window\.location\.(replace|assign)/);
  assert.doesNotMatch(register, /window\.location\.(replace|assign)/);
  assert.doesNotMatch(login, /useEffect/);
  assert.doesNotMatch(register, /useEffect/);
  assert.equal(
    fs.existsSync(path.join(root, "src/views/auth/AccessDoorPage.jsx")),
    false,
  );
});

test("satellite redirect helpers are not shipped", () => {
  assert.equal(fs.existsSync(path.join(root, "src/views/auth/SatelliteAuthRedirect.jsx")), false);
  assert.equal(fs.existsSync(path.join(root, "src/utils/clerk-satellite.js")), false);
});

test("protected portal does not use Clerk RedirectToSignIn", () => {
  const mainRoutes = readRepo("src/routes/MainRoutes.jsx");
  assert.doesNotMatch(mainRoutes, /RedirectToSignIn/);
  assert.doesNotMatch(mainRoutes, /<SignedOut>/);
  assert.match(mainRoutes, /useAuth\(\)/);
  assert.match(mainRoutes, /\/auth\/login\?next=/);
});

test("ticket route consumes Clerk sign-in tokens from ACCESS", () => {
  const ticket = readRepo("src/views/auth/ticket.jsx");
  const consume = readRepo("src/utils/consume-clerk-ticket.js");
  const routes = readRepo("src/routes/PagesRoutes.jsx");
  assert.match(ticket, /consumeClerkTicket/);
  assert.match(consume, /strategy: "ticket"/);
  assert.match(consume, /setActive/);
  assert.match(routes, /path: 'ticket'/);
  assert.match(ticket, /Sign in failed\. Try again\./);
  assert.doesNotMatch(ticket, /window\.location\.(replace|assign)/);
});

test("live ACCESS publishable key stays in vercel.json; satellite env unused", () => {
  const vercel = readRepo("vercel.json");
  const example = readRepo(".env.example");

  assert.match(vercel, /"VITE_CLERK_PUBLISHABLE_KEY": "pk_live_Y2xlcmsuZ2V0YWNjZXNzLndvcmxkJA"/);
  assert.doesNotMatch(vercel, /VITE_CLERK_IS_SATELLITE/);
  assert.doesNotMatch(vercel, /VITE_CLERK_DOMAIN/);
  assert.doesNotMatch(vercel, /VITE_CLERK_SIGN_IN_URL/);
  assert.doesNotMatch(vercel, /VITE_CLERK_SIGN_UP_URL/);

  assert.doesNotMatch(example, /VITE_CLERK_IS_SATELLITE=true/);
  assert.doesNotMatch(example, /sk_live_|sk_test_[A-Za-z0-9]{10,}/);
});

test("login and register expose create-account and sign-in doors", () => {
  const login = readRepo("src/views/auth/login.jsx");
  const register = readRepo("src/views/auth/register.jsx");
  assert.match(login, /Create an account/);
  assert.match(login, /to=\{`\/auth\/register\?next=\$\{encodeURIComponent\(next\)\}`\}/);
  assert.match(register, /Already have an account/);
  assert.match(register, /to=\{`\/auth\/login\?next=\$\{encodeURIComponent\(next\)\}`\}/);
});

test("Early Support Sign in stays on Accounts routes", () => {
  const layout = readRepo("src/layouts/EarlySupportLayout/index.jsx");
  const success = readRepo("src/views/early-support/success.jsx");
  assert.match(layout, /to="\/auth\/login\?next=\/positions"/);
  assert.doesNotMatch(layout, /to="\/auth\/register\?next=\/positions"/);
  assert.doesNotMatch(layout, /Create account/);
  assert.doesNotMatch(layout, /accessSignInUrl/);
  assert.match(layout, /NavAvatar/);
  assert.match(layout, /GalaxySignOutButton/);
  assert.match(layout, /InvestSessionRestore/);
  assert.match(success, /to="\/auth\/register\?next=\/positions"/);
  assert.match(success, /to="\/auth\/login\?next=\/positions"/);
  assert.match(success, /Create an account to track your support/);
  assert.match(success, /earlySupportNavChrome/);
  assert.doesNotMatch(success, /SignedOut/);
});

test("/invest redirects to Early Support instead of a separate page", () => {
  const routes = readRepo("src/routes/EarlySupportRoutes.jsx");
  const vercel = readRepo("vercel.json");
  assert.match(routes, /investPathDestination/);
  assert.match(routes, /path: "\/invest"/);
  assert.equal(
    (routes.match(/export default EarlySupportRoutes/g) || []).length,
    1,
  );
  assert.match(vercel, /"source": "\/invest"/);
  assert.match(vercel, /"destination": "\/early-support"/);
});

test("invest restores the accounts session, not ACCESS, via session-share", () => {
  const restore = readRepo("src/views/auth/InvestSessionRestore.jsx");
  const share = readRepo("src/views/auth/session-share.jsx");
  const routes = readRepo("src/routes/PagesRoutes.jsx");
  const app = readRepo("src/App.jsx");
  const api = readRepo("api/auth/sign-in-token.js");
  const vercel = readRepo("vercel.json");

  assert.match(app, /InvestSessionRestoreProvider/);
  assert.match(routes, /path: 'session-share'/);
  assert.match(share, /\/api\/auth\/sign-in-token/);
  assert.match(share, /SESSION_SHARE_MESSAGE/);
  assert.match(readRepo("src/utils/session-share.js"), /jdp_accounts_session/);
  assert.doesNotMatch(restore, /getaccess\.world/);
  assert.doesNotMatch(share, /getaccess\.world/);
  assert.match(api, /mintSignInTokenForUser/);
  assert.match(vercel, /frame-ancestors/);
  assert.match(vercel, /https:\/\/invest\.jdproductions\.io/);
});
