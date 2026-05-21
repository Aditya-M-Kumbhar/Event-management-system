'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckCircle2, Ticket, Home, Sparkles } from 'lucide-react';

export default function CheckoutSuccessPage() {
  return (
    <div className="page-container py-20 max-w-lg text-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle2 className="w-12 h-12 text-green-500" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h1 className="text-3xl font-display font-bold mb-3">Booking Confirmed! 🎉</h1>
        <p className="text-[--color-text-secondary] mb-2">
          Your tickets have been booked successfully. Check your email for confirmation and QR codes.
        </p>
        <p className="text-sm text-[--color-text-muted] mb-8">
          You can also view and download your tickets from your dashboard anytime.
        </p>

        <div className="card p-5 mb-8 text-left">
          <div className="flex items-center gap-2 text-sm text-brand-500 mb-3">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">What's next?</span>
          </div>
          <ul className="space-y-2 text-sm text-[--color-text-secondary]">
            <li className="flex items-start gap-2">✅ Check your email for ticket confirmation</li>
            <li className="flex items-start gap-2">📱 Save your QR code for easy check-in</li>
            <li className="flex items-start gap-2">📅 Add the event to your calendar</li>
            <li className="flex items-start gap-2">🤝 Connect with other attendees</li>
          </ul>
        </div>

        <div className="flex gap-3 justify-center">
          <Link href="/my-tickets" className="btn-primary flex items-center gap-2">
            <Ticket className="w-4 h-4" /> View My Tickets
          </Link>
          <Link href="/events" className="btn-secondary flex items-center gap-2">
            <Home className="w-4 h-4" /> Explore More
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
