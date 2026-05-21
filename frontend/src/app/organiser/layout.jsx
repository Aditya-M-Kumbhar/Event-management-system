'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Calendar, Users, QrCode, BarChart2,
  ChevronRight, Menu, X, Zap, PlusCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/layout/Navbar';
import { useAuth } from '../../hooks/useAuth';

const SIDEBAR_LINKS = [
  { href: '/organiser/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/organiser/events',     label: 'My Events',   icon: Calendar },
  { href: '/organiser/events/create', label: 'Create Event', icon: PlusCircle },
  { href: '/organiser/attendees',  label: 'Attendees',   icon: Users },
  { href: '/organiser/checkin',    label: 'Check-In',    icon: QrCode },
];

export default function OrganiserLayout({ children }) {
  const pathname = usePathname();
  const { user, isOrganiser, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user || (!isOrganiser && !isAdmin)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
          <p className="text-[--color-text-secondary] mb-4">Organiser account required.</p>
          <Link href="/register?role=organiser" className="btn-primary">Become an Organiser</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--color-bg]">
      <Navbar />
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-56 border-r border-[--color-border] min-h-[calc(100vh-64px)] sticky top-16 bg-white dark:bg-surface-dark-secondary">
          <div className="p-4 border-b border-[--color-border]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold">Organiser Hub</span>
            </div>
          </div>
          <nav className="p-3 flex-1">
            {SIDEBAR_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-colors ${
                  pathname === href || pathname.startsWith(href + '/')
                    ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-500'
                    : 'text-[--color-text-secondary] hover:text-current hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed bottom-6 left-6 z-40 w-12 h-12 bg-brand-500 text-white rounded-2xl shadow-glow flex items-center justify-center"
        >
          <Menu className="w-5 h-5" />
        </button>

        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              />
              <motion.aside
                initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed left-0 top-0 bottom-0 w-60 bg-white dark:bg-surface-dark-secondary shadow-modal z-50 lg:hidden"
              >
                <div className="flex items-center justify-between p-4 border-b border-[--color-border]">
                  <span className="font-semibold">Organiser Hub</span>
                  <button onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
                </div>
                <nav className="p-3">
                  {SIDEBAR_LINKS.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 ${
                        pathname === href ? 'bg-brand-50 text-brand-500' : 'text-[--color-text-secondary] hover:bg-surface-secondary'
                      }`}
                    >
                      <Icon className="w-4 h-4" /> {label}
                    </Link>
                  ))}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
