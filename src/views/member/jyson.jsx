import { useEffect, useRef, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';

const API = 'https://app-iota-inky-62.vercel.app/api/saas/jyson';

const SUGGESTIONS = [
  'Map the system my business is missing',
  'How should I be using AI this quarter?',
  'Turn my idea into an operating plan',
  'What would JD Productions build for me?'
];

/**
 * JYSON — the AI as the workspace (Runway-style session):
 * dark cinematic canvas, minimal chrome, the prompt front and center.
 */
export default function Jyson() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  const send = async (text) => {
    const content = (text || input).trim();
    if (!content || busy) return;
    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const token = await getToken();
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) })
      });
      const d = await res.json().catch(() => ({}));
      setMessages((m) => [...m, { role: 'assistant', content: d.reply || d.error || 'Something went sideways — try again.' }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Could not reach JYSON — check your connection and try again.' }]);
    } finally { setBusy(false); }
  };

  const empty = messages.length === 0;

  return (
    <Box sx={{
      position: 'relative', overflow: 'hidden',
      height: 'calc(100vh - 76px)', display: 'flex', flexDirection: 'column',
      background: 'radial-gradient(110% 90% at 50% 0%, #0d1b2e 0%, #060d18 55%, #04070d 100%)'
    }}>
      {/* ambient glow */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(40% 30% at 50% 105%, rgba(255,194,14,0.10), transparent 70%)' }} />

      {/* session header */}
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: { xs: 2.5, md: 4 }, pt: 3 }}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#FFC20E', boxShadow: '0 0 12px rgba(255,194,14,0.8)' }} />
          <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, letterSpacing: '0.12em', fontSize: 13 }}>JYSON</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>Session · {user?.firstName || 'Member'}</Typography>
        </Stack>
        <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Intelligence that operates</Typography>
      </Stack>

      {/* canvas */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2.5, md: 6 }, py: 3, display: 'flex', flexDirection: 'column' }}>
        {empty ? (
          <Stack sx={{ flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 2 }}>
            <Typography variant="h2" sx={{ color: '#fff', maxWidth: '18ch', fontWeight: 500 }}>
              What are we building{user?.firstName ? `, ${user.firstName}` : ''}?
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.45)', maxWidth: 460 }}>
              The same intelligence that runs the studio — pointed at what you're building.
            </Typography>
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', justifyContent: 'center', mt: 1, maxWidth: 640 }}>
              {SUGGESTIONS.map((s) => (
                <Chip key={s} label={s} onClick={() => send(s)} sx={{
                  color: 'rgba(255,255,255,0.8)', bgcolor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.14)', '&:hover': { bgcolor: 'rgba(255,194,14,0.15)', borderColor: 'rgba(255,194,14,0.4)' }
                }} />
              ))}
            </Stack>
          </Stack>
        ) : (
          <Stack sx={{ gap: 2, maxWidth: 760, width: '100%', mx: 'auto' }}>
            {messages.map((m, i) => (
              <Box key={i} sx={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                px: 2.25, py: 1.5, borderRadius: 3,
                ...(m.role === 'user'
                  ? { bgcolor: 'rgba(255,194,14,0.14)', border: '1px solid rgba(255,194,14,0.25)', color: '#fff' }
                  : { bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.92)' })
              }}>
                <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 15 }}>{m.content}</Typography>
              </Box>
            ))}
            {busy && <CircularProgress size={18} sx={{ color: '#FFC20E', ml: 1 }} />}
            <div ref={endRef} />
          </Stack>
        )}
      </Box>

      {/* prompt bar — front and center */}
      <Box sx={{ px: { xs: 2.5, md: 6 }, pb: 3.5 }}>
        <Box component="form" onSubmit={(e) => { e.preventDefault(); send(); }} sx={{
          display: 'flex', alignItems: 'center', gap: 1, maxWidth: 760, mx: 'auto',
          bgcolor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)',
          borderRadius: 999, px: 2.5, py: 0.75,
          backdropFilter: 'blur(10px)',
          '&:focus-within': { borderColor: 'rgba(255,194,14,0.55)', boxShadow: '0 0 0 3px rgba(255,194,14,0.12)' }
        }}>
          <InputBase fullWidth value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Ask JYSON anything about what you're building…"
            sx={{ color: '#fff', fontSize: 15, py: 1, '& input::placeholder': { color: 'rgba(255,255,255,0.35)' } }} />
          <IconButton type="submit" disabled={busy || !input.trim()} sx={{
            bgcolor: '#FFC20E', color: '#002244', width: 38, height: 38,
            '&:hover': { bgcolor: '#E0A500' }, '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.3)' }
          }}>
            <Box component="span" sx={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>↑</Box>
          </IconButton>
        </Box>
        <Typography sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 11, mt: 1.25 }}>
          JYSON by JD Productions · For studio work, use Concierge
        </Typography>
      </Box>
    </Box>
  );
}
