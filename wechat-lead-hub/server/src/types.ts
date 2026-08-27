export type AccountType = 'service' | 'subscribe';

export type LeadStatus =
  | 'subscribed'
  | 'captured'
  | 'pushing'
  | 'pushed'
  | 'push_failed'
  | 'duplicate'
  | 'redirected';

export type PushMode = 'api' | 'redirect' | 'manual';

export interface WechatAccount {
  id: number;
  name: string;
  app_id: string;
  app_secret: string;
  account_type: AccountType;
  token: string;
  encoding_aes_key: string | null;
  welcome_text: string;
  enabled: number;
  created_at: string;
}

export interface Channel {
  id: number;
  name: string;
  code: string;
  account_id: number;
  agent_name: string | null;
  team_name: string | null;
  qrcode_url: string | null;
  ticket: string | null;
  enabled: number;
  created_at: string;
}

export interface Lead {
  id: number;
  lead_uuid: string;
  openid: string;
  unionid: string | null;
  mobile: string | null;
  name: string | null;
  account_id: number;
  channel_id: number | null;
  account_type: AccountType;
  channel_code: string | null;
  agent_name: string | null;
  team_name: string | null;
  status: LeadStatus;
  third_lead_id: string | null;
  fail_reason: string | null;
  subscribed_at: string;
  captured_at: string | null;
  pushed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ThirdPartyConfig {
  id: number;
  name: string;
  mode: PushMode;
  api_url: string | null;
  api_key: string | null;
  redirect_url_template: string | null;
  callback_secret: string | null;
  retry_count: number;
  enabled: number;
  created_at: string;
}
