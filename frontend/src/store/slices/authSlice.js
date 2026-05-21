import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/axios';

// ─── Async Thunks ──────────────────────────────────────────────────────────────
export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('accessToken', data.data.accessToken);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', userData);
    localStorage.setItem('accessToken', data.data.accessToken);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
  } catch (err) {
    localStorage.removeItem('accessToken');
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchCurrentUser = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/users/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

// ─── Slice ─────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:        null,
    isLoading:   false,
    isInitialized: false,
    error:       null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    setUser:    (state, action) => { state.user = action.payload; },
  },
  extraReducers: (builder) => {
    const pending  = (state) => { state.isLoading = true;  state.error = null; };
    const rejected = (state, action) => { state.isLoading = false; state.error = action.payload; };

    builder
      .addCase(loginUser.pending,   pending)
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user      = action.payload.user;
      })
      .addCase(loginUser.rejected, rejected)

      .addCase(registerUser.pending,   pending)
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user      = action.payload.user;
      })
      .addCase(registerUser.rejected, rejected)

      .addCase(logoutUser.fulfilled, (state) => {
        state.user      = null;
        state.isLoading = false;
      })

      .addCase(fetchCurrentUser.pending, (state) => { state.isLoading = true; })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading     = false;
        state.isInitialized = true;
        state.user          = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading     = false;
        state.isInitialized = true;
        state.user          = null;
      })

      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectUser         = (state) => state.auth.user;
export const selectIsLoading    = (state) => state.auth.isLoading;
export const selectAuthError    = (state) => state.auth.error;
export const selectIsInitialized= (state) => state.auth.isInitialized;
export const selectIsAdmin      = (state) => state.auth.user?.role === 'admin';
export const selectIsOrganiser  = (state) => state.auth.user?.role === 'organiser';
