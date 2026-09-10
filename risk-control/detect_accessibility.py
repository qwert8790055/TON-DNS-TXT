#!/usr/bin/env python3
"""
Scan connected ADB devices for enabled accessibility services.
Writes results to risk_control.db (devices + accessibility_services tables).

Usage:
    python detect_accessibility.py [--db PATH] [--device-id PREFIX]
"""

import argparse
import re
import sqlite3
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

# Known suspicious patterns (Vietnam banking malware / overlay attacks)
SUSPICIOUS_PACKAGES = {
    'com.android.vending.billing': ('Fake Play Billing', 40),
    'com.google.android.apps.authenticator2.fake': ('Fake Authenticator', 50),
    'com.teamviewer.host.market': ('Remote Access (TeamViewer)', 30),
    'com.anydesk.anydeskandroid': ('Remote Access (AnyDesk)', 30),
    'com.sand.airdroid': ('Remote Access (AirDroid)', 25),
    'io.kodular.*': ('Kodular-built app (often abused)', 35),
}

SUSPICIOUS_KEYWORDS = [
    'accessibility', 'overlay', 'screen', 'capture', 'keylog',
    'remote', 'control', 'spy', 'hack', 'inject', 'bank', 'otp',
    'sms', 'forward', 'stealer',
]


def run_adb(args: list[str], serial: str | None = None) -> str:
    cmd = ['adb']
    if serial:
        cmd.extend(['-s', serial])
    cmd.extend(args)
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        if result.returncode != 0:
            return ''
        return result.stdout.strip()
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return ''


def list_devices() -> list[str]:
    output = run_adb(['devices'])
    serials = []
    for line in output.splitlines()[1:]:
        parts = line.split()
        if len(parts) >= 2 and parts[1] == 'device':
            serials.append(parts[0])
    return serials


def get_prop(serial: str, prop: str) -> str:
    return run_adb(['shell', 'getprop', prop], serial)


def get_enabled_accessibility(serial: str) -> list[tuple[str, str]]:
    raw = run_adb(['shell', 'settings', 'get', 'secure', 'enabled_accessibility_services'], serial)
    if not raw or raw in ('null', 'None', ''):
        return []

    services = []
    for entry in raw.split(':'):
        entry = entry.strip()
        if not entry:
            continue
        if '/' in entry:
            package, service = entry.split('/', 1)
        else:
            package, service = entry, entry
        services.append((package.strip(), service.strip()))
    return services


def match_suspicious(package: str, service: str) -> tuple[bool, int, str]:
    combined = f'{package}/{service}'.lower()
    for pattern, (label, weight) in SUSPICIOUS_PACKAGES.items():
        if '*' in pattern:
            regex = pattern.replace('.', r'\.').replace('*', '.*')
            if re.search(regex, package, re.IGNORECASE):
                return True, weight, label
        elif package.lower() == pattern.lower():
            return True, weight, label

    for kw in SUSPICIOUS_KEYWORDS:
        if kw in combined:
            return True, 20, f'Suspicious keyword: {kw}'

    return False, 0, ''


def ensure_schema(conn: sqlite3.Connection) -> None:
    schema_path = Path(__file__).parent / 'schema.sql'
    if schema_path.exists():
        conn.executescript(schema_path.read_text(encoding='utf-8'))
    conn.commit()


def upsert_device(conn: sqlite3.Connection, device_id: str, serial: str) -> None:
    model = get_prop(serial, 'ro.product.model') or 'Unknown'
    android = get_prop(serial, 'ro.build.version.release') or 'Unknown'
    now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')

    conn.execute(
        '''INSERT INTO devices (device_id, model, android_version, adb_serial, last_seen)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(device_id) DO UPDATE SET
             model = excluded.model,
             android_version = excluded.android_version,
             adb_serial = excluded.adb_serial,
             last_seen = excluded.last_seen''',
        (device_id, model, android, serial, now),
    )


