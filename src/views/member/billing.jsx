import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { PageHead, Grid } from './_ui';
import useSubscription, { useBillingActions } from '@/hooks/useSubscription';
import { PLAN_META, PLAN_ORDER } from '@/config/entitlements';

const statusTone = { active: 'success', trialing: 'success', past_due: 'warning', paid: 'success', open: 'warning' };

export default function Billing() {
  const { sub, plan, planName, invoices, isLoading, error } = useSubscription();
  const { checkout, portal } = useBillingActions();
  const [busy, setBusy] = useState('');
  const qs = new URLSearchParams(window.location.search);
  const justPaid = qs.get('status') === 'success';

  const act = async (fn, key, arg) => { setBusy(key); try { await fn(arg); } finally { setBusy(''); } };

  return (
    <Box>
      <PageHead eyebrow="Billing & Payments" title="Your plan & payments." subtitle="Live from Stripe — manage your subscription, payment method, and invoices." />
      {justPaid && <Alert severity="success" sx={{ mb: 3 }}>Payment received — welcome aboard. Your plan is now active.</Alert>}
      {error && <Alert severity="warning" sx={{ mb: 3 }}>Could not reach billing right now. Try again shortly.</Alert>}

      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress size={30} /></Stack>
      ) : plan ? (
        <>
          <Grid min={300} sx={{ mb: 3 }}>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h4">Current plan</Typography>
                  <Chip label={sub.status} size="small" color={statusTone[sub.status] || 'default'} />
                </Stack>
                <Typography variant="h2" color="primary.main">{planName}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  ${PLAN_META[plan]?.price.toLocaleString()} / month{sub.renewsAt ? ` · ${sub.cancelAtPeriodEnd ? 'ends' : 'renews'} ${sub.renewsAt}` : ''}
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  <Button variant="contained" color="primary" disabled={busy === 'portal'} onClick={() => act(portal, 'portal')}>
                    {busy === 'portal' ? 'Opening…' : 'Manage subscription'}
                  </Button>
                  {PLAN_ORDER.indexOf(plan) < PLAN_ORDER.length - 1 && (
                    <Button variant="outlined" color="primary" disabled={!!busy} onClick={() => act(checkout, 'up', PLAN_ORDER[PLAN_ORDER.indexOf(plan) + 1])}>
                      Upgrade to {PLAN_META[PLAN_ORDER[PLAN_ORDER.indexOf(plan) + 1]].name}
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h4" sx={{ mb: 1 }}>Payment method</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Cards, receipts, and cancellation are handled securely in the Stripe portal.
                </Typography>
                <Button variant="outlined" color="primary" disabled={busy === 'portal2'} onClick={() => act(portal, 'portal2')}>Open billing portal</Button>
              </CardContent>
            </Card>
          </Grid>
        </>
      ) : (
        <Card variant="outlined" sx={{ borderRadius: 3, mb: 3, background: 'linear-gradient(120deg,#002244,#001B36)' }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Typography variant="h3" sx={{ color: '#fff', mb: 1 }}>Choose your plan.</Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3, maxWidth: 560 }}>
              Every plan is a system we design, build, and operate with you. Start where you are — upgrade as it compounds.
            </Typography>
            <Grid min={220}>
              {PLAN_ORDER.map((id) => (
                <Card key={id} sx={{ borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <CardContent>
                    <Typography variant="h4" sx={{ color: id === 'grow' ? 'secondary.main' : '#fff' }}>{PLAN_META[id].name}</Typography>
                    <Typography variant="h3" sx={{ color: '#fff', my: 1 }}>${PLAN_META[id].price.toLocaleString()}<Typography component="span" sx={{ color: 'rgba(255,255,255,0.6)' }}> /mo</Typography></Typography>
                    <Button fullWidth variant={id === 'grow' ? 'contained' : 'outlined'} color="secondary" disabled={!!busy}
                      sx={id !== 'grow' ? { color: '#fff', borderColor: 'rgba(255,255,255,0.4)' } : { color: '#002244', fontWeight: 700 }}
                      onClick={() => act(checkout, id, id)}>
                      {busy === id ? 'Redirecting…' : `Start ${PLAN_META[id].name}`}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      <Card variant="outlined" sx={{ borderRadius: 3, mb: 3, borderColor: 'secondary.main' }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
            <Box>
              <Typography variant="h4">Give a month, get a month.</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 480 }}>
                Know a founder who should be building with the studio? Send them your referral — when they subscribe, you both get a month free. Codes apply at checkout.
              </Typography>
            </Box>
            <Button variant="outlined" color="primary" sx={{ whiteSpace: 'nowrap' }}
              href={`mailto:?subject=${encodeURIComponent('You should see what JD Productions builds')}&body=${encodeURIComponent('I use JD Productions — an AI-native venture studio that builds and operates real systems. Start here: https://accounts.jdproductions.io/auth/register — mention my name at checkout and we both get a month free.')}`}>
              Share your referral
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h4" sx={{ mb: 1 }}>Invoices</Typography>
          {invoices.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ py: 1.5 }}>No invoices yet — they'll appear here after your first payment.</Typography>}
          {invoices.map((inv, i) => (
            <Box key={inv.id}>
              {i > 0 && <Divider />}
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{inv.id}</Typography>
                  <Typography variant="caption" color="text.secondary">{inv.date}</Typography>
                </Box>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Typography variant="body2">${inv.amount}</Typography>
                  <Chip label={inv.status} size="small" color={statusTone[inv.status] || 'default'} variant="outlined" />
                  {inv.url && <Button size="small" variant="text" color="primary" href={inv.url} target="_blank">Receipt</Button>}
                </Stack>
              </Stack>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}
