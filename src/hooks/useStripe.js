import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

const ACCESS = import.meta.env.VITE_ACCESS_URL || 'https://getaccess.world';
const SUCCESS = import.meta.env.VITE_STRIPE_SUCCESS_URL || 'https://accounts.jdproductions.io/billing';
const CANCEL  = import.meta.env.VITE_STRIPE_CANCEL_URL  || 'https://accounts.jdproductions.io/billing';

export default function useStripe() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function startCheckout(plan, interval = 'month') {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${ACCESS}/api/stripe/checkout/cross-origin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan, interval, successUrl: SUCCESS, cancelUrl: CANCEL }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Failed to start checkout.');
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setLoading(false);
    }
  }

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${ACCESS}/api/stripe/portal/cross-origin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ returnUrl: 'https://accounts.jdproductions.io/billing' }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Failed to open portal.');
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setLoading(false);
    }
  }

  return { startCheckout, openPortal, loading, error };
}
