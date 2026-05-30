'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setUser } from '@/features/auth/authSlice';
import { DEMO_USERS, type DemoUser } from '@/features/auth/demoUsers';
import { api } from '@/lib/api/apiSlice';
import { initials } from '@/features/alerts/lib/format';

const STORAGE_KEY = 'knaq-token';

/**
 * Switches the "logged-in user" at runtime. Selecting a user swaps the bearer
 * token in the store and resets the RTK Query cache, so every screen re-fetches
 * and re-renders scoped to that user's company — a live multi-tenancy demo.
 */
export function UserSwitcher() {
  const dispatch = useAppDispatch();
  const current = useAppSelector((s) => s.auth);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  // Apply the saved selection once, after mount.
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && saved !== current.token) {
      const user = DEMO_USERS.find((u) => u.token === saved);
      if (user) {
        dispatch(setUser(user));
        dispatch(api.util.resetApiState());
      }
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = (user: DemoUser) => {
    setAnchor(null);
    if (user.token === current.token) return;
    window.localStorage.setItem(STORAGE_KEY, user.token);
    dispatch(setUser(user));
    dispatch(api.util.resetApiState()); // refetch all queries as the new user
  };

  return (
    <>
      <Button
        color="inherit"
        onClick={(e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)}
        endIcon={<KeyboardArrowDownIcon />}
        sx={{ textTransform: 'none', mr: 1 }}
        aria-label="switch user"
      >
        <Avatar sx={{ width: 26, height: 26, fontSize: 12, mr: 1, bgcolor: 'secondary.main' }}>
          {initials(current.name)}
        </Avatar>
        <Box sx={{ textAlign: 'left', lineHeight: 1.15 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {current.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {current.company}
          </Typography>
        </Box>
      </Button>

      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {DEMO_USERS.map((user) => (
          <MenuItem key={user.token} selected={user.token === current.token} onClick={() => pick(user)}>
            <Avatar sx={{ width: 30, height: 30, fontSize: 13, mr: 1.5, bgcolor: 'secondary.main' }}>
              {initials(user.name)}
            </Avatar>
            <ListItemText primary={user.name} secondary={`${user.role} · ${user.company}`} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
