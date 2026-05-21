'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, UserCheck, Users, Clock, CheckCircle2, XCircle, Search, Loader2 } from 'lucide-react';
import { io } from 'socket.io-client';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../../../lib/axios';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card p-5">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div className="text-2xl font-display font-bold">{value}</div>
    <div className="text-sm text-[--color-text-secondary] mt-0.5">{label}</div>
  </div>
);

export default function CheckInDashboard() {
  const { eventId } = useParams();
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [scanInput,    setScanInput]    = useState('');
  const [manualInput,  setManualInput]  = useState('');
  const [scanning,     setScanning]     = useState(false);
  const [recentScans,  setRecentScans]  = useState([]);
  const [mode,         setMode]         = useState('qr');  // 'qr' | 'manual'
  const inputRef = useRef(null);
  const socketRef = useRef(null);

  // Connect to Socket.io for live updates
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000');
    socketRef.current = socket;
    socket.emit('join:checkin', eventId);
    socket.on('checkin:update', (data) => {
      setStats(prev => prev ? { ...prev, ...data } : data);
      setRecentScans(prev => [data, ...prev].slice(0, 30));
    });
    return () => socket.disconnect();
  }, [eventId]);

  // Fetch initial stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get(`/checkin/stats/${eventId}`);
        setStats(data.data);
        setRecentScans(data.data.recentCheckIns || []);
      } finally { setLoading(false); }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [eventId]);

  // Auto-focus QR input & process on scan
  useEffect(() => {
    if (mode === 'qr') inputRef.current?.focus();
  }, [mode]);

  const handleQRScan = async (value) => {
    if (!value.trim() || scanning) return;
    setScanning(true);
    try {
      const { data } = await api.post('/checkin/scan', { qrData: value, eventId });
      toast.success(`✅ ${data.data.attendee?.name || 'Attendee'} checked in!`);
      setRecentScans(prev => [{
        ticketId: data.data.ticket.ticketId,
        attendeeInfo: data.data.attendee,
        checkedInAt: new Date(),
        success: true,
      }, ...prev].slice(0, 30));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
      setRecentScans(prev => [{ error: err.response?.data?.message, checkedInAt: new Date(), success: false }, ...prev].slice(0, 30));
    } finally {
      setScanInput('');
      setScanning(false);
      inputRef.current?.focus();
    }
  };

  const handleManualCheckIn = async () => {
    if (!manualInput.trim()) return;
    setScanning(true);
    try {
      const { data } = await api.post('/checkin/manual', { ticketId: manualInput.toUpperCase(), eventId });
      toast.success(`✅ ${data.data.attendee?.name || 'Attendee'} checked in!`);
      setManualInput('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally { setScanning(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
    </div>
  );

  const checkInPct = stats?.totalSold ? Math.round((stats.checkedIn / stats.totalSold) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold">{stats?.eventTitle}</h1>
          <p className="text-[--color-text-secondary] text-sm mt-1">Live Check-In Dashboard</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-600 font-medium">Live</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users}      label="Total Registered" value={stats?.totalSold || 0} color="bg-brand-500" />
        <StatCard icon={UserCheck}  label="Checked In"        value={stats?.checkedIn || 0} color="bg-green-500" />
        <StatCard icon={Clock}      label="Remaining"          value={stats?.remaining || 0} color="bg-orange-500" />
        <StatCard icon={Scan}       label="Check-In Rate"      value={`${checkInPct}%`} color="bg-purple-500" />
      </div>

      {/* Progress Bar */}
      <div className="card p-5 mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">Check-in Progress</span>
          <span className="text-brand-500 font-bold">{checkInPct}%</span>
        </div>
        <div className="h-3 bg-surface-secondary dark:bg-surface-dark-tertiary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-500 to-green-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${checkInPct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-xs text-[--color-text-muted] mt-1">
          <span>{stats?.checkedIn} checked in</span>
          <span>{stats?.remaining} remaining</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scanner Panel */}
        <div className="card p-5">
          <div className="flex gap-2 mb-5 p-1 bg-surface-secondary dark:bg-surface-dark-tertiary rounded-xl">
            {[{ id: 'qr', label: '📷 QR Scan' }, { id: 'manual', label: '⌨️ Manual Entry' }].map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === m.id ? 'bg-white dark:bg-surface-dark shadow-sm text-brand-500' : 'text-[--color-text-secondary]'}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {mode === 'qr' ? (
            <div>
              <p className="text-sm text-[--color-text-secondary] mb-3">
                Point QR scanner here or type/paste QR data:
              </p>
              <div className="relative">
                <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleQRScan(scanInput); }}
                  placeholder="Scan QR or paste data here…"
                  className="input pl-10 font-mono text-sm"
                  autoComplete="off"
                />
              </div>
              {scanning && <div className="flex items-center gap-2 mt-3 text-sm text-brand-500"><Loader2 className="w-4 h-4 animate-spin" /> Processing…</div>}
              <p className="text-xs text-[--color-text-muted] mt-3">Press Enter after scan to check in automatically</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-[--color-text-secondary] mb-3">Enter Ticket ID manually:</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
                  <input
                    type="text"
                    value={manualInput}
                    onChange={e => setManualInput(e.target.value.toUpperCase())}
                    placeholder="e.g. ES-20240115-ABC12"
                    className="input pl-10 font-mono text-sm uppercase"
                    onKeyDown={e => e.key === 'Enter' && handleManualCheckIn()}
                  />
                </div>
                <button
                  onClick={handleManualCheckIn}
                  disabled={scanning || !manualInput.trim()}
                  className="btn-primary px-4"
                >
                  {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check In'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Check-ins */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-500" /> Recent Check-Ins
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            <AnimatePresence>
              {recentScans.map((scan, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-3 p-2.5 rounded-lg text-sm ${
                    scan.success === false
                      ? 'bg-red-50 dark:bg-red-900/20'
                      : 'bg-green-50 dark:bg-green-900/20'
                  }`}
                >
                  {scan.success === false
                    ? <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    : <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    {scan.success === false
                      ? <p className="text-red-700 dark:text-red-400 text-xs">{scan.error}</p>
                      : <>
                          <p className="font-medium truncate">{scan.attendeeInfo?.name || scan.attendee || 'Unknown'}</p>
                          <p className="text-xs text-[--color-text-muted]">{scan.ticketId}</p>
                        </>
                    }
                  </div>
                  <span className="text-xs text-[--color-text-muted] flex-shrink-0">
                    {format(new Date(scan.checkedInAt), 'HH:mm')}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {recentScans.length === 0 && (
              <p className="text-center text-[--color-text-muted] text-sm py-8">No check-ins yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
