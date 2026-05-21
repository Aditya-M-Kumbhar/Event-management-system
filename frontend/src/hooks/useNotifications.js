// useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unread,        setUnread]        = useState(0);
  const [loading,       setLoading]       = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications?limit=20');
      setNotifications(data.data.notifications);
      setUnread(data.data.unread);
    } finally { setLoading(false); }
  }, []);

  const markRead = useCallback(async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await api.patch('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnread(0);
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  return { notifications, unread, loading, fetch, markRead, markAllRead };
}

export default useNotifications;
