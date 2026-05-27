'use client';
import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../../lib/axios';
import AIDescriptionGenerator from '../../../../components/organiser/AIDescriptionGenerator';

const STEPS = ['Basic Info', 'Details', 'Tickets', 'Agenda', 'Publish'];

export default function CreateEventPage() {
  const router   = useRouter();
  const [step,   setStep]    = useState(0);
  const [saving, setSaving]  = useState(false);
  
  const methods = useForm({
    defaultValues: {
      title: '', 
      description: '', 
      category: '', 
      format: 'offline',
      startDate: '', 
      endDate: '', 
      totalCapacity: 100,
      'venue.name': '', 
      'venue.city': '', 
      'venue.address': '',
      onlineMeetingLink: '', 
      status: 'draft',
      ticketTypes: [{ name: 'General', type: 'general', price: 0, capacity: 100, maxPerUser: 5, isActive: true }],
    },
  });
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = methods;
  const category = watch('category');
  const eventFormat = watch('format');

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const formData = new FormData();

      // ── Build nested venue object with clean validation data ──────────────
      const venue = {};
      const skipKeys = new Set();
      
      Object.keys(data).forEach((k) => {
        if (k.startsWith('venue.')) {
          const subKey = k.replace('venue.', '');
          if (data[k] !== undefined && data[k] !== null && data[k].trim() !== '') {
            venue[subKey] = data[k].trim();
          }
          skipKeys.add(k);
        }
      });
      
      // Only append venue if it's an offline/hybrid event and has data
      if (eventFormat !== 'online' && Object.keys(venue).length > 0) {
        formData.append('venue', JSON.stringify(venue));
      }

      // ── Coerce ticketTypes: ensure clean numbers and serialize ───────
      if (Array.isArray(data.ticketTypes)) {
        const coerced = data.ticketTypes.map((t) => ({
          name: t.name || 'General Admission',
          type: t.type || 'general',
          price: Number(t.price) >= 0 ? Number(t.price) : 0,
          capacity: Number(t.capacity) > 0 ? Number(t.capacity) : 1,
          maxPerUser: Number(t.maxPerUser) > 0 ? Number(t.maxPerUser) : 5,
          isActive: t.isActive !== false,
        }));
        formData.append('ticketTypes', JSON.stringify(coerced));
        skipKeys.add('ticketTypes');
      }

      // ── Clean and Append remaining scalar fields ───────────────────────
      const numericFields = new Set(['totalCapacity']);
      
      Object.entries(data).forEach(([k, v]) => {
        if (skipKeys.has(k)) return;
        if (v === undefined || v === null || v === '') return;
        if (typeof v === 'object') return; 
        
        // Clean online paths if the event format is completely offline
        if (k === 'onlineMeetingLink' && eventFormat === 'offline') return;

        const cleanValue = numericFields.has(k) ? String(Number(v) || 0) : String(v).trim();
        formData.append(k, cleanValue);
      });

      // ── Banner image file structure upload ──────────────────────────────────
      const bannerFile = document.getElementById('banner-upload')?.files?.[0];
      if (bannerFile) {
        formData.append('bannerImage', bannerFile);
      }

      // ── Execute API Request ─────────────────────────────────────────────
      const { data: res } = await api.post('/events', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toast.success('Event created successfully!');
      
      // 🟢 FIX: Redirect securely to the discovery feed to completely bypass 404 crashes
      router.push('/events');
      
    } catch (err) {
      console.error('Event creation error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to create event. Please verify all fields.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-display font-bold mb-2">Create New Event</h1>
      <p className="text-[--color-text-secondary] text-sm mb-8">Fill in the details below. You can always save as draft.</p>

      {/* Step Indicators Layout */}
      <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-shrink-0">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              i < step  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : i === step ? 'bg-brand-500 text-white shadow-sm'
              : 'bg-surface-secondary dark:bg-surface-dark-tertiary text-[--color-text-muted]'
            }`}>
              {i < step ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`w-6 h-0.5 rounded flex-shrink-0 ${i < step ? 'bg-green-400' : 'bg-[--color-border]'}`} />}
          </div>
        ))}
      </div>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* STEP 0 — Basic Info */}
              {step === 0 && (
                <div className="card p-6 space-y-5">
                  <h2 className="font-semibold text-base">Basic Information</h2>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Event Title *</label>
                    <input className={`input ${errors.title ? 'border-red-500' : ''}`} placeholder="Give your event a great title" {...register('title', { required: true })} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium">Description *</label>
                      <AIDescriptionGenerator
                        category={category}
                        onApply={val => setValue('description', val)}
                      />
                    </div>
                    <textarea rows={6} className={`input resize-none ${errors.description ? 'border-red-500' : ''}`} placeholder="Describe your event..." {...register('description', { required: true })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Category *</label>
                      <select className="input" {...register('category', { required: true })}>
                        <option value="">Select category</option>
                        {['Technology','Business','Music','Arts & Culture','Sports & Fitness','Health & Wellness','Food & Drink','Education','Networking','Gaming','Film & Media','Fashion','Travel','Social','Other'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Format *</label>
                      <select className="input" {...register('format')}>
                        <option value="offline">In-Person</option>
                        <option value="online">Online</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Banner Image</label>
                    <input id="banner-upload" type="file" accept="image/*" className="input py-2 text-sm" />
                    <p className="text-xs text-[--color-text-muted] mt-1">Recommended: 1200x600px, max 5MB</p>
                  </div>
                </div>
              )}

              {/* STEP 1 — Details */}
              {step === 1 && (
                <div className="card p-6 space-y-5">
                  <h2 className="font-semibold text-base">Date, Time & Location</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Start Date & Time *</label>
                      <input type="datetime-local" className="input" {...register('startDate', { required: true })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">End Date & Time *</label>
                      <input type="datetime-local" className="input" {...register('endDate', { required: true })} />
                    </div>
                  </div>
                  
                  {eventFormat !== 'online' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Venue Name *</label>
                        <input className="input" placeholder="e.g. NSCI Dome" {...register('venue.name', { required: eventFormat === 'offline' })} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1.5">City *</label>
                          <input className="input" placeholder="Pune" {...register('venue.city', { required: eventFormat === 'offline' })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Total Capacity *</label>
                          <input type="number" className="input" min="1" {...register('totalCapacity', { required: true, min: 1 })} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Full Address</label>
                        <input className="input" placeholder="Street, Area, Pincode" {...register('venue.address')} />
                      </div>
                    </>
                  )}

                  {eventFormat !== 'offline' && (
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Online Meeting Link *</label>
                      <input type="url" className="input" placeholder="https://zoom.us/..." {...register('onlineMeetingLink', { required: eventFormat === 'online' })} />
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2 — Tickets */}
              {step === 2 && (
                <div className="card p-6 space-y-5">
                  <h2 className="font-semibold text-base">Ticket Types</h2>
                  <p className="text-xs text-[--color-text-secondary]">Set price to 0 for free tickets.</p>
                  {watch('ticketTypes')?.map((_, i) => (
                    <div key={i} className="border border-[--color-border] rounded-xl p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">Name *</label>
                          <input className="input text-sm" placeholder="General Admission" {...register(`ticketTypes.${i}.name`, { required: true })} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Type</label>
                          <select className="input text-sm" {...register(`ticketTypes.${i}.type`)}>
                            <option value="general">General</option>
                            <option value="vip">VIP</option>
                            <option value="early_bird">Early Bird</option>
                            <option value="free">Free</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Price (₹)</label>
                          <input type="number" min="0" className="input text-sm" {...register(`ticketTypes.${i}.price`)} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Capacity</label>
                          <input type="number" min="1" className="input text-sm" {...register(`ticketTypes.${i}.capacity`)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* STEP 3 — Agenda */}
              {step === 3 && (
                <div className="card p-6">
                  <h2 className="font-semibold text-base mb-2">Agenda</h2>
                  <p className="text-sm text-[--color-text-secondary] mb-4">You can add agenda items after creating the event.</p>
                  <div className="bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 rounded-xl p-4 text-sm text-brand-600 dark:text-brand-400">
                    💡 Use the AI Smart Schedule Builder on the event management view later to auto-generate your timeline details!
                  </div>
                </div>
              )}

              {/* STEP 4 — Publish */}
              {step === 4 && (
                <div className="card p-6 space-y-4">
                  <h2 className="font-semibold text-base">Publish Settings</h2>
                  <div className="flex gap-3">
                    {['draft','published'].map(s => (
                      <label key={s} className={`flex-1 border-2 rounded-xl p-4 cursor-pointer transition-colors ${watch('status') === s ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20' : 'border-[--color-border]'}`}>
                        <input type="radio" value={s} className="sr-only" {...register('status')} />
                        <p className="font-semibold text-sm capitalize">{s}</p>
                        <p className="text-xs text-[--color-text-secondary] mt-0.5">
                          {s === 'draft' ? 'Save and review later' : 'Make visible immediately'}
                        </p>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls layout footer */}
          <div className="flex items-center justify-between mt-8">
            <button
              type="button"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="btn-secondary flex items-center gap-2 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {step < STEPS.length - 1 ? (
              <button 
                type="button" 
                onClick={async () => {
                  // Trigger validation for current step fields before letting user skip forward
                  let fieldsToValidate = [];
                  if (step === 0) fieldsToValidate = ['title', 'description', 'category'];
                  if (step === 1) fieldsToValidate = ['startDate', 'endDate', 'totalCapacity'];
                  
                  const isValid = fieldsToValidate.length > 0 ? await methods.trigger(fieldsToValidate) : true;
                  if (isValid) setStep(step + 1);
                  else toast.error('Please complete all required fields on this page');
                }} 
                className="btn-primary flex items-center gap-2"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Check className="w-4 h-4" /> Create Event</>}
              </button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  );
}