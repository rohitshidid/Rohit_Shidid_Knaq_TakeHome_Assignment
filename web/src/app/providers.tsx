'use client';

import type { ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from '@/lib/store/store';
import { theme } from '@/lib/theme/theme';

/**
 * Client-side provider stack. Lives in its own 'use client' module so the
 * root layout can stay a Server Component.
 *
 * - ReduxProvider: makes the store (and RTK Query cache) available app-wide.
 * - AppRouterCacheProvider: collects Emotion styles on the server and flushes
 *   them into the streamed HTML, so MUI renders without a flash of unstyled UI.
 * - ThemeProvider + CssBaseline: applies our brand theme and a CSS reset.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <AppRouterCacheProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </AppRouterCacheProvider>
    </ReduxProvider>
  );
}
