import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readRepo(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("ClerkProvider is NOT a satellite; sign-in/up stay on this origin", () => {
  const main = readRepo("src/main.jsx");
  assert.doesNotMatch(main, /isSatellite/);
  assert.doesNotMatch(main, /VITE_CLERK_DOMAIN/);
  assert.doesNotMatch(main, /VITE_CLERK_SIGN_IN_URL/);
  assert.doesNotMatch(main, /getaccess\.world\/sign-in/);
  assert.match(main, /signInUrl="\/auth\/login"/);
  assert.match(main, /signUpUrl="\/auth\/register"/);
  assert.match(main, /afterSignOutUrl="\/auth\/login"/);
});

test("login and register embed Clerk widgets (no satellite redirect)", () => {
  const login = readRepo("src/views/auth/login.jsx");
  const register = readRepo("src/views/auth/register.jsx");

  assert.match(login, /<SignIn[\s/>]/);
  assert.match(login, /safeNextPath/);
  assert.doesNotMatch(login, /SatelliteAuthRedirect/);
  assert.doesNotMatch(login, /buildSignInUrl/);
  assert.doesNotMatch(login, /Redirecting to sign in/);

  assert.match(register, /<SignUp[\s/>]/);
  assert.match(register, /safeNextPath/);
  assert.doesNotMatch(register, /SatelliteAuthRedirect/);
  assert.doesNotMatch(register, /buildSignUpUrl/);
});

test("satellite helper modules are gone", () => {
  assert.equal(fs.existsSync(path.join(root, "src/utils/clerk-satellite.js")), false);
  assert.equal(
    fs.existsSync(path.join(root, "src/views/auth/SatelliteAuthRedirect.jsx")),
    false,
  );
});

test(".env.example does not document satellite Clerk vars", () => {
  const example = readRepo(".env.example");
  assert.doesNotMatch(example, /VITE_CLERK_IS_SATELLITE/);
  assert.doesNotMatch(example, /VITE_CLERK_DOMAIN=/);
  assert.doesNotMatch(example, /VITE_CLERK_SIGN_IN_URL=/);
  assert.doesNotMatch(example, /VITE_CLERK_SIGN_UP_URL=/);
  assert.doesNotMatch(example, /sk_live_|sk_test_[A-Za-z0-9]{10,}/);
});
