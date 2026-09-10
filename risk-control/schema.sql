-- Risk Control SQLite Schema
-- Run: sqlite3 risk_control.db < schema.sql

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS devices (
    device_id       TEXT PRIMARY KEY,
    model           TEXT,
    android_version TEXT,
    adb_serial      TEXT,
    risk_score      INTEGER NOT NULL DEFAULT 0,
    risk_level      TEXT NOT NULL DEFAULT 'low',
    last_seen       TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transactions (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id         TEXT NOT NULL,
    user_id           TEXT,
    amount            INTEGER NOT NULL,
    currency          TEXT NOT NULL DEFAULT 'VND',
    tx_type           TEXT,
    recipient_account TEXT,
    recipient_name    TEXT,
    recipient_bank    TEXT,
    is_new_recipient  INTEGER NOT NULL DEFAULT 0,
    tx_time           TEXT,
    risk_score        INTEGER NOT NULL DEFAULT 0,
    risk_level        TEXT NOT NULL DEFAULT 'low',
    risk_flags        TEXT,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (device_id) REFERENCES devices(device_id)
);

CREATE TABLE IF NOT EXISTS accessibility_services (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id     TEXT NOT NULL,
    service_name  TEXT,
    package_name  TEXT,
    is_enabled    INTEGER NOT NULL DEFAULT 1,
    is_suspicious INTEGER NOT NULL DEFAULT 0,
    risk_weight   INTEGER NOT NULL DEFAULT 0,
    reported_at   TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (device_id) REFERENCES devices(device_id)
);

CREATE TABLE IF NOT EXISTS risk_rules (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_key        TEXT UNIQUE NOT NULL,
    name            TEXT NOT NULL,
    name_vi         TEXT,
    description     TEXT,
    weight          INTEGER NOT NULL DEFAULT 10,
    threshold_value INTEGER,
    enabled         INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_tx_device ON transactions(device_id);
CREATE INDEX IF NOT EXISTS idx_tx_time ON transactions(tx_time DESC);
CREATE INDEX IF NOT EXISTS idx_access_device ON accessibility_services(device_id);
CREATE INDEX IF NOT EXISTS idx_access_reported ON accessibility_services(reported_at DESC);

-- Default risk rules
INSERT OR IGNORE INTO risk_rules (rule_key, name, name_vi, description, weight, threshold_value, enabled) VALUES
    ('high_amount',       'High Amount Transfer',       'Chuyển khoản số tiền lớn',       'Amount exceeds threshold (VND)',           25,  50000000,  1),
    ('very_high_amount',  'Very High Amount Transfer',  'Chuyển khoản số tiền rất lớn',   'Amount exceeds very high threshold (VND)', 40, 200000000, 1),
    ('new_recipient',     'New Recipient',              'Người nhận mới',                 'First-time transfer to recipient',         20,  NULL,      1),
    ('suspicious_access', 'Suspicious Accessibility',   'Dịch vụ trợ năng đáng ngờ',     'Device has suspicious accessibility svc',  35,  NULL,      1),
    ('night_transfer',    'Night Transfer',             'Giao dịch ban đêm',              'Transfer between 22:00-05:00',             15,  NULL,      1),
    ('domestic_transfer', 'Domestic Transfer',          'Chuyển khoản nội địa',           'Domestic bank transfer type',              10,  NULL,      1);
