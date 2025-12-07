import path from 'path';
import fs from 'fs';
import multer from 'multer';
import logger from '../utils/logger.js';

const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
export const upload = multer({ storage });

export async function uploadFile(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    res.status(201).json({ filename: req.file.filename, path: req.file.path });
  } catch (err) {
    logger.error('File upload error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function downloadFile(req, res) {
  try {
    const filePath = path.join(uploadDir, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found' });
    res.download(filePath);
  } catch (err) {
    logger.error('File download error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function deleteFile(req, res) {
  try {
    const filePath = path.join(uploadDir, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found' });
    fs.unlinkSync(filePath);
    res.json({ message: 'File deleted' });
  } catch (err) {
    logger.error('File delete error', err);
    res.status(500).json({ message: 'Server error' });
  }
}
