import Chip from '@mui/material/Chip';
import type { AlertStatus } from '@/features/alerts/types';

const MAP: Record<AlertStatus, { label: string; color: 'default' | 'info' | 'warning' | 'success' }> = {
  new: { label: 'New', color: 'info' },
  acknowledged: { label: 'Acknowledged', color: 'warning' },
  resolved: { label: 'Resolved', color: 'success' },
  dismissed: { label: 'Dismissed', color: 'default' },
};

export function StatusBadge({ status }: { status: AlertStatus }) {
  const s = MAP[status];
  return <Chip size="small" variant="outlined" label={s.label} color={s.color} />;
}
