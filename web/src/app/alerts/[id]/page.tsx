'use client';

import { use } from 'react';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew';
import Link from 'next/link';
import { useGetAlertQuery } from '@/lib/api/apiSlice';
import { AlertDetailView } from '@/features/alerts/components/AlertDetailView';

export default function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // Next 16: params is async
  const { data, isLoading, isError } = useGetAlertQuery(id);

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={100} />
        <Skeleton variant="rounded" height={220} />
      </Stack>
    );
  }

  if (isError || !data) {
    return (
      <Stack spacing={2}>
        <Button
          component={Link}
          href="/alerts"
          startIcon={<ArrowBackIcon sx={{ fontSize: 14 }} />}
          size="small"
          sx={{ alignSelf: 'flex-start' }}
        >
          Back to queue
        </Button>
        <Paper variant="outlined" sx={{ p: 6 }}>
          <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="h6">Alert not found</Typography>
            <Typography variant="body2">It may belong to another company, or no longer exist.</Typography>
          </Box>
        </Paper>
      </Stack>
    );
  }

  return <AlertDetailView alert={data} />;
}
