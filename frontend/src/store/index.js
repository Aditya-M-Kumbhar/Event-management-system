/**
 * Redux Toolkit Store Configuration
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer         from './slices/authSlice';
import eventReducer        from './slices/eventSlice';
import cartReducer         from './slices/cartSlice';
import notificationReducer from './slices/notificationSlice';
import uiReducer           from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth:          authReducer,
    events:        eventReducer,
    cart:          cartReducer,
    notifications: notificationReducer,
    ui:            uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
