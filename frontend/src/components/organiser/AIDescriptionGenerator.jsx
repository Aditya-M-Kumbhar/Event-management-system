'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Copy, Check, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../lib/axios';

export default function AIDescriptionGenerator({ onApply, category }) {
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState('');
  const [copied,    setCopied]    = useState(false);
  const [open,      setOpen]      = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { tone: 'Professional and engaging', audience: 'General public' },
  });

  const onGenerate = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/ai/description', {
        topic:        data.topic,
        bulletPoints: data.bulletPoints,
        audience:     data.audience,
        tone:         data.tone,
        category,
      });
      setResult(res.data.data.description);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate description');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  const handleApply = () => {
    onApply?.(result);
    toast.success('Description applied!');
    setOpen(false);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        Generate with AI
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-5 bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-950/30 dark:to-purple-950/30 border border-brand-200 dark:border-brand-800 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="font-semibold text-sm">AI Description Generator</h3>
                <span className="badge bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-300 text-[10px]">Powered by Groq</span>
              </div>

              <form onSubmit={handleSubmit(onGenerate)} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Event Topic *</label>
                  <input
                    type="text"
                    placeholder="e.g. React.js Workshop for Beginners"
                    className={`input text-sm ${errors.topic ? 'border-red-500' : ''}`}
                    {...register('topic', { required: true })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Key Points (one per line) *</label>
                  <textarea
                    rows={4}
                    placeholder={`What will attendees learn?\nKey speakers or highlights?\nUnique value proposition?\nNetworking opportunities`}
                    className={`input text-sm resize-none ${errors.bulletPoints ? 'border-red-500' : ''}`}
                    {...register('bulletPoints', { required: true })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Target Audience</label>
                    <input type="text" placeholder="Developers, Students…" className="input text-sm" {...register('audience')} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Tone</label>
                    <select className="input text-sm" {...register('tone')}>
                      <option>Professional and engaging</option>
                      <option>Casual and fun</option>
                      <option>Formal and authoritative</option>
                      <option>Inspirational and motivating</option>
                      <option>Educational and informative</option>
                    </select>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating with AI…</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Generate Description</>
                  )}
                </button>
              </form>

              {/* Generated Result */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-brand-600 dark:text-brand-400">Generated Description</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleSubmit(onGenerate)()} className="flex items-center gap-1 text-xs text-[--color-text-muted] hover:text-brand-500">
                          <RefreshCw className="w-3 h-3" /> Regenerate
                        </button>
                        <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-[--color-text-muted] hover:text-brand-500">
                          {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-surface-dark-secondary rounded-xl p-4 text-sm leading-relaxed max-h-64 overflow-y-auto border border-[--color-border] whitespace-pre-wrap">
                      {result}
                    </div>
                    <button onClick={handleApply} className="btn-primary w-full mt-3 text-sm">
                      ✓ Use This Description
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
