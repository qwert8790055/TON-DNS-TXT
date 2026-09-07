import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { initDb } from './db';
import { seedDemoAccounts } from './services/accountService';
import { seedDemoChannels } from './services/channelService';
import { seedDefaultThirdParty } from './services/pushService';
import { authRouter } from './routes/auth';
import { accountsRouter } from './routes/accounts';
import { channelsRouter } from './routes/channels';
import { leadsRouter } from './routes/leads';
import { thirdPartyRouter, settingsRouter } from './routes/thirdParty';
import { statsRouter } from './routes/stats';
import { wechatRouter } from './routes/wechat';
import { h5Router } from './routes/h5';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4780;

initDb(process.env.ADMIN_USERNAME ?? 'admin', process.env.ADMIN_PASSWORD ?? 'admin123');
seedDemoAccounts();
void seedDemoChannels();
seedDefaultThirdParty();

app.disable('x-powered-by');
app.use(express.json());

app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

app.options('*', (_req, res) => res.sendStatus(204));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', demo_mode: process.env.DEMO_MODE === 'true' });
});

app.use('/api/auth', authRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/channels', channelsRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/third-party', thirdPartyRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/wechat', wechatRouter);
app.use('/api/h5', h5Router);

const webDist = path.join(__dirname, '../../web/dist');
app.use(express.static(webDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(webDist, 'index.html'), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`WeChat Lead Hub API listening on http://localhost:${PORT}`);
  console.log(`Demo mode: ${process.env.DEMO_MODE === 'true' ? 'ON' : 'OFF'}`);
  console.log(`Admin login: ${process.env.ADMIN_USERNAME ?? 'admin'} / ${process.env.ADMIN_PASSWORD ?? 'admin123'}`);
});
