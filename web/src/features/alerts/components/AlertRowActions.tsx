'use client';

import type { MouseEvent } from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import Link from 'next/link';
import { useAcknowledgeAlertMutation } from '@/lib/api/apiSlice';
import { apiErrorMessage } from '@/lib/api/error';
import type { Alert } from '@/features/alerts/types';

export function AlertRowActions({
  alert,
  onError,
}: {
  alert: Alert;
  onError: (message: string) => void;
}) {
  const [acknowledge, { isLoading }] = useAcknowledgeAlertMutation();

  const handleAcknowledge = async (e: MouseEvent) => {
    e.stopPropagation();
    try {
      await acknowledge(alert.id).unwrap();
    } catch (err) {
      onError(apiErrorMessage(err));
    }
  };

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
      {alert.status === 'new' && (
        <Button
          size="small"
          variant="outlined"
          disabled={isLoading}
          onClick={handleAcknowledge}
          startIcon={isLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          Acknowledge
        </Button>
      )}
      <Tooltip title="View detail">
        <IconButton size="small" component={Link} href={`/alerts/${alert.id}`} aria-label="view detail">
          <VisibilityOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
