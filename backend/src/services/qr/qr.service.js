const QRCode = require('qrcode');

/**
 * Generate QR code as base64 PNG string
 * @param {string} data - JSON payload to encode
 * @returns {Promise<string>} base64 data URL
 */
const generateQR = async (data) => {
  const options = {
    errorCorrectionLevel: 'H',
    type:                 'image/png',
    quality:              0.95,
    margin:               1,
    color: {
      dark:  '#0d0f1a',
      light: '#ffffff',
    },
    width: 400,
  };
  return QRCode.toDataURL(data, options);
};

/**
 * Generate QR code as SVG string
 */
const generateQRSVG = async (data) => {
  return QRCode.toString(data, { type: 'svg', width: 200 });
};

/**
 * Validate and parse QR payload
 */
const parseQRPayload = (qrData) => {
  try {
    return JSON.parse(qrData);
  } catch {
    return null;
  }
};

module.exports = { generateQR, generateQRSVG, parseQRPayload };
