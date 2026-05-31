'use client';

import type { ReactNode } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useColorMode } from '@/lib/theme/ColorModeContext';
import { UserSwitcher } from '@/features/auth/components/UserSwitcher';

/** Top nav + page container. Holds the brand wordmark and the theme toggle. */
export function AppShell({ children }: { children: ReactNode }) {
  const { mode, toggle } = useColorMode();
  const pathname = usePathname();

  const navSx = (active: boolean) => ({
    color: active ? 'text.primary' : 'text.secondary',
    fontWeight: active ? 700 : 400,
  });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ fontWeight: 800, letterSpacing: '0.5px', color: 'text.primary', mr: 3 }}
          >
            Knaq
          </Typography>
          <Stack direction="row" spacing={0.5}>
            <Button component={Link} href="/alerts" color="inherit" sx={navSx(pathname.startsWith('/alerts'))}>
              Queue
            </Button>
            <Button component={Link} href="/analytics" color="inherit" sx={navSx(pathname.startsWith('/analytics'))}>
              Analytics
            </Button>
          </Stack>
          <Box sx={{ flexGrow: 1 }} />
          <UserSwitcher />
          <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
            <IconButton onClick={toggle} color="inherit" aria-label="toggle color mode">
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {children}
      </Container>
    </Box>
  );
}
