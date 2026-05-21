// useAuth.js
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import {
  selectUser, selectIsLoading, selectAuthError, selectIsInitialized,
  logoutUser,
} from '../store/slices/authSlice';

export function useAuth() {
  const dispatch = useDispatch();
  const router   = useRouter();
  const user        = useSelector(selectUser);
  const isLoading   = useSelector(selectIsLoading);
  const error       = useSelector(selectAuthError);
  const initialized = useSelector(selectIsInitialized);

  const logout = async () => {
    await dispatch(logoutUser());
    router.push('/');
  };

  const requireAuth = (callback) => {
    if (!user) { router.push('/login'); return; }
    callback?.();
  };

  const requireRole = (role, callback) => {
    if (!user || user.role !== role) { router.push('/'); return; }
    callback?.();
  };

  return {
    user,
    isLoading,
    error,
    initialized,
    isAuthenticated: !!user,
    isAdmin:      user?.role === 'admin',
    isOrganiser:  user?.role === 'organiser',
    isAttendee:   user?.role === 'attendee',
    logout,
    requireAuth,
    requireRole,
  };
}
