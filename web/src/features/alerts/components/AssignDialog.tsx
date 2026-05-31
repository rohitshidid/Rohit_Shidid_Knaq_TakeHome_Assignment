'use client';

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useGetUsersQuery } from '@/lib/api/apiSlice';
import { apiErrorMessage } from '@/lib/api/error';
import { initials } from '@/features/alerts/lib/format';

/**
 * Reusable assign dialog. The parent supplies `onSubmit`, so the same UI drives a
 * single-alert assign or a bulk assign.
 */
export function AssignDialog({
  open,
  onClose,
  currentAssigneeId,
  onSubmit,
  onError,
  title = 'Assign alert',
}: {
  open: boolean;
  onClose: () => void;
  currentAssigneeId?: string | null;
  onSubmit: (assigneeId: string, note?: string) => Promise<void>;
  onError: (message: string) => void;
  title?: string;
}) {
  const { data: users } = useGetUsersQuery();
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: { assignee_id: currentAssigneeId ?? '', note: '' },
    enableReinitialize: true,
    validationSchema: Yup.object({ assignee_id: Yup.string().required() }),
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        await onSubmit(values.assignee_id, values.note.trim() || undefined);
        onClose();
        formik.resetForm();
      } catch (err) {
        onError(apiErrorMessage(err));
      } finally {
        setSubmitting(false);
      }
    },
  });

  const q = search.trim().toLowerCase();
  const filtered = (users ?? []).filter((u) => `${u.name} ${u.role}`.toLowerCase().includes(q));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={formik.handleSubmit} noValidate>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              size="small"
              label="Search team"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <List sx={{ maxHeight: 280, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, py: 0 }}>
              {filtered.map((u) => (
                <ListItemButton
                  key={u.id}
                  selected={formik.values.assignee_id === u.id}
                  onClick={() => void formik.setFieldValue('assignee_id', u.id)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>{initials(u.name)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={u.name} secondary={u.role} />
                  {currentAssigneeId === u.id && <Chip size="small" label="current" />}
                </ListItemButton>
              ))}
              {filtered.length === 0 && (
                <Box sx={{ p: 2, color: 'text.secondary' }}>No matching team members.</Box>
              )}
            </List>
            <TextField
              label="Note (optional)"
              placeholder="Reason for assignment"
              multiline
              minRows={2}
              name="note"
              value={formik.values.note}
              onChange={formik.handleChange}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={!formik.values.assignee_id || submitting}>
            Assign
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
