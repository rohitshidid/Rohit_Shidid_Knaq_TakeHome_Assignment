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
