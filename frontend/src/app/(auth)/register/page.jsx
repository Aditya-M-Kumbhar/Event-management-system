'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Zap, Building } from 'lucide-react';
import toast from 'react-hot-toast';
import { registerUser, selectIsLoading } from '../../../store/slices/authSlice';

const registerSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters').max(60),
  email:    z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase & a number'),
  confirmPassword: z.string(),
  role:     z.enum(['attendee', 'organiser']).default('attendee'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path:    ['confirmPassword'],
});

export default function RegisterPage() {
  const dispatch  = useDispatch();
  const router    = useRouter();
  const isLoading = useSelector(selectIsLoading);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'attendee' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    const { confirmPassword, ...payload } = data;
    const result = await dispatch(registerUser(payload));
    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created! Welcome to EventSphere 🎉');
      const role = result.payload.user.role;
      router.push(role === 'organiser' ? '/organiser/dashboard' : '/events');
    } else {
      toast.error(result.payload || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-surface-tertiary dark:bg-surface-dark flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -left-32 w-96 h-96 bg-brand-400/08 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold">EventSphere</span>
          </Link>
          <h1 className="text-2xl font-display font-bold">Create your account</h1>
          <p className="text-sm text-[--color-text-secondary] mt-1">Join thousands of event creators & attendees</p>
        </div>

        <div className="card p-8">
          {/* Role Toggle */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-surface-secondary dark:bg-surface-dark-tertiary rounded-xl">
            {[
              { value: 'attendee',  label: 'Attendee',  icon: User },
              { value: 'organiser', label: 'Organiser', icon: Building },
            ].map(({ value, label, icon: Icon }) => (
              <label
                key={value}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg cursor-pointer text-sm font-medium transition-all ${
                  selectedRole === value
                    ? 'bg-white dark:bg-surface-dark shadow-sm text-brand-500'
                    : 'text-[--color-text-secondary] hover:text-current'
                }`}
              >
                <input type="radio" value={value} {...register('role')} className="sr-only" />
                <Icon className="w-4 h-4" />
                {label}
              </label>
            ))}
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={() => { window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`; }}
            className="w-full flex items-center justify-center gap-3 border border-surface-tertiary dark:border-surface-dark-tertiary rounded-xl py-2.5 px-4 hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors text-sm font-medium mb-5"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-tertiary dark:border-surface-dark-tertiary" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-surface-dark-secondary px-3 text-[--color-text-muted]">or with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
                <input type="text" placeholder="John Doe" className={`input pl-10 ${errors.name ? 'border-red-500' : ''}`} {...register('name')} />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
                <input type="email" placeholder="you@example.com" className={`input pl-10 ${errors.email ? 'border-red-500' : ''}`} {...register('email')} />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 chars with A-z, 0-9"
                  className={`input pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  {...register('password')}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-text-muted]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
                <input type="password" placeholder="••••••••" className={`input pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`} {...register('confirmPassword')} />
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="text-center text-xs text-[--color-text-muted]">
              By signing up you agree to our{' '}
              <Link href="/terms" className="text-brand-500 hover:underline">Terms</Link> &{' '}
              <Link href="/privacy" className="text-brand-500 hover:underline">Privacy Policy</Link>
            </p>
          </form>

          <p className="text-center text-sm text-[--color-text-secondary] mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-500 font-medium hover:text-brand-600">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
