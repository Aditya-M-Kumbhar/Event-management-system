'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Calendar, MapPin, Users, Clock, Wifi, Share2, Heart,
  ChevronDown, ChevronUp, Star, ExternalLink, Tag
} from 'lucide-react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../../../../lib/axios';
import { selectUser } from '../../../../store/slices/authSlice';
import { addToCart } from '../../../../store/slices/cartSlice';
import { useDispatch } from 'react-redux';
import TicketSelector from '../../../../components/events/TicketSelector';
import AgendaSection  from '../../../../components/events/AgendaSection';
import SpeakerCard    from '../../../../components/events/SpeakerCard';
import FAQAccordion   from '../../../../components/events/FAQAccordion';
import ReviewCard     from '../../../../components/reviews/ReviewCard';
import Skeleton       from '../../../../components/ui/Skeleton';

export default function EventDetailPage() {
  const { slug }  = useParams();
  const router    = useRouter();
  const dispatch  = useDispatch();
  const user      = useSelector(selectUser);

  const [event,       setEvent]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [reviews,     setReviews]     = useState([]);
  const [wishlisted,  setWishlisted]  = useState(false);
  const [activeTab,   setActiveTab]   = useState('about');
  const [faqOpen,     setFaqOpen]     = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data } = await api.get(`/events/slug/${slug}`);
        setEvent(data.data.event);
        setWishlisted(data.data.isWishlisted);
        // Fetch reviews
        const rv = await api.get(`/reviews/event/${data.data.event._id}?limit=5`);
        setReviews(rv.data.data);
      } catch {
        router.push('/events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [slug]);

  const handleWishlist = async () => {
    if (!user) { toast.error('Sign in to save events'); return; }
    try {
      await api.post('/wishlist/toggle', { eventId: event._id });
      setWishlisted(!wishlisted);
      toast.success(wishlisted ? 'Removed from wishlist' : 'Saved to wishlist ❤️');
    } catch { toast.error('Failed to update wishlist'); }
  };

  const handleShare = () => {
    navigator.share?.({ title: event.title, url: window.location.href }) ||
      navigator.clipboard.writeText(window.location.href).then(() => toast.success('Link copied!'));
  };

  if (loading) return (
    <div className="page-container py-8 space-y-6">
      <Skeleton className="h-72 rounded-2xl" />
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <Skeleton className="h-8 w-3/4" /><Skeleton className="h-40" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
  if (!event) return null;

  const TABS = ['about','agenda','speakers','faqs','reviews'];
  const isOnline = event.format === 'online';

  return (
    <div className="min-h-screen pb-20">
      {/* ── Hero Banner ── */}
      <div className="relative h-64 md:h-96 w-full overflow-hidden">
        <Image
          src={event.bannerImage || '/images/event-placeholder.jpg'}
          alt={event.title} fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <span className="badge bg-white/20 backdrop-blur-sm text-white mb-2">{event.category}</span>
          <h1 className="text-2xl md:text-4xl font-display font-bold max-w-3xl leading-tight">{event.title}</h1>
        </div>
      </div>

      <div className="page-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left: Main Content ── */}
          <div className="lg:col-span-2">
            {/* Quick Info Bar */}
            <div className="card p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-brand-500" />
                <div>
                  <div className="font-medium">{format(new Date(event.startDate), 'MMM d, yyyy')}</div>
                  <div className="text-xs text-[--color-text-secondary]">{format(new Date(event.startDate), 'h:mm a')}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {isOnline
                  ? <><Wifi className="w-4 h-4 text-blue-500" /><div><div className="font-medium">Online</div><div className="text-xs text-[--color-text-secondary]">{event.onlinePlatform||'Link shared'}</div></div></>
                  : <><MapPin className="w-4 h-4 text-brand-500" /><div><div className="font-medium">{event.venue?.city}</div><div className="text-xs text-[--color-text-secondary]">{event.venue?.name}</div></div></>
                }
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-brand-500" />
                <div>
                  <div className="font-medium">{event.totalSold} registered</div>
                  <div className="text-xs text-[--color-text-secondary]">{event.availableCapacity} spots left</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Star className="w-4 h-4 text-yellow-500" />
                <div>
                  <div className="font-medium">{event.averageRating || 'New'}</div>
                  <div className="text-xs text-[--color-text-secondary]">{event.reviewCount} reviews</div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mb-6">
              <button onClick={handleWishlist} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${wishlisted ? 'border-red-400 text-red-500 bg-red-50 dark:bg-red-950/20' : 'border-[--color-border] hover:border-red-400'}`}>
                <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500' : ''}`} /> {wishlisted ? 'Saved' : 'Save'}
              </button>
              <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[--color-border] hover:border-brand-400 text-sm font-medium">
                <Share2 className="w-4 h-4" /> Share
              </button>
              {event.organiser?.linkedin && (
                <a href={event.organiser.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[--color-border] text-sm font-medium hover:border-blue-400">
                  <ExternalLink className="w-4 h-4" /> Organiser
                </a>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-[--color-border] overflow-x-auto">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium capitalize whitespace-nowrap border-b-2 transition-colors -mb-px ${
                    activeTab === tab
                      ? 'border-brand-500 text-brand-500'
                      : 'border-transparent text-[--color-text-secondary] hover:text-current'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'about' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </div>
                {event.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-6">
                    {event.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 badge bg-surface-secondary dark:bg-surface-dark-tertiary text-[--color-text-secondary] text-xs">
                        <Tag className="w-3 h-3" /> {tag}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'agenda' && <AgendaSection agenda={event.agenda} />}
            {activeTab === 'speakers' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {event.speakers?.map((s, i) => <SpeakerCard key={i} speaker={s} />)}
                {!event.speakers?.length && <p className="text-[--color-text-secondary] text-sm">No speakers listed yet.</p>}
              </div>
            )}
            {activeTab === 'faqs' && <FAQAccordion faqs={event.faqs} />}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {reviews.map(r => <ReviewCard key={r._id} review={r} />)}
                {!reviews.length && <p className="text-[--color-text-secondary] text-sm">No reviews yet. Be the first!</p>}
              </div>
            )}
          </div>

          {/* ── Right: Ticket Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <TicketSelector event={event} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
