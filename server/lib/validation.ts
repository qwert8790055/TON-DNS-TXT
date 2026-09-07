/** User-friendly TON address: EQ... or UQ... (48 chars). */
const FRIENDLY_TON_RE = /^E[QU][A-Za-z0-9_-]{46}$/;

/** Raw TON address: workchain:64-hex-hash */
const RAW_TON_RE = /^-?[0-9]+:[0-9a-fA-F]{64}$/;

export function isValidTonAddress(value: string): boolean {
  if (value.length > 128) return false;
  return FRIENDLY_TON_RE.test(value) || RAW_TON_RE.test(value);
}
