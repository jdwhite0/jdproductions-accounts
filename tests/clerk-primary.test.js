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
  assert.match(main, /signInUrl="\/auth\/login"/);
  assert.match(main, /signUpUrl="\/auth\/register"/);
  assert.match(main, /afterSignOutUrl="\/auth\/login"/);
  assert.match(main, /pk_live_/);
});

test("login and register are ACCESS doors, not embedded Clerk widgets", () => {
  const login = readRepo("src/views/auth/login.jsx");
  const register = readRepo("src/views/auth/register.jsx");

  assert.doesNotMatch(login, /<SignIn/);
  assert.doesNotMatch(register, /<SignUp/);
  assert.match(login, /accessSignInUrl/);
  assert.match(register, /accessWaitlistUrl/);
  assert.doesNotMatch(login, /SatelliteAuthRedirect/);
  assert.doesNotMatch(login, /buildSignInUrl/);
  assert.doesNotMatch(login, /AccessDoorPage/);
  assert.doesNotMatch(register, /SatelliteAuthRedirect/);
  assert.doesNotMatch(register, /buildSignUpUrl/);
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

test("Early Support Sign in stays on Accounts /auth/login", () => {
  const layout = readRepo("src/layouts/EarlySupportLayout/index.jsx");
  assert.match(layout, /to="\/auth\/login\?next=\/positions"/);
  assert.doesNotMatch(layout, /accessSignInUrl/);
});
