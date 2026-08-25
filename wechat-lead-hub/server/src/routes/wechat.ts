import { Router } from 'express';
import { XMLParser } from 'fast-xml-parser';
import {
  buildTextReply,
  decryptWechatMessage,
  encryptWechatReply,
  verifyWechatSignature,
} from '../utils/crypto';
import { getAccountByAppId } from '../services/accountService';
import { getChannelByCode } from '../services/channelService';
import { createSubscribeLead } from '../services/leadService';

export const wechatRouter = Router();

function expressTextParser(
  req: import('express').Request,
  res: import('express').Response,
  next: import('express').NextFunction,
) {
  let data = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    data += chunk;
  });
  req.on('end', () => {
    req.body = data;
    next();
  });
}

function parseXml(xml: string): Record<string, string> {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  const parsed = parser.parse(xml) as { xml: Record<string, string> };
  return parsed.xml ?? {};
}

wechatRouter.get('/:appId', (req, res) => {
  const appId = String(req.params.appId);
  const account = getAccountByAppId(appId);
  if (!account) {
    res.status(404).send('Account not found');
    return;
  }

  const { signature, timestamp, nonce, echostr } = req.query as Record<string, string>;
  if (verifyWechatSignature(account.token, timestamp, nonce, signature)) {
    res.send(echostr);
  } else {
    res.status(403).send('Invalid signature');
  }
});

wechatRouter.post('/:appId', expressTextParser, (req, res) => {
  const appId = String(req.params.appId);
  const account = getAccountByAppId(appId);
  if (!account) {
    res.status(404).send('Account not found');
    return;
  }

  const { signature, timestamp, nonce, msg_signature: msgSignature } = req.query as Record<string, string>;
  if (!verifyWechatSignature(account.token, timestamp, nonce, signature)) {
    res.status(403).send('Invalid signature');
    return;
  }

  let xmlBody = req.body as string;
  const parsedQuery = parseXml(xmlBody);

  if (parsedQuery.Encrypt && account.encoding_aes_key) {
    try {
      xmlBody = decryptWechatMessage(account.encoding_aes_key, account.app_id, parsedQuery.Encrypt);
    } catch {
      res.status(400).send('Decrypt failed');
      return;
    }
  }

  const msg = parseXml(xmlBody);
  const msgType = msg.MsgType;
  const event = msg.Event;
  const openid = msg.FromUserName;
  const toUser = msg.ToUserName;

  if (msgType === 'event' && (event === 'subscribe' || event === 'SCAN')) {
    const eventKey = msg.EventKey ?? '';
    let channelCode = eventKey.replace(/^qrscene_/, '');

    const channel = channelCode ? getChannelByCode(channelCode) : undefined;
    createSubscribeLead({
      openid,
      account,
      channel,
      eventKey,
    });

    const h5Base = process.env.H5_BASE_URL ?? 'http://localhost:4781';
    const captureUrl = `${h5Base}/h5/capture?app_id=${account.app_id}&lead_hint=${encodeURIComponent(openid)}&channel=${encodeURIComponent(channelCode)}`;
    const replyText = `${account.welcome_text}\n\n请点击链接完成登记：\n${captureUrl}`;

    const replyXml = buildTextReply(openid, toUser, replyText);
    if (account.encoding_aes_key) {
      const encrypted = encryptWechatReply(account.encoding_aes_key, account.app_id, replyXml);
      const reply = `<xml><Encrypt><![CDATA[${encrypted}]]></Encrypt><MsgSignature><![CDATA[]]></MsgSignature><TimeStamp>${timestamp}</TimeStamp><Nonce><![CDATA[${nonce}]]></Nonce></xml>`;
      res.type('application/xml').send(reply);
      return;
    }

    res.type('application/xml').send(replyXml);
    return;
  }

  if (msgType === 'text') {
    const h5Base = process.env.H5_BASE_URL ?? 'http://localhost:4781';
    const replyText = `您好！请点击链接完成服务开通：\n${h5Base}/h5/capture?app_id=${account.app_id}`;
    res.type('application/xml').send(buildTextReply(openid, toUser, replyText));
    return;
  }

  res.send('success');
});
