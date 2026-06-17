import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import db from '../db.js';

const router = Router();
const VIDEOGEN_API = 'https://videogen.web.id';

// POST /api/test/generate - Test generate endpoint
router.post('/generate', authMiddleware, async (req, res) => {
  const { api_key, payload } = req.body;

  if (!api_key || !payload) {
    return res.status(400).json({ error: 'api_key and payload are required' });
  }

  try {
    const startTime = Date.now();
    const response = await fetch(`${VIDEOGEN_API}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-api-key': api_key,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    const elapsed = Date.now() - startTime;

    res.json({
      status: response.status,
      ok: response.ok,
      elapsed_ms: elapsed,
      response: data,
      request: {
        url: `${VIDEOGEN_API}/api/generate`,
        headers: { 'Content-Type': 'application/json', 'x-user-api-key': api_key.substring(0, 8) + '...' },
        payload,
      },
    });
  } catch (err) {
    res.status(502).json({
      status: 502,
      ok: false,
      error: err.message,
      request: {
        url: `${VIDEOGEN_API}/api/generate`,
        payload,
      },
    });
  }
});

// POST /api/test/upload - Test upload endpoint
router.post('/upload', authMiddleware, async (req, res) => {
  const { api_key, filename, mimeType, base64Data } = req.body;

  if (!api_key || !filename || !mimeType || !base64Data) {
    return res.status(400).json({ error: 'api_key, filename, mimeType, and base64Data are required' });
  }

  try {
    const startTime = Date.now();
    const response = await fetch(`${VIDEOGEN_API}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, mimeType, base64Data }),
    });

    const data = await response.json();
    const elapsed = Date.now() - startTime;

    res.json({
      status: response.status,
      ok: response.ok,
      elapsed_ms: elapsed,
      response: data,
    });
  } catch (err) {
    res.status(502).json({ status: 502, ok: false, error: err.message });
  }
});

// POST /api/test/job-status - Test job status endpoint
router.post('/job-status', authMiddleware, async (req, res) => {
  const { api_key, job_id } = req.body;

  if (!api_key || !job_id) {
    return res.status(400).json({ error: 'api_key and job_id are required' });
  }

  try {
    const startTime = Date.now();
    const response = await fetch(`${VIDEOGEN_API}/api/jobs/${job_id}`, {
      headers: { 'x-user-api-key': api_key },
    });

    const data = await response.json();
    const elapsed = Date.now() - startTime;

    res.json({
      status: response.status,
      ok: response.ok,
      elapsed_ms: elapsed,
      response: data,
    });
  } catch (err) {
    res.status(502).json({ status: 502, ok: false, error: err.message });
  }
});

// GET /api/test/saved-keys - Get saved API keys (masked)
router.get('/saved-keys', authMiddleware, (req, res) => {
  const keys = db.prepare('SELECT id, key_value, label, is_active, quota FROM api_keys').all();
  const masked = keys.map(k => ({
    ...k,
    key_value: k.key_value.substring(0, 8) + '***' + k.key_value.slice(-4),
  }));
  res.json(masked);
});

export default router;
