import { configureStore } from '@reduxjs/toolkit';
import { api } from '@/lib/api/apiSlice';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
  },
  // RTK Query needs its middleware for caching, invalidation, polling, etc.
  middleware: (getDefault) => getDefault().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
