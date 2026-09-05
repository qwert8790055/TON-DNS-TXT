<?php
/**
 * Risk Control API
 * Endpoints:
 *   GET  ?action=dashboard
 *   POST ?action=report_transaction
 *   POST ?action=update_rule
 *   GET  ?action=rules
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$dbPath = __DIR__ . '/risk_control.db';

function getDb(string $dbPath): PDO
{
    if (!file_exists($dbPath)) {
        $schema = file_get_contents(__DIR__ . '/schema.sql');
        $db = new PDO('sqlite:' . $dbPath);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $db->exec($schema);
        return $db;
    }

    $db = new PDO('sqlite:' . $dbPath);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec('PRAGMA foreign_keys = ON');
    return $db;
}

function jsonResponse(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function jsonError(string $message, int $code = 400): void
{
    jsonResponse(['status' => 'error', 'message' => $message], $code);
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function riskLevelFromScore(int $score): string
{
    if ($score >= 70) {
        return 'critical';
    }
    if ($score >= 50) {
        return 'high';
    }
    if ($score >= 30) {
        return 'medium';
    }
    return 'low';
}

function ensureDevice(PDO $db, string $deviceId): void
{
    $stmt = $db->prepare('SELECT device_id FROM devices WHERE device_id = ?');
    $stmt->execute([$deviceId]);
    if (!$stmt->fetch()) {
        $insert = $db->prepare(
            'INSERT INTO devices (device_id, last_seen) VALUES (?, datetime("now"))'
        );
        $insert->execute([$deviceId]);
    } else {
        $update = $db->prepare('UPDATE devices SET last_seen = datetime("now") WHERE device_id = ?');
        $update->execute([$deviceId]);
    }
}

function loadRules(PDO $db): array
{
    $rows = $db->query('SELECT * FROM risk_rules WHERE enabled = 1')->fetchAll(PDO::FETCH_ASSOC);
    $rules = [];
    foreach ($rows as $row) {
        $rules[$row['rule_key']] = $row;
    }
    return $rules;
}

function evaluateTransactionRisk(PDO $db, array $tx): array
{
    $rules = loadRules($db);
    $score = 0;
    $flags = [];

    $amount = (int)($tx['amount'] ?? 0);
    $isNewRecipient = (int)($tx['is_new_recipient'] ?? 0);
    $txType = $tx['tx_type'] ?? '';
    $txTime = $tx['tx_time'] ?? '';
    $deviceId = $tx['device_id'] ?? '';

    if (isset($rules['high_amount']) && $amount >= (int)$rules['high_amount']['threshold_value']) {
        $score += (int)$rules['high_amount']['weight'];
        $flags[] = [
            'rule_key' => 'high_amount',
            'name' => $rules['high_amount']['name'],
            'name_vi' => $rules['high_amount']['name_vi'],
            'weight' => (int)$rules['high_amount']['weight'],
        ];
    }

    if (isset($rules['very_high_amount']) && $amount >= (int)$rules['very_high_amount']['threshold_value']) {
        $score += (int)$rules['very_high_amount']['weight'];
        $flags[] = [
            'rule_key' => 'very_high_amount',
            'name' => $rules['very_high_amount']['name'],
            'name_vi' => $rules['very_high_amount']['name_vi'],
            'weight' => (int)$rules['very_high_amount']['weight'],
        ];
    }

    if (isset($rules['new_recipient']) && $isNewRecipient) {
        $score += (int)$rules['new_recipient']['weight'];
        $flags[] = [
            'rule_key' => 'new_recipient',
            'name' => $rules['new_recipient']['name'],
            'name_vi' => $rules['new_recipient']['name_vi'],
            'weight' => (int)$rules['new_recipient']['weight'],
        ];
    }

    if (isset($rules['domestic_transfer']) && $txType === 'domestic') {
        $score += (int)$rules['domestic_transfer']['weight'];
        $flags[] = [
            'rule_key' => 'domestic_transfer',
            'name' => $rules['domestic_transfer']['name'],
            'name_vi' => $rules['domestic_transfer']['name_vi'],
            'weight' => (int)$rules['domestic_transfer']['weight'],
        ];
    }

    if (isset($rules['night_transfer']) && $txTime !== '') {
        $hour = (int)date('G', strtotime($txTime));
        if ($hour >= 22 || $hour < 5) {
            $score += (int)$rules['night_transfer']['weight'];
            $flags[] = [
                'rule_key' => 'night_transfer',
                'name' => $rules['night_transfer']['name'],
                'name_vi' => $rules['night_transfer']['name_vi'],
                'weight' => (int)$rules['night_transfer']['weight'],
            ];
        }
    }

    if (isset($rules['suspicious_access']) && $deviceId !== '') {
        $stmt = $db->prepare(
            'SELECT COUNT(*) AS cnt FROM accessibility_services
             WHERE device_id = ? AND is_suspicious = 1'
        );
        $stmt->execute([$deviceId]);
        $count = (int)$stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
        if ($count > 0) {
            $weight = (int)$rules['suspicious_access']['weight'];
            $score += $weight;
            $flags[] = [
                'rule_key' => 'suspicious_access',
                'name' => $rules['suspicious_access']['name'],
                'name_vi' => $rules['suspicious_access']['name_vi'],
                'weight' => $weight,
                'detail' => $count . ' suspicious service(s) detected',
            ];
        }
    }

    return [
        'risk_score' => min($score, 100),
        'risk_level' => riskLevelFromScore(min($score, 100)),
        'risk_flags' => $flags,
    ];
}

function updateDeviceRisk(PDO $db, string $deviceId): void
{
    $txStmt = $db->prepare(
        'SELECT COALESCE(MAX(risk_score), 0) AS max_tx_risk
         FROM transactions WHERE device_id = ?'
    );
    $txStmt->execute([$deviceId]);
    $txRisk = (int)$txStmt->fetch(PDO::FETCH_ASSOC)['max_tx_risk'];

    $accStmt = $db->prepare(
        'SELECT COALESCE(SUM(risk_weight), 0) AS access_risk
         FROM accessibility_services
         WHERE device_id = ? AND is_suspicious = 1'
    );
    $accStmt->execute([$deviceId]);
    $accessRisk = (int)$accStmt->fetch(PDO::FETCH_ASSOC)['access_risk'];

    $deviceRisk = min(max($txRisk, $accessRisk), 100);
    $level = riskLevelFromScore($deviceRisk);

    $update = $db->prepare(
        'UPDATE devices SET risk_score = ?, risk_level = ?, last_seen = datetime("now")
         WHERE device_id = ?'
    );
    $update->execute([$deviceRisk, $level, $deviceId]);
}

try {
    $db = getDb($dbPath);
    $action = $_GET['action'] ?? '';

    switch ($action) {
        case 'dashboard':
            $devices = $db->query(
                'SELECT * FROM devices ORDER BY risk_score DESC, last_seen DESC LIMIT 50'
            )->fetchAll(PDO::FETCH_ASSOC);

            $txs = $db->query(
                'SELECT * FROM transactions ORDER BY tx_time DESC LIMIT 50'
            )->fetchAll(PDO::FETCH_ASSOC);

            $access = $db->query(
                'SELECT * FROM accessibility_services ORDER BY reported_at DESC LIMIT 50'
            )->fetchAll(PDO::FETCH_ASSOC);

            foreach ($txs as &$tx) {
                if (!empty($tx['risk_flags'])) {
                    $tx['risk_flags'] = json_decode($tx['risk_flags'], true);
                }
            }
            unset($tx);

            $stats = $db->query(
                'SELECT
                    (SELECT COUNT(*) FROM devices) AS device_count,
                    (SELECT COUNT(*) FROM transactions) AS transaction_count,
                    (SELECT COUNT(*) FROM accessibility_services WHERE is_suspicious = 1) AS suspicious_access_count,
                    (SELECT COUNT(*) FROM transactions WHERE risk_level IN ("high", "critical")) AS high_risk_tx_count'
            )->fetch(PDO::FETCH_ASSOC);

            jsonResponse([
                'status' => 'ok',
                'stats' => $stats,
                'devices' => $devices,
                'transactions' => $txs,
                'accessibility_services' => $access,
            ]);
            break;

        case 'report_transaction':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                jsonError('POST required', 405);
            }

            $body = readJsonBody();
            $deviceId = trim($body['device_id'] ?? '');
            if ($deviceId === '') {
                jsonError('device_id is required');
            }

            $required = ['amount', 'currency', 'tx_type'];
            foreach ($required as $field) {
                if (!isset($body[$field]) || $body[$field] === '') {
                    jsonError("$field is required");
                }
            }

            ensureDevice($db, $deviceId);

            $risk = evaluateTransactionRisk($db, $body);

            $stmt = $db->prepare(
                'INSERT INTO transactions
                 (device_id, user_id, amount, currency, tx_type, recipient_account,
                  recipient_name, recipient_bank, is_new_recipient, tx_time,
                  risk_score, risk_level, risk_flags)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );

            $stmt->execute([
                $deviceId,
                $body['user_id'] ?? null,
                (int)$body['amount'],
                $body['currency'],
                $body['tx_type'],
                $body['recipient_account'] ?? null,
                $body['recipient_name'] ?? null,
                $body['recipient_bank'] ?? null,
                (int)($body['is_new_recipient'] ?? 0),
                $body['tx_time'] ?? date('Y-m-d H:i:s'),
                $risk['risk_score'],
                $risk['risk_level'],
                json_encode($risk['risk_flags'], JSON_UNESCAPED_UNICODE),
            ]);

            $txId = (int)$db->lastInsertId();
            updateDeviceRisk($db, $deviceId);

            jsonResponse([
                'status' => 'ok',
                'transaction_id' => $txId,
                'risk_score' => $risk['risk_score'],
                'risk_level' => $risk['risk_level'],
                'risk_flags' => $risk['risk_flags'],
            ]);
            break;

        case 'rules':
            $rules = $db->query('SELECT * FROM risk_rules ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
            jsonResponse(['status' => 'ok', 'rules' => $rules]);
            break;

        case 'update_rule':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                jsonError('POST required', 405);
            }

            $body = readJsonBody();
            $ruleKey = trim($body['rule_key'] ?? '');
            if ($ruleKey === '') {
                jsonError('rule_key is required');
            }

            $fields = [];
            $params = [];
            $allowed = ['name', 'name_vi', 'description', 'weight', 'threshold_value', 'enabled'];
            foreach ($allowed as $field) {
                if (array_key_exists($field, $body)) {
                    $fields[] = "$field = ?";
                    $params[] = $body[$field];
                }
            }

            if (empty($fields)) {
                jsonError('No updatable fields provided');
            }

            $params[] = $ruleKey;
            $sql = 'UPDATE risk_rules SET ' . implode(', ', $fields) . ' WHERE rule_key = ?';
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            if ($stmt->rowCount() === 0) {
                jsonError('Rule not found', 404);
            }

            $rule = $db->prepare('SELECT * FROM risk_rules WHERE rule_key = ?');
            $rule->execute([$ruleKey]);

            jsonResponse([
                'status' => 'ok',
                'rule' => $rule->fetch(PDO::FETCH_ASSOC),
            ]);
            break;

        default:
            jsonError('Unknown action. Supported: dashboard, report_transaction, rules, update_rule', 404);
    }
} catch (Throwable $e) {
    jsonError('Internal error: ' . $e->getMessage(), 500);
}
