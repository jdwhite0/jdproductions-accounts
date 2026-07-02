import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import { useNavigate } from 'react-router-dom';
import { PageHead, Grid } from './_ui';

const FAQ = [
  { q: 'How do I start a project with the studio?', a: 'Open Concierge in the sidebar and tell us what you need. Every request routes straight to the JD Productions team — new builds, changes, or questions.' },
  { q: 'What does my plan include?', a: 'LAUNCH gets a real system live fast; GROW adds automation, AI, and deeper support; SCALE is enterprise-grade architecture and a dedicated manager. Manage or change your plan anytime under Billing.' },
  { q: 'What is JYSON?', a: "It's the intelligence layer that runs the studio — now in your account. Ask it about systems, positioning, growth, or how to use JD Productions to build what you're working on." },
  { q: 'What is The Mode?', a: 'Our daily intelligence brief — the same signal the studio runs on, published to your account and inbox each day.' },
  { q: 'How do I cancel or change billing?', a: 'Billing → Manage subscription opens the secure Stripe portal where you can update your card, download receipts, or cancel — no lock-in.' }
];

export default function Support() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(-1);
  return (
    <Box>
      <PageHead eyebrow="Support" title="We're here — and easy to reach." subtitle="Members get the studio's direct attention. Start below or call the front desk." />
      <Grid min={260} sx={{ mb: 3 }}>
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Concierge</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Requests, changes, and support — handled by the team that builds.</Typography>
            <Button variant="contained" color="primary" onClick={() => navigate('/concierge')}>Open Concierge</Button>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ borderRadius: 3, background: 'linear-gradient(120deg,#002244,#001B36)' }}>
          <CardContent>
            <Typography variant="h4" sx={{ color: '#fff', mb: 0.5 }}>Call the front desk</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>Atlanta HQ · members answered first.</Typography>
            <Stack direction="row" spacing={1.5}>
              <Button variant="contained" color="secondary" href="tel:+16788463374" sx={{ color: '#002244', fontWeight: 700 }}>Call HQ</Button>
              <Button variant="outlined" href="sms:+16788463374" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}>Text</Button>
            </Stack>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Email</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Prefer email? Reach the studio directly.</Typography>
            <Button variant="outlined" color="primary" href="mailto:hello@jdproductions.io">hello@jdproductions.io</Button>
          </CardContent>
        </Card>
      </Grid>
      <Card variant="outlined" sx={{ borderRadius: 3, maxWidth: 760 }}>
        <CardContent>
          <Typography variant="h4" sx={{ mb: 1 }}>Frequently asked</Typography>
          {FAQ.map((f, i) => (
            <Box key={i}>
              {i > 0 && <Divider />}
              <Box sx={{ py: 1.75, cursor: 'pointer' }} onClick={() => setOpen(open === i ? -1 : i)}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{f.q}</Typography>
                  <Typography sx={{ color: 'text.secondary' }}>{open === i ? '–' : '+'}</Typography>
                </Stack>
                <Collapse in={open === i}>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>{f.a}</Typography>
                </Collapse>
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}
