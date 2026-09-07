import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { router as domainsRouter } from './routes/domains';
import { router as dnsRecordsRouter } from './routes/dnsRecords';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4727;

const DEFAULT_ORIGINS = [
  'http://135.181.228.18:8080',
  'https://135.181.228.18:8080',
  'http://localhost:5173',
  'http://localhost:8080',
  'https://dns.resistance.dog',
  'https://web.telegram.org',
];

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? DEFAULT_ORIGINS.join(','))
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (!origin) {
    next();
    return;
  }
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

app.use(
  '/api',
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
    max: Number(process.env.RATE_LIMIT_MAX) || 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
  }),
);

app.use('/api', domainsRouter);
app.use('/api', dnsRecordsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`dns-text-api listening on port ${PORT}`);
});
