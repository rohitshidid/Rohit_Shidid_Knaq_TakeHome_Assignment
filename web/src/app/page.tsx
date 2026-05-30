'use client';

import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetUsersQuery, useGetAlertsQuery } from '@/lib/api/apiSlice';

// Temporary wiring check — proves the browser talks to the live API through
// RTK Query with the bearer token. Replaced by the real Alert Queue next.
export default function HomePage() {
  const users = useGetUsersQuery();
  const alerts = useGetAlertsQuery();
  const loading = users.isLoading || alerts.isLoading;
  const errored = Boolean(users.error || alerts.error);

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={2}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
          Knaq — wiring check
        </Typography>

        {loading && <CircularProgress />}
        {errored && (
          <Alert severity="error">API error — is the backend running on :8000?</Alert>
        )}

        {users.data && (
          <Typography>
            Users in your company: <strong>{users.data.length}</strong> (
            {users.data.map((u) => u.name).join(', ')})
          </Typography>
        )}
        {alerts.data && (
          <Typography>
            Alerts in your company: <strong>{alerts.data.length}</strong>
          </Typography>
        )}
      </Stack>
    </Container>
  );
}
