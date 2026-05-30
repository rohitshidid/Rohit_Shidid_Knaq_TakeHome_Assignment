import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import type { Alert } from '@/features/alerts/types';
import { titleForAlert, relativeTime, initials } from '@/features/alerts/lib/format';
import { SeverityChip } from './SeverityChip';
import { StatusBadge } from './StatusBadge';
import { AlertRowActions } from './AlertRowActions';

export function AlertTable({
  alerts,
  onError,
}: {
  alerts: Alert[];
  onError: (message: string) => void;
}) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" aria-label="alert queue">
        <TableHead>
          <TableRow>
            <TableCell>Severity</TableCell>
            <TableCell>Alert</TableCell>
            <TableCell>Device</TableCell>
            <TableCell>Triggered</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Assignee</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {alerts.map((a) => (
            <TableRow key={a.id} hover>
              <TableCell>
                <SeverityChip severity={a.severity} />
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {titleForAlert(a)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{a.device.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {a.device.location}
                </Typography>
              </TableCell>
              <TableCell>
                <Tooltip title={new Date(a.triggeredAt).toLocaleString()}>
                  <span>{relativeTime(a.triggeredAt)}</span>
                </Tooltip>
              </TableCell>
              <TableCell>
                <StatusBadge status={a.status} />
              </TableCell>
              <TableCell>
                {a.assignedTo ? (
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: 12, bgcolor: 'secondary.main' }}>
                      {initials(a.assignedTo.name)}
                    </Avatar>
                    <Typography variant="body2">{a.assignedTo.name}</Typography>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Unassigned
                  </Typography>
                )}
              </TableCell>
              <TableCell align="right">
                <AlertRowActions alert={a} onError={onError} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
