'use client';
import { formatDistanceToNow } from 'date-fns';
import { Star } from 'lucide-react';

export default function ReviewCard({ review }) {
  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
          {review.user?.avatar
            ? <img src={review.user.avatar} alt={review.user.name} className="w-full h-full object-cover" />
            : review.user?.name?.charAt(0)
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-medium text-sm">{review.user?.name || 'Attendee'}</p>
              <p className="text-xs text-[--color-text-muted]">{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</p>
            </div>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-700'}`} />
              ))}
            </div>
          </div>
          {review.title && <p className="font-semibold text-sm mt-2">{review.title}</p>}
          {review.body  && <p className="text-sm text-[--color-text-secondary] mt-1 leading-relaxed">{review.body}</p>}
        </div>
      </div>
    </div>
  );
}
