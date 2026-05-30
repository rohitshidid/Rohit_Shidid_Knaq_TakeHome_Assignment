'use client';

import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { toggleStatus } from '@/features/alerts/slices/filtersSlice';
import type { Alert, AlertStatus } from '@/features/alerts/types';

const CARDS: { key: AlertStatus; label: string }[] = [
  { key: 'new', label: 'New' },
  { key: 'acknowledged', label: 'Acknowledged' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'dismissed', label: 'Dismissed' },
];

function countByStatus(alerts: Alert[]): Record<AlertStatus, number> {
  const counts: Record<AlertStatus, number> = { new: 0, acknowledged: 0, resolved: 0, dismissed: 0 };
  for (const a of alerts) counts[a.status] += 1;
  return counts;
}

/** Counts by status; clicking a card toggles that status filter. */
export function SummaryBar({ alerts }: { alerts: Alert[] }) {
  const dispatch = useAppDispatch();
  const active = useAppSelector((s) => s.alertFilters.statuses);
  const counts = countByStatus(alerts);

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      {CARDS.map((c) => {
        const selected = active.includes(c.key);
        return (
          <Card
            key={c.key}
            variant="outlined"
            sx={{
              flex: 1,
              borderColor: selected ? 'primary.main' : 'divider',
              borderWidth: selected ? 2 : 1,
            }}
          >
            <CardActionArea onClick={() => dispatch(toggleStatus(c.key))} sx={{ p: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                {counts[c.key]}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {c.label}
              </Typography>
            </CardActionArea>
          </Card>
        );
      })}
    </Stack>
  );
}
