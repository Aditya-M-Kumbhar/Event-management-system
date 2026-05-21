// useTickets.js
import { useState, useCallback } from 'react';
import api from '../lib/axios';

export function useTickets() {
  const [tickets,  setTickets]  = useState([]);
  const [loading,  setLoading]  = useState(false);

  const fetchMyTickets = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tickets/my-tickets');
      setTickets(data.data);
      return data.data;
    } finally { setLoading(false); }
  }, []);

  const getTicket = useCallback(async (ticketId) => {
    const { data } = await api.get(`/tickets/${ticketId}`);
    return data.data;
  }, []);

  return { tickets, loading, fetchMyTickets, getTicket };
}

// useAI.js
export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const generateDescription = async (payload) => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.post('/ai/description', payload);
      return data.data.description;
    } catch (err) {
      setError(err.response?.data?.message || 'AI generation failed');
      throw err;
    } finally { setLoading(false); }
  };

  const generateFAQs = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post('/ai/faqs', payload);
      return data.data.faqs;
    } finally { setLoading(false); }
  };

  const generateSchedule = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post('/ai/schedule', payload);
      return data.data.agenda;
    } finally { setLoading(false); }
  };

  const naturalLanguageSearch = async (query) => {
    const { data } = await api.post('/ai/search', { query });
    return data.data;
  };

  const getRecommendations = async (limit = 10) => {
    const { data } = await api.get('/ai/recommendations', { params: { limit } });
    return data.data.events;
  };

  return { loading, error, generateDescription, generateFAQs, generateSchedule, naturalLanguageSearch, getRecommendations };
}

import api from '../lib/axios';
