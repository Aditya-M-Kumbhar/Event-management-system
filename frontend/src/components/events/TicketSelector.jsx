'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, ShoppingCart, Clock, Users, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { addToCart, clearCart } from '../../store/slices/cartSlice';
import { selectUser } from '../../store/slices/authSlice';
import { selectCartItems } from '../../store/slices/cartSlice';

export default function TicketSelector({ event }) {
  const dispatch   = useDispatch();
  const router     = useRouter();
  const user       = useSelector(selectUser);
  const cartItems  = useSelector(selectCartItems);
  const [quantities, setQuantities] = useState({});

  const activeTickets = event.ticketTypes?.filter(t =>
    t.isActive &&
    t.sold < t.capacity &&
    (!t.saleEndDate || new Date() < new Date(t.saleEndDate))
  ) || [];

  const updateQty = (ticketTypeId, delta, max) => {
    setQuantities(prev => {
      const current = prev[ticketTypeId] || 0;
      const next    = Math.max(0, Math.min(current + delta, max));
      return { ...prev, [ticketTypeId]: next };
    });
  };

  const totalItems = Object.values(quantities).reduce((s, v) => s + v, 0);
  const totalPrice = activeTickets.reduce((sum, t) => {
    return sum + (quantities[t._id] || 0) * t.price;
  }, 0);

  const handleAddToCart = () => {
    if (!user) { toast.error('Please sign in to book tickets'); router.push('/login'); return; }

    const selectedItems = activeTickets.filter(t => quantities[t._id] > 0);
    if (!selectedItems.length) { toast.error('Please select at least one ticket'); return; }

    // If cart has items from a different event, warn
    if (cartItems.length > 0 && cartItems[0].eventId !== event._id) {
      if (!confirm('Your cart has tickets from another event. Clear it?')) return;
      dispatch(clearCart());
    }

    selectedItems.forEach(t => {
      dispatch(addToCart({
        ticketTypeId:   t._id,
        ticketTypeName: t.name,
        price:          t.price,
        quantity:       quantities[t._id],
        eventId:        event._id,
        eventTitle:     event.title,
        maxPerUser:     t.maxPerUser,
      }));
    });

    toast.success('Tickets added to cart!');
    router.push('/checkout');
  };

  const isSoldOut = event.isSoldOut || activeTickets.length === 0;

  return (
    <div className="card p-5">
      <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2">
        <Ticket className="w-5 h-5 text-brand-500" />
        Select Tickets
      </h3>

      {isSoldOut ? (
        <div className="text-center py-8">
          <div className="text-3xl mb-2">😢</div>
          <p className="font-semibold text-sm">This event is sold out</p>
          <p className="text-xs text-[--color-text-secondary] mt-1">Check back for cancellations</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeTickets.map(ticket => {
            const available = ticket.capacity - ticket.sold;
            const qty       = quantities[ticket._id] || 0;
            const isEarlyBird = ticket.type === 'early_bird' && ticket.earlyBirdExpiry && new Date() < new Date(ticket.earlyBirdExpiry);

            return (
              <div key={ticket._id} className={`border rounded-xl p-3.5 transition-colors ${qty > 0 ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20' : 'border-[--color-border]'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{ticket.name}</span>
                      {isEarlyBird && <span className="badge bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 text-[10px]">🐦 Early Bird</span>}
                      {ticket.type === 'vip' && <span className="badge bg-yellow-100 text-yellow-700 text-[10px]">⭐ VIP</span>}
                    </div>
                    {ticket.description && <p className="text-xs text-[--color-text-secondary] mt-0.5">{ticket.description}</p>}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-[--color-text-muted]">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {available} left
                      </span>
                      {ticket.saleEndDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Sale ends {format(new Date(ticket.saleEndDate), 'MMM d')}
                        </span>
                      )}
                    </div>
                    {ticket.perksIncluded?.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {ticket.perksIncluded.slice(0,3).map((perk, i) => (
                          <li key={i} className="text-xs text-[--color-text-secondary] flex items-center gap-1">
                            <span className="text-green-500">✓</span> {perk}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-brand-500">
                      {ticket.price === 0 ? 'Free' : `₹${ticket.price.toLocaleString()}`}
                    </div>
                    {/* Quantity control */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQty(ticket._id, -1, Math.min(available, ticket.maxPerUser))}
                        disabled={qty === 0}
                        className="w-7 h-7 rounded-lg border border-[--color-border] flex items-center justify-center hover:border-brand-500 disabled:opacity-30 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold">{qty}</span>
                      <button
                        onClick={() => updateQty(ticket._id, 1, Math.min(available, ticket.maxPerUser))}
                        disabled={qty >= Math.min(available, ticket.maxPerUser)}
                        className="w-7 h-7 rounded-lg border border-[--color-border] flex items-center justify-center hover:border-brand-500 disabled:opacity-30 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Summary */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-[--color-border]">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[--color-text-secondary]">{totalItems} ticket{totalItems > 1 ? 's' : ''}</span>
              <span className="font-semibold">₹{totalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-[--color-text-muted] mb-3">
              <span>+ 18% GST</span>
              <span>₹{Math.round(totalPrice * 0.18).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-sm mb-4 pb-3 border-b border-[--color-border]">
              <span>Total</span>
              <span className="text-brand-500">₹{Math.round(totalPrice * 1.18).toLocaleString()}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isSoldOut && (
        <button
          onClick={handleAddToCart}
          disabled={totalItems === 0}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-3"
        >
          <ShoppingCart className="w-4 h-4" />
          {totalItems === 0 ? 'Select Tickets' : `Book ${totalItems} Ticket${totalItems > 1 ? 's' : ''}`}
        </button>
      )}

      <p className="text-center text-xs text-[--color-text-muted] mt-3">
        🔒 Secure checkout powered by Razorpay
      </p>
    </div>
  );
}
