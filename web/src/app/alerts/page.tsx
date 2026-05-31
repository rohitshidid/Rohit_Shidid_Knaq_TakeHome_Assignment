'use client';

import { useState } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MuiAlert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import {
  useGetAlertsQuery,
  useBulkAcknowledgeMutation,
  useBulkAssignMutation,
  type BulkResult,
} from '@/lib/api/apiSlice';
import { apiErrorMessage, isAuthError } from '@/lib/api/error';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { clear } from '@/features/alerts/slices/selectionSlice';
import { AlertTable } from '@/features/alerts/components/AlertTable';
import { SummaryBar } from '@/features/alerts/components/SummaryBar';
import { QueueFilters } from '@/features/alerts/components/QueueFilters';
import { BulkActionBar } from '@/features/alerts/components/BulkActionBar';
import { AssignDialog } from '@/features/alerts/components/AssignDialog';
import { useFilteredAlerts } from '@/features/alerts/hooks/useFilteredAlerts';
import { ResetButton } from '@/features/dev/components/ResetButton';

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

function summarize(res: BulkResult, verb: string): string {
  const ok = res.succeeded.length;
  return res.failed.length === 0 ? `${verb} ${ok}` : `${verb} ${ok}, skipped ${res.failed.length}`;
}

export default function AlertsPage() {
  const { data, isLoading, isError, error: queryError, refetch } = useGetAlertsQuery();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const all = data ?? [];
  const filtered = useFilteredAlerts(all);

  const dispatch = useAppDispatch();
  const selectedIds = useAppSelector((s) => s.alertSelection.ids);
  const [bulkAck, { isLoading: bulkAcking }] = useBulkAcknowledgeMutation();
  const [bulkAssign] = useBulkAssignMutation();
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);

  const doBulkAck = async () => {
    try {
      const res = await bulkAck({ ids: selectedIds }).unwrap();
      setInfo(summarize(res, 'Acknowledged'));
      dispatch(clear());
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Alert Queue
        </Typography>
        <ResetButton />
      </Stack>

      {isLoading && (
        <Stack spacing={1}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={44} />
          ))}
        </Stack>
      )}

      {isError &&
        (isAuthError(queryError) ? (
          <MuiAlert severity="warning">
            Authentication failed — your token is invalid. Switch user from the top bar.
          </MuiAlert>
        ) : (
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
        ))}

      {data && (
        <>
          <SummaryBar alerts={all} />
          <QueueFilters />

          {selectedIds.length > 0 && (
            <BulkActionBar
              count={selectedIds.length}
              busy={bulkAcking}
              onAcknowledge={doBulkAck}
              onAssign={() => setBulkAssignOpen(true)}
              onClear={() => dispatch(clear())}
            />
          )}

          {all.length === 0 ? (
            <EmptyPaper title="No alerts" body="Nothing is alerting for your company right now." />
          ) : filtered.length === 0 ? (
            <EmptyPaper title="No matches" body="No alerts match the current filters." />
          ) : (
            <>
              <Typography variant="body2" color="text.secondary">
                Showing {filtered.length} of {all.length}
              </Typography>
              <AlertTable alerts={filtered} onError={setError} />
            </>
          )}
        </>
      )}

      <AssignDialog
        open={bulkAssignOpen}
        onClose={() => setBulkAssignOpen(false)}
        onError={setError}
        title={`Assign ${selectedIds.length} alert${selectedIds.length === 1 ? '' : 's'}`}
        onSubmit={async (assigneeId, note) => {
          const res = await bulkAssign({ ids: selectedIds, assignee_id: assigneeId, note }).unwrap();
          setInfo(summarize(res, 'Assigned'));
          dispatch(clear());
        }}
      />

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={5000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert severity="error" variant="filled" onClose={() => setError(null)} sx={{ width: '100%' }}>
          {error}
        </MuiAlert>
      </Snackbar>

      <Snackbar
        open={Boolean(info)}
        autoHideDuration={4000}
        onClose={() => setInfo(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert severity="info" variant="filled" onClose={() => setInfo(null)} sx={{ width: '100%' }}>
          {info}
        </MuiAlert>
      </Snackbar>
    </Stack>
  );
}
