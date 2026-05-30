'use client';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import { useAcknowledgeAlertMutation } from '@/lib/api/apiSlice';
import { apiErrorMessage } from '@/lib/api/error';
import type { Alert } from '@/features/alerts/types';

/**
 * Renders the actions allowed in the current status (the server still enforces
 * the rules; this just shows the right buttons). Resolved/dismissed = read-only.
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
  const [acknowledge, { isLoading }] = useAcknowledgeAlertMutation();

  if (alert.status === 'resolved' || alert.status === 'dismissed') {
    return null; // terminal — read-only
  }

  const handleAck = async () => {
    try {
      await acknowledge(alert.id).unwrap();
    } catch (err) {
      onError(apiErrorMessage(err));
    }
  };

  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
      {alert.status === 'new' && (
        <Button
          variant="contained"
          disabled={isLoading}
          onClick={handleAck}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <VisibilityOutlinedIcon />}
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
    </Stack>
  );
}
