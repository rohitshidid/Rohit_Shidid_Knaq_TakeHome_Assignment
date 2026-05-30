'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from '@/lib/store/store';
import { createAppTheme } from '@/lib/theme/theme';
import { ColorModeContext, type ColorMode } from '@/lib/theme/ColorModeContext';

const STORAGE_KEY = 'knaq-color-mode';

/**
 * Client-side provider stack: Redux store + RTK Query cache, Emotion SSR cache,
 * and a dark/light MUI theme whose mode is persisted to localStorage.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ColorMode>('light');

  // Restore the saved preference after mount (keeps SSR markup stable).
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') setMode(saved);
  }, []);

  const colorMode = useMemo(
    () => ({
      mode,
      toggle: () =>
        setMode((prev) => {
          const next: ColorMode = prev === 'light' ? 'dark' : 'light';
          window.localStorage.setItem(STORAGE_KEY, next);
          return next;
        }),
    }),
    [mode],
  );

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ReduxProvider store={store}>
      <AppRouterCacheProvider>
        <ColorModeContext.Provider value={colorMode}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </ColorModeContext.Provider>
      </AppRouterCacheProvider>
    </ReduxProvider>
  );
}
