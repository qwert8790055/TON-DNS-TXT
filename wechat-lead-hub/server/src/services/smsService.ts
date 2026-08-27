import { getDb } from '../db';

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function sendSmsCode(mobile: string): { success: boolean; code?: string; message: string } {
  if (!/^1[3-9]\d{9}$/.test(mobile)) {
    return { success: false, message: '手机号格式不正确' };
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  getDb()
    .prepare('INSERT INTO sms_codes (mobile, code, expires_at) VALUES (?, ?, ?)')
    .run(mobile, code, expiresAt);

  if (process.env.SMS_PROVIDER === 'mock' || process.env.DEMO_MODE === 'true') {
    console.log(`[SMS Mock] ${mobile} => ${code}`);
    return { success: true, code, message: '验证码已发送（演示模式返回验证码）' };
  }

  // Production: integrate Aliyun/Tencent SMS here
  return { success: true, message: '验证码已发送' };
}

export function verifySmsCode(mobile: string, code: string): boolean {
  const row = getDb()
    .prepare(
      `SELECT * FROM sms_codes WHERE mobile = ? AND code = ? AND used = 0 AND expires_at > datetime('now') ORDER BY id DESC LIMIT 1`,
    )
    .get(mobile, code) as { id: number } | undefined;

  if (!row) return false;

  getDb().prepare('UPDATE sms_codes SET used = 1 WHERE id = ?').run(row.id);
  return true;
}
