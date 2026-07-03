import jwt from 'jsonwebtoken';
import RefreshToken from '../models/RefreshToken.js';

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, permissions: user.permissions },
    process.env.JWT_SECRET || 'merchant_secret_access_key_9988776655',
    { expiresIn: '15m' }
  );
};

export const generateRefreshToken = async (user) => {
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'merchant_secret_refresh_key_5544332211',
    { expiresIn: '7d' }
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Save the refresh token in database
  await RefreshToken.create({
    token,
    user: user._id,
    expiresAt,
  });

  return token;
};
