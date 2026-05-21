/**
 * Check-In Controller — QR Scan, Manual Entry, Live Dashboard
 */

const Ticket  = require('../../models/Ticket.model');
const Event   = require('../../models/Event.model');
const { CheckIn } = require('../../models/schemas');
const ApiResponse  = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { parseQRPayload } = require('../../services/qr/qr.service');

// ─── Helper: perform check-in ─────────────────────────────────────────────────
const performCheckIn = async (ticket, eventId, checkInBy, method, io) => {
  if (ticket.isCheckedIn) {
    return { success: false, message: 'Ticket already checked in', ticket };
  }
  if (ticket.event.toString() !== eventId.toString()) {
    return { success: false, message: 'This ticket is for a different event', ticket };
  }
  if (ticket.isRefunded) {
    return { success: false, message: 'This ticket has been refunded', ticket };
  }

  // Mark checked in
  ticket.isCheckedIn = true;
  ticket.checkedInAt = new Date();
  ticket.checkedInBy = checkInBy;
  await ticket.save();

  // Create check-in record
  await CheckIn.create({
    event:    eventId,
    ticket:   ticket._id,
    attendee: ticket.attendee,
    checkedInBy: checkInBy,
    method,
  });

  // Emit real-time update via Socket.io
  if (io) {
    const [totalSold, checkedIn] = await Promise.all([
      Ticket.countDocuments({ event: eventId }),
      Ticket.countDocuments({ event: eventId, isCheckedIn: true }),
    ]);
    io.to(`checkin:${eventId}`).emit('checkin:update', {
      ticketId:   ticket.ticketId,
      attendee:   ticket.attendeeInfo,
      totalSold,
      checkedIn,
      remaining:  totalSold - checkedIn,
      checkedAt:  ticket.checkedInAt,
    });
  }

  return { success: true, message: 'Check-in successful!', ticket };
};

// ─── Scan QR Code ─────────────────────────────────────────────────────────────
exports.scanQR = asyncHandler(async (req, res) => {
  const { qrData, eventId } = req.body;
  const io = req.app.get('io');

  const payload = parseQRPayload(qrData);
  if (!payload?.ticketId) {
    return ApiResponse.error(res, 'Invalid QR code', 400);
  }

  const ticket = await Ticket.findOne({ ticketId: payload.ticketId });
  if (!ticket) return ApiResponse.error(res, 'Ticket not found', 404);

  const result = await performCheckIn(ticket, eventId, req.user._id, 'qr_scan', io);

  return result.success
    ? ApiResponse.success(res, { ticket: result.ticket, attendee: ticket.attendeeInfo }, result.message)
    : ApiResponse.error(res, result.message, 400);
});

// ─── Manual Check-In by Ticket ID ────────────────────────────────────────────
exports.manualCheckIn = asyncHandler(async (req, res) => {
  const { ticketId, eventId } = req.body;
  const io = req.app.get('io');

  const ticket = await Ticket.findOne({ ticketId: ticketId.toUpperCase() });
  if (!ticket) return ApiResponse.error(res, 'Ticket not found', 404);

  const result = await performCheckIn(ticket, eventId, req.user._id, 'manual', io);

  return result.success
    ? ApiResponse.success(res, { ticket: result.ticket, attendee: ticket.attendeeInfo }, result.message)
    : ApiResponse.error(res, result.message, 400);
});

// ─── Get Check-in Dashboard Stats ────────────────────────────────────────────
exports.getCheckInStats = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId).select('title totalSold totalCapacity organiser');
  if (!event) return ApiResponse.error(res, 'Event not found', 404);

  if (event.organiser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return ApiResponse.error(res, 'Not authorized', 403);
  }

  const [totalTickets, checkedIn, recentCheckIns] = await Promise.all([
    Ticket.countDocuments({ event: eventId }),
    Ticket.countDocuments({ event: eventId, isCheckedIn: true }),
    Ticket.find({ event: eventId, isCheckedIn: true })
      .sort({ checkedInAt: -1 })
      .limit(20)
      .select('ticketId ticketTypeName attendeeInfo checkedInAt'),
  ]);

  // Hourly check-in distribution
  const hourlyData = await CheckIn.aggregate([
    { $match: { event: require('mongoose').Types.ObjectId(eventId) } },
    { $group: {
      _id:   { $hour: '$createdAt' },
      count: { $sum: 1 },
    }},
    { $sort: { _id: 1 } },
  ]);

  return ApiResponse.success(res, {
    eventTitle:   event.title,
    totalSold:    totalTickets,
    checkedIn,
    remaining:    totalTickets - checkedIn,
    checkInRate:  totalTickets ? Math.round((checkedIn / totalTickets) * 100) : 0,
    recentCheckIns,
    hourlyData,
  });
});

// ─── Get All Checked-In Attendees ─────────────────────────────────────────────
exports.getCheckedInAttendees = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const tickets = await Ticket.find({ event: eventId, isCheckedIn: true })
    .sort({ checkedInAt: -1 })
    .populate('attendee', 'name email avatar');
  return ApiResponse.success(res, tickets);
});

// ─── Undo Check-In (Admin only) ────────────────────────────────────────────────
exports.undoCheckIn = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
  if (!ticket) return ApiResponse.error(res, 'Ticket not found', 404);

  ticket.isCheckedIn = false;
  ticket.checkedInAt = null;
  ticket.checkedInBy = null;
  await ticket.save();

  await CheckIn.deleteOne({ ticket: ticket._id });

  return ApiResponse.success(res, {}, 'Check-in reversed');
});
