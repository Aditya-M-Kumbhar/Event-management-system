'use client';
import { useState, useEffect } from 'react';
import { DollarSign, Users, Ticket, TrendingUp, Download, Loader2 } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../../lib/axios';

export default function AdminReportsPage() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [refunds, setRefunds] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/refunds'),
    ]).then(([s, r]) => {
      setStats(s.data.data);
      setRefunds(r.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display font-bold">Platform Reports</h1>
        <button
          onClick={() => window.print()}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: DollarSign, label: 'Total Revenue',   value: `₹${((stats?.revenue?.total || 0)/100000).toFixed(2)}L`, color: 'bg-brand-500' },
          { icon: Users,      label: 'Total Users',     value: (stats?.users?.total || 0).toLocaleString(), color: 'bg-green-500' },
          { icon: Ticket,     label: 'Total Orders',    value: (stats?.orders?.total || 0).toLocaleString(), color: 'bg-orange-500' },
          { icon: TrendingUp, label: 'Published Events',value: (stats?.events?.published || 0).toLocaleString(), color: 'bg-purple-500' },
        ].map((card, i) => (
          <div key={i} className="card p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-display font-bold">{card.value}</div>
            <div className="text-sm text-[--color-text-secondary] mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="card p-5 mb-8">
        <h2 className="font-semibold mb-4">Daily Revenue (Last 30 Days)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={stats?.revenue?.byDay || []}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3a52ff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3a52ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke="#3a52ff" strokeWidth={2} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Orders per Day */}
      <div className="card p-5 mb-8">
        <h2 className="font-semibold mb-4">Orders per Day</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats?.revenue?.byDay || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="orders" fill="#10b981" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pending Refunds */}
      <div className="card p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          Pending Refund Requests
          {refunds.length > 0 && <span className="badge bg-red-100 text-red-600">{refunds.length}</span>}
        </h2>
        {refunds.length === 0 ? (
          <p className="text-[--color-text-secondary] text-sm py-4 text-center">No pending refunds 🎉</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[--color-text-muted] uppercase border-b border-[--color-border]">
                  <th className="pb-3 pr-4">Order ID</th>
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3 pr-4">Event</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Requested</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--color-border]">
                {refunds.map(order => (
                  <tr key={order._id} className="hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary">
                    <td className="py-3 pr-4 font-mono text-xs">{order.orderId}</td>
                    <td className="py-3 pr-4">
                      <p className="font-medium">{order.user?.name}</p>
                      <p className="text-xs text-[--color-text-muted]">{order.user?.email}</p>
                    </td>
                    <td className="py-3 pr-4 max-w-[160px] truncate">{order.event?.title}</td>
                    <td className="py-3 pr-4 font-semibold text-brand-500">₹{order.totalAmount?.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-xs text-[--color-text-muted]">
                      {order.refundRequestedAt ? new Date(order.refundRequestedAt).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={async () => {
                          try {
                            await api.post(`/payments/refund/${order._id}`);
                            setRefunds(prev => prev.filter(r => r._id !== order._id));
                          } catch { /* toast */ }
                        }}
                        className="px-3 py-1.5 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-xs font-medium rounded-lg hover:bg-green-100 transition-colors"
                      >
                        Process Refund
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
