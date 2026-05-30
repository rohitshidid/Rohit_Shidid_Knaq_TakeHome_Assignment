'use client';

import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import { useGetDevicesQuery } from '@/lib/api/apiSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import {
  setSearch,
  toggleSeverity,
  setDeviceId,
  setSort,
  resetFilters,
  type SortKey,
} from '@/features/alerts/slices/filtersSlice';
import type { Severity } from '@/features/alerts/types';

const SEVERITIES: { key: Severity; label: string; color: 'error' | 'warning' }[] = [
  { key: 'critical', label: 'Critical', color: 'error' },
  { key: 'warning', label: 'Warning', color: 'warning' },
];

export function QueueFilters() {
  const dispatch = useAppDispatch();
  const f = useAppSelector((s) => s.alertFilters);
  const { data: devices } = useGetDevicesQuery();

  const anyActive =
    f.search.length > 0 || f.severities.length > 0 || f.statuses.length > 0 || f.deviceId !== null;

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      sx={{ alignItems: { md: 'center' }, flexWrap: 'wrap' }}
    >
      <TextField
        size="small"
        label="Search device or title"
        value={f.search}
        onChange={(e) => dispatch(setSearch(e.target.value))}
        sx={{ minWidth: 240 }}
      />

      <Stack direction="row" spacing={1}>
        {SEVERITIES.map((s) => (
          <Chip
            key={s.key}
            label={s.label}
            color={s.color}
            clickable
            variant={f.severities.includes(s.key) ? 'filled' : 'outlined'}
            onClick={() => dispatch(toggleSeverity(s.key))}
          />
        ))}
      </Stack>

      <TextField
        select
        size="small"
        label="Device"
        value={f.deviceId ?? ''}
        onChange={(e) => dispatch(setDeviceId(e.target.value || null))}
        sx={{ minWidth: 200 }}
      >
        <MenuItem value="">All devices</MenuItem>
        {devices?.map((d) => (
          <MenuItem key={d.id} value={d.id}>
            {d.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Sort by"
        value={f.sort}
        onChange={(e) => dispatch(setSort(e.target.value as SortKey))}
        sx={{ minWidth: 150 }}
      >
        <MenuItem value="severity">Severity</MenuItem>
        <MenuItem value="time">Most recent</MenuItem>
        <MenuItem value="status">Status</MenuItem>
      </TextField>

      {anyActive && (
        <Button size="small" onClick={() => dispatch(resetFilters())}>
          Clear
        </Button>
      )}
    </Stack>
  );
}
