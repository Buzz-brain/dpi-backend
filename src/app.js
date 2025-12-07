import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import adminRoutes from './routes/admin.routes.js';
import announcementRoutes from './routes/announcement.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';
import pollRoutes from './routes/poll.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import fileRoutes from './routes/file.routes.js';
import otpRoutes from './routes/otp.routes.js';
import ninRoutes from './routes/nin.routes.js';
import ninInfoRoutes from './routes/nininfo.routes.js';

const app = express();

app.use(helmet());
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:8080';
app.use(cors({
	origin: allowedOrigin,
	credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 100, message: 'Too many requests from this IP' });
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/nin', ninRoutes);
app.use('/api/nininfo', ninInfoRoutes);

app.get('/', (req, res) => res.json({ message: 'DPI backend running (JS)' }));

export default app;
