import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Severity, AlertStatus } from '@/features/alerts/types';

export type SortKey = 'severity' | 'time' | 'status';

export interface AlertFiltersState {
  search: string;
  severities: Severity[];
  statuses: AlertStatus[];
  deviceId: string | null;
  sort: SortKey;
}

const initialState: AlertFiltersState = {
  search: '',
  severities: [],
  statuses: [],
  deviceId: null,
  sort: 'severity',
};

function toggle<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
}

const filtersSlice = createSlice({
  name: 'alertFilters',
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    toggleSeverity(state, action: PayloadAction<Severity>) {
      state.severities = toggle(state.severities, action.payload);
    },
    toggleStatus(state, action: PayloadAction<AlertStatus>) {
      state.statuses = toggle(state.statuses, action.payload);
    },
    setDeviceId(state, action: PayloadAction<string | null>) {
      state.deviceId = action.payload;
    },
    setSort(state, action: PayloadAction<SortKey>) {
      state.sort = action.payload;
    },
    resetFilters() {
      return initialState;
    },
  },
});

export const { setSearch, toggleSeverity, toggleStatus, setDeviceId, setSort, resetFilters } =
  filtersSlice.actions;
export default filtersSlice.reducer;
