'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Camera, Save, Loader2, User, Phone, MapPin, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateProfile, selectUser } from '../../../store/slices/authSlice';

export default function ProfilePage() {
  const dispatch  = useDispatch();
  const user      = useSelector(selectUser);
  const [saving,  setSaving]  = useState(false);
  const [preview, setPreview] = useState(user?.avatar || '');

  const { register, handleSubmit } = useForm({
    defaultValues: {
      name:                user?.name                || '',
      bio:                 user?.bio                 || '',
      phone:               user?.phone               || '',
      city:                user?.city                || '',
      website:             user?.website             || '',
      linkedin:            user?.linkedin            || '',
      twitter:             user?.twitter             || '',
      organisationName:    user?.organisationName    || '',
      organisationWebsite: user?.organisationWebsite || '',
    },
  });

  const onSubmit = async (data) => {
    setSaving(true);
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v) formData.append(k, v); });
    const fileInput = document.getElementById('avatar-upload');
    if (fileInput?.files?.[0]) formData.append('avatar', fileInput.files[0]);
    const result = await dispatch(updateProfile(formData));
    if (updateProfile.fulfilled.match(result)) toast.success('Profile updated!');
    else toast.error(result.payload || 'Update failed');
    setSaving(false);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  return (
    <div className="page-container py-8 max-w-2xl">
      <h1 className="section-title mb-8">Profile Settings</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Avatar Card */}
        <div className="card p-6 flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-brand-500 flex items-center justify-center text-white text-3xl font-bold">
              {preview
                ? <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
                : user?.name?.charAt(0)
              }
            </div>
            <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-brand-600 transition-colors">
              <Camera className="w-3.5 h-3.5 text-white" />
            </label>
            <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="font-semibold">{user?.name}</p>
            <p className="text-sm text-[--color-text-secondary]">{user?.email}</p>
            <span className="badge bg-brand-100 text-brand-600 text-xs mt-1">{user?.role}</span>
          </div>
        </div>

        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold">Basic Information</h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
              <input type="text" className="input pl-10" placeholder="Your full name" {...register('name')} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Bio</label>
            <textarea rows={3} className="input resize-none" placeholder="Tell us about yourself..." {...register('bio')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
                <input type="text" className="input pl-10" placeholder="+91 9999999999" {...register('phone')} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">City</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
                <input type="text" className="input pl-10" placeholder="Mumbai, Delhi..." {...register('city')} />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Website</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
              <input type="url" className="input pl-10" placeholder="https://yoursite.com" {...register('website')} />
            </div>
          </div>
        </div>

        {/* Organiser Details */}
        {user?.role === 'organiser' && (
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold">Organisation Details</h2>
            <div>
              <label className="block text-sm font-medium mb-1.5">Organisation Name</label>
              <input type="text" className="input" placeholder="Your company/org name" {...register('organisationName')} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Organisation Website</label>
              <input type="url" className="input" placeholder="https://org.com" {...register('organisationWebsite')} />
            </div>
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
