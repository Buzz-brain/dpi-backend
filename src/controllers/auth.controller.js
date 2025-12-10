import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import BlacklistedToken from '../models/BlacklistedToken.js';
import { generateToken } from '../utils/generateToken.js';
import logger from '../utils/logger.js';
import NinInfo from '../models/NinInfo.js';
import mongoose from 'mongoose';

export async function register(req, res) {
  try {
    const { username, nin, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Missing fields' });

    const allowedRoles = ['admin', 'agent', 'citizen'];
    const userRole = allowedRoles.includes(role) ? role : 'citizen';


    if (userRole === 'citizen') {
      if (!nin) return res.status(400).json({ message: 'NIN is required for citizens' });
      // Fetch NIN info and ensure it is verified
      const ninInfo = await NinInfo.findOne({ nin });
      if (!ninInfo) return res.status(404).json({ message: 'NIN Invalid' });
      if (!ninInfo.isVerified) return res.status(403).json({ message: 'NIN must be verified before registration' });
    }

    const existing = await User.findOne({ $or: [{ username }, { nin }] });
    if (existing) return res.status(409).json({ message: 'Username or NIN already exists' });

    let userData = { username, password: await bcrypt.hash(password, 10), role: userRole };

    if (userRole === 'citizen') {
      // Link by reference; do not copy demographic/contact fields into User
      const ninInfo = await NinInfo.findOne({ nin });
      userData = {
        ...userData,
        nin,
        ninInfo: ninInfo._id
      };
    }

    const user = await User.create(userData);

    try {
      await Wallet.create({ user: user._id });
    } catch (err) {
      logger.error('Failed to create wallet for user', err);
    }

    // Build a response user object that includes ninInfo fields for client convenience
    let responseNinInfo = null;
    if (user.ninInfo) responseNinInfo = await NinInfo.findById(user.ninInfo).select('-__v');
    else if (user.nin) responseNinInfo = await NinInfo.findOne({ nin: user.nin }).select('-_id -__v');

    const responseUser = {
      id: user._id,
      username: user.username,
      fullName: responseNinInfo ? responseNinInfo.fullName : undefined,
      nin: user.nin,
      role: user.role,
      email: responseNinInfo ? responseNinInfo.email : undefined,
      phone: responseNinInfo ? responseNinInfo.phone : undefined,
      ninInfo: user.ninInfo || null
    };

    const token = generateToken(user);
    res.status(201).json({ user: responseUser, token });
  } catch (err) {
    logger.error('Register error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function login(req, res) {
  try {
    const { nin, username, password } = req.body;
    if (!password || (!nin && !username)) return res.status(400).json({ message: 'Missing fields' });
    // Try to find user by nin (citizen) or username (admin/agent)
    const user = nin ? await User.findOne({ nin }) : await User.findOne({ username });
    if (!user || !user.password) return res.status(401).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    // Include ninInfo fields in response for client convenience
    let responseNinInfo = null;
    if (user.ninInfo) responseNinInfo = await NinInfo.findById(user.ninInfo).select('-__v');
    else if (user.nin) responseNinInfo = await NinInfo.findOne({ nin: user.nin }).select('-_id -__v');

    const responseUser = {
      id: user._id,
      username: user.username,
      fullName: responseNinInfo ? responseNinInfo.fullName : undefined,
      nin: user.nin,
      role: user.role,
      email: responseNinInfo ? responseNinInfo.email : undefined,
      phone: responseNinInfo ? responseNinInfo.phone : undefined,
      ninInfo: user.ninInfo || null
    };

    const token = generateToken(user);
    res.json({ user: responseUser, token });
  } catch (err) {
    logger.error('Login error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function logout(req, res) {
  try {
    // Try to get token from Authorization header or body
    let token = null;
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) token = header.split(' ')[1];
    else if (req.body && req.body.token) token = req.body.token;

    if (!token) return res.status(400).json({ message: 'No token provided' });

    // Decode token to get expiry (without verifying)
    const decoded = jwt.decode(token);
    let expiresAt = null;
    if (decoded && decoded.exp) {
      expiresAt = new Date(decoded.exp * 1000);
    } else {
      // Fallback: use configured expiry or 7 days
      const fallbackMs = 7 * 24 * 60 * 60 * 1000; // 7 days
      expiresAt = new Date(Date.now() + fallbackMs);
    }

    // Save token to blacklist so it cannot be reused
    await BlacklistedToken.create({ token, expiresAt });
    return res.json({ message: 'Logged out' });
  } catch (err) {
    logger.error('Logout error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function me(req, res) {
  try {
    // `protect` middleware puts decoded token on req.user
    const userId = req.user && (req.user.sub || req.user.id);
    if (!userId) return res.status(401).json({ message: 'Not authorized' });

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      // token sub might be a string id; if not valid, still attempt to find by string
    }

    const user = await User.findById(userId).select('-password -__v');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const wallet = await Wallet.findOne({ user: user._id }).select('-__v');

    // Optionally include NIN info if available (prefer linked document)
    let ninInfo = null;
    if (user.ninInfo) {
      ninInfo = await NinInfo.findById(user.ninInfo).select('-__v');
    } else if (user.nin) {
      ninInfo = await NinInfo.findOne({ nin: user.nin }).select('-_id -__v');
    }

    return res.json({ user, wallet, ninInfo });
  } catch (err) {
    logger.error('Me error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}
