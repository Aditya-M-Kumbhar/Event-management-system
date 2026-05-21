// AgendaSection.jsx
'use client';
import { motion } from 'framer-motion';
import { Clock, Mic, Coffee } from 'lucide-react';

const TYPE_STYLES = {
  keynote:    'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
  break:      'border-gray-300 bg-gray-50 dark:bg-gray-800/30',
  workshop:   'border-blue-400 bg-blue-50 dark:bg-blue-900/20',
  panel:      'border-purple-400 bg-purple-50 dark:bg-purple-900/20',
  networking: 'border-green-400 bg-green-50 dark:bg-green-900/20',
  session:    'border-brand-400 bg-brand-50 dark:bg-brand-900/20',
};

export function AgendaSection({ agenda = [] }) {
  if (!agenda.length) return <p className="text-[--color-text-secondary] text-sm">Agenda coming soon.</p>;
  return (
    <div className="space-y-3">
      {agenda.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`border-l-4 rounded-r-xl pl-4 pr-4 py-3 ${TYPE_STYLES[item.type] || TYPE_STYLES.session}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-[--color-text-muted] flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {item.time}
                </span>
                <span className="badge text-[10px] bg-white/70 dark:bg-black/20 capitalize">{item.type}</span>
              </div>
              <h4 className="font-semibold text-sm">{item.title}</h4>
              {item.description && <p className="text-xs text-[--color-text-secondary] mt-0.5">{item.description}</p>}
              {item.speaker && (
                <p className="text-xs text-brand-500 mt-1 flex items-center gap-1">
                  <Mic className="w-3 h-3" /> {item.speaker}
                </p>
              )}
            </div>
            {item.duration && (
              <span className="text-xs text-[--color-text-muted] flex-shrink-0 flex items-center gap-1">
                <Coffee className="w-3 h-3" /> {item.duration}m
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
export default AgendaSection;
