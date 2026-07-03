import QRCode from 'qrcode';

export const generateQRCode = async (text) => {
  try {
    // Generate base64 Data URI of QR code image
    const qrCodeDataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 1,
      width: 300,
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('QR Code Generation Error:', error);
    throw new Error('Could not generate QR Code');
  }
};
