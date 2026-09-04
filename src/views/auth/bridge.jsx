import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

// Marketing iframe bridge — AGENTS.md §2.2. postMessage type `jdp_auth`.
// Do not change payload shape, type, or ALLOWED_ORIGINS without updating
// jdproductions-website (and AGENTS.md) in the same change.

const ALLOWED_ORIGINS = [
  'https://jdproductions.io',
  'https://www.jdproductions.io',
  'https://jdwhite.world',
  'https://www.jdwhite.world'
];

export default function AuthBridge() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    const payload = user
      ? {
          type: 'jdp_auth',
          signedIn: true,
          imageUrl: user.imageUrl || user.profileImageUrl || null,
          firstName: user.firstName || null,
          fullName: user.fullName || null
        }
      : { type: 'jdp_auth', signedIn: false };

    ALLOWED_ORIGINS.forEach((origin) => {
      try { window.parent.postMessage(payload, origin); } catch (_) {}
    });
  }, [isLoaded, user]);

  return null;
}
