import { Outlet } from 'react-router-dom';

// @mui
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// @project
import LogoMain from '@/components/logo/LogoMain';

/***************************  AUTH LAYOUT  ***************************/

export default function AuthLayout() {
  return (
    <Grid container sx={{ height: '100vh' }}>
      <Grid size={{ xs: 12, md: 6, lg: 7 }} sx={{ p: { xs: 3, sm: 7 } }}>
        <Outlet />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 5 }} sx={{ bgcolor: 'grey.100', pt: 7, display: { xs: 'none', md: 'block' } }}>
        <Stack sx={{ height: 1, justifyContent: 'space-between', alignItems: 'center', px: 4 }}>
          <Stack sx={{ alignItems: 'center', gap: 2 }}>
            <LogoMain />
            <Typography variant="body2" color="grey.700" align="center" sx={{ maxWidth: 400 }}>
              JD Productions Accounts — your company login, membership, and Early Support home.
            </Typography>
          </Stack>
          <Box sx={{ width: 1, height: 200, bgcolor: 'grey.200', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="grey.600">Dashboard Preview</Typography>
          </Box>
        </Stack>
      </Grid>
    </Grid>
  );
}
