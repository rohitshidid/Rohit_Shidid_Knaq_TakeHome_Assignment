'use client';

import { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import type { EChartsOption } from 'echarts';
import { EChart } from '@/components/EChart';
import type { AlertStats } from '@/features/analytics/types';

export function StatusDonut({ byStatus }: { byStatus: AlertStats['byStatus'] }) {
  const theme = useTheme();

  const option = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, textStyle: { color: theme.palette.text.secondary } },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: theme.palette.background.paper, borderWidth: 2 },
          label: { color: theme.palette.text.primary },
          data: [
            { value: byStatus.new, name: 'New', itemStyle: { color: theme.palette.info.main } },
            { value: byStatus.acknowledged, name: 'Acknowledged', itemStyle: { color: theme.palette.warning.main } },
            { value: byStatus.resolved, name: 'Resolved', itemStyle: { color: theme.palette.success.main } },
            { value: byStatus.dismissed, name: 'Dismissed', itemStyle: { color: theme.palette.grey[500] } },
          ],
        },
      ],
    }),
    [byStatus, theme],
  );

  return <EChart option={option} height={280} />;
}
