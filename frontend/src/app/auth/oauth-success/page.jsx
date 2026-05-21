'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { fetchCurrentUser } from '../../../store/slices/authSlice';
import { Loader2 } from 'lucide-react';

export default function OAuthSuccessPage() {
  const router       = useRouter();
  const dispatch     = useDispatch();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const role  = searchParams.get('role');
    if (token) {
      localStorage.setItem('accessToken', token);
      dispatch(fetchCurrentUser()).then(() => {
        if (role === 'admin')     router.replace('/admin/dashboard');
        else if (role === 'organiser') router.replace('/organiser/dashboard');
        else router.replace('/events');
      });
    } else {
      router.replace('/login?error=oauth_failed');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500 mx-auto mb-4" />
        <p className="text-[--color-text-secondary]">Completing sign in...</p>
      </div>
    </div>
  );
}
