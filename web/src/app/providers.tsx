'use client';

import type { ReactNode } from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '@/lib/theme/theme';

/**
 * Client-side provider stack. Lives in its own 'use client' module so the
 * root layout can stay a Server Component. Redux's <Provider> is added here later.
 *
 * - AppRouterCacheProvider: collects Emotion styles on the server and flushes
 *   them into the streamed HTML, so MUI renders without a flash of unstyled UI.
 * - ThemeProvider + CssBaseline: applies our brand theme and a CSS reset.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
