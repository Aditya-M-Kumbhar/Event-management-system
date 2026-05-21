// useCheckIn.js
import { useState, useCallback } from 'react';
import api from '../lib/axios';

export function useCheckIn(eventId) {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/checkin/stats/${eventId}`);
      setStats(data.data);
      return data.data;
    } catch (err) {
      setError(err.response?.data?.message);
    } finally { setLoading(false); }
  }, [eventId]);

  const scanQR = useCallback(async (qrData) => {
    const { data } = await api.post('/checkin/scan', { qrData, eventId });
    return data.data;
  }, [eventId]);

  const manualCheckIn = useCallback(async (ticketId) => {
    const { data } = await api.post('/checkin/manual', { ticketId, eventId });
    return data.data;
  }, [eventId]);

  return { stats, loading, error, fetchStats, scanQR, manualCheckIn };
}

// useCart.js
import { useSelector, useDispatch } from 'react-redux';
import {
  selectCartItems, selectCartSubtotal, selectCartTotal,
  selectCartCoupon, selectCartDiscount,
  addToCart, removeFromCart, updateQuantity,
  applyCoupon, removeCoupon, clearCart,
} from '../store/slices/cartSlice';

export function useCart() {
  const dispatch  = useDispatch();
  const items     = useSelector(selectCartItems);
  const subtotal  = useSelector(selectCartSubtotal);
  const total     = useSelector(selectCartTotal);
  const coupon    = useSelector(selectCartCoupon);
  const discount  = useSelector(selectCartDiscount);
  const tax       = Math.round((subtotal - discount) * 0.18);

  return {
    items, subtotal, total, coupon, discount, tax,
    totalItems: items.reduce((s, i) => s + i.quantity, 0),
    isEmpty:    items.length === 0,
    eventId:    items[0]?.eventId,
    add:    (item)   => dispatch(addToCart(item)),
    remove: (id)     => dispatch(removeFromCart(id)),
    update: (id, qty)=> dispatch(updateQuantity({ ticketTypeId: id, quantity: qty })),
    apply:  (c)      => dispatch(applyCoupon(c)),
    removeCoupon: () => dispatch(removeCoupon()),
    clear:  ()       => dispatch(clearCart()),
  };
}
