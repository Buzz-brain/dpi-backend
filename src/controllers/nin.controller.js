import User from '../models/User.js';
import logger from '../utils/logger.js';

// Mock NIN verification service
function mockNinVerification(nin) {
  // Accept any 11-digit NIN as valid for mock
  return nin && nin.length === 11 && /^\d+$/.test(nin);
}

export async function verifyNin(req, res) {
  try {
    const { nin } = req.body;
    if (!mockNinVerification(nin)) {
      return res.status(400).json({ message: 'Invalid NIN' });
    }
    // Mark user as NIN verified
    await User.findByIdAndUpdate(req.user.sub, { ninVerified: true, nin });
    res.json({ message: 'NIN verified' });
  } catch (err) {
    logger.error('NIN verification error', err);
    res.status(500).json({ message: 'Server error' });
  } 
}
