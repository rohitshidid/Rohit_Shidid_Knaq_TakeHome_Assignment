'use client';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useResolveAlertMutation } from '@/lib/api/apiSlice';
import { apiErrorMessage } from '@/lib/api/error';
import type { ResolutionType } from '@/features/alerts/types';

const RES_TYPES: { value: ResolutionType; label: string }[] = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'false_alarm', label: 'False Alarm' },
  { value: 'known_issue', label: 'Known Issue' },
  { value: 'deferred', label: 'Deferred' },
  { value: 'cannot_reproduce', label: 'Cannot Reproduce' },
];

const schema = Yup.object({
  resolution_type: Yup.string().required('Select a resolution type'),
  root_cause: Yup.string().trim().required('Root cause is required'),
  action_taken: Yup.string().trim().required('Action taken is required'),
  preventive_measures: Yup.string(),
  time_spent_minutes: Yup.number()
    .transform((value, original) => (original === '' ? null : value))
    .typeError('Enter a number')
    .min(0, 'Must be 0 or more')
    .nullable(),
});

export function ResolveDialog({
  alertId,
  open,
  onClose,
  onError,
}: {
  alertId: string;
  open: boolean;
  onClose: () => void;
  onError: (message: string) => void;
}) {
  const [resolve, { isLoading }] = useResolveAlertMutation();

  const formik = useFormik({
    initialValues: {
      resolution_type: '',
      root_cause: '',
      action_taken: '',
      preventive_measures: '',
      time_spent_minutes: '',
    },
    validationSchema: schema,
    validateOnMount: true,
    onSubmit: async (values) => {
      try {
        await resolve({
          id: alertId,
          resolution_type: values.resolution_type as ResolutionType,
          root_cause: values.root_cause.trim(),
          action_taken: values.action_taken.trim(),
          preventive_measures: values.preventive_measures.trim() || undefined,
          time_spent_minutes: values.time_spent_minutes ? Number(values.time_spent_minutes) : undefined,
        }).unwrap();
        onClose();
        formik.resetForm();
      } catch (err) {
        onError(apiErrorMessage(err));
      }
    },
  });

  const field = (name: keyof typeof formik.values) => ({
    name,
    value: formik.values[name],
    onChange: formik.handleChange,
    onBlur: formik.handleBlur,
    error: formik.touched[name] && Boolean(formik.errors[name]),
    helperText: formik.touched[name] ? formik.errors[name] : undefined,
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={formik.handleSubmit} noValidate>
        <DialogTitle>Resolve alert</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="Resolution type" required {...field('resolution_type')}>
              {RES_TYPES.map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  {r.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Root cause" required {...field('root_cause')} />
            <TextField label="Action taken" required multiline minRows={2} {...field('action_taken')} />
            <TextField label="Preventive measures (optional)" multiline minRows={2} {...field('preventive_measures')} />
            <TextField label="Time spent (minutes, optional)" type="number" {...field('time_spent_minutes')} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="success" disabled={!formik.isValid || isLoading}>
            Resolve
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
