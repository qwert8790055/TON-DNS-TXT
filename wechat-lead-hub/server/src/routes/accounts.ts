import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  createAccount,
  deleteAccount,
  listAccounts,
  updateAccount,
} from '../services/accountService';

export const accountsRouter = Router();
accountsRouter.use(authMiddleware);

accountsRouter.get('/', (_req, res) => {
  res.json(listAccounts());
});

accountsRouter.post('/', (req, res) => {
  try {
    const account = createAccount(req.body);
    res.status(201).json(account);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Create failed' });
  }
});

accountsRouter.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const account = updateAccount(id, req.body);
  if (!account) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(account);
});

accountsRouter.delete('/:id', (req, res) => {
  const ok = deleteAccount(Number(req.params.id));
  res.status(ok ? 204 : 404).send();
});
