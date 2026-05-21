import { createSlice } from '@reduxjs/toolkit';

// ─── Event Slice ──────────────────────────────────────────────────────────────
export const eventSlice = createSlice({
  name: 'events',
  initialState: {
    filters: {
      category: '',
      city:     '',
      dateFrom: '',
      dateTo:   '',
      type:     'all',   // 'free' | 'paid' | 'all'
      format:   'all',   // 'online' | 'offline' | 'all'
      sort:     'newest', // 'newest' | 'popular' | 'price_asc' | 'trending'
    },
    searchQuery: '',
    currentPage: 1,
  },
  reducers: {
    setFilter:      (state, { payload }) => { state.filters[payload.key] = payload.value; state.currentPage = 1; },
    setSearchQuery: (state, { payload }) => { state.searchQuery = payload; state.currentPage = 1; },
    resetFilters:   (state) => { state.filters = eventSlice.getInitialState().filters; state.searchQuery = ''; },
    setPage:        (state, { payload }) => { state.currentPage = payload; },
  },
});

export const { setFilter, setSearchQuery, resetFilters, setPage } = eventSlice.actions;
export default eventSlice.reducer;

// ─── Notification Slice ───────────────────────────────────────────────────────
export const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items:       [],
    unreadCount: 0,
  },
  reducers: {
    setNotifications(state, { payload }) {
      state.items       = payload;
      state.unreadCount = payload.filter((n) => !n.isRead).length;
    },
    markAllRead(state) {
      state.items.forEach((n) => (n.isRead = true));
      state.unreadCount = 0;
    },
    addNotification(state, { payload }) {
      state.items.unshift(payload);
      if (!payload.isRead) state.unreadCount++;
    },
  },
});

export const { setNotifications, markAllRead, addNotification } = notificationSlice.actions;
