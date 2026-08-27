import { v4 as uuidv4 } from 'uuid';
import { getDb, getSetting } from '../db';
import { pushLeadToThirdParty } from './pushService';
import type { Lead, LeadStatus, WechatAccount } from '../types';
import type { Channel } from '../types';

function nowIso(): string {
  return new Date().toISOString();
}

export function findRecentDuplicate(mobile: string | null, openid: string): Lead | undefined {
  const dedupHours = Number(getSetting('dedup_hours', '24'));
  const since = new Date(Date.now() - dedupHours * 3600 * 1000).toISOString();

  if (mobile) {
    const byMobile = getDb()
      .prepare(
        `SELECT * FROM leads WHERE mobile = ? AND status NOT IN ('duplicate') AND created_at >= ? ORDER BY id DESC LIMIT 1`,
      )
      .get(mobile, since) as Lead | undefined;
    if (byMobile) return byMobile;
  }

  return getDb()
    .prepare(
      `SELECT * FROM leads WHERE openid = ? AND status NOT IN ('duplicate') AND created_at >= ? ORDER BY id DESC LIMIT 1`,
    )
    .get(openid, since) as Lead | undefined;
}

export function createSubscribeLead(params: {
  openid: string;
  unionid?: string;
  account: WechatAccount;
  channel?: Channel;
  eventKey?: string;
}): Lead {
  const { openid, unionid, account, channel, eventKey } = params;

  let channelCode = channel?.code ?? null;
  if (!channelCode && eventKey) {
    const match = eventKey.replace(/^qrscene_/, '');
    channelCode = match || null;
  }

  let resolvedChannel = channel;
  if (!resolvedChannel && channelCode) {
    resolvedChannel = getDb()
      .prepare('SELECT * FROM channels WHERE code = ?')
      .get(channelCode) as Channel | undefined;
  }

  const duplicate = findRecentDuplicate(null, openid);
  if (duplicate) {
    const leadUuid = uuidv4();
    const result = getDb()
      .prepare(
        `INSERT INTO leads (lead_uuid, openid, unionid, account_id, channel_id, account_type, channel_code, agent_name, team_name, status, subscribed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'duplicate', ?)`,
      )
      .run(
        leadUuid,
        openid,
        unionid ?? null,
        account.id,
        resolvedChannel?.id ?? null,
        account.account_type,
        channelCode,
        resolvedChannel?.agent_name ?? null,
        resolvedChannel?.team_name ?? null,
        nowIso(),
      );
    return getLeadById(result.lastInsertRowid as number)!;
  }

  const leadUuid = uuidv4();
  const result = getDb()
    .prepare(
      `INSERT INTO leads (lead_uuid, openid, unionid, account_id, channel_id, account_type, channel_code, agent_name, team_name, status, subscribed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'subscribed', ?)`,
    )
    .run(
      leadUuid,
      openid,
      unionid ?? null,
      account.id,
      resolvedChannel?.id ?? null,
      account.account_type,
      channelCode,
      resolvedChannel?.agent_name ?? null,
      resolvedChannel?.team_name ?? null,
      nowIso(),
    );

  return getLeadById(result.lastInsertRowid as number)!;
}

export function getLeadById(id: number): Lead | undefined {
  return getDb().prepare('SELECT * FROM leads WHERE id = ?').get(id) as Lead | undefined;
}

export function getLeadByUuid(uuid: string): Lead | undefined {
  return getDb().prepare('SELECT * FROM leads WHERE lead_uuid = ?').get(uuid) as Lead | undefined;
}

export function listLeads(filters: {
  status?: string;
  channel_code?: string;
  account_id?: number;
  mobile?: string;
  page?: number;
  pageSize?: number;
}): { items: Lead[]; total: number } {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];

  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }
  if (filters.channel_code) {
    conditions.push('channel_code = ?');
    params.push(filters.channel_code);
  }
  if (filters.account_id) {
    conditions.push('account_id = ?');
    params.push(filters.account_id);
  }
  if (filters.mobile) {
    conditions.push('mobile LIKE ?');
    params.push(`%${filters.mobile}%`);
  }

  const where = conditions.join(' AND ');
  const total = (
    getDb().prepare(`SELECT COUNT(*) as c FROM leads WHERE ${where}`).get(...params) as { c: number }
  ).c;

  const items = getDb()
    .prepare(`SELECT * FROM leads WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset) as Lead[];

  return { items, total };
}

export function captureLead(params: {
  lead_uuid: string;
  mobile: string;
  name?: string;
}): Lead {
  const lead = getLeadByUuid(params.lead_uuid);
  if (!lead) throw new Error('Lead not found');

  const duplicate = findRecentDuplicate(params.mobile, lead.openid);
  if (duplicate && duplicate.id !== lead.id) {
    updateLeadStatus(lead.id, 'duplicate', '手机号重复');
    return getLeadById(lead.id)!;
  }

  getDb()
    .prepare(
      `UPDATE leads SET mobile = ?, name = ?, status = 'captured', captured_at = ?, updated_at = ? WHERE id = ?`,
    )
    .run(params.mobile, params.name ?? null, nowIso(), nowIso(), lead.id);

  const updated = getLeadById(lead.id)!;

  if (getSetting('auto_push', '1') === '1') {
    void pushLeadToThirdParty(updated.id);
  }

  return updated;
}

export function updateLeadStatus(
  id: number,
  status: LeadStatus,
  failReason?: string,
  thirdLeadId?: string,
): void {
  const fields: string[] = ['status = ?', 'updated_at = ?'];
  const params: unknown[] = [status, nowIso()];

  if (failReason !== undefined) {
    fields.push('fail_reason = ?');
    params.push(failReason);
  }
  if (thirdLeadId !== undefined) {
    fields.push('third_lead_id = ?');
    params.push(thirdLeadId);
  }
  if (status === 'pushed') {
    fields.push('pushed_at = ?');
    params.push(nowIso());
  }

  params.push(id);
  getDb().prepare(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`).run(...params);
}

export function exportLeads(filters: { status?: string; from?: string; to?: string }): Lead[] {
  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];

  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }
  if (filters.from) {
    conditions.push('created_at >= ?');
    params.push(filters.from);
  }
  if (filters.to) {
    conditions.push('created_at <= ?');
    params.push(filters.to);
  }

  return getDb()
    .prepare(`SELECT * FROM leads WHERE ${conditions.join(' AND ')} ORDER BY id DESC`)
    .all(...params) as Lead[];
}
