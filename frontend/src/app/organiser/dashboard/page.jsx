'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, Users, Ticket, DollarSign, Calendar,
  Plus, Eye, BarChart2, ArrowUpRight, ArrowDownRight, Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../../../lib/axios';

const COLORS = ['#3a52ff','#10b981','#f59e0b','#ef4444','#8b5cf6'];

const StatCard = ({ icon: Icon, label, value, change, color, loading }) => (
  <div className="card p-5">
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {change !== undefined && (
        <span className={`flex items-center gap-0.5 text-xs font-medium ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {Math.abs(change)}%
        </span>
      )}
    </div>
    {loading
      ? <div className="skeleton h-7 w-24 mt-3 rounded-lg" />
      : <div className="text-2xl font-display font-bold mt-3">{value}</div>
    }
    <div className="text-sm text-[--color-text-secondary] mt-0.5">{label}</div>
  </div>
);

export default function OrganiserDashboard() {
  const [stats,   setStats]   = useState(null);
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState('30'); // days

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [statsRes, eventsRes] = await Promise.all([
          api.get(`/users/organiser/stats?days=${period}`),
          api.get('/events/organiser/my-events?limit=5&sort=-createdAt'),
        ]);
        setStats(statsRes.data.data);
        setEvents(eventsRes.data.data);
      } catch {
        // handle gracefully
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [period]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Organiser Dashboard</h1>
          <p className="text-[--color-text-secondary] text-sm mt-1">
            {format(new Date(), 'EEEE, MMMM d yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="input py-2 w-auto text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Link href="/organiser/events/create" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Event
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} label="Total Revenue" value={loading ? '' : `₹${(stats?.totalRevenue || 0).toLocaleString()}`} change={stats?.revenueChange} color="bg-brand-500" loading={loading} />
        <StatCard icon={Ticket}     label="Tickets Sold"  value={loading ? '' : (stats?.ticketsSold || 0).toLocaleString()} change={stats?.ticketsChange} color="bg-green-500" loading={loading} />
        <StatCard icon={Users}      label="Attendees"     value={loading ? '' : (stats?.attendees || 0).toLocaleString()} change={stats?.attendeesChange} color="bg-orange-500" loading={loading} />
        <StatCard icon={Eye}        label="Event Views"   value={loading ? '' : (stats?.totalViews || 0).toLocaleString()} change={stats?.viewsChange} color="bg-purple-500" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-500" /> Revenue Over Time
            </h2>
          </div>
          {loading ? (
            <div className="h-56 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats?.revenueByDay || []}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3a52ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3a52ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                <Tooltip formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#3a52ff" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Ticket Breakdown Pie */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-brand-500" /> Ticket Breakdown
          </h2>
          {loading ? (
            <div className="h-56 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stats?.ticketBreakdown || []}
                  dataKey="quantity"
                  nameKey="_id"
                  cx="50%" cy="50%"
                  outerRadius={80}
                  label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {(stats?.ticketBreakdown || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Check-in Rate by Event */}
      {!loading && stats?.eventCheckIns?.length > 0 && (
        <div className="card p-5 mb-8">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-500" /> Check-In Rates by Event
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.eventCheckIns} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="title" width={140} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`${v}%`, 'Check-in rate']} />
              <Bar dataKey="rate" fill="#3a52ff" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Events Table */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-500" /> Recent Events
          </h2>
          <Link href="/organiser/events" className="text-sm text-brand-500 hover:text-brand-600 font-medium">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[--color-border] text-left text-xs text-[--color-text-muted] uppercase tracking-wide">
                <th className="pb-3 pr-4">Event</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Sold</th>
                <th className="pb-3 pr-4">Revenue</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-border]">
              {events.map(event => (
                <tr key={event._id} className="hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors">
                  <td className="py-3 pr-4 font-medium max-w-[200px] truncate">{event.title}</td>
                  <td className="py-3 pr-4 text-[--color-text-secondary]">
                    {format(new Date(event.startDate), 'MMM d, yyyy')}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`badge text-xs ${
                      event.status === 'published'  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : event.status === 'draft'    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : event.status === 'cancelled'? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-gray-100 text-gray-700'
                    }`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{event.totalSold || 0}/{event.totalCapacity}</td>
                  <td className="py-3 pr-4 font-medium text-brand-500">₹{(event.totalRevenue || 0).toLocaleString()}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Link href={`/organiser/events/${event._id}/edit`} className="text-xs text-brand-500 hover:underline">Edit</Link>
                      <Link href={`/organiser/checkin/${event._id}`} className="text-xs text-green-600 hover:underline">Check-in</Link>
                    </div>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-[--color-text-muted]">
                    No events yet.{' '}
                    <Link href="/organiser/events/create" className="text-brand-500 hover:underline">Create your first event →</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
