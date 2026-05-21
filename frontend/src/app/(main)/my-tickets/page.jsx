'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Download, QrCode, Calendar, MapPin, Wifi, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../../lib/axios';
import Skeleton from '../../../components/ui/Skeleton';

function TicketCard({ ticket }) {
  const [expanded, setExpanded] = useState(false);
  const event   = ticket.event;
  const isPast  = event && new Date(event.endDate) < new Date();
  const isOnline= event?.format === 'online';

  const handleDownload = () => {
    const svg   = document.getElementById(`qr-${ticket.ticketId}`);
    if (!svg) return;
    const data  = new XMLSerializer().serializeToString(svg);
    const blob  = new Blob([data], { type: 'image/svg+xml' });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href      = url;
    a.download  = `ticket-${ticket.ticketId}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card overflow-hidden ${isPast ? 'opacity-70' : ''}`}
    >
      {/* Ticket Header */}
      <div className="flex items-start justify-between p-5 gap-4">
        <div className="flex gap-4">
          {event?.bannerImage && (
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
              <img src={event.bannerImage} alt={event?.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-sm line-clamp-1">{event?.title || 'Event'}</h3>
            <p className="text-xs font-mono text-brand-500 mt-0.5">{ticket.ticketId}</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-[--color-text-secondary]">
              {event?.startDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(event.startDate), 'MMM d, yyyy')}
                </span>
              )}
              <span className="flex items-center gap-1">
                {isOnline
                  ? <><Wifi className="w-3 h-3 text-blue-500" /> Online</>
                  : <><MapPin className="w-3 h-3" /> {event?.venue?.city}</>
                }
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`badge text-xs ${
            ticket.isCheckedIn ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : isPast           ? 'bg-gray-100 text-gray-600'
            : 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400'
          }`}>
            {ticket.isCheckedIn ? '✅ Checked In' : isPast ? 'Past Event' : '🎫 Active'}
          </span>
          <span className="text-xs text-[--color-text-secondary]">{ticket.ticketTypeName}</span>
          <span className="font-bold text-sm text-brand-500">
            {ticket.price === 0 ? 'Free' : `₹${ticket.price.toLocaleString()}`}
          </span>
        </div>
      </div>

      {/* Perforated line */}
      <div className="relative">
        <div className="border-t border-dashed border-[--color-border] mx-5" />
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface-secondary dark:bg-surface-dark rounded-full" />
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface-secondary dark:bg-surface-dark rounded-full" />
      </div>

      {/* QR Section Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3 flex items-center justify-between text-xs text-[--color-text-secondary] hover:text-brand-500 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <QrCode className="w-3.5 h-3.5" /> {expanded ? 'Hide QR Code' : 'Show QR Code for Check-in'}
        </span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-2xl shadow-sm border border-[--color-border]">
                <QRCodeSVG
                  id={`qr-${ticket.ticketId}`}
                  value={ticket.qrCodeData || ticket.ticketId}
                  size={180}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <div className="text-center">
                <p className="font-mono font-bold text-lg tracking-wider">{ticket.ticketId}</p>
                <p className="text-xs text-[--color-text-muted] mt-1">Scan at entry or show this QR code</p>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 btn-secondary text-sm py-2 px-4"
              >
                <Download className="w-4 h-4" /> Download Ticket
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function MyTicketsPage() {
  const [tickets,  setTickets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('upcoming'); // 'upcoming' | 'past' | 'all'

  useEffect(() => {
    api.get('/tickets/my-tickets')
      .then(({ data }) => setTickets(data.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tickets.filter(t => {
    if (!t.event) return filter === 'all';
    const isPast = new Date(t.event.endDate) < new Date();
    if (filter === 'upcoming') return !isPast;
    if (filter === 'past')     return isPast;
    return true;
  });

  return (
    <div className="page-container py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="section-title flex items-center gap-2 mb-1">
            <Ticket className="w-7 h-7 text-brand-500" /> My Tickets
          </h1>
          <p className="text-[--color-text-secondary] text-sm">{tickets.length} total tickets</p>
        </div>

        {/* Filter tabs */}
        <div className="flex p-1 bg-surface-secondary dark:bg-surface-dark-tertiary rounded-xl gap-1">
          {['upcoming','past','all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                filter === f
                  ? 'bg-white dark:bg-surface-dark shadow-sm text-brand-500'
                  : 'text-[--color-text-secondary] hover:text-current'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Ticket className="w-12 h-12 text-[--color-text-muted] mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No {filter} tickets</h3>
          <p className="text-[--color-text-secondary] text-sm mb-4">
            {filter === 'upcoming' ? 'Book your next event to see tickets here.' : 'Your past tickets will appear here.'}
          </p>
          {filter === 'upcoming' && (
            <a href="/events" className="btn-primary">Explore Events</a>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map(ticket => <TicketCard key={ticket._id} ticket={ticket} />)}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
