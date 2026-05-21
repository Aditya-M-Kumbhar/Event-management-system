'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, LayoutDashboard, Users, Calendar, AlertTriangle, DollarSign } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import { useAuth } from '../../hooks/useAuth';

const ADMIN_LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/admin/users',     label: 'Users',        icon: Users },
  { href: '/admin/events',    label: 'Events',       icon: Calendar },
  { href: '/admin/reports',   label: 'Reports',      icon: AlertTriangle },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();

  if (!user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2">Admin Access Required</h2>
          <Link href="/" className="btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--color-bg]">
      <Navbar />
      <div className="flex">
        <aside className="hidden lg:flex flex-col w-56 border-r border-[--color-border] min-h-[calc(100vh-64px)] sticky top-16 bg-white dark:bg-surface-dark-secondary">
          <div className="p-4 border-b border-[--color-border]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-red-500 rounded-lg flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold">Admin Panel</span>
            </div>
          </div>
          <nav className="p-3 flex-1">
            {ADMIN_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-colors ${
                  pathname === href
                    ? 'bg-red-50 dark:bg-red-950/30 text-red-600'
                    : 'text-[--color-text-secondary] hover:text-current hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
