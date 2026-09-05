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

test("login and register embed Clerk widgets instead of ACCESS-only doors", () => {
  const login = readRepo("src/views/auth/login.jsx");
  const register = readRepo("src/views/auth/register.jsx");

  assert.match(login, /<SignIn/);
  assert.match(login, /routing="hash"/);
  assert.match(login, /safeNextPath/);
  assert.match(login, /forceRedirectUrl=\{next\}/);
  assert.match(login, /<SignedIn>/);
  assert.match(login, /<Navigate to=\{next\} replace \/>/);
  assert.doesNotMatch(login, /JYSON/);
  assert.doesNotMatch(login, /identity pool/);
  assert.doesNotMatch(login, /Sign in with ACCESS/);
  assert.doesNotMatch(login, /Continue on ACCESS/);
  assert.doesNotMatch(login, /SatelliteAuthRedirect/);
  assert.doesNotMatch(register, /Continue on ACCESS/);
  assert.doesNotMatch(login, /buildSignInUrl/);
  assert.doesNotMatch(login, /Redirecting to sign in/);
  assert.doesNotMatch(login, /AccessDoorPage/);

  assert.match(register, /<SignUp/);
  assert.match(register, /routing="hash"/);
  assert.match(register, /safeNextPath/);
  assert.match(register, /forceRedirectUrl=\{next\}/);
  assert.match(register, /<SignedIn>/);
  assert.match(register, /<Navigate to=\{next\} replace \/>/);
  assert.doesNotMatch(register, /SatelliteAuthRedirect/);
  assert.doesNotMatch(register, /buildSignUpUrl/);
  assert.doesNotMatch(register, /Redirecting to sign up/);
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

test("Early Support Sign in and Create account stay on Accounts Clerk", () => {
  const layout = readRepo("src/layouts/EarlySupportLayout/index.jsx");
  const success = readRepo("src/views/early-support/success.jsx");
  assert.match(layout, /to="\/auth\/login\?next=\/positions"/);
  assert.match(layout, /to="\/auth\/register\?next=\/positions"/);
  assert.doesNotMatch(layout, /accessSignInUrl/);
  assert.match(success, /to="\/auth\/register\?next=\/positions"/);
  assert.match(success, /to="\/auth\/login\?next=\/positions"/);
  assert.match(success, /Create an account to claim Positions/);
  assert.match(success, /earlySupportNavChrome/);
  assert.doesNotMatch(success, /SignedOut/);
});
