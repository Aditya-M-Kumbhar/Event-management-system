'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Zap, Menu, X, Bell, Sun, Moon, ChevronDown, User,
  Calendar, Ticket, LogOut, LayoutDashboard, Settings,
  Shield, PlusCircle, Search,
} from 'lucide-react';
import { logoutUser, selectUser } from '../../store/slices/authSlice';
import { toggleSearch } from '../../store/slices/uiSlice';
import NotificationBell from '../notifications/NotificationBell';
import toast from 'react-hot-toast';

const NAV_LINKS = [
  { href: '/events',    label: 'Discover' },
  { href: '/events?type=free', label: 'Free Events' },
  { href: '/events?trending=true', label: '🔥 Trending' },
];

export default function Navbar() {
  const dispatch  = useDispatch();
  const router    = useRouter();
  const pathname  = usePathname();
  const user      = useSelector(selectUser);
  const { theme, setTheme } = useTheme();

  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [scrolled,     setScrolled]     = useState(false);
  const profileRef = useRef(null);

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [pathname]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
    router.push('/');
    setProfileOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return null;
    if (user.role === 'admin')     return { href: '/admin/dashboard',     label: 'Admin Panel' };
    if (user.role === 'organiser') return { href: '/organiser/dashboard', label: 'Dashboard' };
    return { href: '/my-tickets', label: 'My Tickets' };
  };

  const dashLink = getDashboardLink();

  return (
    <header className={`sticky top-0 z-50 transition-all duration-200 ${
      scrolled
        ? 'bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md shadow-sm border-b border-[--color-border]'
        : 'bg-white dark:bg-surface-dark border-b border-transparent'
    }`}>
      <div className="page-container">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-display font-bold hidden sm:block">EventSphere</span>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-500'
                    : 'text-[--color-text-secondary] hover:text-current hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ── Right Controls ── */}
          <div className="flex items-center gap-2">

            {/* Search button */}
            <button
              onClick={() => dispatch(toggleSearch())}
              className="p-2 rounded-lg text-[--color-text-secondary] hover:text-current hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-[--color-text-secondary] hover:text-current hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <>
                {/* Create Event (organiser/admin) */}
                {(user.role === 'organiser' || user.role === 'admin') && (
                  <Link
                    href="/organiser/events/create"
                    className="hidden md:flex items-center gap-1.5 btn-primary text-sm py-2 px-3"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Create
                  </Link>
                )}

                {/* Notifications */}
                <NotificationBell />

                {/* Profile dropdown */}
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                      {user.avatar
                        ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        : user.name.charAt(0).toUpperCase()
                      }
                    </div>
                    <span className="hidden md:block text-sm font-medium max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[--color-text-muted] transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 card shadow-modal py-1 z-50"
                      >
                        {/* User info */}
                        <div className="px-4 py-3 border-b border-[--color-border]">
                          <p className="font-medium text-sm truncate">{user.name}</p>
                          <p className="text-xs text-[--color-text-muted] truncate">{user.email}</p>
                          <span className={`badge text-[10px] mt-1 ${
                            user.role === 'admin' ? 'bg-red-100 text-red-600' :
                            user.role === 'organiser' ? 'bg-orange-100 text-orange-600' :
                            'bg-brand-100 text-brand-600'
                          }`}>
                            {user.role}
                          </span>
                        </div>

                        {/* Menu items */}
                        {[
                          dashLink && { href: dashLink.href, label: dashLink.label, icon: LayoutDashboard },
                          { href: '/profile',    label: 'Profile',    icon: User },
                          { href: '/my-tickets', label: 'My Tickets', icon: Ticket },
                          { href: '/wishlist',   label: 'Saved Events', icon: Calendar },
                          user.role === 'admin' && { href: '/admin/dashboard', label: 'Admin Panel', icon: Shield },
                        ].filter(Boolean).map(item => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary transition-colors"
                          >
                            <item.icon className="w-4 h-4 text-[--color-text-muted]" />
                            {item.label}
                          </Link>
                        ))}

                        <div className="border-t border-[--color-border] mt-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 w-full transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="btn-ghost text-sm py-2 px-3 hidden sm:flex">
                  Sign In
                </Link>
                <Link href="/register" className="btn-primary text-sm py-2 px-3">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-[--color-text-secondary] hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-[--color-border] bg-white dark:bg-surface-dark overflow-hidden"
          >
            <div className="page-container py-3 space-y-1">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center py-3 px-3 rounded-xl text-sm font-medium hover:bg-surface-secondary dark:hover:bg-surface-dark-secondary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {!user && (
                <div className="flex gap-2 pt-2 border-t border-[--color-border]">
                  <Link href="/login"    className="btn-secondary flex-1 text-center text-sm">Sign In</Link>
                  <Link href="/register" className="btn-primary  flex-1 text-center text-sm">Sign Up</Link>
                </div>
              )}
              {user && dashLink && (
                <Link href={dashLink.href} className="flex items-center gap-2 py-3 px-3 rounded-xl text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30">
                  <LayoutDashboard className="w-4 h-4" /> {dashLink.label}
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
