import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const VIDEOGEN_API = 'https://videogen.web.id';

// GET /api/jobs - List all jobs
router.get('/', authMiddleware, (req, res) => {
  const { status, model, limit = 50, offset = 0 } = req.query;

  let query = 'SELECT * FROM jobs WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (model) {
    query += ' AND model = ?';
    params.push(model);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const jobs = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM jobs').get().count;

  res.json({ jobs, total, limit: Number(limit), offset: Number(offset) });
});

// GET /api/jobs/:id - Get job status (poll from videogen + update local)
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  // Try fetching from videogen API
  const localJob = db.prepare('SELECT * FROM jobs WHERE job_id = ? OR id = ?').get(id, Number(id) || 0);

  try {
    // Poll videogen for job status
    const activeKey = db.prepare('SELECT * FROM api_keys WHERE is_active = 1 ORDER BY id ASC LIMIT 1').get();
    if (!activeKey) {
      return res.status(400).json({ error: 'No active API key configured' });
    }

    const response = await fetch(`${VIDEOGEN_API}/api/jobs/${id}`, {
      headers: { 'x-user-api-key': activeKey.key_value },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to poll job status');
    }

    // Update local job if exists
    if (localJob) {
      if (data.status === 'done' || data.status === 'completed') {
        db.prepare(`
          UPDATE jobs SET status = 'done', result_url = ?, updated_at = datetime('now') WHERE job_id = ?
        `).run(data.url || null, id);
      } else if (data.status === 'failed' || data.status === 'error') {
        db.prepare(`
          UPDATE jobs SET status = 'failed', error = ?, updated_at = datetime('now') WHERE job_id = ?
        `).run(data.error || 'Upstream processing failed', id);
      }
    }

    res.json(data);
  } catch (err) {
    console.error('[Jobs] Poll error:', err.message);
    // Return local job data if available
    if (localJob) {
      return res.json({
        job_id: localJob.job_id,
        status: localJob.status,
        url: localJob.result_url,
        error: localJob.error,
        model: localJob.model,
        prompt: localJob.prompt,
      });
    }
    res.status(404).json({ error: 'Job not found' });
  }
});

// DELETE /api/jobs/:id - Delete job
router.delete('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;

  const result = db.prepare('DELETE FROM jobs WHERE id = ? OR job_id = ?').run(id, id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({ message: 'Job deleted successfully' });
});

export default router;
