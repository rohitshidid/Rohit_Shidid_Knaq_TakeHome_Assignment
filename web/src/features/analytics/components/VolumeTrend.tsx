'use client';

import { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { EChartsOption } from 'echarts';
import { EChart } from '@/components/EChart';
import type { TimeseriesPoint } from '@/features/analytics/types';

export function VolumeTrend({ points }: { points: TimeseriesPoint[] }) {
  const theme = useTheme();

  const option = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: 'axis' },
      legend: { top: 0, textStyle: { color: theme.palette.text.secondary } },
      grid: { left: 40, right: 20, top: 40, bottom: 30 },
      xAxis: {
        type: 'category',
        data: points.map((p) => p.date),
        axisLabel: { color: theme.palette.text.secondary },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: theme.palette.text.secondary },
        splitLine: { lineStyle: { color: theme.palette.divider } },
      },
      series: [
        {
          name: 'Critical',
          type: 'line',
          smooth: true,
          areaStyle: { opacity: 0.15 },
          itemStyle: { color: theme.palette.error.main },
          data: points.map((p) => p.critical),
        },
        {
          name: 'Warning',
          type: 'line',
          smooth: true,
          areaStyle: { opacity: 0.15 },
          itemStyle: { color: theme.palette.warning.main },
          data: points.map((p) => p.warning),
        },
      ],
    }),
    [points, theme],
  );

  if (points.length === 0) {
    return (
      <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">No alerts in this window.</Typography>
      </Box>
    );
  }

  return <EChart option={option} height={300} />;
}

