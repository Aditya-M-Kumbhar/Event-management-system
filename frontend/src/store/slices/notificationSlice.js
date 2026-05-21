import { createSlice } from '@reduxjs/toolkit';
const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], unreadCount: 0 },
  reducers: {
    setNotifications(state, { payload }) {
      state.items = payload;
      state.unreadCount = payload.filter(n => !n.isRead).length;
    },
    markAllRead(state) {
      state.items.forEach(n => (n.isRead = true));
      state.unreadCount = 0;
    },
    addNotification(state, { payload }) {
      state.items.unshift(payload);
      if (!payload.isRead) state.unreadCount++;
    },
  },
});
export const { setNotifications, markAllRead, addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
