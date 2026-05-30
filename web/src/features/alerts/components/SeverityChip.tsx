import Chip from '@mui/material/Chip';
import type { Severity } from '@/features/alerts/types';

const MAP: Record<Severity, { label: string; color: 'error' | 'warning' }> = {
  critical: { label: 'Critical', color: 'error' },
  warning: { label: 'Warning', color: 'warning' },
};

export function SeverityChip({ severity }: { severity: Severity }) {
  const s = MAP[severity];
  return <Chip size="small" label={s.label} color={s.color} />;
}
