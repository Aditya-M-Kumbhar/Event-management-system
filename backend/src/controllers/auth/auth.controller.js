/**
 * Auth Controller — Register, Login, Logout, Refresh, Google OAuth
 */

const jwt      = require('jsonwebtoken');
const passport = require('passport');
const User     = require('../../models/User.model');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
} = require('../../utils/generateToken');
const emailService = require('../../services/email/email.service');

// ─── Register ─────────────────────────────────────────────────────────────────
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return ApiResponse.error(res, 'Email already registered.', 409);
  }

  // Only allow attendee or organiser self-registration
  const allowedRoles = ['attendee', 'organiser'];
  const userRole = allowedRoles.includes(role) ? role : 'attendee';

  const user = await User.create({ name, email, password, role: userRole });

  // Send welcome email (non-blocking)
  emailService.sendWelcome(user.email, user.name).catch(() => {});

  const accessToken  = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  setRefreshTokenCookie(res, refreshToken);

  return ApiResponse.created(res, {
    user: user.toSafeObject(),
    accessToken,
  }, 'Account created successfully');
});

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return ApiResponse.error(res, 'Invalid email or password.', 401);
  }

  if (user.authProvider === 'google') {
    return ApiResponse.error(res, 'This account uses Google Sign-In. Please use Google OAuth.', 400);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return ApiResponse.error(res, 'Invalid email or password.', 401);
  }

  if (user.isBanned) {
    return ApiResponse.error(res, `Account suspended: ${user.banReason || 'Contact support.'}`, 403);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const accessToken  = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  setRefreshTokenCookie(res, refreshToken);

  return ApiResponse.success(res, {
    user: user.toSafeObject(),
    accessToken,
  }, 'Logged in successfully');
});

// ─── Logout ───────────────────────────────────────────────────────────────────
exports.logout = asyncHandler(async (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  return ApiResponse.success(res, {}, 'Logged out successfully');
});

// ─── Refresh Access Token ─────────────────────────────────────────────────────
exports.refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    return ApiResponse.error(res, 'No refresh token provided.', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user    = await User.findById(decoded.id);

    if (!user || user.isBanned) {
      return ApiResponse.error(res, 'Invalid refresh token.', 401);
    }

    const newAccessToken  = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);
    setRefreshTokenCookie(res, newRefreshToken);

    return ApiResponse.success(res, { accessToken: newAccessToken }, 'Token refreshed');
  } catch {
    return ApiResponse.error(res, 'Invalid or expired refresh token.', 401);
  }
});

// ─── Get Current User ─────────────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, req.user.toSafeObject());
});

// ─── Google OAuth Callback ────────────────────────────────────────────────────
exports.googleCallback = (req, res) => {
  const user = req.user;

  const accessToken  = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  setRefreshTokenCookie(res, refreshToken);

  // Redirect to frontend with token
  res.redirect(
    `${process.env.CLIENT_URL}/auth/oauth-success?token=${accessToken}&role=${user.role}`
  );
};

// ─── Change Password ──────────────────────────────────────────────────────────
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return ApiResponse.error(res, 'Current password is incorrect.', 400);
  }

  user.password = newPassword;
  await user.save();

  return ApiResponse.success(res, {}, 'Password updated successfully');
});
