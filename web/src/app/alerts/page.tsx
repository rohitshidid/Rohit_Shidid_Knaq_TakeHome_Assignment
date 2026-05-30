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
import { SummaryBar } from '@/features/alerts/components/SummaryBar';
import { QueueFilters } from '@/features/alerts/components/QueueFilters';
import { useFilteredAlerts } from '@/features/alerts/hooks/useFilteredAlerts';

function EmptyPaper({ title, body }: { title: string; body: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 6 }}>
      <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2">{body}</Typography>
      </Box>
    </Paper>
  );
}

export default function AlertsPage() {
  const { data, isLoading, isError, refetch } = useGetAlertsQuery();
  const all = data ?? [];
  const filtered = useFilteredAlerts(all);

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

      {data && (
        <>
          <SummaryBar alerts={all} />
          <QueueFilters />

          {all.length === 0 ? (
            <EmptyPaper title="No alerts" body="Nothing is alerting for your company right now." />
          ) : filtered.length === 0 ? (
            <EmptyPaper title="No matches" body="No alerts match the current filters." />
          ) : (
            <>
              <Typography variant="body2" color="text.secondary">
                Showing {filtered.length} of {all.length}
              </Typography>
              <AlertTable alerts={filtered} />
            </>
          )}
        </>
      )}
    </Stack>
  );
}
