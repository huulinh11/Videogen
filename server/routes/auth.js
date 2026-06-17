import { Router } from 'express';
import db from '../db.js';
import { hashPassword, verifyPassword, generateToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  if (user.password_hash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = generateToken(user);
  res.json({ token, username: user.username });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ username: req.user.username, authenticated: true });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// PUT /api/auth/change-password
router.put('/change-password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }

  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(req.user.username);
  if (user.password_hash !== hashPassword(currentPassword)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  db.prepare('UPDATE admin_users SET password_hash = ? WHERE username = ?')
    .run(hashPassword(newPassword), req.user.username);

  res.json({ message: 'Password changed successfully' });
});

export default router;