def clear_accessibility(conn: sqlite3.Connection, device_id: str) -> None:
    conn.execute('DELETE FROM accessibility_services WHERE device_id = ?', (device_id,))


def insert_accessibility(
    conn: sqlite3.Connection,
    device_id: str,
    package: str,
    service: str,
    is_suspicious: bool,
    weight: int,
) -> None:
    now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
    conn.execute(
        '''INSERT INTO accessibility_services
           (device_id, service_name, package_name, is_enabled, is_suspicious, risk_weight, reported_at)
           VALUES (?, ?, ?, 1, ?, ?, ?)''',
        (device_id, service, package, 1 if is_suspicious else 0, weight, now),
    )


def update_device_risk(conn: sqlite3.Connection, device_id: str) -> None:
    row = conn.execute(
        'SELECT COALESCE(SUM(risk_weight), 0) AS w FROM accessibility_services WHERE device_id = ? AND is_suspicious = 1',
        (device_id,),
    ).fetchone()
    access_risk = min(int(row[0]), 100)

    tx_row = conn.execute(
        'SELECT COALESCE(MAX(risk_score), 0) FROM transactions WHERE device_id = ?',
        (device_id,),
    ).fetchone()
    tx_risk = int(tx_row[0])
    score = min(max(access_risk, tx_risk), 100)

    if score >= 70:
        level = 'critical'
    elif score >= 50:
        level = 'high'
    elif score >= 30:
        level = 'medium'
    else:
        level = 'low'

    conn.execute(
        'UPDATE devices SET risk_score = ?, risk_level = ? WHERE device_id = ?',
        (score, level, device_id),
    )


def scan_device(conn: sqlite3.Connection, serial: str, device_id: str) -> dict:
    upsert_device(conn, device_id, serial)
    clear_accessibility(conn, device_id)

    services = get_enabled_accessibility(serial)
    suspicious_count = 0
    results = []

    for package, service in services:
        is_suspicious, weight, label = match_suspicious(package, service)
        if is_suspicious:
            suspicious_count += 1
        insert_accessibility(conn, device_id, package, service, is_suspicious, weight)
        results.append({
            'package': package,
            'service': service,
            'is_suspicious': is_suspicious,
            'risk_weight': weight,
            'label': label if is_suspicious else None,
        })

    update_device_risk(conn, device_id)
    conn.commit()

    return {
        'device_id': device_id,
        'adb_serial': serial,
        'services_found': len(services),
        'suspicious_count': suspicious_count,
        'services': results,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description='Detect accessibility services via ADB')
    parser.add_argument('--db', default=str(Path(__file__).parent / 'risk_control.db'))
    parser.add_argument('--device-id', default='dev', help='Prefix for generated device IDs')
    args = parser.parse_args()

    db_path = Path(args.db)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    ensure_schema(conn)

    serials = list_devices()
    if not serials:
        print('No ADB devices found. Connect a device or start an emulator.', file=sys.stderr)
        # Seed demo data when no device is available (for testing)
        demo_id = f'{args.device_id}_001'
        upsert_device(conn, demo_id, 'emulator-demo')
        clear_accessibility(conn, demo_id)
        insert_accessibility(conn, demo_id, 'com.malware.overlay', 'OverlayService', True, 40)
        insert_accessibility(conn, demo_id, 'com.android.settings', 'AccessibilityMenuService', False, 0)
        update_device_risk(conn, demo_id)
        conn.commit()
        print(f'Demo mode: seeded device {demo_id} with sample accessibility data.')
        conn.close()
        return 0

    print(f'Found {len(serials)} device(s)')
    for i, serial in enumerate(serials, 1):
        device_id = f'{args.device_id}_{i:03d}'
        result = scan_device(conn, serial, device_id)
        print(f'  [{device_id}] {result["services_found"]} service(s), {result["suspicious_count"]} suspicious')

    conn.close()
    return 0


if __name__ == '__main__':
    sys.exit(main())
