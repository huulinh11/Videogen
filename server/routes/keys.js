import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/keys - List all API keys
router.get('/', authMiddleware, (req, res) => {
  const keys = db.prepare(`
    SELECT k.*, COUNT(j.id) as job_count
    FROM api_keys k
    LEFT JOIN jobs j ON j.api_key_id = k.id
    GROUP BY k.id
    ORDER BY k.created_at DESC
  `).all();

  res.json(keys);
});

// GET /api/keys/active - Get active keys only
router.get('/active', authMiddleware, (req, res) => {
  const keys = db.prepare('SELECT * FROM api_keys WHERE is_active = 1 ORDER BY created_at DESC').all();
  res.json(keys);
});

// POST /api/keys - Add new API key
router.post('/', authMiddleware, (req, res) => {
  const { key_value, label } = req.body;

  if (!key_value || !key_value.trim()) {
    return res.status(400).json({ error: 'API key is required' });
  }

  // Validate key format: vdgen- prefix
  const trimmedKey = key_value.trim();
  if (!trimmedKey.startsWith('vdgen-') && !trimmedKey.startsWith('seedance')) {
    // Also accept cookie-style keys
  }

  const existing = db.prepare('SELECT id FROM api_keys WHERE key_value = ?').get(trimmedKey);
  if (existing) {
    return res.status(409).json({ error: 'API key already exists' });
  }

  const result = db.prepare('INSERT INTO api_keys (key_value, label) VALUES (?, ?)')
    .run(trimmedKey, label || '');

  const created = db.prepare('SELECT * FROM api_keys WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/keys/:id - Update API key
router.put('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { key_value, label, is_active, quota } = req.body;

  const existing = db.prepare('SELECT * FROM api_keys WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'API key not found' });
  }

  const updates = [];
  const params = [];

  if (key_value !== undefined) {
    updates.push('key_value = ?');
    params.push(key_value.trim());
  }
  if (label !== undefined) {
    updates.push('label = ?');
    params.push(label);
  }
  if (is_active !== undefined) {
    updates.push('is_active = ?');
    params.push(is_active ? 1 : 0);
  }
  if (quota !== undefined) {
    updates.push('quota = ?');
    params.push(quota);
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    params.push(id);
    db.prepare(`UPDATE api_keys SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  const updated = db.prepare('SELECT * FROM api_keys WHERE id = ?').get(id);
  res.json(updated);
});

// DELETE /api/keys/:id - Delete API key
router.delete('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;

  const existing = db.prepare('SELECT * FROM api_keys WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'API key not found' });
  }

  db.prepare('DELETE FROM api_keys WHERE id = ?').run(id);
  res.json({ message: 'API key deleted successfully' });
});

export default router;
