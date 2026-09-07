import { Router, Request, Response } from 'express';
import { beginCell } from '@ton/core';
import { isValidTonAddress } from '../lib/validation';
import { sendInternalError } from '../lib/errors';
import { getCached, setCache } from '../lib/cache';

const TONCENTER_KEY = process.env.TONCENTER_KEY ?? '';
const DNS_CACHE_TTL_MS = Number(process.env.DNS_CACHE_TTL_MS) || 300_000;

const NULL_BYTE_BOC = beginCell().storeUint(0, 8).endCell().toBoc().toString('base64');

export const router = Router();

/**
 * GET /api/dns-records?address=<nft-item-address>
 * Calls dnsresolve(category=0) on the NFT item and returns the HashmapE BOC.
 */
router.get('/dns-records', async (req: Request, res: Response) => {
  const address = req.query.address as string | undefined;
  if (!address) {
    res.status(400).json({ error: 'Missing address parameter' });
    return;
  }

  if (!isValidTonAddress(address)) {
    res.status(400).json({ error: 'Invalid address format' });
    return;
  }

  const cacheKey = `dns-records:${address}`;
  const cached = getCached<{ ok: boolean; boc: string | null }>(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const body = {
      id: 1,
      jsonrpc: '2.0',
      method: 'runGetMethod',
      params: {
        address,
        method: 'dnsresolve',
        stack: [
          ['tvm.Slice', NULL_BYTE_BOC],
          ['num', '0'],
        ],
      },
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (TONCENTER_KEY) headers['X-API-Key'] = TONCENTER_KEY;

    const tcRes = await fetch('https://toncenter.com/api/v2/jsonRPC', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!tcRes.ok) {
      res.status(502).json({ error: `TonCenter error: ${tcRes.status}` });
      return;
    }

    const data = await tcRes.json() as {
      ok?: boolean;
      result?: {
        exit_code: number;
        stack: Array<[string, unknown]>;
      };
    };

    if (!data.ok || !data.result || data.result.exit_code !== 0) {
      const payload = { ok: true, boc: null };
      setCache(cacheKey, payload, DNS_CACHE_TTL_MS);
      res.json(payload);
      return;
    }

    const stack = data.result.stack;
    if (!stack || stack.length < 2 || stack[1][0] === 'null') {
      const payload = { ok: true, boc: null };
      setCache(cacheKey, payload, DNS_CACHE_TTL_MS);
      res.json(payload);
      return;
    }

    const cellEntry = stack[1][1] as { bytes?: string } | undefined;
    const payload = { ok: true, boc: cellEntry?.bytes ?? null };
    setCache(cacheKey, payload, DNS_CACHE_TTL_MS);
    res.json(payload);
  } catch {
    sendInternalError(res);
  }
});
