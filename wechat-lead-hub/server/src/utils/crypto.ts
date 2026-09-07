import crypto from 'crypto';

export function sha1(input: string): string {
  return crypto.createHash('sha1').update(input).digest('hex');
}

export function verifyWechatSignature(
  token: string,
  timestamp: string,
  nonce: string,
  signature: string,
): boolean {
  const arr = [token, timestamp, nonce].sort();
  const hash = sha1(arr.join(''));
  return hash === signature;
}

export function signPayload(payload: Record<string, unknown>, secret: string): string {
  const sorted = Object.keys(payload)
    .sort()
    .map((k) => `${k}=${payload[k]}`)
    .join('&');
  return crypto.createHmac('sha256', secret).update(sorted).digest('hex');
}

export function decryptWechatMessage(
  encodingAesKey: string,
  appId: string,
  encrypted: string,
): string {
  const aesKey = Buffer.from(`${encodingAesKey}=`, 'base64');
  const iv = aesKey.subarray(0, 16);
  const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
  decipher.setAutoPadding(false);
  let decoded = Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64')),
    decipher.final(),
  ]);

  const pad = decoded[decoded.length - 1];
  decoded = decoded.subarray(0, decoded.length - pad);

  const contentLen = decoded.readUInt32BE(16);
  const content = decoded.subarray(20, 20 + contentLen).toString('utf-8');
  const fromAppId = decoded.subarray(20 + contentLen).toString('utf-8');

  if (fromAppId !== appId) {
    throw new Error('AppId mismatch in decrypted message');
  }

  return content;
}

export function encryptWechatReply(
  encodingAesKey: string,
  appId: string,
  replyXml: string,
): string {
  const aesKey = Buffer.from(`${encodingAesKey}=`, 'base64');
  const iv = aesKey.subarray(0, 16);
  const random = crypto.randomBytes(16);
  const msgBuf = Buffer.from(replyXml, 'utf-8');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(msgBuf.length, 0);
  const appIdBuf = Buffer.from(appId, 'utf-8');
  const raw = Buffer.concat([random, lenBuf, msgBuf, appIdBuf]);

  const blockSize = 32;
  const padLen = blockSize - (raw.length % blockSize);
  const padding = Buffer.alloc(padLen, padLen);
  const padded = Buffer.concat([raw, padding]);

  const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(padded), cipher.final()]).toString('base64');
}

export function buildTextReply(toUser: string, fromUser: string, content: string): string {
  return `<xml><ToUserName><![CDATA[${toUser}]]></ToUserName><FromUserName><![CDATA[${fromUser}]]></FromUserName><CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[${content}]]></Content></xml>`;
}
