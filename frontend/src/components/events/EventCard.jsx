'use client';

import Image from 'next/image';
import Link  from 'next/link';
import { format } from 'date-fns';
import { MapPin, Calendar, Users, Heart, Wifi } from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { selectUser } from '../../store/slices/authSlice';

export default function EventCard({ event, viewMode = 'grid' }) {
  const user = useSelector(selectUser);
  const [wishlisted, setWishlisted] = useState(event.isWishlisted || false);
  const [wishLoading, setWishLoading] = useState(false);

  const minPrice = event.minPrice ?? (event.isFree ? 0 : null);
  const isOnline = event.format === 'online';

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Sign in to save events'); return; }
    setWishLoading(true);
    try {
      await api.post(`/wishlist/toggle`, { eventId: event._id });
      setWishlisted(!wishlisted);
      toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setWishLoading(false);
    }
  };

  if (viewMode === 'list') {
    return (
      <Link href={`/events/${event.slug}`}>
        <div className="card p-4 flex gap-4 hover:shadow-card-hover transition-shadow cursor-pointer">
          <div className="relative w-32 h-24 rounded-xl overflow-hidden flex-shrink-0">
            <Image src={event.bannerImage || '/images/event-placeholder.jpg'} alt={event.title} fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="badge bg-brand-50 dark:bg-brand-950 text-brand-500 mb-1">{event.category}</span>
                <h3 className="font-semibold text-sm line-clamp-1">{event.title}</h3>
              </div>
              <div className="text-right flex-shrink-0">
                {event.isFree
                  ? <span className="badge bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">Free</span>
                  : <span className="font-bold text-brand-500 text-sm">₹{minPrice?.toLocaleString()}</span>
                }
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-[--color-text-secondary]">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(event.startDate), 'MMM d, yyyy')}</span>
              <span className="flex items-center gap-1">
                {isOnline ? <><Wifi className="w-3 h-3" /> Online</> : <><MapPin className="w-3 h-3" />{event.venue?.city || 'TBD'}</>}
              </span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event.totalSold || 0} registered</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/events/${event.slug}`}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className="card overflow-hidden cursor-pointer group h-full flex flex-col"
      >
        {/* Banner */}
        <div className="relative h-44 overflow-hidden">
          <Image
            src={event.bannerImage || '/images/event-placeholder.jpg'}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          {/* Overlay badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {event.isFeatured && <span className="badge bg-yellow-400 text-yellow-900 text-[10px]">⭐ Featured</span>}
            {event.isTrending && <span className="badge bg-red-500 text-white text-[10px]">🔥 Trending</span>}
            {event.isSoldOut  && <span className="badge bg-gray-800 text-white text-[10px]">Sold Out</span>}
          </div>
          {/* Format badge */}
          <div className="absolute top-3 right-3">
            <span className={`badge text-[10px] ${isOnline ? 'bg-blue-500 text-white' : 'bg-white/90 text-gray-700'}`}>
              {isOnline ? '🌐 Online' : '📍 In-Person'}
            </span>
          </div>
          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            disabled={wishLoading}
            className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-gray-900/90 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <span className="badge bg-brand-50 dark:bg-brand-950/50 text-brand-500 text-[10px] mb-2 w-fit">{event.category}</span>
          <h3 className="font-semibold text-sm line-clamp-2 mb-2 flex-1">{event.title}</h3>

          <div className="space-y-1.5 text-xs text-[--color-text-secondary]">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
              {format(new Date(event.startDate), 'EEE, MMM d · h:mm a')}
            </div>
            <div className="flex items-center gap-1.5">
              {isOnline
                ? <><Wifi className="w-3.5 h-3.5 text-blue-400" /> Online Event</>
                : <><MapPin className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />{event.venue?.city || 'Location TBD'}</>
              }
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[--color-border]">
            <div className="flex items-center gap-1 text-xs text-[--color-text-secondary]">
              <Users className="w-3.5 h-3.5" />
              {event.totalSold?.toLocaleString() || 0} going
            </div>
            <div>
              {event.isFree
                ? <span className="font-bold text-green-600 dark:text-green-400 text-sm">Free</span>
                : <span className="font-bold text-brand-500 text-sm">₹{minPrice?.toLocaleString()}</span>
              }
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
