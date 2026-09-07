import { getDb } from '../db';
import { createChannelQrcode } from '../wechat/api';
import { getAccountById } from './accountService';
import type { Channel } from '../types';

export function listChannels(): Channel[] {
  return getDb()
    .prepare(
      `SELECT c.*, a.name as account_name, a.account_type
       FROM channels c
       JOIN wechat_accounts a ON a.id = c.account_id
       ORDER BY c.id DESC`,
    )
    .all() as Channel[];
}

export function getChannelByCode(code: string): (Channel & { account_name?: string }) | undefined {
  return getDb()
    .prepare('SELECT * FROM channels WHERE code = ? AND enabled = 1')
    .get(code) as Channel | undefined;
}

export function getChannelById(id: number): Channel | undefined {
  return getDb().prepare('SELECT * FROM channels WHERE id = ?').get(id) as Channel | undefined;
}

export async function createChannel(data: {
  name: string;
  code: string;
  account_id: number;
  agent_name?: string;
  team_name?: string;
}): Promise<Channel> {
  const account = getAccountById(data.account_id);
  if (!account) throw new Error('Account not found');

  const qr = await createChannelQrcode(account, data.code);

  const result = getDb()
    .prepare(
      `INSERT INTO channels (name, code, account_id, agent_name, team_name, qrcode_url, ticket)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      data.name,
      data.code,
      data.account_id,
      data.agent_name ?? null,
      data.team_name ?? null,
      qr.url,
      qr.ticket,
    );

  return getChannelById(result.lastInsertRowid as number)!;
}

export async function refreshChannelQrcode(id: number): Promise<Channel | undefined> {
  const channel = getChannelById(id);
  if (!channel) return undefined;

  const account = getAccountById(channel.account_id);
  if (!account) throw new Error('Account not found');

  const qr = await createChannelQrcode(account, channel.code);
  getDb()
    .prepare('UPDATE channels SET qrcode_url = ?, ticket = ? WHERE id = ?')
    .run(qr.url, qr.ticket, id);

  return getChannelById(id);
}

export function updateChannel(
  id: number,
  data: Partial<{ name: string; agent_name: string; team_name: string; enabled: number }>,
): Channel | undefined {
  const existing = getChannelById(id);
  if (!existing) return undefined;

  getDb()
    .prepare(
      'UPDATE channels SET name = ?, agent_name = ?, team_name = ?, enabled = ? WHERE id = ?',
    )
    .run(
      data.name ?? existing.name,
      data.agent_name ?? existing.agent_name,
      data.team_name ?? existing.team_name,
      data.enabled ?? existing.enabled,
      id,
    );

  return getChannelById(id);
}

export function deleteChannel(id: number): boolean {
  const result = getDb().prepare('DELETE FROM channels WHERE id = ?').run(id);
  return result.changes > 0;
}

export async function seedDemoChannels(): Promise<void> {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as c FROM channels').get() as { c: number };
  if (count.c > 0) return;

  const accounts = db.prepare('SELECT id, account_type FROM wechat_accounts').all() as {
    id: number;
    account_type: string;
  }[];

  for (const acc of accounts) {
    await createChannel({
      name: `${acc.account_type === 'service' ? '服务号' : '订阅号'}-坐席A`,
      code: `${acc.account_type}_agent_a`,
      account_id: acc.id,
      agent_name: '坐席A',
      team_name: '一组',
    });
    await createChannel({
      name: `${acc.account_type === 'service' ? '服务号' : '订阅号'}-坐席B`,
      code: `${acc.account_type}_agent_b`,
      account_id: acc.id,
      agent_name: '坐席B',
      team_name: '二组',
    });
  }
}
