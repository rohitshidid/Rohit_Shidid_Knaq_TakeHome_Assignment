'use client';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

export function BulkActionBar({
  count,
  busy,
  onAcknowledge,
  onAssign,
  onClear,
}: {
  count: number;
  busy?: boolean;
  onAcknowledge: () => void;
  onAssign: () => void;
  onClear: () => void;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 1.25, borderColor: 'primary.main', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, mr: 1 }}>
        {count} selected
      </Typography>
      <Button size="small" variant="contained" disabled={busy} onClick={onAcknowledge}>
        Acknowledge
      </Button>
      <Button size="small" variant="outlined" onClick={onAssign}>
        Assign
      </Button>
      <Box sx={{ flexGrow: 1 }} />
      <Button size="small" color="inherit" onClick={onClear}>
        Clear
      </Button>
    </Paper>
  );
}
