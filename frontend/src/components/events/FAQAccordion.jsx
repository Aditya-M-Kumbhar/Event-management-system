'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function FAQAccordion({ faqs = [] }) {
  const [open, setOpen] = useState(null);
  if (!faqs.length) return <p className="text-[--color-text-secondary] text-sm">No FAQs yet.</p>;
  return (
    <div className="space-y-2">
      {faqs.map((faq, i) => (
        <div key={i} className="border border-[--color-border] rounded-xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
          >
            <span className="font-medium text-sm pr-4">{faq.question}</span>
            <ChevronDown className={`w-4 h-4 text-[--color-text-muted] flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {open === i && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <p className="px-4 pb-4 text-sm text-[--color-text-secondary] leading-relaxed border-t border-[--color-border] pt-3">{faq.answer}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
