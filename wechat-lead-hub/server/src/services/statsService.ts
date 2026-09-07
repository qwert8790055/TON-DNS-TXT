import { getDb } from '../db';

export interface DashboardStats {
  total_leads: number;
  subscribed: number;
  captured: number;
  pushed: number;
  push_failed: number;
  duplicate: number;
  conversion_rate: number;
  push_success_rate: number;
  by_channel: Array<{
    channel_code: string;
    agent_name: string | null;
    team_name: string | null;
    total: number;
    captured: number;
    pushed: number;
  }>;
  by_account: Array<{
    account_id: number;
    account_type: string;
    total: number;
    captured: number;
    pushed: number;
  }>;
  daily: Array<{ date: string; subscribed: number; captured: number; pushed: number }>;
}

export function getDashboardStats(days = 7): DashboardStats {
  const db = getDb();

  const totals = db
    .prepare(
      `SELECT
        COUNT(*) as total_leads,
        SUM(CASE WHEN status = 'subscribed' THEN 1 ELSE 0 END) as subscribed,
        SUM(CASE WHEN status = 'captured' THEN 1 ELSE 0 END) as captured,
        SUM(CASE WHEN status IN ('pushed', 'redirected') THEN 1 ELSE 0 END) as pushed,
        SUM(CASE WHEN status = 'push_failed' THEN 1 ELSE 0 END) as push_failed,
        SUM(CASE WHEN status = 'duplicate' THEN 1 ELSE 0 END) as duplicate
       FROM leads`,
    )
    .get() as DashboardStats;

  const capturedCount = Number(totals.captured) + Number(totals.pushed) + Number(totals.push_failed);
  const pushedCount = Number(totals.pushed);
  totals.conversion_rate =
    Number(totals.total_leads) > 0 ? Math.round((capturedCount / Number(totals.total_leads)) * 1000) / 10 : 0;
  totals.push_success_rate =
    capturedCount > 0 ? Math.round((pushedCount / capturedCount) * 1000) / 10 : 0;

  totals.by_channel = db
    .prepare(
      `SELECT
        COALESCE(channel_code, 'unknown') as channel_code,
        agent_name, team_name,
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('captured', 'pushing', 'pushed', 'redirected', 'push_failed') THEN 1 ELSE 0 END) as captured,
        SUM(CASE WHEN status IN ('pushed', 'redirected') THEN 1 ELSE 0 END) as pushed
       FROM leads GROUP BY channel_code, agent_name, team_name ORDER BY total DESC`,
    )
    .all() as DashboardStats['by_channel'];

  totals.by_account = db
    .prepare(
      `SELECT
        account_id, account_type,
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('captured', 'pushing', 'pushed', 'redirected', 'push_failed') THEN 1 ELSE 0 END) as captured,
        SUM(CASE WHEN status IN ('pushed', 'redirected') THEN 1 ELSE 0 END) as pushed
       FROM leads GROUP BY account_id, account_type`,
    )
    .all() as DashboardStats['by_account'];

  totals.daily = db
    .prepare(
      `SELECT date(subscribed_at) as date,
        COUNT(*) as subscribed,
        SUM(CASE WHEN captured_at IS NOT NULL THEN 1 ELSE 0 END) as captured,
        SUM(CASE WHEN pushed_at IS NOT NULL THEN 1 ELSE 0 END) as pushed
       FROM leads
       WHERE subscribed_at >= datetime('now', ?)
       GROUP BY date(subscribed_at) ORDER BY date ASC`,
    )
    .all(`-${days} days`) as DashboardStats['daily'];

  return totals;
}
