import { configureStore } from '@reduxjs/toolkit';
import { api } from '@/lib/api/apiSlice';
import alertFilters from '@/features/alerts/slices/filtersSlice';
import auth from '@/features/auth/authSlice';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    alertFilters,
    auth,
  },
  // RTK Query needs its middleware for caching, invalidation, polling, etc.
  middleware: (getDefault) => getDefault().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Dev-only handle for manual testing (e.g. injecting a bad token to see 401 UX).
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  (window as unknown as { __knaq?: { store: typeof store; api: typeof api } }).__knaq = { store, api };
}
