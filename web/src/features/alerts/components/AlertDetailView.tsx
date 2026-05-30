'use client';

import { useState } from 'react';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew';
import Link from 'next/link';
import { SeverityChip } from './SeverityChip';
import { StatusBadge } from './StatusBadge';
import { Timeline } from './Timeline';
import { AlertActions } from './AlertActions';
import { ResolveDialog } from './ResolveDialog';
import { AssignDialog } from './AssignDialog';
import { titleForAlert, relativeTime, initials } from '@/features/alerts/lib/format';
import type { Alert } from '@/features/alerts/types';

export function AlertDetailView({ alert }: { alert: Alert }) {
  const hasReading = alert.readingValue !== null && alert.threshold !== null;
  const [assignOpen, setAssignOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Stack spacing={2}>
      <Button
        component={Link}
        href="/alerts"
        startIcon={<ArrowBackIcon sx={{ fontSize: 14 }} />}
        size="small"
        sx={{ alignSelf: 'flex-start' }}
      >
        Back to queue
      </Button>

      {/* Header */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <SeverityChip severity={alert.severity} />
            <StatusBadge status={alert.status} />
          </Stack>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {titleForAlert(alert)}
          </Typography>
          <Typography color="text.secondary">
            {alert.device.name} · {alert.device.location}
          </Typography>
          <AlertActions
            alert={alert}
            onAssign={() => setAssignOpen(true)}
            onResolve={() => setResolveOpen(true)}
            onError={setError}
          />
        </Stack>
      </Paper>

      {/* Triggering reading */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="overline" color="text.secondary">
            Triggering reading
          </Typography>
          {hasReading ? (
            <Stack direction="row" spacing={4} sx={{ alignItems: 'baseline', mt: 1 }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                  {alert.readingValue}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {alert.readingName ?? 'reading'}
                </Typography>
              </Box>
              <Typography variant="h6" color="text.secondary">
                / threshold {alert.threshold}
              </Typography>
            </Stack>
          ) : (
            <Typography sx={{ mt: 1 }} color="text.secondary">
              Device-detected fault — no numeric reading.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Assignment */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="overline" color="text.secondary">
            Assignment
          </Typography>
          <Box sx={{ mt: 1 }}>
            {alert.assignedTo ? (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Avatar sx={{ width: 28, height: 28, fontSize: 13, bgcolor: 'secondary.main' }}>
                  {initials(alert.assignedTo.name)}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {alert.assignedTo.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {alert.assignedTo.role}
                  </Typography>
                </Box>
              </Stack>
            ) : (
              <Typography color="text.secondary">Unassigned</Typography>
            )}
          </Box>
          {alert.recoveredAt && (
            <Typography variant="caption" color="success.main" sx={{ mt: 1.5, display: 'block' }}>
              Device reported recovery {relativeTime(alert.recoveredAt)}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="overline" color="text.secondary">
            Timeline
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Timeline events={alert.timeline ?? []} />
          </Box>
        </CardContent>
      </Card>

      <AssignDialog alert={alert} open={assignOpen} onClose={() => setAssignOpen(false)} onError={setError} />
      <ResolveDialog alertId={alert.id} open={resolveOpen} onClose={() => setResolveOpen(false)} onError={setError} />

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={5000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert severity="error" variant="filled" onClose={() => setError(null)}>
          {error}
        </MuiAlert>
      </Snackbar>
    </Stack>
  );
}
