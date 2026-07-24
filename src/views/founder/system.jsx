import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import { PageHead, Grid, StatCard } from '@/views/member/_ui';

const ACCESS = import.meta.env.VITE_ACCESS_URL || 'https://getaccess.world';

const DEPLOYMENTS = [
  { name: 'accounts.jdproductions.io', repo: 'jdproductions-saas (Vite/React)', url: 'https://vercel.com/jd-white-s-projects' },
  { name: 'getaccess.world', repo: 'access-app (Next.js)', url: 'https://vercel.com/jd-white-s-projects/app' },
  { name: 'jdproductions.io', repo: 'jdproductions-website (static)', url: 'https://vercel.com/jd-white-s-projects' },
  { name: 'jdwhite.world', repo: 'jdwhite-world (static)', url: 'https://vercel.com/jd-white-s-projects' },
  { name: 'jyson.vercel.app', repo: 'jyson (Vite/React)', url: 'https://vercel.com/jd-white-s-projects' },
];

const ENV_SERVICES = [
  { name: 'Clerk', env: 'mighty-owl-15 (dev instance)', link: 'https://dashboard.clerk.com' },
  { name: 'Stripe', env: 'Live mode — sk_live_51RpDLk…', link: 'https://dashboard.stripe.com' },
  { name: 'Supabase', env: 'flxlusqktlstjvjusbpz', link: 'https://supabase.com/dashboard/project/flxlusqktlstjvjusbpz' },
  { name: 'Resend', env: 'jdwhite.world domain verified', link: 'https://resend.com/domains' },
  { name: 'Ollama', env: 'qwen2.5-coder:7b — local', link: null },
];

export default function FounderSystem() {
  const [briefOk, setBriefOk] = useState(null);

  useEffect(() => {
    fetch(`${ACCESS}/api/public/brief`, { cache: 'no-store' })
      .then((r) => setBriefOk(r.ok))
      .catch(() => setBriefOk(false));
  }, []);

  return (
    <Box>
      <PageHead eyebrow="System" title="Platform infrastructure." subtitle="Every deployment, service, and integration that powers the JD ecosystem." />

      <Grid min={200} sx={{ mb: 3 }}>
        <StatCard label="Deployments" value={DEPLOYMENTS.length} hint="Active Vercel projects" accent="primary.main" />
        <StatCard label="Auth" value="Clerk" hint="Shared instance across all apps" />
        <StatCard label="The Mode" value={briefOk === null ? '…' : briefOk ? 'Live' : 'Error'} hint="Public brief API" accent={briefOk === false ? 'error.main' : 'secondary.dark'} />
        <StatCard label="Local AI" value="Ollama" hint="qwen2.5-coder:7b" />
      </Grid>

      <Grid min={320} sx={{ mb: 3 }}>
        {/* Deployments */}
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h4" sx={{ mb: 2 }}>Deployments</Typography>
            {DEPLOYMENTS.map((d, i) => (
              <Box key={d.name}>
                {i > 0 && <Divider />}
                <Stack sx={{ py: 1.1 }}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.name}</Typography>
                    <Chip label="Live" size="small" color="success" variant="outlined" />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">{d.repo}</Typography>
                </Stack>
              </Box>
            ))}
          </CardContent>
        </Card>

        {/* Services */}
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h4" sx={{ mb: 2 }}>Services & integrations</Typography>
            {ENV_SERVICES.map((s, i) => (
              <Box key={s.name}>
                {i > 0 && <Divider />}
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', py: 1.1 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{s.env}</Typography>
                  </Box>
                  {s.link && (
                    <Button size="small" variant="text" href={s.link} target="_blank" rel="noopener">Open</Button>
                  )}
                </Stack>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Box>
  );
}
