import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 5000;
(async () => {
  await connectDB(process.env.MONGO_URI || '');
  app.listen(PORT, () => logger.info(`Server listening on ${PORT}`));
})();
