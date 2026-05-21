'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Search, Eye, Star, EyeOff, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '../../../lib/axios';
import Skeleton from '../../../components/ui/Skeleton';

export default function AdminEventsPage() {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = { limit: 30, ...(search && { search }), ...(status && { status }) };
      const { data } = await api.get('/admin/events', { params });
      setEvents(data.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, [status]);
  useEffect(() => {
    const t = setTimeout(fetchEvents, 500);
    return () => clearTimeout(t);
  }, [search]);

  const handleFeature = async (id, isFeatured) => {
    try {
      await api.patch(`/admin/events/${id}/feature`);
      toast.success(isFeatured ? 'Removed from featured' : 'Event featured!');
      fetchEvents();
    } catch { toast.error('Action failed'); }
  };

  const handleVisibility = async (id, isPublic) => {
    try {
      await api.patch(`/admin/events/${id}/visibility`);
      toast.success(isPublic ? 'Event hidden' : 'Event made public');
      fetchEvents();
    } catch { toast.error('Action failed'); }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Permanently delete "${title}"?`)) return;
    try {
      await api.delete(`/admin/events/${id}`);
      toast.success('Event deleted');
      fetchEvents();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Event Moderation</h1>
          <p className="text-[--color-text-secondary] text-sm mt-1">{events.length} events</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
            <input
              type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events..."
              className="input pl-9 py-2 text-sm w-52"
            />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)} className="input py-2 text-sm w-36">
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-secondary dark:bg-surface-dark-tertiary">
                <tr className="text-left text-xs text-[--color-text-muted] uppercase tracking-wide">
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Organiser</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Sold</th>
                  <th className="px-4 py-3">Revenue</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--color-border]">
                {events.map(event => (
                  <tr key={event._id} className="hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium max-w-[180px] truncate">{event.title}</p>
                        <div className="flex gap-1.5 mt-0.5">
                          <span className="badge bg-surface-tertiary dark:bg-surface-dark-tertiary text-[10px]">{event.category}</span>
                          {event.isFeatured && <span className="badge bg-yellow-100 text-yellow-700 text-[10px]">⭐ Featured</span>}
                          {!event.isPublic && <span className="badge bg-gray-100 text-gray-600 text-[10px]">Hidden</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[--color-text-secondary]">
                      <p>{event.organiser?.name}</p>
                      <p className="text-xs text-[--color-text-muted]">{event.organiser?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${
                        event.status === 'published' ? 'bg-green-100 text-green-700' :
                        event.status === 'draft'     ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>{event.status}</span>
                    </td>
                    <td className="px-4 py-3 text-[--color-text-secondary] text-xs">
                      {format(new Date(event.startDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">{event.totalSold || 0}</td>
                    <td className="px-4 py-3 font-medium text-brand-500">₹{(event.totalRevenue || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/events/${event.slug}`} target="_blank"
                          className="p-1.5 rounded-lg hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary text-[--color-text-muted] hover:text-brand-500"
                          title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button onClick={() => handleFeature(event._id, event.isFeatured)}
                          className={`p-1.5 rounded-lg transition-colors ${event.isFeatured ? 'text-yellow-500 hover:bg-yellow-50' : 'text-[--color-text-muted] hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'}`}
                          title={event.isFeatured ? 'Unfeature' : 'Feature'}>
                          <Star className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleVisibility(event._id, event.isPublic)}
                          className="p-1.5 rounded-lg text-[--color-text-muted] hover:text-brand-500 hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary"
                          title={event.isPublic ? 'Hide' : 'Show'}>
                          {event.isPublic ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => handleDelete(event._id, event.title)}
                          className="p-1.5 rounded-lg text-[--color-text-muted] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                          title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr><td colSpan="7" className="px-4 py-10 text-center text-[--color-text-muted]">No events found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
