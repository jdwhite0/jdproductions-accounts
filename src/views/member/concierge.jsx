import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import { PageHead } from './_ui';

const TYPES = ['New project / venture', 'Change to an existing build', 'Technical support', 'Billing question', 'Something else'];
const ENDPOINT = 'https://app-iota-inky-62.vercel.app/api/concierge/lead';

export default function Concierge() {
  const { user } = useUser();
  const [type, setType] = useState(TYPES[0]);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');
  const submit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'member_dashboard', type, message,
          email: user?.primaryEmailAddress?.emailAddress, name: user?.fullName
        })
      });
      setStatus(res.ok ? 'sent' : 'error');
      if (res.ok) setMessage('');
    } catch { setStatus('error'); }
  };
  return (
    <Box>
      <PageHead eyebrow="Concierge" title="Talk to the studio." subtitle="Your direct line to JD Productions — requests, changes, and support, handled by the team that builds." />
      <Card variant="outlined" sx={{ borderRadius: 3, maxWidth: 680, mb: 3, background: 'linear-gradient(120deg,#002244,#001B36)' }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ color: '#fff' }}>Reach HQ directly.</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', mt: 0.5 }}>
                The front desk answers members first. Call or text — a real line into the studio.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5}>
              <Button variant="contained" color="secondary" href="tel:+16788463374" sx={{ color: '#002244', fontWeight: 700, whiteSpace: 'nowrap' }}>Call HQ</Button>
              <Button variant="outlined" href="sms:+16788463374" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>Text HQ</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 3, maxWidth: 680 }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          {status === 'sent' && <Alert severity="success" sx={{ mb: 2 }}>Got it — the studio will follow up shortly.</Alert>}
          {status === 'error' && <Alert severity="warning" sx={{ mb: 2 }}>Could not send right now. Email us at hello@jdproductions.io.</Alert>}
          <Stack component="form" spacing={2.5} onSubmit={submit}>
            <TextField select label="What do you need?" value={type} onChange={(e) => setType(e.target.value)} fullWidth>
              {TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField label="Tell us more" value={message} onChange={(e) => setMessage(e.target.value)} required multiline minRows={5} fullWidth placeholder="What are you trying to build or solve?" />
            <Box>
              <Button type="submit" variant="contained" color="primary" disabled={status === 'sending' || !message.trim()}>
                {status === 'sending' ? 'Sending…' : 'Send to the studio'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
