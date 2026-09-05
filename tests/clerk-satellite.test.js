import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { satelliteReturnUrl } from "../src/utils/clerk-satellite.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readRepo(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("satelliteReturnUrl builds an absolute return URL on this origin", () => {
  assert.equal(
    satelliteReturnUrl("https://accounts.jdproductions.io", "/positions"),
    "https://accounts.jdproductions.io/positions",
  );
  assert.equal(
    satelliteReturnUrl("https://invest.jdproductions.io", "/dashboard"),
    "https://invest.jdproductions.io/dashboard",
  );
  assert.equal(
    satelliteReturnUrl("https://accounts.jdproductions.io", "not-a-path"),
    "https://accounts.jdproductions.io/dashboard",
  );
  assert.equal(satelliteReturnUrl("", "/positions"), "/positions");
});

test("ClerkProvider is a satellite of the ACCESS primary", () => {
  const main = readRepo("src/main.jsx");
  assert.match(main, /isSatellite=\{true\}/);
  assert.match(
    main,
    /domain=\{import\.meta\.env\.VITE_CLERK_DOMAIN \|\| 'accounts\.jdproductions\.io'\}/,
  );
  assert.match(
    main,
    /signInUrl=\{import\.meta\.env\.VITE_CLERK_SIGN_IN_URL \|\| 'https:\/\/getaccess\.world\/sign-in'\}/,
  );
  assert.match(
    main,
    /signUpUrl=\{import\.meta\.env\.VITE_CLERK_SIGN_UP_URL \|\| 'https:\/\/getaccess\.world\/sign-up'\}/,
  );
  assert.match(main, /afterSignOutUrl="\/auth\/login"/);
  assert.doesNotMatch(main, /signInUrl="\/auth\/login"/);
  assert.doesNotMatch(main, /signUpUrl="\/auth\/register"/);
});

test("login and register redirect to primary instead of embedding Clerk widgets", () => {
  const login = readRepo("src/views/auth/login.jsx");
  const register = readRepo("src/views/auth/register.jsx");
  const redirect = readRepo("src/views/auth/SatelliteAuthRedirect.jsx");

  assert.match(login, /SatelliteAuthRedirect/);
  assert.match(login, /mode="signin"/);
  assert.match(login, /safeNextPath/);
  assert.doesNotMatch(login, /<SignIn/);

  assert.match(register, /SatelliteAuthRedirect/);
  assert.match(register, /mode="signup"/);
  assert.match(register, /safeNextPath/);
  assert.doesNotMatch(register, /<SignUp/);

  assert.match(redirect, /buildSignInUrl/);
  assert.match(redirect, /buildSignUpUrl/);
  assert.match(redirect, /satelliteReturnUrl/);
  assert.doesNotMatch(redirect, /<SignIn/);
  assert.doesNotMatch(redirect, /<SignUp/);
});

test(".env.example documents satellite Clerk vars without secrets", () => {
  const example = readRepo(".env.example");
  assert.match(example, /VITE_CLERK_IS_SATELLITE=true/);
  assert.match(example, /VITE_CLERK_DOMAIN=accounts\.jdproductions\.io/);
  assert.match(example, /VITE_CLERK_SIGN_IN_URL=https:\/\/getaccess\.world\/sign-in/);
  assert.match(example, /VITE_CLERK_SIGN_UP_URL=https:\/\/getaccess\.world\/sign-up/);
  assert.doesNotMatch(example, /sk_live_|sk_test_[A-Za-z0-9]{10,}/);
});
