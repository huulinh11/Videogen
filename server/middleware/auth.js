import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'videogen-jwt-secret-change-in-production';
const JWT_EXPIRY = '24h';

export function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password, hash) {
  return crypto.createHash('sha256').update(password).digest('hex') === hash;
}

export function generateToken(user) {
  return jwt.sign({ username: user.username, id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}
