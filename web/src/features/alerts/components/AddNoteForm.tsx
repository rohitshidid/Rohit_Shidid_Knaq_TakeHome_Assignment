'use client';

import { useState, type FormEvent } from 'react';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useAddNoteMutation } from '@/lib/api/apiSlice';
import { apiErrorMessage } from '@/lib/api/error';

/** Text input → POST /alerts/:id/notes → the timeline re-fetches with the note. */
export function AddNoteForm({ alertId, onError }: { alertId: string; onError: (message: string) => void }) {
  const [note, setNote] = useState('');
  const [addNote, { isLoading }] = useAddNoteMutation();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = note.trim();
    if (!trimmed) return;
    try {
      await addNote({ id: alertId, note: trimmed }).unwrap();
      setNote('');
    } catch (err) {
      onError(apiErrorMessage(err));
    }
  };

  return (
    <Box component="form" onSubmit={submit} sx={{ mt: 2 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Add a note…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          multiline
          maxRows={4}
          disabled={isLoading}
        />
        <Button type="submit" variant="contained" disabled={!note.trim() || isLoading}>
          Add
        </Button>
      </Stack>
    </Box>
  );
}
