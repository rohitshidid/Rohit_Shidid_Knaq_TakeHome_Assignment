'use client';

import { useState } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import MuiAlert from '@mui/material/Alert';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useGetStatsQuery, useGetTimeseriesQuery } from '@/lib/api/apiSlice';
import { isAuthError } from '@/lib/api/error';
import { MetricCard } from '@/features/analytics/components/MetricCard';
import { StatusDonut } from '@/features/analytics/components/StatusDonut';
import { ResolutionBar } from '@/features/analytics/components/ResolutionBar';
import { VolumeTrend } from '@/features/analytics/components/VolumeTrend';

function fmtMttr(min: number | null): string {
  if (min === null) return '—';
  if (min < 60) return `${min}m`;
  return `${(min / 60).toFixed(1)}h`;
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(0); // 0 = all time
  const stats = useGetStatsQuery();
  const series = useGetTimeseriesQuery(days);

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Analytics
      </Typography>

      {stats.isError &&
        (isAuthError(stats.error) ? (
          <MuiAlert severity="warning">
            Authentication failed — your token is invalid. Switch user from the top bar.
          </MuiAlert>
        ) : (
          <MuiAlert severity="error">Couldn&apos;t load analytics — is the API running?</MuiAlert>
        ))}

      {stats.data ? (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
          <MetricCard label="MTTR (ack → resolve)" value={fmtMttr(stats.data.mttrMinutes)} />
          <MetricCard
            label="Open critical"
            value={String(stats.data.openBySeverity.critical)}
            sub={`${stats.data.openBySeverity.warning} warning`}
          />
          <MetricCard
            label="Resolved this week"
            value={String(stats.data.resolvedThisWeek)}
            trend={stats.data.resolvedThisWeek - stats.data.resolvedLastWeek}
            sub="vs last week"
          />
          <MetricCard label="Dismissal rate" value={`${Math.round(stats.data.dismissalRate * 100)}%`} />
        </Stack>
      ) : (
        <Skeleton variant="rounded" height={100} />
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              Alerts by status
            </Typography>
            {stats.data ? <StatusDonut byStatus={stats.data.byStatus} /> : <Skeleton variant="rounded" height={280} />}
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              Resolution time by severity
            </Typography>
            {stats.data ? (
              <ResolutionBar data={stats.data.resolutionTimeBySeverity} />
            ) : (
              <Skeleton variant="rounded" height={280} />
            )}
          </CardContent>
        </Card>
      </Stack>

      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="overline" color="text.secondary">
              Alert volume
            </Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={days}
              onChange={(_, v: number | null) => {
                if (v !== null) setDays(v);
              }}
            >
              <ToggleButton value={7}>7d</ToggleButton>
              <ToggleButton value={30}>30d</ToggleButton>
              <ToggleButton value={90}>90d</ToggleButton>
              <ToggleButton value={365}>1y</ToggleButton>
              <ToggleButton value={0}>All</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          {series.data ? <VolumeTrend points={series.data.points} /> : <Skeleton variant="rounded" height={300} />}
        </CardContent>
      </Card>
    </Stack>
  );
}
