import NinInfo from '../models/NinInfo.js';
import logger from '../utils/logger.js';

export async function createNinInfo(req, res) {
  try {
    const { nin, fullName, email, phone } = req.body;
    if (!nin || !fullName || !email || !phone) return res.status(400).json({ message: 'Missing fields' });
    const existing = await NinInfo.findOne({ nin });
    if (existing) return res.status(409).json({ message: 'NIN already exists' });
    const ninInfo = await NinInfo.create({ nin, fullName, email, phone });
    res.status(201).json(ninInfo);
  } catch (err) {
    logger.error('Create NIN info error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getNinInfo(req, res) {
  try {
    const ninInfo = await NinInfo.findOne({ nin: req.params.nin });
    if (!ninInfo) return res.status(404).json({ message: 'NIN Invalid' });
    res.json(ninInfo);
  } catch (err) {
    logger.error('Get NIN info error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function updateNinInfo(req, res) {
  try {
    const updates = req.body;
    const ninInfo = await NinInfo.findOneAndUpdate({ nin: req.params.nin }, updates, { new: true });
    if (!ninInfo) return res.status(404).json({ message: 'NIN not found' });
    res.json(ninInfo);
  } catch (err) {
    logger.error('Update NIN info error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function deleteNinInfo(req, res) {
  try {
    const ninInfo = await NinInfo.findOneAndDelete({ nin: req.params.nin });
    if (!ninInfo) return res.status(404).json({ message: 'NIN not found' });
    res.json({ message: 'NIN info deleted' });
  } catch (err) {
    logger.error('Delete NIN info error', err);
    res.status(500).json({ message: 'Server error' });
  }
}
