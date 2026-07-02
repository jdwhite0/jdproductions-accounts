// @mui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// @project
import MainCard from '@/components/MainCard';
import { useNavigate } from 'react-router-dom';
import useSubscription from '@/hooks/useSubscription';
import { PLAN_ORDER, PLAN_META } from '@/config/entitlements';

/***************************  DRAWER CONTENT - UPGRADE CARD (plan-aware)  ***************************/

export default function NavCard() {
  const navigate = useNavigate();
  const { plan, isLoading } = useSubscription();

  // On the top plan (or still loading) → nothing to upsell.
  if (isLoading || plan === PLAN_ORDER[PLAN_ORDER.length - 1]) return null;

  const nextId = plan ? PLAN_ORDER[PLAN_ORDER.indexOf(plan) + 1] : PLAN_ORDER[0];
  const next = PLAN_META[nextId];
  const headline = plan ? `Upgrade to ${next.name}` : 'Activate your plan';
  const copy = plan
    ? `${next.name} adds automation, AI, and deeper support.`
    : 'Unlock products, services, and the studio behind them.';

  return (
    <MainCard sx={{ p: 2, mb: 3, boxShadow: 'none', background: 'linear-gradient(135deg,#002244,#001B36)', border: 'none' }}>
      <Stack sx={{ gap: 1.25, alignItems: 'flex-start' }}>
        <Box sx={{ px: 1, py: 0.25, borderRadius: 1, bgcolor: 'secondary.main' }}>
          <Typography variant="caption" sx={{ color: '#002244', fontWeight: 700, letterSpacing: '0.04em' }}>
            {plan ? `${PLAN_META[plan]?.name} → ${next.name}` : 'GET STARTED'}
          </Typography>
        </Box>
        <Typography variant="subtitle1" sx={{ color: '#fff' }}>{headline}</Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>{copy}</Typography>
        <Button variant="contained" color="secondary" size="small" onClick={() => navigate('/billing')} sx={{ mt: 0.5, color: '#002244', fontWeight: 700 }}>
          {plan ? `Upgrade — $${next.price.toLocaleString()}/mo` : 'See plans'}
        </Button>
      </Stack>
    </MainCard>
  );
}
