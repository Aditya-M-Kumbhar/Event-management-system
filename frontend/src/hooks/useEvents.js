// useEvents.js
import { useState, useCallback } from 'react';
import api from '../lib/axios';

export function useEvents() {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetchEvents = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/events', { params });
      setEvents(data.data);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch events');
    } finally { setLoading(false); }
  }, []);

  const createEvent = useCallback(async (formData) => {
    const { data } = await api.post('/events', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  }, []);

  const updateEvent = useCallback(async (id, formData) => {
    const { data } = await api.put(`/events/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  }, []);

  const deleteEvent = useCallback(async (id) => {
    await api.delete(`/events/${id}`);
  }, []);

  const publishEvent = useCallback(async (id) => {
    const { data } = await api.patch(`/events/${id}/publish`);
    return data.data;
  }, []);

  return { events, loading, error, fetchEvents, createEvent, updateEvent, deleteEvent, publishEvent };
}
