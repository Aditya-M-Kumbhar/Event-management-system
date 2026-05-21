import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen:    false,
    chatbotOpen:    false,
    searchOpen:     false,
    activeModal:    null,   // 'login' | 'register' | 'coupon' | null
    toasts:         [],
  },
  reducers: {
    toggleSidebar:  (state) => { state.sidebarOpen = !state.sidebarOpen; },
    closeSidebar:   (state) => { state.sidebarOpen = false; },
    toggleChatbot:  (state) => { state.chatbotOpen = !state.chatbotOpen; },
    toggleSearch:   (state) => { state.searchOpen  = !state.searchOpen; },
    openModal:      (state, { payload }) => { state.activeModal = payload; },
    closeModal:     (state) => { state.activeModal = null; },
    addToast(state, { payload }) {
      state.toasts.push({ id: Date.now(), ...payload });
    },
    removeToast(state, { payload }) {
      state.toasts = state.toasts.filter((t) => t.id !== payload);
    },
  },
});

export const {
  toggleSidebar, closeSidebar, toggleChatbot, toggleSearch,
  openModal, closeModal, addToast, removeToast,
} = uiSlice.actions;

export default uiSlice.reducer;
