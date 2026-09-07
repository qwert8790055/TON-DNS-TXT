import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getSetting, setSetting } from '../db';
import {
  handleThirdPartyCallback,
  listPushLogs,
  listThirdPartyConfigs,
  upsertThirdPartyConfig,
} from '../services/pushService';

export const thirdPartyRouter = Router();

thirdPartyRouter.post('/callback', (req, res) => {
  const ok = handleThirdPartyCallback(req.body);
  res.json({ success: ok });
});

thirdPartyRouter.use(authMiddleware);

thirdPartyRouter.get('/configs', (_req, res) => {
  res.json(listThirdPartyConfigs());
});

thirdPartyRouter.post('/configs', (req, res) => {
  try {
    const config = upsertThirdPartyConfig(req.body);
    res.status(201).json(config);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Save failed' });
  }
});

thirdPartyRouter.put('/configs/:id', (req, res) => {
  try {
    const config = upsertThirdPartyConfig({ ...req.body, id: Number(req.params.id) });
    res.json(config);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Update failed' });
  }
});

thirdPartyRouter.get('/push-logs', (req, res) => {
  const leadId = req.query.lead_id ? Number(req.query.lead_id) : undefined;
  res.json(listPushLogs(leadId));
});

export const settingsRouter = Router();
settingsRouter.use(authMiddleware);

settingsRouter.get('/', (_req, res) => {
  res.json({
    dedup_hours: getSetting('dedup_hours', '24'),
    auto_push: getSetting('auto_push', '1'),
    require_mobile: getSetting('require_mobile', '1'),
  });
});

settingsRouter.put('/', (req, res) => {
  const { dedup_hours, auto_push, require_mobile } = req.body as Record<string, string>;
  if (dedup_hours !== undefined) setSetting('dedup_hours', String(dedup_hours));
  if (auto_push !== undefined) setSetting('auto_push', String(auto_push));
  if (require_mobile !== undefined) setSetting('require_mobile', String(require_mobile));
  res.json({ success: true });
});
