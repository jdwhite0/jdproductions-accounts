import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import './index.css';
import App from './App';

/* simpebar styles */
import 'simplebar-react/dist/simplebar.min.css';

// Archivo
import '@fontsource/archivo/400.css';
import '@fontsource/archivo/500.css';
import '@fontsource/archivo/600.css';
import '@fontsource/archivo/700.css';

// Same Clerk instance as ACCESS — consume this key only. Never edit Clerk apps,
// redirects, or the pool (AGENTS.md §2.1). pk_test / mighty-owl-15 is frozen.
// Clerk cannot register accounts.jdproductions.io as a satellite
// (reserved_subdomain). This origin hosts its own SignIn/SignUp so the SaaS
// portal gets a first-party session. Do not set isSatellite.
const ACCESS_LIVE_PK = 'pk_live_Y2xlcmsuZ2V0YWNjZXNzLndvcmxkJA';
const rawKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ACCESS_LIVE_PK;
const PUBLISHABLE_KEY = rawKey.startsWith('pk_live_') ? rawKey : ACCESS_LIVE_PK;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/auth/login"
      signInUrl="/auth/login"
      signUpUrl="/auth/register"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <App />
    </ClerkProvider>
  </StrictMode>
);
