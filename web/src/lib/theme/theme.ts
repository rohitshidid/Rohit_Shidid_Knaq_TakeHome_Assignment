import { createTheme, type Theme } from '@mui/material/styles';

/**
 * Brand palette from the assignment, parameterized by light/dark mode.
 * Gold stays the primary accent; the dark/light toggle swaps backgrounds.
 */
export function createAppTheme(mode: 'light' | 'dark'): Theme {
  return createTheme({
    palette: {
      mode,
      primary: { main: '#EFC01A' }, // gold
      secondary: { main: '#4B8189' }, // teal
      error: { main: '#F44336' },
      warning: { main: '#FFA726' },
      info: { main: '#29B6F6' },
      success: { main: '#66BB6A' },
    },
    shape: { borderRadius: 8 },
  });
}
