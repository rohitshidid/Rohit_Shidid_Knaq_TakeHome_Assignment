import { createTheme } from '@mui/material/styles';

/**
 * Brand palette from the assignment. The dark/light toggle arrives in
 * Segment 3.2 — for now a single light theme proves MUI theming is wired.
 */
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#EFC01A' }, // gold
    secondary: { main: '#4B8189' }, // teal
    error: { main: '#F44336' },
    warning: { main: '#FFA726' },
    info: { main: '#29B6F6' },
    success: { main: '#66BB6A' },
  },
});
