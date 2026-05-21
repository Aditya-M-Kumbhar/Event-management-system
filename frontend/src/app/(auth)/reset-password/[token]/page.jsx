'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Zap, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import api from '../../../../lib/axios';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const { token }  = useParams();
  const router     = useRouter();
  const [show,     setShow]    = useState(false);
  const [loading,  setLoading] = useState(false);
  const [done,     setDone]    = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async ({ newPassword }) => {
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { newPassword });
      setDone(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-tertiary dark:bg-surface-dark flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold">EventSphere</span>
          </Link>
        </div>

        <div className="card p-8">
          {done ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Password Reset!</h2>
              <p className="text-sm text-[--color-text-secondary]">Redirecting to login...</p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-display font-bold mb-1">Set New Password</h1>
              <p className="text-sm text-[--color-text-secondary] mb-6">Choose a strong password for your account.</p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
                    <input
                      type={show ? 'text' : 'password'}
                      placeholder="Min 8 chars, uppercase + number"
                      className={`input pl-10 pr-10 ${errors.newPassword ? 'border-red-500' : ''}`}
                      {...register('newPassword', {
                        required: true,
                        minLength: 8,
                        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      })}
                    />
                    <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-text-muted]">
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="text-red-500 text-xs mt-1">Must be 8+ chars with uppercase and a number</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className={`input pl-10 ${errors.confirm ? 'border-red-500' : ''}`}
                      {...register('confirm', { validate: v => v === watch('newPassword') || 'Passwords do not match' })}
                    />
                  </div>
                  {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
