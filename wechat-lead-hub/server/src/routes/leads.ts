import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { exportLeads, getLeadById, listLeads } from '../services/leadService';
import { pushLeadToThirdParty } from '../services/pushService';

export const leadsRouter = Router();
leadsRouter.use(authMiddleware);

leadsRouter.get('/', (req, res) => {
  const result = listLeads({
    status: req.query.status as string | undefined,
    channel_code: req.query.channel_code as string | undefined,
    account_id: req.query.account_id ? Number(req.query.account_id) : undefined,
    mobile: req.query.mobile as string | undefined,
    page: req.query.page ? Number(req.query.page) : 1,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : 20,
  });
  res.json(result);
});

leadsRouter.get('/export', (req, res) => {
  const items = exportLeads({
    status: req.query.status as string | undefined,
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
  });

  const header = 'lead_uuid,mobile,name,channel_code,agent_name,team_name,status,subscribed_at,captured_at,pushed_at\n';
  const rows = items
    .map((l) =>
      [
        l.lead_uuid,
        l.mobile ?? '',
        l.name ?? '',
        l.channel_code ?? '',
        l.agent_name ?? '',
        l.team_name ?? '',
        l.status,
        l.subscribed_at,
        l.captured_at ?? '',
        l.pushed_at ?? '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    )
    .join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=leads-export.csv');
  res.send('\ufeff' + header + rows);
});

leadsRouter.get('/:id', (req, res) => {
  const lead = getLeadById(Number(req.params.id));
  if (!lead) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(lead);
});

leadsRouter.post('/:id/push', async (req, res) => {
  try {
    await pushLeadToThirdParty(Number(req.params.id), true);
    const lead = getLeadById(Number(req.params.id));
    res.json(lead);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Push failed' });
  }
});
