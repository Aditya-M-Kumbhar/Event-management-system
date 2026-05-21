import { z } from 'zod';

export const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name:            z.string().min(2, 'Name must be at least 2 characters').max(60),
  email:           z.string().email('Invalid email address'),
  password:        z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase & a number'),
  confirmPassword: z.string(),
  role:            z.enum(['attendee', 'organiser']).default('attendee'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path:    ['confirmPassword'],
});

export const createEventSchema = z.object({
  title:         z.string().min(3, 'Title must be at least 3 characters').max(120),
  description:   z.string().min(10, 'Description too short').max(5000),
  category:      z.string().min(1, 'Category is required'),
  startDate:     z.string().min(1, 'Start date is required'),
  endDate:       z.string().min(1, 'End date is required'),
  format:        z.enum(['online', 'offline', 'hybrid']),
  totalCapacity: z.coerce.number().int().min(1, 'Capacity must be at least 1'),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title:  z.string().max(100).optional(),
  body:   z.string().max(1000).optional(),
});

export const couponSchema = z.object({
  code:           z.string().min(3).max(20).toUpperCase(),
  discountType:   z.enum(['percentage', 'fixed']),
  discountValue:  z.coerce.number().min(1),
  minOrderAmount: z.coerce.number().min(0).optional(),
  validFrom:      z.string().min(1),
  validUntil:     z.string().min(1),
  maxUses:        z.coerce.number().int().min(1).optional(),
  perUserLimit:   z.coerce.number().int().min(1).optional(),
});
