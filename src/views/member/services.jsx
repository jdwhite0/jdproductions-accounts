import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import { PageHead, Grid } from './_ui';

const tone = { Operating: 'success', 'In build': 'secondary', Scoping: 'default', Delivered: 'primary' };

export default function Services() {
  const { user } = useUser();
  const navigate = useNavigate();
  // Services are assigned by the studio via Clerk publicMetadata.services
  const services = user?.publicMetadata?.services || [];
  return (
    <Box>
      <PageHead eyebrow="My Services" title="What we're building for you." subtitle="Every engagement is a system we design, build, and operate with you." />
      {services.length === 0 ? (
        <Card variant="outlined" sx={{ borderRadius: 3, maxWidth: 640 }}>
          <CardContent sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ mb: 1 }}>No active services yet.</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              When the studio starts a build for you, it shows up here with live status. Tell us what you need and we'll scope it.
            </Typography>
            <Button variant="contained" color="primary" onClick={() => navigate('/concierge')}>Start with Concierge</Button>
          </CardContent>
        </Card>
      ) : (
        <Grid min={320}>
          {services.map((s) => (
            <Card key={s.name} variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h4">{s.name}</Typography>
                  <Chip label={s.status} size="small" color={tone[s.status] || 'default'} />
                </Stack>
                {s.note && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{s.note}</Typography>}
                {typeof s.progress === 'number' && (
                  <>
                    <LinearProgress variant="determinate" value={s.progress} sx={{ height: 8, borderRadius: 4 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>{s.progress}% complete</Typography>
                  </>
                )}
                {Array.isArray(s.milestones) && s.milestones.length > 0 && (
                  <Box sx={{ mt: 2.5, pl: 0.5 }}>
                    {s.milestones.map((m, mi) => (
                      <Stack key={mi} direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', position: 'relative', pb: mi < s.milestones.length - 1 ? 2 : 0 }}>
                        <Box sx={{ mt: '5px', width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                          bgcolor: m.done ? 'success.main' : 'grey.400',
                          boxShadow: m.done ? '0 0 0 3px rgba(34,137,47,0.15)' : 'none' }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: m.done ? 'text.primary' : 'text.secondary' }}>{m.title}</Typography>
                          {m.date && <Typography variant="caption" color="text.secondary">{m.date}</Typography>}
                        </Box>
                      </Stack>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Grid>
      )}
    </Box>
  );
}
