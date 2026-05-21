'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Ban, Shield, ChevronDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../../lib/axios';

export default function AdminUsersPage() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [roleFilter, setRole]   = useState('');
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, search: search || undefined, role: roleFilter || undefined };
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.data);
      setTotal(data.pagination?.total || 0);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, roleFilter]);
  useEffect(() => {
    const timer = setTimeout(fetchUsers, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleBan = async (userId, isBanned) => {
    const reason = isBanned ? '' : prompt('Ban reason (optional):') || 'Policy violation';
    try {
      await api.patch(`/admin/users/${userId}/ban`, { reason });
      toast.success(isBanned ? 'User unbanned' : 'User banned');
      fetchUsers();
    } catch { toast.error('Action failed'); }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      toast.success('Role updated');
      fetchUsers();
    } catch { toast.error('Role update failed'); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">User Management</h1>
          <p className="text-[--color-text-secondary] text-sm mt-1">{total.toLocaleString()} total users</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
              className="input pl-9 py-2 text-sm w-56"
            />
          </div>
          <select value={roleFilter} onChange={e => setRole(e.target.value)} className="input py-2 text-sm w-36">
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="organiser">Organiser</option>
            <option value="attendee">Attendee</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary dark:bg-surface-dark-tertiary">
              <tr className="text-left text-xs text-[--color-text-muted] uppercase tracking-wide">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-border]">
              {loading ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-500" /></td></tr>
              ) : users.map(user => (
                <tr key={user._id} className="hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                        {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : user.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-[--color-text-muted]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={e => handleRoleChange(user._id, e.target.value)}
                      className={`badge border-0 text-xs cursor-pointer outline-none ${
                        user.role === 'admin' ? 'bg-red-100 text-red-600' :
                        user.role === 'organiser' ? 'bg-orange-100 text-orange-600' :
                        'bg-brand-100 text-brand-600'
                      }`}
                    >
                      <option value="attendee">attendee</option>
                      <option value="organiser">organiser</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${user.isBanned ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {user.isBanned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[--color-text-secondary]">
                    {format(new Date(user.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-[--color-text-secondary]">
                    {user.lastLogin ? format(new Date(user.lastLogin), 'MMM d') : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleBan(user._id, user.isBanned)}
                      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                        user.isBanned
                          ? 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20'
                          : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20'
                      }`}
                    >
                      {user.isBanned ? <><Shield className="w-3 h-3" /> Unban</> : <><Ban className="w-3 h-3" /> Ban</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
