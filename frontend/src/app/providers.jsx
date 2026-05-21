'use client';

import { Provider } from 'react-redux';
import { store } from '../store';
import { useEffect } from 'react';
import { fetchCurrentUser } from '../store/slices/authSlice';
import { ThemeProvider } from 'next-themes'; // 🌟 Added theme provider here

function AuthInitializer({ children }) {
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      store.dispatch(fetchCurrentUser());
    } else {
      store.dispatch({ type: 'auth/fetchCurrentUser/rejected' });
    }
  }, []);
  return children;
}

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem> {/* 🌟 Wrapped here */}
        <AuthInitializer>
          {children}
        </AuthInitializer>
      </ThemeProvider>
    </Provider>
  );
}