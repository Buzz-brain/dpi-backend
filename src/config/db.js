import mongoose from 'mongoose';
import logger from '../utils/logger.js';

export async function connectDB(uri) {
  try {
    await mongoose.connect(uri);
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  }
}
