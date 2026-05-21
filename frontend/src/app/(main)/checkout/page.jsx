'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingBag, Tag, Shield, ChevronRight, Loader2, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../lib/axios';
import { selectUser } from '../../../store/slices/authSlice';
import {
  selectCartItems, selectCartSubtotal, selectCartTotal,
  applyCoupon, removeCoupon, clearCart,
  selectCartCoupon, selectCartDiscount,
} from '../../../store/slices/cartSlice';

// Dynamically load Razorpay script
const loadRazorpay = () => new Promise((resolve) => {
  if (window.Razorpay) { resolve(true); return; }
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

export default function CheckoutPage() {
  const router   = useRouter();
  const dispatch = useDispatch();
  const user     = useSelector(selectUser);
  const items    = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const total    = useSelector(selectCartTotal);
  const coupon   = useSelector(selectCartCoupon);
  const discount = useSelector(selectCartDiscount);

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [payLoading,    setPayLoading]    = useState(false);
  const [orderId,       setOrderId]       = useState(null);

  const eventId = items[0]?.eventId;
  const tax     = Math.round((subtotal - discount) * 0.18);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!items.length) { router.push('/events'); return; }
  }, [user, items]);

  // Create backend order on mount
  useEffect(() => {
    if (!items.length || !eventId) return;
    const createOrder = async () => {
      try {
        const payload = {
          eventId,
          couponCode: coupon || undefined,
          items: items.map(i => ({ ticketTypeId: i.ticketTypeId, quantity: i.quantity })),
        };
        const { data } = await api.post('/orders', payload);
        setOrderId(data.data.order._id);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to create order');
      }
    };
    createOrder();
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await api.post('/coupons/validate', {
        code: couponInput, eventId, orderAmount: subtotal,
      });
      dispatch(applyCoupon({ code: couponInput, discount: data.data.discountAmount }));
      toast.success(`Coupon applied! You save ₹${data.data.discountAmount}`);
      setCouponInput('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!orderId) { toast.error('Order not ready. Please wait.'); return; }
    setPayLoading(true);

    try {
      // Initiate payment
      const { data: initData } = await api.post('/payments/initiate', { orderId });

      // Free tickets
      if (initData.data.free) {
        toast.success('Free tickets confirmed! 🎉');
        dispatch(clearCart());
        router.push('/checkout/success');
        return;
      }

      // Load Razorpay
      const loaded = await loadRazorpay();
      if (!loaded) { toast.error('Razorpay failed to load. Try again.'); setPayLoading(false); return; }

      const { razorpayOrderId, amount, currency, keyId, orderDetails } = initData.data;

      const options = {
        key:          keyId,
        amount,
        currency,
        name:         'EventSphere',
        description:  `Booking: ${items[0]?.eventTitle}`,
        order_id:     razorpayOrderId,
        prefill:      { name: user.name, email: user.email, contact: user.phone || '' },
        theme:        { color: '#3a52ff' },
        modal:        { ondismiss: () => setPayLoading(false) },

        handler: async (response) => {
          try {
            const verifyRes = await api.post('/payments/verify', {
              razorpayOrderId:  response.razorpay_order_id,
              razorpayPaymentId:response.razorpay_payment_id,
              razorpaySignature:response.razorpay_signature,
              orderId,
            });
            toast.success('Payment successful! Your tickets are ready 🎫');
            dispatch(clearCart());
            router.push('/checkout/success');
          } catch {
            toast.error('Payment verification failed. Contact support.');
            setPayLoading(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initiation failed');
      setPayLoading(false);
    }
  };

  if (!items.length) return null;

  return (
    <div className="page-container py-10 max-w-4xl">
      <h1 className="section-title mb-8 flex items-center gap-3">
        <ShoppingBag className="w-7 h-7 text-brand-500" />
        Checkout
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* ── Order Items ── */}
        <div className="md:col-span-3 space-y-5">
          <div className="card p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-brand-500" /> Your Tickets
            </h2>
            <div className="divide-y divide-[--color-border]">
              {items.map(item => (
                <div key={item.ticketTypeId} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{item.ticketTypeName}</p>
                    <p className="text-xs text-[--color-text-secondary]">{item.eventTitle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {item.price === 0 ? 'Free' : `₹${(item.price * item.quantity).toLocaleString()}`}
                    </p>
                    <p className="text-xs text-[--color-text-secondary]">
                      {item.price === 0 ? '' : `₹${item.price.toLocaleString()} × ${item.quantity}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coupon */}
          <div className="card p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-brand-500" /> Have a Coupon?
            </h2>
            {coupon ? (
              <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-xl px-4 py-2.5">
                <div>
                  <span className="font-mono font-bold text-green-700 dark:text-green-400">{coupon}</span>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">Saving ₹{discount.toLocaleString()}</p>
                </div>
                <button onClick={() => dispatch(removeCoupon())} className="text-xs text-red-500 hover:text-red-600 font-medium">Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="input flex-1 uppercase font-mono"
                  onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponInput}
                  className="btn-primary px-4 py-2.5 text-sm"
                >
                  {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                </button>
              </div>
            )}
          </div>

          {/* Attendee Info */}
          <div className="card p-5">
            <h2 className="font-semibold mb-3">Attendee Details</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="block text-xs text-[--color-text-muted] mb-1">Name</label>
                <p className="font-medium">{user?.name}</p>
              </div>
              <div>
                <label className="block text-xs text-[--color-text-muted] mb-1">Email</label>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
            <p className="text-xs text-[--color-text-muted] mt-3">
              Tickets will be sent to your registered email.
            </p>
          </div>
        </div>

        {/* ── Order Summary Sidebar ── */}
        <div className="md:col-span-2">
          <div className="card p-5 sticky top-6">
            <h2 className="font-semibold mb-4">Order Summary</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[--color-text-secondary]">Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Discount</span>
                  <span>- ₹{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-[--color-text-secondary]">
                <span>GST (18%)</span>
                <span>₹{tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-3 border-t border-[--color-border]">
                <span>Total</span>
                <span className="text-brand-500">₹{total.toLocaleString()}</span>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handlePayment}
              disabled={payLoading || !orderId}
              className="btn-primary w-full mt-5 flex items-center justify-center gap-2"
            >
              {payLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                : <><Shield className="w-4 h-4" /> Pay ₹{total.toLocaleString()}</>
              }
            </motion.button>

            <p className="text-center text-xs text-[--color-text-muted] mt-3 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" /> Powered by Razorpay — 100% Secure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
