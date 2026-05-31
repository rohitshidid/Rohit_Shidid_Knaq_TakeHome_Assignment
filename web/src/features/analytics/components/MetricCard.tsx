'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

export function MetricCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: number;
}) {
  return (
    <Card variant="outlined" sx={{ flex: 1, minWidth: 160 }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          {value}
        </Typography>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.5 }}>
          {typeof trend === 'number' && trend !== 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', color: trend > 0 ? 'success.main' : 'error.main' }}>
              {trend > 0 ? <ArrowUpwardIcon sx={{ fontSize: 16 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16 }} />}
              <Typography variant="caption">{Math.abs(trend)}</Typography>
            </Box>
          )}
          {sub && (
            <Typography variant="caption" color="text.secondary">
              {sub}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
