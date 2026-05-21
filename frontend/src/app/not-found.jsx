import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-bg]">
      <div className="text-center max-w-md px-4">
        <div className="text-8xl font-display font-black text-brand-500 mb-4">404</div>
        <h1 className="text-2xl font-display font-bold mb-2">Page Not Found</h1>
        <p className="text-[--color-text-secondary] text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/"       className="btn-primary flex items-center gap-2"><Home className="w-4 h-4" /> Home</Link>
          <Link href="/events" className="btn-secondary flex items-center gap-2"><Search className="w-4 h-4" /> Browse Events</Link>
        </div>
      </div>
    </div>
  );
}
