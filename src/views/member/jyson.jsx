import { useEffect, useRef, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';

const API = 'https://app-iota-inky-62.vercel.app/api/saas/jyson';

const SUGGESTIONS = [
  'Map the system my business is missing',
  'How should I be using AI this quarter?',
  'Turn my idea into an operating plan',
  'What would JD Productions build for me?'
];

const PROFILES = [
  { id: 'balanced', label: 'Balanced', desc: 'Clear, helpful default' },
  { id: 'precise', label: 'Precise', desc: 'Tighter, more literal' },
  { id: 'creative', label: 'Creative', desc: 'Exploratory, expressive' },
  { id: 'builder', label: 'Builder', desc: 'Code & systems focus' }
];
const SPEEDS = [
  { id: 'max', label: 'Zin Max', desc: 'Deepest reasoning' },
  { id: 'fast', label: 'Zin Fast', desc: 'Fastest replies' }
];

/* ── prose renderer: bold/inline-code/fenced-code/lists — never shows raw ** ── */
function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function renderMarkdown(src) {
  const parts = src.split(/```/);
  let out = '';
  parts.forEach((seg, i) => {
    if (i % 2 === 1) {
      const nl = seg.indexOf('\n');
      const code = nl >= 0 ? seg.slice(nl + 1) : seg;
      out += `<pre class="jy-code"><code>${esc(code.replace(/\n$/, ''))}</code></pre>`;
    } else {
      let t = esc(seg)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*(?!\s)([^*]+?)\*(?!\*)/g, '$1<em>$2</em>')
        .replace(/`([^`]+?)`/g, '<code class="jy-inline">$1</code>');
      // hyphen lists
      t = t.replace(/(?:^|\n)- (.+)(?=\n|$)/g, (m, item) => `\n<li>${item}</li>`);
      t = t.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>').replace(/<\/ul>\s*<ul>/g, '');
      t = t.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br/>');
      out += `<p>${t}</p>`;
    }
  });
  return out;
}

