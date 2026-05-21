'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Zap, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../../../lib/axios';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
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
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-display font-bold mb-2">Check your email</h2>
              <p className="text-sm text-[--color-text-secondary] mb-6">
                If that email exists, we sent a password reset link. It expires in 10 minutes.
              </p>
              <Link href="/login" className="btn-primary w-full">Back to Login</Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-display font-bold mb-1">Reset your password</h1>
              <p className="text-sm text-[--color-text-secondary] mb-6">Enter your email and we will send you a reset link.</p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className={`input pl-10 ${errors.email ? 'border-red-500' : ''}`}
                      {...register('email', { required: true })}
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
              <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-[--color-text-secondary] hover:text-brand-500 mt-5">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
