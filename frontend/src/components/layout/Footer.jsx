'use client';

import Link from 'next/link';
import { Zap, Github, Twitter, Linkedin, Heart } from 'lucide-react';

const FOOTER_LINKS = {
  Platform: [
    { href: '/events',          label: 'Discover Events' },
    { href: '/events?type=free', label: 'Free Events' },
    { href: '/register?role=organiser', label: 'Become an Organiser' },
    { href: '/events?trending=true', label: 'Trending Events' },
  ],
  Support: [
    { href: '/help',    label: 'Help Center' },
    { href: '/contact', label: 'Contact Us' },
    { href: '/faq',     label: 'FAQs' },
    { href: '/refunds', label: 'Refund Policy' },
  ],
  Legal: [
    { href: '/terms',   label: 'Terms of Service' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/cookies', label: 'Cookie Policy' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-surface-secondary dark:bg-surface-dark-secondary border-t border-[--color-border] mt-auto">
      <div className="page-container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg">EventSphere</span>
            </Link>
            <p className="text-sm text-[--color-text-secondary] leading-relaxed mb-4">
              AI-powered event management & ticketing. Create unforgettable experiences.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Github,   href: 'https://github.com' },
                { icon: Twitter,  href: 'https://twitter.com' },
                { icon: Linkedin, href: 'https://linkedin.com' },
              ].map(({ icon: Icon, href }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg border border-[--color-border] flex items-center justify-center text-[--color-text-muted] hover:text-brand-500 hover:border-brand-400 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-semibold text-sm mb-3">{title}</h3>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[--color-text-secondary] hover:text-brand-500 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[--color-border] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[--color-text-muted]">
            © {new Date().getFullYear()} EventSphere. All rights reserved.
          </p>
          <p className="text-xs text-[--color-text-muted] flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> using MERN + Groq AI
          </p>
          <div className="flex items-center gap-3 text-xs text-[--color-text-muted]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
