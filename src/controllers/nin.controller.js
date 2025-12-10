import User from '../models/User.js';
import NinInfo from '../models/NinInfo.js';
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
      return res.status(400).json({ message: 'Invalid NIN format' });
    }
    
    // First check if NIN exists
    const existingNin = await NinInfo.findOne({ nin });
    if (!existingNin) {
      return res.status(404).json({ message: 'NIN record not found. Please register the NIN first before verifying.' });
    }
    
    // Update only the isVerified flag
    existingNin.isVerified = true;
    const ninInfo = await existingNin.save();
    
    // NOTE: do NOT set `User.nin` here — that would assign the NIN to
    // the currently authenticated admin (req.user) and can cause a
    // duplicate-key error if the NIN already belongs to another user.
    // If the NinInfo record is linked to a specific user, update that
    // user's `ninVerified` flag instead. For now, only update `ninVerified`
    // for the linked user when that link exists on the NinInfo document.
    if (existingNin.linkedUserId) {
      try {
        await User.findByIdAndUpdate(existingNin.linkedUserId, { ninVerified: true });
      } catch (e) {
        // Log but do not fail verification if user update fails
        logger.warn('Failed to update linked user verification status', { err: e, linkedUserId: existingNin.linkedUserId });
      }
    }
    
    res.json({ message: 'NIN verified successfully', ninInfo });
  } catch (err) {
    logger.error('NIN verification error', err);
    res.status(500).json({ message: 'Server error', details: err });
  } 
}
