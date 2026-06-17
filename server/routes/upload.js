import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const VIDEOGEN_API = 'https://videogen.web.id';

// POST /api/upload - Proxy file upload to videogen.web.id
router.post('/', authMiddleware, async (req, res) => {
  const { filename, mimeType, base64Data } = req.body;

  if (!filename || !mimeType || !base64Data) {
    return res.status(400).json({ error: 'filename, mimeType, and base64Data are required' });
  }

  try {
    const response = await fetch(`${VIDEOGEN_API}/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filename, mimeType, base64Data }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error || 'Upload failed',
      });
    }

    res.json(data);
  } catch (err) {
    console.error('[Upload] Error:', err.message);
    res.status(502).json({ error: 'Failed to connect to videogen.web.id upload endpoint' });
  }
});

export default router;
