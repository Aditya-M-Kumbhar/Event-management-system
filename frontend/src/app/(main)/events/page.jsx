'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, Grid3X3, List, X } from 'lucide-react';
import { useDebounce } from '../../../hooks/useDebounce';
import { setFilter, setSearchQuery, resetFilters } from '../../../store/slices/eventSlice';
import EventCard   from '../../../components/events/EventCard';
import EventFilters from '../../../components/events/EventFilters';
import EventSearch  from '../../../components/events/EventSearch';
import Pagination  from '../../../components/ui/Pagination';
import Skeleton    from '../../../components/ui/Skeleton';
import api         from '../../../lib/axios';

const CATEGORIES = ['Technology','Business','Music','Arts & Culture','Sports & Fitness',
  'Health & Wellness','Food & Drink','Education','Networking','Gaming','Film & Media','Other'];

export default function EventsPage() {
  const dispatch = useDispatch();
  const { filters, searchQuery, currentPage } = useSelector(s => s.events);
  const debouncedSearch = useDebounce(searchQuery, 500);

  const [events,    setEvents]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [total,     setTotal]     = useState(0);
  const [totalPages,setTotalPages]= useState(1);
  const [view,      setView]      = useState('grid');   // 'grid' | 'list'
  const [showFilters,setShowFilters]= useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage, limit: 12,
        search:   debouncedSearch || undefined,
        category: filters.category || undefined,
        city:     filters.city     || undefined,
        format:   filters.format !== 'all' ? filters.format : undefined,
        type:     filters.type   !== 'all' ? filters.type   : undefined,
        sort:     filters.sort,
      };
      const { data } = await api.get('/events', { params });
      setEvents(data.data);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch, currentPage]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const activeFilterCount = [
    filters.category, filters.city,
    filters.format !== 'all' && filters.format,
    filters.type   !== 'all' && filters.type,
  ].filter(Boolean).length;

  return (
    <div className="page-container py-8">
      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="section-title mb-2">Discover Events</h1>
        <p className="text-[--color-text-secondary] text-sm">
          {total.toLocaleString()} events found
        </p>
      </div>

      {/* ── AI Search Bar ── */}
      <EventSearch />

      {/* ── Filter Controls ── */}
      <div className="flex items-center gap-3 mt-4 mb-6 flex-wrap">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
            showFilters || activeFilterCount > 0
              ? 'border-brand-500 text-brand-500 bg-brand-50 dark:bg-brand-950'
              : 'border-[--color-border] hover:border-brand-400'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="badge bg-brand-500 text-white">{activeFilterCount}</span>
          )}
        </button>

        {/* Quick category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 flex-1 scrollbar-hide">
          {CATEGORIES.slice(0, 7).map(cat => (
            <button
              key={cat}
              onClick={() => dispatch(setFilter({ key: 'category', value: filters.category === cat ? '' : cat }))}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filters.category === cat
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'border-[--color-border] hover:border-brand-400 text-[--color-text-secondary]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={filters.sort}
          onChange={e => dispatch(setFilter({ key: 'sort', value: e.target.value }))}
          className="input py-2 w-auto text-sm cursor-pointer"
        >
          <option value="date_asc">Date: Soonest</option>
          <option value="newest">Newest</option>
          <option value="popular">Most Viewed</option>
          <option value="trending">Trending</option>
          <option value="price_asc">Price: Low</option>
          <option value="price_desc">Price: High</option>
        </select>

        {/* View toggle */}
        <div className="flex border border-[--color-border] rounded-xl overflow-hidden">
          <button onClick={() => setView('grid')} className={`p-2 ${view==='grid' ? 'bg-brand-500 text-white' : 'hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary'}`}>
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button onClick={() => setView('list')} className={`p-2 ${view==='list' ? 'bg-brand-500 text-white' : 'hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>

        {activeFilterCount > 0 && (
          <button onClick={() => dispatch(resetFilters())} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* ── Filter Panel ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <EventFilters />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Events Grid ── */}
      {loading ? (
        <div className={`grid gap-5 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold mb-2">No events found</h3>
          <p className="text-[--color-text-secondary] text-sm mb-4">Try adjusting your filters or search query</p>
          <button onClick={() => dispatch(resetFilters())} className="btn-primary">Clear Filters</button>
        </motion.div>
      ) : (
        <motion.div
          layout
          className={`grid gap-5 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 max-w-3xl'}`}
        >
          <AnimatePresence>
            {events.map((event, i) => (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
              >
                <EventCard event={event} viewMode={view} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="mt-10 flex justify-center">
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
      )}
    </div>
  );
}
