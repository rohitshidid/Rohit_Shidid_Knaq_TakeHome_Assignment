import { createTheme } from '@mui/material/styles';

/**
 * Brand palette from the assignment. A single light theme for now; the
 * dark/light toggle is added later.
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
