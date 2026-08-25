import { getDb } from '../db';
import type { WechatAccount } from '../types';

export function listAccounts(): WechatAccount[] {
  return getDb().prepare('SELECT * FROM wechat_accounts ORDER BY id DESC').all() as WechatAccount[];
}

export function getAccountById(id: number): WechatAccount | undefined {
  return getDb().prepare('SELECT * FROM wechat_accounts WHERE id = ?').get(id) as
    | WechatAccount
    | undefined;
}

export function getAccountByAppId(appId: string): WechatAccount | undefined {
  return getDb().prepare('SELECT * FROM wechat_accounts WHERE app_id = ? AND enabled = 1').get(appId) as
    | WechatAccount
    | undefined;
}

export function createAccount(data: {
  name: string;
  app_id: string;
  app_secret: string;
  account_type: 'service' | 'subscribe';
  token: string;
  encoding_aes_key?: string;
  welcome_text?: string;
}): WechatAccount {
  const result = getDb()
    .prepare(
      `INSERT INTO wechat_accounts (name, app_id, app_secret, account_type, token, encoding_aes_key, welcome_text)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      data.name,
      data.app_id,
      data.app_secret,
      data.account_type,
      data.token,
      data.encoding_aes_key ?? null,
      data.welcome_text ?? '欢迎关注！请点击下方链接完成服务开通。',
    );

  return getAccountById(result.lastInsertRowid as number)!;
}

export function updateAccount(
  id: number,
  data: Partial<{
    name: string;
    app_secret: string;
    token: string;
    encoding_aes_key: string;
    welcome_text: string;
    enabled: number;
  }>,
): WechatAccount | undefined {
  const existing = getAccountById(id);
  if (!existing) return undefined;

  getDb()
    .prepare(
      `UPDATE wechat_accounts SET
        name = ?, app_secret = ?, token = ?, encoding_aes_key = ?,
        welcome_text = ?, enabled = ?
       WHERE id = ?`,
    )
    .run(
      data.name ?? existing.name,
      data.app_secret ?? existing.app_secret,
      data.token ?? existing.token,
      data.encoding_aes_key ?? existing.encoding_aes_key,
      data.welcome_text ?? existing.welcome_text,
      data.enabled ?? existing.enabled,
      id,
    );

  return getAccountById(id);
}

export function deleteAccount(id: number): boolean {
  const result = getDb().prepare('DELETE FROM wechat_accounts WHERE id = ?').run(id);
  return result.changes > 0;
}

export function seedDemoAccounts(): void {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as c FROM wechat_accounts').get() as { c: number };
  if (count.c > 0) return;

  createAccount({
    name: '演示服务号',
    app_id: 'demo_service_001',
    app_secret: 'demo_secret_service',
    account_type: 'service',
    token: 'demo_token_service',
    welcome_text: '欢迎关注演示服务号！请完成手机号验证以开通专属服务。',
  });

  createAccount({
    name: '演示订阅号',
    app_id: 'demo_subscribe_001',
    app_secret: 'demo_secret_subscribe',
    account_type: 'subscribe',
    token: 'demo_token_subscribe',
    welcome_text: '欢迎关注演示订阅号！点击链接完成登记。',
  });
}
