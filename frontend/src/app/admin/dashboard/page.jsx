'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import {
  Users, Calendar, DollarSign, TrendingUp,
  Shield, AlertTriangle, Eye, Star, Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../../../lib/axios';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="card p-5"
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div className="text-2xl font-display font-bold">{value}</div>
    <div className="text-sm text-[--color-text-secondary] mt-0.5">{label}</div>
    {sub && <div className="text-xs text-green-500 mt-1">{sub}</div>}
  </motion.div>
);

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('overview');

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data.data))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand-500" /> Admin Dashboard
          </h1>
          <p className="text-[--color-text-secondary] text-sm mt-1">{format(new Date(), 'EEEE, MMMM d yyyy')}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/users"  className="btn-secondary text-sm py-2 px-4">Manage Users</Link>
          <Link href="/admin/events" className="btn-secondary text-sm py-2 px-4">Manage Events</Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users}       label="Total Users"   value={(stats?.users?.total || 0).toLocaleString()}    sub={`+${stats?.users?.newThisMonth || 0} this month`} color="bg-brand-500" />
        <StatCard icon={Calendar}    label="Total Events"  value={(stats?.events?.total || 0).toLocaleString()}   sub={`${stats?.events?.published || 0} published`} color="bg-green-500" />
        <StatCard icon={DollarSign}  label="Platform Revenue" value={`₹${((stats?.revenue?.total || 0) / 100000).toFixed(1)}L`} color="bg-orange-500" />
        <StatCard icon={TrendingUp}  label="Total Orders"  value={(stats?.orders?.total || 0).toLocaleString()}   color="bg-purple-500" />
      </div>

      {/* User Roles Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Users by Role</h2>
          <div className="space-y-3">
            {(stats?.users?.byRole || []).map(r => (
              <div key={r._id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${r._id === 'admin' ? 'bg-red-500' : r._id === 'organiser' ? 'bg-orange-500' : 'bg-brand-500'}`} />
                  <span className="text-sm capitalize">{r._id}</span>
                </div>
                <span className="font-semibold text-sm">{r.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-semibold mb-4">Revenue (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={stats?.revenue?.byDay || []}>
              <defs>
                <linearGradient id="adminRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3a52ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3a52ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#3a52ff" strokeWidth={2} fill="url(#adminRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Events + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Events */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" /> Top Events by Revenue</h2>
            <Link href="/admin/events" className="text-xs text-brand-500">View all →</Link>
          </div>
          <div className="space-y-3">
            {(stats?.topEvents || []).map((e, i) => (
              <div key={e._id} className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-surface-secondary dark:bg-surface-dark-tertiary flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{e.title}</p>
                  <p className="text-xs text-[--color-text-secondary]">{e.organiser?.name} · {e.totalSold} sold</p>
                </div>
                <span className="font-semibold text-brand-500 flex-shrink-0">₹{(e.totalRevenue || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Orders</h2>
          </div>
          <div className="space-y-3">
            {(stats?.recentOrders || []).map(o => (
              <div key={o._id} className="flex items-center justify-between text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{o.user?.name}</p>
                  <p className="text-xs text-[--color-text-secondary] truncate">{o.event?.title}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold">₹{o.totalAmount?.toLocaleString()}</p>
                  <p className="text-xs text-[--color-text-muted]">{format(new Date(o.createdAt), 'MMM d')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" /> Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/users?banned=true" className="btn-secondary text-sm">View Banned Users</Link>
          <Link href="/admin/reports"           className="btn-secondary text-sm">View Reports</Link>
          <Link href="/admin/events?status=draft" className="btn-secondary text-sm">Review Draft Events</Link>
          <button
            onClick={async () => {
              const { data } = await api.get('/admin/refunds');
              toast.success(`${data.data.length} pending refund(s)`);
            }}
            className="btn-secondary text-sm"
          >
            Check Pending Refunds
          </button>
        </div>
      </div>
    </div>
  );
}
