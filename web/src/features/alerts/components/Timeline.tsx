'use client';

import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import RestoreOutlinedIcon from '@mui/icons-material/RestoreOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import type { TimelineEvent, TimelineAction } from '@/features/alerts/types';
import { relativeTime } from '@/features/alerts/lib/format';

const META: Record<TimelineAction, { label: string; color: string; icon: ReactNode }> = {
  created: { label: 'Alert created', color: 'info.main', icon: <NotificationsActiveOutlinedIcon fontSize="small" /> },
  acknowledged: { label: 'Acknowledged', color: 'warning.main', icon: <VisibilityOutlinedIcon fontSize="small" /> },
  assigned: { label: 'Assigned', color: 'secondary.main', icon: <PersonAddAltOutlinedIcon fontSize="small" /> },
  note: { label: 'Note added', color: 'grey.600', icon: <ChatBubbleOutlineOutlinedIcon fontSize="small" /> },
  resolved: { label: 'Resolved', color: 'success.main', icon: <CheckCircleOutlineIcon fontSize="small" /> },
  recovered: { label: 'Device recovered', color: 'success.light', icon: <RestoreOutlinedIcon fontSize="small" /> },
  dismissed: { label: 'Dismissed', color: 'grey.600', icon: <CancelOutlinedIcon fontSize="small" /> },
  reopened: { label: 'Reopened', color: 'warning.main', icon: <ReplayOutlinedIcon fontSize="small" /> },
};

/** Pull a short human detail out of the event's `details` JSON, if any. */
function detailLine(event: TimelineEvent): string | null {
  const d = event.details;
  if (d && typeof d === 'object') {
    if ('assigneeName' in d && typeof (d as { assigneeName?: unknown }).assigneeName === 'string') {
      return `→ ${(d as { assigneeName: string }).assigneeName}`;
    }
    if ('resolutionType' in d && typeof (d as { resolutionType?: unknown }).resolutionType === 'string') {
      return `Resolution: ${(d as { resolutionType: string }).resolutionType.replace(/_/g, ' ')}`;
    }
  }
  return null;
}

export function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No activity yet.
      </Typography>
    );
  }

  return (
    <Stack>
      {events.map((event, i) => {
        const meta = META[event.action];
        const isLast = i === events.length - 1;
        const detail = detailLine(event);
        return (
          <Stack key={event.id} direction="row" spacing={2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: meta.color }}>{meta.icon}</Avatar>
              {!isLast && <Box sx={{ flexGrow: 1, width: '2px', bgcolor: 'divider', my: 0.5, minHeight: 20 }} />}
            </Box>
            <Box sx={{ pb: isLast ? 0 : 3, pt: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {meta.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {event.userName ?? 'System'}
                {' · '}
                <Tooltip title={new Date(event.timestamp).toLocaleString()}>
                  <span>{relativeTime(event.timestamp)}</span>
                </Tooltip>
              </Typography>
              {detail && (
                <Typography variant="body2" color="text.secondary">
                  {detail}
                </Typography>
              )}
              {event.note && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {event.note}
                </Typography>
              )}
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
}
