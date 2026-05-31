'use client';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ReplayIcon from '@mui/icons-material/Replay';
import {
  useAcknowledgeAlertMutation,
  useDismissAlertMutation,
  useReopenAlertMutation,
} from '@/lib/api/apiSlice';
import { apiErrorMessage } from '@/lib/api/error';
import type { Alert } from '@/features/alerts/types';

/**
 * Renders the actions allowed in the current status (the server still enforces
 * the rules). new/acknowledged → act + dismiss; resolved/dismissed → reopen.
 */
export function AlertActions({
  alert,
  onAssign,
  onResolve,
  onError,
}: {
  alert: Alert;
  onAssign: () => void;
  onResolve: () => void;
  onError: (message: string) => void;
}) {
  const [acknowledge, { isLoading: acking }] = useAcknowledgeAlertMutation();
  const [dismiss, { isLoading: dismissing }] = useDismissAlertMutation();
  const [reopen, { isLoading: reopening }] = useReopenAlertMutation();

  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (err) {
      onError(apiErrorMessage(err));
    }
  };

  if (alert.status === 'resolved' || alert.status === 'dismissed') {
    return (
      <Stack direction="row" spacing={1}>
        <Button
          variant="outlined"
          disabled={reopening}
          startIcon={<ReplayIcon />}
          onClick={() => run(() => reopen(alert.id).unwrap())}
        >
          Reopen
        </Button>
      </Stack>
    );
  }

  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
      {alert.status === 'new' && (
        <Button
          variant="contained"
          disabled={acking}
          onClick={() => run(() => acknowledge(alert.id).unwrap())}
          startIcon={acking ? <CircularProgress size={16} color="inherit" /> : <VisibilityOutlinedIcon />}
        >
          Acknowledge
        </Button>
      )}
      {alert.status === 'acknowledged' && (
        <Button variant="contained" color="success" onClick={onResolve} startIcon={<TaskAltOutlinedIcon />}>
          Resolve
        </Button>
      )}
      <Button variant="outlined" onClick={onAssign} startIcon={<PersonAddAltOutlinedIcon />}>
        Assign
      </Button>
      <Button
        variant="text"
        color="inherit"
        disabled={dismissing}
        startIcon={<CancelOutlinedIcon />}
        onClick={() => run(() => dismiss(alert.id).unwrap())}
      >
        Dismiss
      </Button>
    </Stack>
  );
}
