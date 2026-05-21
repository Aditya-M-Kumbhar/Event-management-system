/**
 * Email Service — Nodemailer wrapper with HTML templates
 */

const transporter = require('../../config/nodemailer');
const logger = require('../../utils/logger');

const FROM = process.env.EMAIL_FROM || 'EventSphere <noreply@eventsphere.com>';

// ─── Base HTML wrapper ────────────────────────────────────────────────────────
const wrapHtml = (content, title) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f2f8; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #3a52ff 0%, #5e7bff 100%); padding: 32px 40px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px; }
    .body { padding: 32px 40px; color: #0d0f1a; }
    .body h2 { font-size: 18px; font-weight: 600; margin: 0 0 12px; }
    .body p { font-size: 14px; line-height: 1.65; color: #4b5168; margin: 0 0 16px; }
    .ticket-box { background: #f0f2f8; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .ticket-box .label { font-size: 11px; color: #8891a8; text-transform: uppercase; letter-spacing: 0.08em; }
    .ticket-box .value { font-size: 15px; font-weight: 600; color: #0d0f1a; margin-top: 2px; }
    .btn { display: inline-block; background: #3a52ff; color: white; text-decoration: none; padding: 13px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; margin: 8px 0; }
    .footer { background: #f8f9fc; padding: 20px 40px; text-align: center; font-size: 12px; color: #8891a8; }
    .divider { border: none; border-top: 1px solid #e4e7f0; margin: 20px 0; }
    .ticket-id { font-family: monospace; font-size: 16px; font-weight: 700; color: #3a52ff; letter-spacing: 0.05em; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ EventSphere</h1>
      <p>AI-Powered Event Management</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} EventSphere. All rights reserved.</p>
      <p>You're receiving this because you have an EventSphere account.</p>
    </div>
  </div>
</body>
</html>`;

// ─── Send helper ──────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    logger.error(`Email failed to ${to}: ${err.message}`);
    // Don't throw — email failures shouldn't break app flow
  }
};

// ─── Welcome Email ────────────────────────────────────────────────────────────
const sendWelcome = (email, name) => sendEmail({
  to: email,
  subject: '🎉 Welcome to EventSphere!',
  html: wrapHtml(`
    <h2>Welcome aboard, ${name}! 🎉</h2>
    <p>You've successfully joined EventSphere — your hub for discovering, creating, and managing amazing events.</p>
    <p>Here's what you can do:</p>
    <ul style="font-size:14px;line-height:2;color:#4b5168;padding-left:20px;">
      <li>🔍 Browse thousands of events</li>
      <li>🎫 Book tickets with one click</li>
      <li>✨ Get AI-powered event recommendations</li>
      <li>📊 Create and manage your own events</li>
    </ul>
    <a href="${process.env.CLIENT_URL}/events" class="btn">Explore Events</a>
  `, 'Welcome to EventSphere'),
});

// ─── Ticket Confirmation Email ────────────────────────────────────────────────
const sendTicketConfirmation = async (order, tickets, event) => {
  const ticketRows = tickets.map(t => `
    <div class="ticket-box">
      <div class="label">Ticket ID</div>
      <div class="ticket-id">${t.ticketId}</div>
      <hr class="divider" style="margin:12px 0">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div><div class="label">Type</div><div class="value">${t.ticketTypeName}</div></div>
        <div><div class="label">Price</div><div class="value">${t.price === 0 ? 'Free' : '₹' + t.price.toLocaleString()}</div></div>
      </div>
    </div>
  `).join('');

  return sendEmail({
    to: order.attendeeSnapshot?.email,
    subject: `🎫 Your tickets for "${event.title}" are confirmed!`,
    html: wrapHtml(`
      <h2>Booking Confirmed! 🎉</h2>
      <p>Hi ${order.attendeeSnapshot?.name}, your tickets are ready. Here's your booking summary:</p>
      <div class="ticket-box">
        <div class="label">Event</div><div class="value">${event.title}</div>
        <hr class="divider" style="margin:12px 0">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:4px">
          <div><div class="label">Date</div><div class="value">${new Date(event.startDate).toLocaleDateString('en-IN', { weekday:'short',month:'short',day:'numeric',year:'numeric' })}</div></div>
          <div><div class="label">Venue</div><div class="value">${event.format === 'online' ? 'Online Event' : (event.venue?.name || event.venue?.city)}</div></div>
          <div><div class="label">Order ID</div><div class="value">${order.orderId}</div></div>
          <div><div class="label">Total Paid</div><div class="value">₹${order.totalAmount.toLocaleString()}</div></div>
        </div>
      </div>
      <h3 style="font-size:15px;margin:20px 0 4px">Your Tickets (${tickets.length})</h3>
      ${ticketRows}
      <p>Show the QR code at the venue for check-in. Your tickets are also available in your EventSphere dashboard.</p>
      <a href="${process.env.CLIENT_URL}/my-tickets" class="btn">View My Tickets</a>
    `, 'Ticket Confirmation'),
  });
};

// ─── Password Reset Email ─────────────────────────────────────────────────────
const sendPasswordReset = (email, name, resetUrl) => sendEmail({
  to: email,
  subject: '🔑 Reset your EventSphere password',
  html: wrapHtml(`
    <h2>Password Reset Request</h2>
    <p>Hi ${name}, we received a request to reset your password. Click the button below to create a new one:</p>
    <a href="${resetUrl}" class="btn">Reset Password</a>
    <p style="margin-top:20px;font-size:13px;color:#8891a8">
      This link expires in <strong>10 minutes</strong>.<br>
      If you didn't request this, you can safely ignore this email.
    </p>
  `, 'Reset Password'),
});

// ─── Event Reminder ───────────────────────────────────────────────────────────
const sendEventReminder = (email, name, event, hoursUntil) => sendEmail({
  to: email,
  subject: `⏰ Reminder: "${event.title}" is in ${hoursUntil} hours!`,
  html: wrapHtml(`
    <h2>Your event is coming up! ⏰</h2>
    <p>Hi ${name}, just a reminder that <strong>${event.title}</strong> starts in ${hoursUntil} hours.</p>
    <div class="ticket-box">
      <div class="label">Event</div><div class="value">${event.title}</div>
      <hr class="divider" style="margin:12px 0">
      <div><div class="label">Time</div><div class="value">${new Date(event.startDate).toLocaleString('en-IN')}</div></div>
      <div style="margin-top:8px"><div class="label">Location</div><div class="value">${event.format === 'online' ? 'Online — check your tickets for the link' : `${event.venue?.name}, ${event.venue?.city}`}</div></div>
    </div>
    <a href="${process.env.CLIENT_URL}/my-tickets" class="btn">View Tickets & Details</a>
  `, 'Event Reminder'),
});

// ─── Refund Status ────────────────────────────────────────────────────────────
const sendRefundStatus = (email, name, orderId, amount, status) => sendEmail({
  to: email,
  subject: `💰 Refund ${status} — Order ${orderId}`,
  html: wrapHtml(`
    <h2>Refund ${status === 'processed' ? 'Processed ✅' : 'Update'}</h2>
    <p>Hi ${name}, your refund request for order <strong>${orderId}</strong> has been ${status}.</p>
    ${status === 'processed' ? `<div class="ticket-box"><div class="label">Refund Amount</div><div class="value">₹${amount?.toLocaleString()}</div></div><p>The refund will reflect in your account within 5-7 business days.</p>` : ''}
    <a href="${process.env.CLIENT_URL}/my-tickets" class="btn">View Orders</a>
  `, `Refund ${status}`),
});

// ─── Post-event Feedback Request ──────────────────────────────────────────────
const sendFeedbackRequest = (email, name, event) => sendEmail({
  to: email,
  subject: `⭐ How was "${event.title}"? Share your feedback!`,
  html: wrapHtml(`
    <h2>Hope you enjoyed the event! ⭐</h2>
    <p>Hi ${name}, <strong>${event.title}</strong> has wrapped up. We'd love to hear your thoughts!</p>
    <p>Your feedback helps organisers improve and helps other attendees make informed decisions.</p>
    <a href="${process.env.CLIENT_URL}/events/${event.slug}#reviews" class="btn">Write a Review</a>
  `, 'Share Your Feedback'),
});

module.exports = {
  sendWelcome,
  sendTicketConfirmation,
  sendPasswordReset,
  sendEventReminder,
  sendRefundStatus,
  sendFeedbackRequest,
};
