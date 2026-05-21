import { createSlice } from '@reduxjs/toolkit';

// ─── Cart Slice ────────────────────────────────────────────────────────────────
const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items:     [],    // [{ ticketTypeId, ticketTypeName, price, quantity, eventId }]
    eventId:   null,
    eventTitle: '',
    coupon:    null,
    couponDiscount: 0,
  },
  reducers: {
    addToCart(state, { payload }) {
      const exists = state.items.find((i) => i.ticketTypeId === payload.ticketTypeId);
      if (exists) {
        exists.quantity = Math.min(exists.quantity + payload.quantity, payload.maxPerUser || 10);
      } else {
        state.items.push(payload);
        state.eventId    = payload.eventId;
        state.eventTitle = payload.eventTitle;
      }
    },
    removeFromCart(state, { payload }) {
      state.items = state.items.filter((i) => i.ticketTypeId !== payload);
      if (state.items.length === 0) { state.eventId = null; state.coupon = null; }
    },
    updateQuantity(state, { payload: { ticketTypeId, quantity } }) {
      const item = state.items.find((i) => i.ticketTypeId === ticketTypeId);
      if (item) item.quantity = quantity;
    },
    applyCoupon(state, { payload }) {
      state.coupon         = payload.code;
      state.couponDiscount = payload.discount;
    },
    removeCoupon(state) {
      state.coupon         = null;
      state.couponDiscount = 0;
    },
    clearCart(state) {
      state.items          = [];
      state.eventId        = null;
      state.eventTitle     = '';
      state.coupon         = null;
      state.couponDiscount = 0;
    },
  },
});

export const {
  addToCart, removeFromCart, updateQuantity,
  applyCoupon, removeCoupon, clearCart,
} = cartSlice.actions;

// ─── Pure ESM Selectors ────────────────────────────────────────────────────────
export const selectCartItems    = (state) => state.cart.items;
export const selectCartSubtotal = (state) =>
  state.cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
export const selectCartCoupon   = (state) => state.cart.coupon;
export const selectCartDiscount = (state) => state.cart.couponDiscount;

export const selectCartTotal    = (state) => {
  const sub = state.cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = sub * 0.18; // 18% GST
  return Math.max(0, sub + tax - state.cart.couponDiscount);
};

// 🌟 Single Default Export
export default cartSlice.reducer;