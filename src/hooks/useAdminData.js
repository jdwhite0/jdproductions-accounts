import useSWR from 'swr';
import { useAuth } from '@clerk/clerk-react';

const API = 'https://getaccess.world/api/saas/admin';

/** Founder-only live data: accounts, plan counts, MRR. */
export default function useAdminData() {
  const { getToken, isSignedIn } = useAuth();
  return useSWR(isSignedIn ? API : null, async (url) => {
    const token = await getToken();
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('admin fetch failed');
    return res.json();
  }, { revalidateOnFocus: false });
}
