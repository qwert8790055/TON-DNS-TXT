import axios from 'axios';
import { getDb } from '../db';
import type { WechatAccount } from '../types';

export async function getAccessToken(account: WechatAccount): Promise<string> {
  const db = getDb();
  const cached = db
    .prepare('SELECT access_token, expires_at FROM access_token_cache WHERE app_id = ?')
    .get(account.app_id) as { access_token: string; expires_at: number } | undefined;

  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.expires_at > now + 60) {
    return cached.access_token;
  }

  if (process.env.DEMO_MODE === 'true' && account.app_id.startsWith('demo_')) {
    const token = `demo_token_${account.app_id}`;
    db.prepare(
      'INSERT INTO access_token_cache (app_id, access_token, expires_at) VALUES (?, ?, ?) ON CONFLICT(app_id) DO UPDATE SET access_token = excluded.access_token, expires_at = excluded.expires_at',
    ).run(account.app_id, token, now + 7200);
    return token;
  }

  const res = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
    params: {
      grant_type: 'client_credential',
      appid: account.app_id,
      secret: account.app_secret,
    },
  });

  if (res.data.errcode) {
    throw new Error(`WeChat token error: ${res.data.errmsg}`);
  }

  const expiresAt = now + (res.data.expires_in as number) - 120;
  db.prepare(
    'INSERT INTO access_token_cache (app_id, access_token, expires_at) VALUES (?, ?, ?) ON CONFLICT(app_id) DO UPDATE SET access_token = excluded.access_token, expires_at = excluded.expires_at',
  ).run(account.app_id, res.data.access_token, expiresAt);

  return res.data.access_token as string;
}

export async function createChannelQrcode(
  account: WechatAccount,
  sceneStr: string,
): Promise<{ ticket: string; url: string }> {
  const token = await getAccessToken(account);

  if (process.env.DEMO_MODE === 'true' && account.app_id.startsWith('demo_')) {
    const ticket = `demo_ticket_${sceneStr}_${Date.now()}`;
    return {
      ticket,
      url: `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURIComponent(ticket)}`,
    };
  }

  const res = await axios.post(
    `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${token}`,
    {
      action_name: 'QR_STR_SCENE',
      action_info: { scene: { scene_str: sceneStr } },
    },
  );

  if (res.data.errcode) {
    throw new Error(`QR code error: ${res.data.errmsg}`);
  }

  const ticket = res.data.ticket as string;
  return {
    ticket,
    url: `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURIComponent(ticket)}`,
  };
}

export async function getOAuthAccessToken(
  account: WechatAccount,
  code: string,
): Promise<{ openid: string; access_token: string; unionid?: string }> {
  if (process.env.DEMO_MODE === 'true' && account.app_id.startsWith('demo_')) {
    return {
      openid: `demo_openid_${code}`,
      access_token: 'demo_oauth_token',
      unionid: `demo_union_${code}`,
    };
  }

  const res = await axios.get('https://api.weixin.qq.com/sns/oauth2/access_token', {
    params: {
      appid: account.app_id,
      secret: account.app_secret,
      code,
      grant_type: 'authorization_code',
    },
  });

  if (res.data.errcode) {
    throw new Error(`OAuth error: ${res.data.errmsg}`);
  }

  return {
    openid: res.data.openid,
    access_token: res.data.access_token,
    unionid: res.data.unionid,
  };
}

export function buildOAuthUrl(account: WechatAccount, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    appid: account.app_id,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'snsapi_userinfo',
    state,
  });
  return `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`;
}
