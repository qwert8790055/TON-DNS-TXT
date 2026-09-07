import { Response } from 'express';

export function sendInternalError(res: Response): void {
  res.status(500).json({ error: 'Internal server error' });
}
