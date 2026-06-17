import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB } from './db.js';
import authRoutes from './routes/auth.js';
import keysRoutes from './routes/keys.js';
import generateRoutes from './routes/generate.js';
import jobsRoutes from './routes/jobs.js';
import uploadRoutes from './routes/upload.js';
import modelsRoutes from './routes/models.js';
import apiTestRoutes from './routes/api-test.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
await initDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/keys', keysRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/models', modelsRoutes);
app.use('/api/test', apiTestRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static files in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(clientDist, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`[Server] Videogen backend running on port ${PORT}`);
  console.log(`[Server] API: http://localhost:${PORT}/api`);
});
