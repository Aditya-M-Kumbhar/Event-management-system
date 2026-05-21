/**
 * Organiser Payout Simulation Service
 * Simulates payout tracking for organiser earnings
 * In production: integrate with Razorpay Route / bank transfer APIs
 */

const Order = require('../../models/Order.model');
const Event = require('../../models/Event.model');

const PLATFORM_FEE_PERCENT = 5; // EventSphere takes 5% platform fee

/**
 * Calculate organiser earnings for an event after platform fee
 */
const calculatePayoutForEvent = async (eventId) => {
  const orders = await Order.find({
    event:  eventId,
    status: { $in: ['confirmed', 'refunded'] },
  });

  const grossRevenue   = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const refundedAmount = orders
    .filter(o => o.status === 'refunded')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const netRevenue     = grossRevenue - refundedAmount;
  const platformFee    = Math.round(netRevenue * PLATFORM_FEE_PERCENT / 100);
  const organiserPayout= netRevenue - platformFee;

  return {
    eventId,
    grossRevenue,
    refundedAmount,
    netRevenue,
    platformFee,
    organiserPayout,
    platformFeePercent: PLATFORM_FEE_PERCENT,
    currency: 'INR',
    status: 'calculated', // 'pending' | 'processing' | 'paid'
  };
};

/**
 * Get payout summary for all organiser events
 */
const getOrganiserPayoutSummary = async (organiserId) => {
  const events = await Event.find({ organiser: organiserId }).select('_id title totalRevenue');

  const payouts = await Promise.all(
    events.map(e => calculatePayoutForEvent(e._id))
  );

  const totalGross    = payouts.reduce((s, p) => s + p.grossRevenue, 0);
  const totalPayout   = payouts.reduce((s, p) => s + p.organiserPayout, 0);
  const totalFees     = payouts.reduce((s, p) => s + p.platformFee, 0);

  return {
    events: payouts,
    summary: {
      totalGrossRevenue: totalGross,
      totalPlatformFees: totalFees,
      totalOrganiserPayout: totalPayout,
      currency: 'INR',
    },
  };
};

module.exports = { calculatePayoutForEvent, getOrganiserPayoutSummary };
