import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_URL, API_TOKEN } from '@/lib/config';
import type { Alert } from '@/features/alerts/types';
import type { Device } from '@/features/devices/types';
import type { User } from '@/features/users/types';

/**
 * The single RTK Query API slice — owns all server state (cache, loading, error)
 * and injects the bearer token on every request. Mutations are added later.
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers) => {
      headers.set('Authorization', `Bearer ${API_TOKEN}`);
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
      providesTags: ['Alert'],
    }),
  }),
});

export const { useGetUsersQuery, useGetDevicesQuery, useGetAlertsQuery } = api;
