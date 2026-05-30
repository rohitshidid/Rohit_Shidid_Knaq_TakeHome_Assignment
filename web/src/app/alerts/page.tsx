'use client';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MuiAlert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import { useGetAlertsQuery } from '@/lib/api/apiSlice';
import { AlertTable } from '@/features/alerts/components/AlertTable';

export default function AlertsPage() {
  const { data, isLoading, isError, refetch } = useGetAlertsQuery();

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Alert Queue
      </Typography>

      {isLoading && (
        <Stack spacing={1}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={44} />
          ))}
        </Stack>
      )}

      {isError && (
        <MuiAlert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        >
          Couldn&apos;t load alerts — is the API running on :8000?
        </MuiAlert>
      )}

      {data && data.length === 0 && (
        <Paper variant="outlined" sx={{ p: 6 }}>
          <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="h6">No alerts</Typography>
            <Typography variant="body2">Nothing is alerting for your company right now.</Typography>
          </Box>
        </Paper>
      )}

      {data && data.length > 0 && <AlertTable alerts={data} />}
    </Stack>
  );
}
