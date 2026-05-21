// formatDate.js
import { format, formatDistanceToNow, isToday, isTomorrow, isThisWeek } from 'date-fns';

export const formatDate = (date, fmt = 'MMM d, yyyy') =>
  format(new Date(date), fmt);

export const formatDateTime = (date) =>
  format(new Date(date), 'MMM d, yyyy · h:mm a');

export const formatRelative = (date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true });

export const formatEventDate = (startDate, endDate) => {
  const start = new Date(startDate);
  const end   = new Date(endDate);
  if (isToday(start))    return `Today · ${format(start, 'h:mm a')}`;
  if (isTomorrow(start)) return `Tomorrow · ${format(start, 'h:mm a')}`;
  if (isThisWeek(start)) return format(start, 'EEEE · h:mm a');
  return format(start, 'EEE, MMM d · h:mm a');
};
