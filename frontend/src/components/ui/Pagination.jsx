'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setPage } from '../../store/slices/eventSlice';

export default function Pagination({ currentPage, totalPages }) {
  const dispatch = useDispatch();

  const getPages = () => {
    const pages = [];
    const delta = 1;
    const left  = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);
    pages.push(1);
    if (left > 2)          pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    if (totalPages > 1)    pages.push(totalPages);
    return pages;
  };

  const btn = (page) => typeof page === 'number'
    ? `flex items-center justify-center w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
        page === currentPage
          ? 'bg-brand-500 text-white shadow-sm'
          : 'hover:bg-surface-secondary dark:hover:bg-surface-dark-tertiary text-[--color-text-secondary]'
      }`
    : 'flex items-center justify-center w-9 h-9 text-[--color-text-muted] text-sm';

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => dispatch(setPage(currentPage - 1))}
        disabled={currentPage === 1}
        className="flex items-center justify-center w-9 h-9 rounded-xl border border-[--color-border] disabled:opacity-40 hover:border-brand-400 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {getPages().map((page, i) => (
        <button
          key={i}
          onClick={() => typeof page === 'number' && dispatch(setPage(page))}
          disabled={typeof page !== 'number'}
          className={btn(page)}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => dispatch(setPage(currentPage + 1))}
        disabled={currentPage === totalPages}
        className="flex items-center justify-center w-9 h-9 rounded-xl border border-[--color-border] disabled:opacity-40 hover:border-brand-400 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