export default function Jyson() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [images, setImages] = useState([]); // data URLs pending on the next send
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState(() => localStorage.getItem('jy_profile') || 'balanced');
  const [speed, setSpeed] = useState(() => localStorage.getItem('jy_speed') || 'max');
  const [anchor, setAnchor] = useState(null);
  const endRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);
  useEffect(() => { localStorage.setItem('jy_profile', profile); localStorage.setItem('jy_speed', speed); }, [profile, speed]);

  const addFiles = (files) => {
    Array.from(files).slice(0, 5).forEach((f) => {
      if (!f.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => setImages((im) => [...im, reader.result]);
      reader.readAsDataURL(f);
    });
  };

  const send = async (text) => {
    const content = (text || input).trim();
    if ((!content && images.length === 0) || busy) return;
    const userMsg = { role: 'user', content, images };
    const next = [...messages, userMsg];
    setMessages([...next, { role: 'assistant', content: '', streaming: true }]);
    setInput(''); setImages([]); setBusy(true);

    try {
      const token = await getToken();
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content, images: m.images })),
          profile, speed
        })
      });
      if (!res.body) throw new Error('no stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '', acc = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const m = line.match(/^data: (.*)$/s);
          if (!m) continue;
          if (m[1] === '[DONE]') continue;
          try {
            const d = JSON.parse(m[1]);
            if (d.text) { acc += d.text; setMessages((ms) => { const c = [...ms]; c[c.length - 1] = { role: 'assistant', content: acc, streaming: true }; return c; }); }
            else if (d.error && !acc) { acc = d.error; }
          } catch { /* ignore partial */ }
        }
      }
      setMessages((ms) => { const c = [...ms]; c[c.length - 1] = { role: 'assistant', content: acc || 'No response — try again.' }; return c; });
    } catch {
      setMessages((ms) => { const c = [...ms]; c[c.length - 1] = { role: 'assistant', content: 'Could not reach JYSON — check your connection and try again.' }; return c; });
    } finally { setBusy(false); }
  };

  const empty = messages.length === 0;
  const profLabel = PROFILES.find((p) => p.id === profile)?.label;
  const speedLabel = SPEEDS.find((s) => s.id === speed)?.label;

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', height: 'calc(100vh - 76px)', display: 'flex', flexDirection: 'column',
      background: 'radial-gradient(110% 90% at 50% 0%, #0d1b2e 0%, #060d18 55%, #04070d 100%)' }}
      onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(40% 30% at 50% 105%, rgba(255,194,14,0.10), transparent 70%)' }} />

      {/* session header + model settings */}
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: { xs: 2.5, md: 4 }, pt: 3, zIndex: 2 }}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#FFC20E', boxShadow: '0 0 12px rgba(255,194,14,0.8)' }} />
          <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, letterSpacing: '0.12em', fontSize: 13 }}>JYSON</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>· {user?.firstName || 'Member'}</Typography>
        </Stack>
        <Tooltip title="Model settings">
          <Box onClick={(e) => setAnchor(e.currentTarget)} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.75,
            px: 1.5, py: 0.6, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600 }}>Zin · {profLabel} · {speedLabel}</Typography>
            <Box component="span" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>▾</Box>
          </Box>
        </Tooltip>
        <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
          <Typography sx={{ px: 2, pt: 1, pb: 0.5, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'text.secondary' }}>SPEED</Typography>
          {SPEEDS.map((s) => (
            <MenuItem key={s.id} selected={speed === s.id} onClick={() => { setSpeed(s.id); setAnchor(null); }}>
              <ListItemText primary={s.label} secondary={s.desc} />
            </MenuItem>
          ))}
          <Typography sx={{ px: 2, pt: 1, pb: 0.5, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'text.secondary' }}>PROFILE</Typography>
          {PROFILES.map((p) => (
            <MenuItem key={p.id} selected={profile === p.id} onClick={() => { setProfile(p.id); setAnchor(null); }}>
              <ListItemText primary={p.label} secondary={p.desc} />
            </MenuItem>
          ))}
        </Menu>
      </Stack>

      {/* canvas */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2.5, md: 6 }, py: 3, display: 'flex', flexDirection: 'column', zIndex: 1 }}>
        {empty ? (
          <Stack sx={{ flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 2 }}>
            <Typography variant="h2" sx={{ color: '#fff', maxWidth: '18ch', fontWeight: 500 }}>
              What are we building{user?.firstName ? `, ${user.firstName}` : ''}?
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.45)', maxWidth: 460 }}>
              The intelligence that runs the studio — pointed at what you're building. Ask anything, drop in an image, or start below.
            </Typography>
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', justifyContent: 'center', mt: 1, maxWidth: 640 }}>
              {SUGGESTIONS.map((s) => (
                <Chip key={s} label={s} onClick={() => send(s)} sx={{ color: 'rgba(255,255,255,0.8)', bgcolor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.14)', '&:hover': { bgcolor: 'rgba(255,194,14,0.15)', borderColor: 'rgba(255,194,14,0.4)' } }} />
              ))}
            </Stack>
          </Stack>
        ) : (
          <Stack sx={{ gap: 2, maxWidth: 780, width: '100%', mx: 'auto' }}>
            {messages.map((m, i) => (
              <Box key={i} sx={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%',
                px: 2.25, py: 1.5, borderRadius: 3,
                ...(m.role === 'user'
                  ? { bgcolor: 'rgba(255,194,14,0.14)', border: '1px solid rgba(255,194,14,0.25)', color: '#fff' }
                  : { bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.92)' }) }}>
                {m.images?.length > 0 && (
                  <Stack direction="row" sx={{ gap: 1, mb: m.content ? 1 : 0, flexWrap: 'wrap' }}>
                    {m.images.map((src, k) => <Box key={k} component="img" src={src} sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 2 }} />)}
                  </Stack>
                )}
                {m.role === 'assistant'
                  ? <Box className="jy-prose" sx={{ '& p': { m: 0, mb: 1, lineHeight: 1.7, fontSize: 15 }, '& p:last-child': { mb: 0 },
                      '& ul': { m: '0 0 8px', pl: 2.5 }, '& li': { mb: 0.5, lineHeight: 1.6 },
                      '& strong': { fontWeight: 700, color: '#fff' }, '& em': { fontStyle: 'italic' },
                      '& .jy-inline': { bgcolor: 'rgba(255,255,255,0.12)', px: 0.6, py: 0.1, borderRadius: 1, fontFamily: 'monospace', fontSize: 13 },
                      '& .jy-code': { bgcolor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 2, p: 1.5, overflowX: 'auto', fontSize: 13, my: 1 } }}
                      dangerouslySetInnerHTML={{ __html: m.content ? renderMarkdown(m.content) : (m.streaming ? '<p style="opacity:.5">…</p>' : '') }} />
                  : <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 15 }}>{m.content}</Typography>}
              </Box>
            ))}
            <div ref={endRef} />
          </Stack>
        )}
      </Box>

      {/* prompt bar */}
      <Box sx={{ px: { xs: 2.5, md: 6 }, pb: 3.5, zIndex: 2 }}>
        {images.length > 0 && (
          <Stack direction="row" sx={{ gap: 1, maxWidth: 780, mx: 'auto', mb: 1, flexWrap: 'wrap' }}>
            {images.map((src, k) => (
              <Box key={k} sx={{ position: 'relative' }}>
                <Box component="img" src={src} sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.2)' }} />
                <IconButton size="small" onClick={() => setImages((im) => im.filter((_, j) => j !== k))}
                  sx={{ position: 'absolute', top: -8, right: -8, bgcolor: '#000', color: '#fff', width: 18, height: 18, fontSize: 12, '&:hover': { bgcolor: '#333' } }}>×</IconButton>
              </Box>
            ))}
          </Stack>
        )}
        <Box component="form" onSubmit={(e) => { e.preventDefault(); send(); }} sx={{ display: 'flex', alignItems: 'center', gap: 1, maxWidth: 780, mx: 'auto',
          bgcolor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 999, px: 1.5, py: 0.75, backdropFilter: 'blur(10px)',
          '&:focus-within': { borderColor: 'rgba(255,194,14,0.55)', boxShadow: '0 0 0 3px rgba(255,194,14,0.12)' } }}>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          <Tooltip title="Upload image">
            <IconButton onClick={() => fileRef.current?.click()} sx={{ color: 'rgba(255,255,255,0.6)', width: 36, height: 36, '&:hover': { color: '#FFC20E' } }}>
              <Box component="span" sx={{ fontSize: 20, lineHeight: 1 }}>＋</Box>
            </IconButton>
          </Tooltip>
          <InputBase fullWidth multiline maxRows={6} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask JYSON anything — or drop an image…"
            sx={{ color: '#fff', fontSize: 15, py: 0.5, '& textarea::placeholder': { color: 'rgba(255,255,255,0.35)' } }} />
          <IconButton type="submit" disabled={busy || (!input.trim() && images.length === 0)} sx={{ bgcolor: '#FFC20E', color: '#002244', width: 38, height: 38,
            '&:hover': { bgcolor: '#E0A500' }, '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.3)' } }}>
            <Box component="span" sx={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>↑</Box>
          </IconButton>
        </Box>
        <Typography sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 11, mt: 1.25 }}>
          JYSON by JD Productions · powered by Zin · for studio work, use Concierge
        </Typography>
      </Box>
    </Box>
  );
}
