import User from '../models/User.js';
import NinInfo from '../models/NinInfo.js';
import logger from '../utils/logger.js';

// Get logged-in user profile
export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.sub).select('-password').populate('ninInfo');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const obj = user.toObject();
    const nin = obj.ninInfo || null;
    // Merge common fields from ninInfo for backward compatibility
    const responseUser = {
      ...obj,
      fullName: nin ? nin.fullName : undefined,
      email: nin ? nin.email : undefined,
      phone: nin ? nin.phone : undefined
    };
    res.json(responseUser);
  } catch (err) {
    logger.error('Get profile error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Update logged-in user profile
export async function updateProfile(req, res) {
  try {
    const updates = { ...req.body };
    delete updates.password;

    // Extract potential NinInfo updates (demographic/contact fields)
    const ninFields = ['fullName', 'email', 'phone', 'state', 'region', 'occupation', 'gender', 'dob', 'address', 'lga', 'tribe'];
    const ninUpdates = {};
    ninFields.forEach((k) => {
      if (k in updates) {
        ninUpdates[k] = updates[k];
        delete updates[k];
      }
    });

    // Update User (only non-demographic fields)
    const user = await User.findByIdAndUpdate(req.user.sub, updates, { new: true, select: '-password' });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // If there are demographic updates, apply them to linked NinInfo (if present)
    if (Object.keys(ninUpdates).length) {
      if (user.ninInfo) {
        await NinInfo.findByIdAndUpdate(user.ninInfo, ninUpdates, { new: true });
      } else if (user.nin) {
        await NinInfo.findOneAndUpdate({ nin: user.nin }, ninUpdates, { new: true });
      }
    }

    // Return merged object
    const populated = await User.findById(user._id).select('-password').populate('ninInfo');
    const obj = populated.toObject();
    const nin = obj.ninInfo || null;
    const responseUser = {
      ...obj,
      fullName: nin ? nin.fullName : undefined,
      email: nin ? nin.email : undefined,
      phone: nin ? nin.phone : undefined
    };
    res.json(responseUser);
  } catch (err) {
    logger.error('Update profile error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Admin: get user by id
export async function getUser(req, res) {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('ninInfo');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const obj = user.toObject();
    const nin = obj.ninInfo || null;
    const responseUser = {
      ...obj,
      fullName: nin ? nin.fullName : undefined,
      email: nin ? nin.email : undefined,
      phone: nin ? nin.phone : undefined
    };
    res.json(responseUser);
  } catch (err) {
    logger.error('Get user error', err);
    res.status(500).json({ message: 'Server error' });
  }
}


// Admin: get all users
export async function getAllUsers(req, res) {
  try {
    const users = await User.find().select('-password').populate('ninInfo');
    const mapped = users.map((u) => {
      const obj = u.toObject();
      const nin = obj.ninInfo || null;
      return {
        ...obj,
        fullName: nin ? nin.fullName : undefined,
        email: nin ? nin.email : undefined,
        phone: nin ? nin.phone : undefined
      };
    });
    res.json(mapped);
  } catch (err) {
    logger.error('Get all users error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Admin: update user by id
export async function updateUser(req, res) {
  try {
    const updates = { ...req.body };
    delete updates.password;

    // Forward demographic updates to NinInfo where appropriate
    const ninFields = ['fullName', 'email', 'phone', 'state', 'region', 'occupation', 'gender', 'dob', 'address', 'lga', 'tribe'];
    const ninUpdates = {};
    ninFields.forEach((k) => {
      if (k in updates) {
        ninUpdates[k] = updates[k];
        delete updates[k];
      }
    });

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, select: '-password' });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (Object.keys(ninUpdates).length) {
      if (user.ninInfo) {
        await NinInfo.findByIdAndUpdate(user.ninInfo, ninUpdates, { new: true });
      } else if (user.nin) {
        await NinInfo.findOneAndUpdate({ nin: user.nin }, ninUpdates, { new: true });
      }
    }

    const populated = await User.findById(user._id).select('-password').populate('ninInfo');
    const obj = populated.toObject();
    const nin = obj.ninInfo || null;
    const responseUser = {
      ...obj,
      fullName: nin ? nin.fullName : undefined,
      email: nin ? nin.email : undefined,
      phone: nin ? nin.phone : undefined
    };
    res.json(responseUser);
  } catch (err) {
    logger.error('Update user error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Admin: delete user by id
export async function deleteUser(req, res) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    logger.error('Delete user error', err);
    res.status(500).json({ message: 'Server error' });
  }
}
