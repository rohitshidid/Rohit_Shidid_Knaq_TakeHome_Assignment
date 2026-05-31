import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface SelectionState {
  ids: string[];
}

const initialState: SelectionState = { ids: [] };

const selectionSlice = createSlice({
  name: 'alertSelection',
  initialState,
  reducers: {
    toggleOne(state, action: PayloadAction<string>) {
      state.ids = state.ids.includes(action.payload)
        ? state.ids.filter((x) => x !== action.payload)
        : [...state.ids, action.payload];
    },
    setMany(state, action: PayloadAction<string[]>) {
      state.ids = action.payload;
    },
    clear(state) {
      state.ids = [];
    },
  },
});

export const { toggleOne, setMany, clear } = selectionSlice.actions;
export default selectionSlice.reducer;
