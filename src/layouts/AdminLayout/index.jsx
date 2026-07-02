import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import useMediaQuery from '@mui/material/useMediaQuery';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';

// @project
import Drawer from './Drawer';
import Header from './Header';
import { handlerDrawerOpen, useGetMenuMaster } from '@/states/menu';
import Breadcrumbs from '@/components/Breadcrumbs';
import Loader from '@/components/Loader';

import { DRAWER_WIDTH } from '@/config';

/***************************  ADMIN LAYOUT  ***************************/

export default function DashboardLayout() {
  const { menuMasterLoading } = useGetMenuMaster();

  const downXL = useMediaQuery((theme) => theme.breakpoints.down('xl'));
  // Full-bleed routes fill the content region edge-to-edge (no Container/padding gutter).
  const { pathname } = useLocation();
  const fullBleed = ['/jyson'].includes(pathname);

  useEffect(() => {
    handlerDrawerOpen(!downXL);
  }, [downXL]);

  if (menuMasterLoading) return <Loader />;

  return (
    <Stack direction="row" sx={{ width: 1 }}>
      <Header />
      <Drawer />
      <Box component="main" sx={{ width: `calc(100% - ${DRAWER_WIDTH}px)`, flexGrow: 1, p: fullBleed ? 0 : { xs: 2, sm: 3 } }}>
        <Toolbar sx={{ minHeight: { xs: 54, sm: 46, md: 76 } }} />
        {!fullBleed && (
          <Box
            sx={{
              py: 0.4,
              px: 1.5,
              mx: { xs: -2, sm: -3 },
              display: { xs: 'block', md: 'none' },
              borderBottom: 1,
              borderColor: 'divider',
              mb: 2
            }}
          >
            <Breadcrumbs />
          </Box>
        )}
        {fullBleed ? (
          <Outlet />
        ) : (
          <Container maxWidth="lg" sx={{ px: { xs: 0, sm: 2 } }}>
            <Outlet />
          </Container>
        )}
      </Box>
    </Stack>
  );
}
