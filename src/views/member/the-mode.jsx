import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import { PageHead } from './_ui';

const FEED = 'https://getaccess.world/api/public/brief';

export default function TheMode() {
  const [post, setPost] = useState(null);
  const [state, setState] = useState('loading');
  useEffect(() => {
    fetch(FEED, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { const p = d?.posts?.[0]; if (p) { setPost(p); setState('ok'); } else setState('empty'); })
      .catch(() => setState('error'));
  }, []);
  return (
    <Box>
      <PageHead eyebrow="The Mode" title="Today's intelligence." subtitle="The same daily brief the studio runs on — published to your account." />
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          {state === 'loading' && <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress size={28} /></Stack>}
          {state !== 'loading' && !post && <Typography color="text.secondary">A new brief publishes daily — check back shortly.</Typography>}
          {post && (
            <Box>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
                <Chip label={post.category} size="small" color="secondary" />
                <Typography variant="caption" color="text.secondary">{post.date} · {post.readTime}</Typography>
              </Stack>
              <Typography variant="h2" sx={{ mb: 2 }}>{post.title}</Typography>
              <Box sx={{ '& h2': { fontSize: 20, fontWeight: 600, mt: 3, mb: 1 }, '& p': { color: 'text.secondary', lineHeight: 1.8, mb: 1.5 }, '& ul': { color: 'text.secondary', lineHeight: 1.8 }, '& a': { color: 'primary.main' } }}
                dangerouslySetInnerHTML={{ __html: post.bodyHtml || `<p>${post.excerpt || ''}</p>` }} />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
