import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { PageHead } from './_ui';

const RELEASES = [
  { date: 'Jun 2026', tag: 'New', title: 'JYSON in your account', body: "The studio's intelligence layer is now a workspace inside your dashboard — ask it anything about what you're building." },
  { date: 'Jun 2026', tag: 'New', title: 'The Mode, live in your account', body: 'Our daily intelligence brief now publishes straight to your dashboard, with a growing archive.' },
  { date: 'Jun 2026', tag: 'New', title: 'Concierge + front-desk line', body: 'A direct channel to the studio — submit requests, or call/text Atlanta HQ from inside the app.' },
  { date: 'Jun 2026', tag: 'Improved', title: 'Billing, done right', body: 'Live plans, upgrades, invoices, and secure card management through Stripe. Start, change, or cancel anytime.' },
  { date: 'Jun 2026', tag: 'Improved', title: 'Products unlock by plan', body: 'Your launchpad now shows exactly what your plan includes — and what one upgrade away unlocks.' }
];
const tone = { New: 'success', Improved: 'primary', Fixed: 'secondary' };

export default function Changelog() {
  return (
    <Box>
      <PageHead eyebrow="What's new" title="We ship constantly." subtitle="The studio builds its own systems in the open. Here's what's landed recently." />
      <Stack spacing={2} sx={{ maxWidth: 720 }}>
        {RELEASES.map((r, i) => (
          <Card key={i} variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 0.75 }}>
                <Chip label={r.tag} size="small" color={tone[r.tag] || 'default'} />
                <Typography variant="caption" color="text.secondary">{r.date}</Typography>
              </Stack>
              <Typography variant="h4" sx={{ mb: 0.5 }}>{r.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{r.body}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
