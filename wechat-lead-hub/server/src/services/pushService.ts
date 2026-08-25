import axios from 'axios';
import { getDb } from '../db';
import { signPayload } from '../utils/crypto';
import { getLeadById, updateLeadStatus } from './leadService';
import type { ThirdPartyConfig } from '../types';

export function getActiveThirdPartyConfig(): ThirdPartyConfig | undefined {
  return getDb()
    .prepare('SELECT * FROM third_party_configs WHERE enabled = 1 ORDER BY id DESC LIMIT 1')
    .get() as ThirdPartyConfig | undefined;
}

export function listThirdPartyConfigs(): ThirdPartyConfig[] {
  return getDb()
    .prepare('SELECT * FROM third_party_configs ORDER BY id DESC')
    .all() as ThirdPartyConfig[];
}

export function upsertThirdPartyConfig(data: {
  id?: number;
  name: string;
  mode: 'api' | 'redirect' | 'manual';
  api_url?: string;
  api_key?: string;
  redirect_url_template?: string;
  callback_secret?: string;
  retry_count?: number;
  enabled?: number;
}): ThirdPartyConfig {
  if (data.id) {
    getDb()
      .prepare(
        `UPDATE third_party_configs SET name = ?, mode = ?, api_url = ?, api_key = ?,
         redirect_url_template = ?, callback_secret = ?, retry_count = ?, enabled = ? WHERE id = ?`,
      )
      .run(
        data.name,
        data.mode,
        data.api_url ?? null,
        data.api_key ?? null,
        data.redirect_url_template ?? null,
        data.callback_secret ?? null,
        data.retry_count ?? 3,
        data.enabled ?? 1,
        data.id,
      );
    return getDb().prepare('SELECT * FROM third_party_configs WHERE id = ?').get(data.id) as ThirdPartyConfig;
  }

  const result = getDb()
    .prepare(
      `INSERT INTO third_party_configs (name, mode, api_url, api_key, redirect_url_template, callback_secret, retry_count, enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      data.name,
      data.mode,
      data.api_url ?? null,
      data.api_key ?? null,
      data.redirect_url_template ?? null,
      data.callback_secret ?? null,
      data.retry_count ?? 3,
      data.enabled ?? 1,
    );

  return getDb()
    .prepare('SELECT * FROM third_party_configs WHERE id = ?')
    .get(result.lastInsertRowid) as ThirdPartyConfig;
}

function buildRedirectUrl(config: ThirdPartyConfig, lead: ReturnType<typeof getLeadById>): string {
  const template =
    config.redirect_url_template ??
    'https://example-third-party.com/register?lead_id={lead_uuid}&mobile={mobile}&channel={channel_code}';

  const payload = {
    lead_uuid: lead!.lead_uuid,
    mobile: lead!.mobile ?? '',
    channel_code: lead!.channel_code ?? '',
    openid: lead!.openid,
    agent_name: lead!.agent_name ?? '',
    team_name: lead!.team_name ?? '',
    account_type: lead!.account_type,
  };

  let url = template;
  for (const [key, value] of Object.entries(payload)) {
    url = url.replace(new RegExp(`\\{${key}\\}`, 'g'), encodeURIComponent(String(value)));
  }

  if (config.callback_secret) {
    const sign = signPayload(payload, config.callback_secret);
    url += (url.includes('?') ? '&' : '?') + `sign=${sign}`;
  }

  return url;
}

export async function pushLeadToThirdParty(leadId: number, manual = false): Promise<void> {
  const lead = getLeadById(leadId);
  if (!lead) throw new Error('Lead not found');

  const config = getActiveThirdPartyConfig();
  if (!config) {
    updateLeadStatus(leadId, 'push_failed', '未配置三方平台');
    return;
  }

  if (config.mode === 'manual' && !manual) {
    updateLeadStatus(leadId, 'captured', '等待人工导出');
    return;
  }

  updateLeadStatus(leadId, 'pushing');

  const payload = {
    lead_id: lead.lead_uuid,
    mobile: lead.mobile,
    openid: lead.openid,
    channel_code: lead.channel_code,
    agent_name: lead.agent_name,
    team_name: lead.team_name,
    account_type: lead.account_type,
    subscribed_at: lead.subscribed_at,
    captured_at: lead.captured_at,
  };

  const maxAttempts = manual ? 1 : config.retry_count;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (config.mode === 'api') {
        if (!config.api_url) throw new Error('API URL not configured');

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (config.api_key) headers['Authorization'] = `Bearer ${config.api_key}`;

        const res = await axios.post(config.api_url, payload, {
          headers,
          timeout: 10000,
          validateStatus: () => true,
        });

        getDb()
          .prepare(
            'INSERT INTO push_logs (lead_id, attempt, status, request_body, response_body) VALUES (?, ?, ?, ?, ?)',
          )
          .run(leadId, attempt, res.status < 300 ? 'success' : 'failed', JSON.stringify(payload), JSON.stringify(res.data));

        if (res.status >= 300) {
          throw new Error(`API returned ${res.status}`);
        }

        const thirdId = (res.data?.third_lead_id ?? res.data?.id ?? '') as string;
        updateLeadStatus(leadId, 'pushed', undefined, thirdId || undefined);
        return;
      }

      if (config.mode === 'redirect') {
        updateLeadStatus(leadId, 'redirected');
        getDb()
          .prepare(
            'INSERT INTO push_logs (lead_id, attempt, status, request_body, response_body) VALUES (?, ?, ?, ?, ?)',
          )
          .run(
            leadId,
            attempt,
            'redirect_ready',
            JSON.stringify(payload),
            JSON.stringify({ redirect_url: buildRedirectUrl(config, lead) }),
          );
        return;
      }

      updateLeadStatus(leadId, 'captured', '人工导出模式');
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      getDb()
        .prepare(
          'INSERT INTO push_logs (lead_id, attempt, status, request_body, response_body) VALUES (?, ?, ?, ?, ?)',
        )
        .run(leadId, attempt, 'failed', JSON.stringify(payload), message);

      if (attempt === maxAttempts) {
        updateLeadStatus(leadId, 'push_failed', message);
      } else {
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }
  }
}

export function getRedirectUrlForLead(leadUuid: string): string | null {
  const lead = getDb().prepare('SELECT * FROM leads WHERE lead_uuid = ?').get(leadUuid) as
    | ReturnType<typeof getLeadById>
    | undefined;
  const config = getActiveThirdPartyConfig();
  if (!lead || !config || config.mode !== 'redirect') return null;
  return buildRedirectUrl(config, lead);
}

export function handleThirdPartyCallback(body: {
  lead_id: string;
  third_lead_id?: string;
  status?: string;
  sign?: string;
}): boolean {
  const config = getActiveThirdPartyConfig();
  if (!config?.callback_secret) return false;

  const { sign, ...rest } = body;
  const expected = signPayload(rest, config.callback_secret);
  if (sign !== expected) return false;

  const lead = getDb().prepare('SELECT * FROM leads WHERE lead_uuid = ?').get(body.lead_id) as
    | ReturnType<typeof getLeadById>
    | undefined;
  if (!lead) return false;

  if (body.status === 'success') {
    updateLeadStatus(lead.id, 'pushed', undefined, body.third_lead_id);
  } else {
    updateLeadStatus(lead.id, 'push_failed', body.status ?? 'callback failed');
  }
  return true;
}

export function listPushLogs(leadId?: number): unknown[] {
  if (leadId) {
    return getDb()
      .prepare('SELECT * FROM push_logs WHERE lead_id = ? ORDER BY id DESC')
      .all(leadId);
  }
  return getDb()
    .prepare(
      `SELECT p.*, l.lead_uuid, l.mobile FROM push_logs p
       JOIN leads l ON l.id = p.lead_id ORDER BY p.id DESC LIMIT 200`,
    )
    .all();
}

export function seedDefaultThirdParty(): void {
  const count = getDb().prepare('SELECT COUNT(*) as c FROM third_party_configs').get() as { c: number };
  if (count.c > 0) return;

  upsertThirdPartyConfig({
    name: '默认三方（跳转模式）',
    mode: 'redirect',
    redirect_url_template:
      'https://example-third-party.com/register?lead_id={lead_uuid}&mobile={mobile}&channel={channel_code}&agent={agent_name}',
    callback_secret: 'demo_callback_secret',
    retry_count: 3,
    enabled: 1,
  });
}
