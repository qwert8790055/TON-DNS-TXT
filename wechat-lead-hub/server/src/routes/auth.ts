import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db';

export const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  const user = getDb()
    .prepare('SELECT * FROM admin_users WHERE username = ?')
    .get(username) as { id: number; username: string; password_hash: string } | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const secret = process.env.JWT_SECRET ?? 'change-me';
  const token = jwt.sign({ sub: user.id, username: user.username }, secret, { expiresIn: '7d' });
  res.json({ token, username: user.username });
});

authRouter.get('/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const secret = process.env.JWT_SECRET ?? 'change-me';
    const payload = jwt.verify(header.slice(7), secret) as { username: string };
    res.json({ username: payload.username });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});
