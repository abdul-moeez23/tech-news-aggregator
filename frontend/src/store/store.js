import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import feedReducer from './feedSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    feed: feedReducer,
  },
});
