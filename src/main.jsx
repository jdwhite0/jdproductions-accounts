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

// Clerk publishable key is public by design; inline fallback guarantees the prod
// build always has it even if the build env var isn't injected.
// Same Clerk instance as ACCESS — consume this key only. Never edit Clerk apps,
// redirects, or the pool (AGENTS.md §2.1).
// Accounts is a satellite of the ACCESS primary. Sign-in / sign-up happen on
// getaccess.world; /auth/login and /auth/register redirect there and return
// with the synced session. Satellite domain + DNS still required in Clerk.
const PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_bWlnaHR5LW93bC0xNS5jbGVyay5hY2NvdW50cy5kZXYk';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      isSatellite={true}
      domain={import.meta.env.VITE_CLERK_DOMAIN || 'accounts.jdproductions.io'}
      signInUrl={import.meta.env.VITE_CLERK_SIGN_IN_URL || 'https://getaccess.world/sign-in'}
      signUpUrl={import.meta.env.VITE_CLERK_SIGN_UP_URL || 'https://getaccess.world/sign-up'}
      afterSignOutUrl="/auth/login"
    >
      <App />
    </ClerkProvider>
  </StrictMode>
);
