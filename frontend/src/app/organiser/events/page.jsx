'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Plus, Eye, Edit, QrCode, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../lib/axios';
import Skeleton from '../../../components/ui/Skeleton';

export default function OrganiserEventsPage() {
  const [events,   setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = { limit: 50, ...(filter && { status: filter }) };
      const { data } = await api.get('/events/organiser/my-events', { params });
      setEvents(data.data);
    } catch (err) {
      console.error('Failed to fetch events:', err.message);
      toast.error('Could not load your events');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchEvents(); 
  }, [filter]);

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/events/${id}`);
      toast.success('Event deleted successfully');
      fetchEvents();
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Delete failed'); 
    }
  };

  const handlePublish = async (id, currentStatus) => {
    try {
      await api.patch(`/events/${id}/publish`);
      toast.success(currentStatus === 'published' ? 'Event unpublished' : 'Event published!');
      fetchEvents();
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Action failed'); 
    }
  };

  const STATUS_COLORS = {
    published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    draft:     'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    completed: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-2xl font-display font-bold">My Events</h1>
        <div className="flex items-center gap-3">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="input py-2 text-sm w-36">
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
          <Link href="/organiser/events/create" className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> New Event
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 card">
          <div className="text-5xl mb-4">🎪</div>
          <h3 className="font-semibold mb-2">No events yet</h3>
          <p className="text-[--color-text-secondary] text-sm mb-4">Create your first event to get started.</p>
          <Link href="/organiser/events/create" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Event
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-secondary dark:bg-surface-dark-tertiary">
                <tr className="text-left text-xs text-[--color-text-muted] uppercase tracking-wide">
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sold / Cap</th>
                  <th className="px-4 py-3">Revenue</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--color-border]">
                {events.map((event, i) => (
                  <motion.tr
                    key={event._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {event.bannerImage && (
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium max-w-[200px] truncate">{event.title}</p>
                          <p className="text-xs text-[--color-text-muted]">{event.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[--color-text-secondary]">
                      {event.startDate ? format(new Date(event.startDate), 'MMM d, yyyy') : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[event.status] || 'bg-gray-100 text-gray-600'}`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{event.totalSold || 0}/{event.totalCapacity}</span>
                        <div className="w-16 h-1.5 bg-surface-secondary dark:bg-surface-dark-tertiary rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(100, ((event.totalSold || 0) / event.totalCapacity) * 100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-brand-500">
                      ₹{(event.totalRevenue || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {/* Public Link View */}
                        <Link href={`/events/${event.slug || event._id}`} className="p-1.5 rounded-lg hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors text-[--color-text-muted] hover:text-brand-500" title="View Public Page">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        
                        {/* 🟢 FIXED: Safely reroutes to the live overview instead of the missing /edit subfolder page */}
                        <Link href={`/events/${event.slug || event._id}`} className="p-1.5 rounded-lg hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors text-[--color-text-muted] hover:text-brand-500" title="Manage Event">
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        
                        {/* QR checkin path link */}
                        <Link href={`/organiser/checkin/${event._id}`} className="p-1.5 rounded-lg hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors text-[--color-text-muted] hover:text-green-500" title="Check-in QR Gate">
                          <QrCode className="w-3.5 h-3.5" />
                        </Link>
                        
                        {/* Toggle Publish State Button */}
                        <button
                          onClick={() => handlePublish(event._id, event.status)}
                          className={`px-2 py-1 text-xs rounded-lg font-medium transition-colors ${
                            event.status === 'published'
                              ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100 dark:bg-yellow-900/20'
                              : 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20'
                          }`}
                        >
                          {event.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        
                        {/* Delete Event Row Button */}
                        <button
                          onClick={() => handleDelete(event._id, event.title)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-[--color-text-muted] hover:text-red-500"
                          title="Delete Event permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}