import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_URL } from '@/lib/config';
import type { Alert, ResolutionType } from '@/features/alerts/types';
import type { Device } from '@/features/devices/types';
import type { User } from '@/features/users/types';
import type { AlertStats, TimeseriesResponse } from '@/features/analytics/types';

export interface AssignArgs {
  id: string;
  assignee_id: string;
  note?: string;
}
export interface ResolveArgs {
  id: string;
  resolution_type: ResolutionType;
  root_cause: string;
  action_taken: string;
  preventive_measures?: string;
  time_spent_minutes?: number;
}
export interface NoteArgs {
  id: string;
  note: string;
}
export interface BulkArgs {
  ids: string[];
}
export interface BulkAssignArgs {
  ids: string[];
  assignee_id: string;
  note?: string;
}
export interface BulkResult {
  requested: number;
  succeeded: string[];
  failed: { id: string; code: string; message: string }[];
}

/**
 * The single RTK Query API slice — owns all server state (cache, loading, error)
 * and injects the current user's bearer token on every request. Mutations
 * invalidate the alert cache so the queue + detail re-fetch the server's truth.
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, apiCtx) => {
      // Read the current user's token from the store (set by the UserSwitcher).
      const state = apiCtx.getState() as { auth: { token: string } };
      headers.set('Authorization', `Bearer ${state.auth.token}`);
      return headers;
    },
  }),
  tagTypes: ['Alert', 'Device', 'User'],
  endpoints: (build) => ({
    getUsers: build.query<User[], void>({
      query: () => '/users',
      providesTags: ['User'],
    }),
    getDevices: build.query<Device[], void>({
      query: () => '/devices',
      providesTags: ['Device'],
    }),
    getAlerts: build.query<Alert[], void>({
      query: () => '/alerts',
      providesTags: [{ type: 'Alert', id: 'LIST' }],
    }),
    getAlert: build.query<Alert, string>({
      query: (id) => `/alerts/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Alert', id }],
    }),
    getStats: build.query<AlertStats, void>({
      query: () => '/alerts/stats',
      providesTags: [{ type: 'Alert', id: 'LIST' }],
    }),
    getTimeseries: build.query<TimeseriesResponse, number>({
      query: (days) => `/alerts/timeseries?days=${days}`,
      providesTags: [{ type: 'Alert', id: 'LIST' }],
    }),

    acknowledgeAlert: build.mutation<Alert, string>({
      query: (id) => ({ url: `/alerts/${id}/acknowledge`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Alert', id }, { type: 'Alert', id: 'LIST' }],
    }),
    assignAlert: build.mutation<Alert, AssignArgs>({
      query: ({ id, ...body }) => ({ url: `/alerts/${id}/assign`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Alert', id }, { type: 'Alert', id: 'LIST' }],
    }),
    resolveAlert: build.mutation<Alert, ResolveArgs>({
      query: ({ id, ...body }) => ({ url: `/alerts/${id}/resolve`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Alert', id }, { type: 'Alert', id: 'LIST' }],
    }),
    addNote: build.mutation<Alert, NoteArgs>({
      query: ({ id, note }) => ({ url: `/alerts/${id}/notes`, method: 'POST', body: { note } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Alert', id }, { type: 'Alert', id: 'LIST' }],
    }),
    dismissAlert: build.mutation<Alert, string>({
      query: (id) => ({ url: `/alerts/${id}/dismiss`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Alert', id }, { type: 'Alert', id: 'LIST' }],
    }),
    reopenAlert: build.mutation<Alert, string>({
      query: (id) => ({ url: `/alerts/${id}/reopen`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Alert', id }, { type: 'Alert', id: 'LIST' }],
    }),

    bulkAcknowledge: build.mutation<BulkResult, BulkArgs>({
      query: (body) => ({ url: '/alerts/bulk/acknowledge', method: 'POST', body }),
      invalidatesTags: (_r, _e, { ids }) => [
        { type: 'Alert', id: 'LIST' },
        ...ids.map((id) => ({ type: 'Alert' as const, id })),
      ],
    }),
    bulkAssign: build.mutation<BulkResult, BulkAssignArgs>({
      query: (body) => ({ url: '/alerts/bulk/assign', method: 'POST', body }),
      invalidatesTags: (_r, _e, { ids }) => [
        { type: 'Alert', id: 'LIST' },
        ...ids.map((id) => ({ type: 'Alert' as const, id })),
      ],
    }),

    // Testing helper — resets the DB to default values (see api /dev/reset).
    resetDatabase: build.mutation<{ ok: boolean; message: string }, void>({
      query: () => ({ url: '/dev/reset', method: 'POST' }),
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetDevicesQuery,
  useGetAlertsQuery,
  useGetAlertQuery,
  useGetStatsQuery,
  useGetTimeseriesQuery,
  useAcknowledgeAlertMutation,
  useAssignAlertMutation,
  useResolveAlertMutation,
  useAddNoteMutation,
  useDismissAlertMutation,
  useReopenAlertMutation,
  useBulkAcknowledgeMutation,
  useBulkAssignMutation,
  useResetDatabaseMutation,
} = api;
