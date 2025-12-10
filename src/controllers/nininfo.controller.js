import NinInfo from '../models/NinInfo.js';
import logger from '../utils/logger.js';
import Joi from 'joi';

export async function createNinInfo(req, res) {
  try {
    // const schema = Joi.object({
    //   nin: Joi.string().min(5).max(20).required(),
    //   fullName: Joi.string().min(3).max(200).required(),
    //   email: Joi.string().email().required(),
    //   phone: Joi.string().min(7).max(20).required(),
    //   state: Joi.string().optional().allow(''),
    //   region: Joi.string().optional().allow(''),
    //   occupation: Joi.string().optional().allow(''),
    //   gender: Joi.string().valid('male', 'female', 'other').optional(),
    //   dob: Joi.date().iso().optional(),
    //   address: Joi.string().optional().allow(''),
    //   lga: Joi.string().optional().allow(''),
    //   tribe: Joi.string().optional().allow('')
    // });

    // const { error, value } = schema.validate(req.body, { stripUnknown: true });
    // if (error) return res.status(400).json({ message: error.details[0].message });
    const { nin, fullName, email, phone, state, region, occupation, gender, dob, address, lga, tribe } = req.body;
    const existing = await NinInfo.findOne({ nin });
    if (existing) return res.status(409).json({ message: 'NIN already exists' });
    const ninInfo = await NinInfo.create({ nin, fullName, email, phone, state, region, occupation, gender, dob, address, lga, tribe });
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
    // Include isVerified status in response
    res.json({
      fullName: ninInfo.fullName,
      email: ninInfo.email,
      phone: ninInfo.phone,
      isVerified: ninInfo.isVerified
    });
  } catch (err) {
    logger.error('Get NIN info error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function listNinInfos(req, res) {
  try {
    const all = await NinInfo.find().lean();
    res.json(all);
  } catch (err) {
    logger.error('List NIN infos error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function updateNinInfo(req, res) {
  try {
    const schema = Joi.object({
      fullName: Joi.string().min(3).max(200).optional(),
      email: Joi.string().email().optional(),
      phone: Joi.string().min(7).max(20).optional(),
      state: Joi.string().optional().allow(''),
      region: Joi.string().optional().allow(''),
      occupation: Joi.string().optional().allow(''),
      gender: Joi.string().valid('male', 'female', 'other').optional(),
      dob: Joi.date().iso().optional(),
      address: Joi.string().optional().allow(''),
      lga: Joi.string().optional().allow(''),
      tribe: Joi.string().optional().allow('')
    });

    const { error, value: updates } = schema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.details[0].message });

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
