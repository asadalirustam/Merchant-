import jwt from 'jsonwebtoken';
import RefreshToken from '../models/RefreshToken.js';

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'merchant_secret_access_key_9988776655',
    { expiresIn: '1d' } // 1 day validity for robust POS work session stability
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

  await RefreshToken.create({
    token,
    user: user._id,
    expiresAt,
  });

  return token;
};
