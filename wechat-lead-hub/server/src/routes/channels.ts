import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  createChannel,
  deleteChannel,
  listChannels,
  refreshChannelQrcode,
  updateChannel,
} from '../services/channelService';

export const channelsRouter = Router();
channelsRouter.use(authMiddleware);

channelsRouter.get('/', (_req, res) => {
  res.json(listChannels());
});

channelsRouter.post('/', async (req, res) => {
  try {
    const channel = await createChannel(req.body);
    res.status(201).json(channel);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Create failed' });
  }
});

channelsRouter.post('/:id/refresh-qrcode', async (req, res) => {
  try {
    const channel = await refreshChannelQrcode(Number(req.params.id));
    if (!channel) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(channel);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Refresh failed' });
  }
});

channelsRouter.put('/:id', (req, res) => {
  const channel = updateChannel(Number(req.params.id), req.body);
  if (!channel) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(channel);
});

channelsRouter.delete('/:id', (req, res) => {
  const ok = deleteChannel(Number(req.params.id));
  res.status(ok ? 204 : 404).send();
});
