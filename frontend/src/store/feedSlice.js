import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/api';

export const fetchFeed = createAsyncThunk(
  'feed/fetchFeed',
  async (page = 1, { rejectWithValue }) => {
    try {
      const response = await api.get(`/feed/?page=${page}`);
      return { data: response.data, page };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch feed');
    }
  }
);

const feedSlice = createSlice({
  name: 'feed',
  initialState: {
    articles: [],
    status: 'idle',
    error: null,
    hasMore: true,
    currentPage: 1,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { data, page } = action.payload;
        
        // DRF paginated response has a 'results' array
        const newArticles = data.results || data; 
        
        if (page === 1) {
          state.articles = newArticles;
        } else {
          state.articles = [...state.articles, ...newArticles];
        }
        
        state.hasMore = !!data.next;
        state.currentPage = page;
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default feedSlice.reducer;
