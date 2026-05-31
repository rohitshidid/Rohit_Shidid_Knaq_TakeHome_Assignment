'use client';

import { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import type { EChartsOption } from 'echarts';
import { EChart } from '@/components/EChart';
import type { AlertStats } from '@/features/analytics/types';

// SLA targets in minutes (Critical 4h, Warning 24h).
const SLA = { critical: 240, warning: 1440 };

export function ResolutionBar({ data }: { data: AlertStats['resolutionTimeBySeverity'] }) {
  const theme = useTheme();

  const option = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: 'axis' },
      grid: { left: 55, right: 20, top: 30, bottom: 30 },
      xAxis: {
        type: 'category',
        data: ['Critical', 'Warning'],
        axisLabel: { color: theme.palette.text.secondary },
      },
      yAxis: {
        type: 'value',
        name: 'minutes',
        nameTextStyle: { color: theme.palette.text.secondary },
        axisLabel: { color: theme.palette.text.secondary },
        splitLine: { lineStyle: { color: theme.palette.divider } },
      },
      series: [
        {
          type: 'bar',
          barWidth: 44,
          data: [
            { value: data.critical ?? 0, itemStyle: { color: theme.palette.error.main } },
            { value: data.warning ?? 0, itemStyle: { color: theme.palette.warning.main } },
          ],
          markLine: {
            symbol: 'none',
            label: { color: theme.palette.text.secondary, formatter: '{b}' },
            data: [
              { yAxis: SLA.critical, name: 'Critical SLA 4h', lineStyle: { color: theme.palette.error.light, type: 'dashed' } },
              { yAxis: SLA.warning, name: 'Warning SLA 24h', lineStyle: { color: theme.palette.warning.light, type: 'dashed' } },
            ],
          },
        },
      ],
    }),
    [data, theme],
  );

  return <EChart option={option} height={280} />;
}
