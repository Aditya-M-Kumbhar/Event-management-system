'use client';
import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import api from '../../../lib/axios';
import EventCard from '../../../components/events/EventCard';
import Skeleton  from '../../../components/ui/Skeleton';

export default function WishlistPage() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/wishlist')
      .then(({ data }) => setItems(data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container py-8">
      <h1 className="section-title flex items-center gap-2 mb-2">
        <Heart className="w-7 h-7 text-red-500 fill-red-500" /> Saved Events
      </h1>
      <p className="text-[--color-text-secondary] text-sm mb-8">{items.length} saved event{items.length !== 1 ? 's' : ''}</p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-12 h-12 text-[--color-text-muted] mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No saved events yet</h3>
          <p className="text-[--color-text-secondary] text-sm mb-4">Heart events you are interested in to save them here.</p>
          <Link href="/events" className="btn-primary">Explore Events</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((item, i) => item.event && (
            <motion.div key={item._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <EventCard event={{ ...item.event, isWishlisted: true }} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
