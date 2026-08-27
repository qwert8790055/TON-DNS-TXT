-- WeChat accounts (service + subscribe)
CREATE TABLE IF NOT EXISTS wechat_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  app_id TEXT NOT NULL UNIQUE,
  app_secret TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK(account_type IN ('service', 'subscribe')),
  token TEXT NOT NULL,
  encoding_aes_key TEXT,
  welcome_text TEXT DEFAULT '欢迎关注！请点击菜单完成服务开通。',
  enabled INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Channel codes for telemarketing agents/teams
CREATE TABLE IF NOT EXISTS channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  account_id INTEGER NOT NULL REFERENCES wechat_accounts(id),
  agent_name TEXT,
  team_name TEXT,
  qrcode_url TEXT,
  ticket TEXT,
  enabled INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Lead records
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_uuid TEXT NOT NULL UNIQUE,
  openid TEXT NOT NULL,
  unionid TEXT,
  mobile TEXT,
  name TEXT,
  account_id INTEGER NOT NULL REFERENCES wechat_accounts(id),
  channel_id INTEGER REFERENCES channels(id),
  account_type TEXT NOT NULL,
  channel_code TEXT,
  agent_name TEXT,
  team_name TEXT,
  status TEXT NOT NULL DEFAULT 'subscribed',
  third_lead_id TEXT,
  fail_reason TEXT,
  subscribed_at TEXT NOT NULL,
  captured_at TEXT,
  pushed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_openid ON leads(openid);
CREATE INDEX IF NOT EXISTS idx_leads_mobile ON leads(mobile);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_channel ON leads(channel_code);

-- Third-party integration config
CREATE TABLE IF NOT EXISTS third_party_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('api', 'redirect', 'manual')),
  api_url TEXT,
  api_key TEXT,
  redirect_url_template TEXT,
  callback_secret TEXT,
  retry_count INTEGER DEFAULT 3,
  enabled INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Push attempt logs
CREATE TABLE IF NOT EXISTS push_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL REFERENCES leads(id),
  attempt INTEGER NOT NULL,
  status TEXT NOT NULL,
  request_body TEXT,
  response_body TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Admin users
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- SMS verification codes
CREATE TABLE IF NOT EXISTS sms_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mobile TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sms_mobile ON sms_codes(mobile);

-- Access token cache per app
CREATE TABLE IF NOT EXISTS access_token_cache (
  app_id TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

-- Dedup settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO settings (key, value) VALUES ('dedup_hours', '24');
INSERT OR IGNORE INTO settings (key, value) VALUES ('auto_push', '1');
INSERT OR IGNORE INTO settings (key, value) VALUES ('require_mobile', '1');
