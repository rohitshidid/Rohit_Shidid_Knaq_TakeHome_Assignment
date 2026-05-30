import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_USER, type DemoUser } from './demoUsers';

export interface AuthState {
  token: string;
  name: string;
  company: string;
}

// Same default on server and client → no hydration mismatch. The saved choice
// is applied after mount by the UserSwitcher.
const initialState: AuthState = {
  token: DEFAULT_USER.token,
  name: DEFAULT_USER.name,
  company: DEFAULT_USER.company,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<DemoUser>) {
      state.token = action.payload.token;
      state.name = action.payload.name;
      state.company = action.payload.company;
    },
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
