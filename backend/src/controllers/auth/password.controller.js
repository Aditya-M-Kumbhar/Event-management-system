const crypto = require('crypto');
const User   = require('../../models/User.model');
const ApiResponse  = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const emailService = require('../../services/email/email.service');

// ─── Forgot Password ──────────────────────────────────────────────────────────
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always return success to prevent email enumeration
  if (!user) {
    return ApiResponse.success(res, {}, 'If that email exists, a reset link was sent.');
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await emailService.sendPasswordReset(user.email, user.name, resetUrl);
    return ApiResponse.success(res, {}, 'Password reset email sent.');
  } catch (err) {
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return ApiResponse.error(res, 'Error sending email. Please try again.', 500);
  }
});

// ─── Reset Password ───────────────────────────────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token }       = req.params;
  const { newPassword } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken:   hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return ApiResponse.error(res, 'Invalid or expired reset token.', 400);
  }

  user.password             = newPassword;
  user.passwordResetToken   = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return ApiResponse.success(res, {}, 'Password reset successful. Please log in.');
});
