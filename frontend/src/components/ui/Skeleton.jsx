// ─── Skeleton Component ───────────────────────────────────────────────────────
'use client';
import { cn } from '../../utils/cn';
export default function Skeleton({ className }) {
  return <div className={cn('skeleton rounded-xl', className)} />;
}
