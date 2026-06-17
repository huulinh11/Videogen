import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// External API base URL
const VIDEOGEN_API = 'https://videogen.web.id';

// POST /api/generate - Forward generate request to videogen.web.id
router.post('/', authMiddleware, async (req, res) => {
  const { payload, api_key_id } = req.body;

  if (!payload || !payload.model) {
    return res.status(400).json({ error: 'Payload with model is required' });
  }

  // Get API key from DB or use default
  let apiKey;
  if (api_key_id) {
    const keyRecord = db.prepare('SELECT * FROM api_keys WHERE id = ? AND is_active = 1').get(api_key_id);
    if (!keyRecord) {
      return res.status(400).json({ error: 'Invalid or inactive API key' });
    }
    apiKey = keyRecord.key_value;
  } else {
    // Use first active key
    const activeKey = db.prepare('SELECT * FROM api_keys WHERE is_active = 1 ORDER BY id ASC LIMIT 1').get();
    if (!activeKey) {
      return res.status(400).json({ error: 'No active API key configured. Please add one in Account settings.' });
    }
    apiKey = activeKey.key_value;
    api_key_id = activeKey.id;
  }

  try {
    const response = await fetch(VIDEOGEN_API + '/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-api-key': apiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000),
    });

    const data = await response.json();

    if (!response.ok || !data.job_id) {
      return res.status(response.status).json({
        error: data.error || 'Failed to start video generation',
        details: data,
      });
    }

    // Save job to local DB
    const jobRecord = db.prepare(`
      INSERT INTO jobs (job_id, model, prompt, mode, status, payload, api_key_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.job_id,
      payload.model,
      payload.prompt || '',
      payload.image_url ? 'image-to-video' : 'text-to-video',
      'processing',
      JSON.stringify(payload),
      api_key_id
    );

    res.json({
      job_id: data.job_id,
      local_id: jobRecord.lastInsertRowid,
      ...data,
    });
  } catch (err) {
    console.error('[Generate] Error:', err.message);
    res.status(502).json({ error: 'Failed to connect to videogen.web.id API' });
  }
});

export default router;
