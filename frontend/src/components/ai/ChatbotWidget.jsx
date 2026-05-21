'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, Loader2, Bot } from 'lucide-react';
import { usePathname } from 'next/navigation';
import api from '../../lib/axios';

const INITIAL_MESSAGE = {
  role:    'assistant',
  content: "Hi! I'm EventBot 🎉 I can help you find events, answer ticketing questions, or assist organisers. What can I help you with?",
  quickReplies: [
    'Recommend events for me',
    'How do I book tickets?',
    'Help me create an event',
  ],
};

export default function ChatbotWidget() {
  const pathname = usePathname();
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  // Extract eventId from URL (for event context)
  const eventId = pathname.includes('/events/') ? null : null; // extend as needed

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, messages]);

  const sendMessage = async (text) => {
    const userMessage = text || input.trim();
    if (!userMessage || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const { data } = await api.post('/ai/chat', {
        message: userMessage,
        conversationHistory: history.slice(-8),
        eventId,
      });

      setMessages(prev => [...prev, {
        role:         'assistant',
        content:      data.data.message,
        quickReplies: data.data.quickReplies || [],
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment! 🙏",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Don't show on auth or admin pages
  if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/admin')) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="mb-4 w-80 sm:w-96 card shadow-modal overflow-hidden flex flex-col"
            style={{ height: '480px' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white flex-shrink-0">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">EventBot</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-white/80">AI Assistant • Powered by Groq</span>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                          <Bot className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[10px] text-[--color-text-muted] font-medium">EventBot</span>
                      </div>
                    )}
                    <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-brand-500 text-white rounded-br-sm'
                        : 'bg-surface-secondary dark:bg-surface-dark-tertiary text-current rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>

                    {/* Quick Replies */}
                    {msg.role === 'assistant' && msg.quickReplies?.length > 0 && i === messages.length - 1 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.quickReplies.map((qr, qi) => (
                          <button
                            key={qi}
                            onClick={() => sendMessage(qr)}
                            className="text-xs px-2.5 py-1 rounded-full border border-brand-300 dark:border-brand-700 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
                          >
                            {qr}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-surface-secondary dark:bg-surface-dark-tertiary rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 bg-[--color-text-muted] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[--color-border] flex-shrink-0">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about events…"
                  className="input flex-1 text-sm py-2.5"
                  disabled={loading}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-2xl shadow-glow flex items-center justify-center relative"
        aria-label="Open AI assistant"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="w-6 h-6" /></motion.div>
            : <motion.div key="open"  initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Sparkles className="w-6 h-6" /></motion.div>
          }
        </AnimatePresence>
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </motion.button>
    </div>
  );
}
