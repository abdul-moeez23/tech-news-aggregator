import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.token = action.payload.access;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.access);
      if (action.payload.refresh) {
        localStorage.setItem('refreshToken', action.payload.refresh);
      }
    },
    logout: (state) => {
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
