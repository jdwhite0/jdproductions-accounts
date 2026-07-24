import useSWR from 'swr';
import { useAuth } from '@clerk/clerk-react';

const API = 'https://getaccess.world/api/saas';

/** Live subscription state from Stripe (via access-app). */
export default function useSubscription() {
  const { getToken, isSignedIn } = useAuth();
  const { data, error, isLoading, mutate } = useSWR(
    isSignedIn ? `${API}/subscription` : null,
    async (url) => {
      const token = await getToken();
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('subscription fetch failed');
      return res.json();
    },
    { revalidateOnFocus: false }
  );
  return {
    sub: data || null,
    plan: data?.plan?.id || null,
    planName: data?.plan?.name || null,
    invoices: data?.invoices || [],
    isLoading,
    error,
    refresh: mutate
  };
}

/** POST helper for checkout/portal — returns Stripe URL and redirects. */
export function useBillingActions() {
  const { getToken } = useAuth();
  const post = async (path, body) => {
    const token = await getToken();
    const res = await fetch(`${API}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body || {})
    });
    const d = await res.json().catch(() => ({}));
    if (d.url) window.location.href = d.url;
    return d;
  };
  return {
    checkout: (plan) => post('checkout', { plan }),
    portal: () => post('portal')
  };
}
