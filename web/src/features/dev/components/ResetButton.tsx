'use client';

import { useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { api, useResetDatabaseMutation } from '@/lib/api/apiSlice';
import { useAppDispatch } from '@/lib/store/hooks';
import { apiErrorMessage } from '@/lib/api/error';

/** Testing-only: wipes triage state and re-ingests, restoring default data. */
export function ResetButton() {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);
  const [reset, { isLoading }] = useResetDatabaseMutation();

  const doReset = async () => {
    try {
      const res = await reset().unwrap();
      dispatch(api.util.resetApiState()); // refetch everything from the clean DB
      setSnack(res.message);
    } catch (err) {
      setSnack(apiErrorMessage(err));
    } finally {
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        color="error"
        variant="outlined"
        size="small"
        startIcon={<RestartAltIcon />}
        onClick={() => setOpen(true)}
        disabled={isLoading}
      >
        Hard reset (testing)
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Reset all data to defaults?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This wipes all triage progress (acknowledgements, assignments, resolutions, notes) for
            every company and re-ingests the original messages. For testing only.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={doReset} disabled={isLoading}>
            Reset
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert severity="info" variant="filled" onClose={() => setSnack(null)}>
          {snack}
        </MuiAlert>
      </Snackbar>
    </>
  );
}
