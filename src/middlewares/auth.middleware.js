import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import BlacklistedToken from '../models/BlacklistedToken.js';

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ message: 'Not authorized' });
    const token = header.split(' ')[1];

    // Check if token was blacklisted (logged out)
    const blacklisted = await BlacklistedToken.findOne({ token });
    if (blacklisted) return res.status(401).json({ message: 'Token revoked' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
    req.user = decoded;
    return next();
  } catch (err) {
    logger.error('Auth error', err);
    return res.status(401).json({ message: 'Token invalid or expired' });
  }
}
