'use client';

import { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Search, Sparkles, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { setSearchQuery } from '../../store/slices/eventSlice';
import api from '../../lib/axios';

const SUGGESTIONS = [
  'AI workshops this weekend',
  'Music festivals in Mumbai',
  'Networking events for developers',
  'Free yoga classes online',
  'Tech conferences under ₹500',
];

export default function EventSearch() {
  const dispatch = useDispatch();
  const [query,     setQuery]     = useState('');
  const [aiMode,    setAiMode]    = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult,  setAiResult]  = useState(null);
  const [focused,   setFocused]   = useState(false);
  const inputRef = useRef(null);

  // Regular search — updates Redux
  const handleRegularSearch = (val) => {
    setQuery(val);
    dispatch(setSearchQuery(val));
    setAiResult(null);
  };

  // AI search — sends query to backend AI endpoint
  const handleAISearch = async () => {
    if (!query.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const { data } = await api.post('/ai/search', { query });
      setAiResult(data.data);
      // Apply the AI-generated filters to Redux
      if (data.data.filters) {
        Object.entries(data.data.filters).forEach(([key, value]) => {
          if (value) dispatch({ type: 'events/setFilter', payload: { key, value } });
        });
      }
    } catch {
      setAiResult({ error: 'AI search failed. Using regular search.' });
      dispatch(setSearchQuery(query));
    } finally {
      setAiLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (aiMode) handleAISearch();
      else dispatch(setSearchQuery(query));
    }
  };

  const clearSearch = () => {
    setQuery('');
    setAiResult(null);
    dispatch(setSearchQuery(''));
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className={`relative flex items-center rounded-2xl border-2 transition-colors bg-white dark:bg-surface-dark-secondary ${
        focused ? 'border-brand-500 shadow-glow' : 'border-[--color-border]'
      }`}>
        {/* Search icon */}
        <Search className="absolute left-4 w-5 h-5 text-[--color-text-muted]" />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleRegularSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder={aiMode ? 'Ask AI anything: "Tech events under ₹500 in Bangalore"' : 'Search events, categories, cities…'}
          className="flex-1 bg-transparent pl-12 pr-4 py-3.5 text-sm outline-none"
        />

        {/* Clear button */}
        {query && (
          <button onClick={clearSearch} className="p-2 text-[--color-text-muted] hover:text-current">
            <X className="w-4 h-4" />
          </button>
        )}

        {/* AI toggle */}
        <button
          onClick={() => { setAiMode(!aiMode); setAiResult(null); }}
          className={`flex items-center gap-1.5 mx-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            aiMode
              ? 'bg-gradient-to-r from-brand-500 to-purple-500 text-white shadow-glow'
              : 'bg-surface-secondary dark:bg-surface-dark-tertiary text-[--color-text-secondary] hover:text-brand-500'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI
        </button>

        {/* AI Search button */}
        {aiMode && (
          <button
            onClick={handleAISearch}
            disabled={aiLoading || !query.trim()}
            className="mr-2 px-4 py-2 bg-brand-500 text-white text-xs font-medium rounded-xl hover:bg-brand-600 disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Search
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {focused && !query && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute top-full left-0 right-0 mt-2 card py-2 z-50 shadow-modal"
          >
            <div className="px-4 py-1.5 text-xs font-medium text-[--color-text-muted] uppercase tracking-wide">
              {aiMode ? '✨ AI Search Examples' : 'Popular Searches'}
            </div>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => { setQuery(s); if (aiMode) { setTimeout(handleAISearch, 100); } else dispatch(setSearchQuery(s)); }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary flex items-center gap-2"
              >
                {aiMode ? <Sparkles className="w-3.5 h-3.5 text-brand-400" /> : <Search className="w-3.5 h-3.5 text-[--color-text-muted]" />}
                {s}
              </button>
            ))}
          </motion.div>
        )}

        {/* AI Result badge */}
        {aiResult && !aiResult.error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 mt-2 card p-3 z-50 border-brand-500"
          >
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-brand-500 mb-1">AI interpreted your search</p>
                <p className="text-xs text-[--color-text-secondary]">{aiResult.interpretation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
