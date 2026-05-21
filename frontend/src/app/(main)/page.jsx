'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, Search, TrendingUp, Users, Star, ArrowRight, Sparkles } from 'lucide-react';
import EventCard    from '../../components/events/EventCard';
import EventSearch  from '../../components/events/EventSearch';
import ChatbotWidget from '../../components/ai/ChatbotWidget';
import Skeleton     from '../../components/ui/Skeleton';
import api from '../../lib/axios';

const STATS = [
  { label: 'Events Hosted', value: '50,000+' },
  { label: 'Happy Attendees', value: '2M+' },
  { label: 'Cities',          value: '200+' },
  { label: 'Avg. Rating',     value: '4.9 ⭐' },
];

const CATEGORIES = [
  { name: 'Technology',       emoji: '💻', color: 'from-blue-500 to-cyan-500' },
  { name: 'Business',         emoji: '💼', color: 'from-gray-600 to-gray-800' },
  { name: 'Music',            emoji: '🎵', color: 'from-pink-500 to-rose-500' },
  { name: 'Health & Wellness',emoji: '🧘', color: 'from-green-500 to-emerald-500' },
  { name: 'Networking',       emoji: '🤝', color: 'from-brand-500 to-purple-500' },
  { name: 'Arts & Culture',   emoji: '🎨', color: 'from-orange-500 to-yellow-500' },
];

export default function LandingPage() {
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/events/featured'),
      api.get('/events/trending'),
    ]).then(([f, t]) => {
      setFeatured(f.data.data.slice(0, 4));
      setTrending(t.data.data.slice(0, 4));
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="overflow-hidden">

      {/* ── Hero Section ── */}
      <section className="relative min-h-[85vh] flex items-center bg-gradient-to-br from-surface-dark via-brand-950 to-surface-dark-secondary overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/5 rounded-full blur-3xl" />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        </div>

        <div className="page-container relative text-white py-20 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm mb-8"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>AI-Powered Event Management Platform</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold leading-tight mb-6 max-w-5xl mx-auto"
          >
            Discover & Create{' '}
            <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
              Unforgettable
            </span>{' '}
            Events
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            From tech conferences to music festivals — discover events with AI-powered recommendations,
            book tickets instantly, and create memorable experiences.
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto mb-10"
          >
            <EventSearch />
            <p className="text-xs text-white/50 mt-2">
              Try: "Free tech workshops this weekend" or "Music events in Mumbai"
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link href="/events" className="btn-primary text-base py-3 px-8 flex items-center gap-2 shadow-glow">
              <Search className="w-5 h-5" /> Explore Events
            </Link>
            <Link
              href="/register?role=organiser"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200"
            >
              <Zap className="w-5 h-5" /> Create an Event
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-brand-500 text-white py-8">
        <div className="page-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-3xl font-display font-bold">{stat.value}</div>
                <div className="text-sm text-white/80 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="py-16 page-container">
        <h2 className="section-title mb-2 text-center">Browse by Category</h2>
        <p className="text-[--color-text-secondary] text-sm text-center mb-8">Find events that match your passion</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07 }}
              viewport={{ once: true }}
            >
              <Link
                href={`/events?category=${encodeURIComponent(cat.name)}`}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-[--color-border] hover:border-brand-400 hover:shadow-card-hover transition-all duration-200 group text-center"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${cat.color} rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                  {cat.emoji}
                </div>
                <span className="text-xs font-medium text-[--color-text-secondary] group-hover:text-current transition-colors leading-tight">
                  {cat.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Featured Events ── */}
      <section className="py-16 bg-surface-secondary dark:bg-surface-dark-secondary">
        <div className="page-container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="section-title mb-1 flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500" /> Featured Events
              </h2>
              <p className="text-[--color-text-secondary] text-sm">Handpicked by our team</p>
            </div>
            <Link href="/events?featured=true" className="flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600 font-medium">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)
              : featured.map((event, i) => (
                  <motion.div key={event._id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                    <EventCard event={event} />
                  </motion.div>
                ))
            }
          </div>
        </div>
      </section>

      {/* ── Trending Events ── */}
      <section className="py-16 page-container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="section-title mb-1 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-red-500" /> Trending Now
            </h2>
            <p className="text-[--color-text-secondary] text-sm">Most popular this week</p>
          </div>
          <Link href="/events?trending=true" className="flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600 font-medium">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)
            : trending.map((event, i) => (
                <motion.div key={event._id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                  <EventCard event={event} />
                </motion.div>
              ))
          }
        </div>
      </section>

      {/* ── AI Feature Banner ── */}
      <section className="py-16 bg-gradient-to-r from-brand-500 to-purple-600 text-white">
        <div className="page-container text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              Powered exclusively by Groq AI
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
              Events, Personalized by AI
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
              Our AI understands your interests and curates the perfect events for you.
              Just tell it what you're looking for in plain English.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mb-8 text-sm">
              {[
                '🔍 Natural language search',
                '🎯 Smart recommendations',
                '📅 Auto schedule builder',
                '✍️ AI description writer',
                '🤖 24/7 chatbot assistant',
              ].map(f => (
                <span key={f} className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">{f}</span>
              ))}
            </div>
            <Link href="/register" className="inline-flex items-center gap-2 bg-white text-brand-600 font-bold py-3 px-8 rounded-xl hover:bg-white/90 transition-colors shadow-lg">
              <Zap className="w-5 h-5" /> Get Started Free
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Chatbot ── */}
      <ChatbotWidget />
    </div>
  );
}
