import { Router } from 'express';
import { getAccountByAppId } from '../services/accountService';
import { buildOAuthUrl, getOAuthAccessToken } from '../wechat/api';
import { createSubscribeLead, getLeadByUuid, captureLead } from '../services/leadService';
import { sendSmsCode, verifySmsCode } from '../services/smsService';
import { getRedirectUrlForLead } from '../services/pushService';
import { getChannelByCode } from '../services/channelService';

export const h5Router = Router();

h5Router.get('/oauth/start', (req, res) => {
  const appId = req.query.app_id as string;
  const channel = req.query.channel as string | undefined;
  const account = getAccountByAppId(appId);
  if (!account) {
    res.status(404).json({ error: 'Account not found' });
    return;
  }

  const h5Base = process.env.H5_BASE_URL ?? 'http://localhost:4781';
  const redirectUri = `${h5Base}/api/h5/oauth/callback`;
  const state = Buffer.from(JSON.stringify({ app_id: appId, channel: channel ?? '' })).toString('base64url');
  const url = buildOAuthUrl(account, redirectUri, state);
  res.redirect(url);
});

h5Router.get('/oauth/callback', async (req, res) => {
  const code = req.query.code as string;
  const stateRaw = req.query.state as string;

  try {
    const state = JSON.parse(Buffer.from(stateRaw, 'base64url').toString()) as {
      app_id: string;
      channel: string;
    };
    const account = getAccountByAppId(state.app_id);
    if (!account) throw new Error('Account not found');

    const oauth = await getOAuthAccessToken(account, code);
    const channel = state.channel ? getChannelByCode(state.channel) : undefined;
    const lead = createSubscribeLead({
      openid: oauth.openid,
      unionid: oauth.unionid,
      account,
      channel,
      eventKey: state.channel,
    });

    const h5Base = process.env.H5_BASE_URL ?? 'http://localhost:4781';
    res.redirect(`${h5Base}/h5/capture?lead_uuid=${lead.lead_uuid}`);
  } catch {
    res.status(400).send('OAuth failed');
  }
});

h5Router.post('/sms/send', (req, res) => {
  const { mobile } = req.body as { mobile?: string };
  if (!mobile) {
    res.status(400).json({ error: 'Mobile required' });
    return;
  }
  const result = sendSmsCode(mobile);
  res.json(result);
});

h5Router.post('/capture', (req, res) => {
  const { lead_uuid, mobile, code, name } = req.body as {
    lead_uuid?: string;
    mobile?: string;
    code?: string;
    name?: string;
  };

  if (!lead_uuid || !mobile || !code) {
    res.status(400).json({ error: 'lead_uuid, mobile, code required' });
    return;
  }

  if (!verifySmsCode(mobile, code)) {
    res.status(400).json({ error: '验证码错误或已过期' });
    return;
  }

  try {
    const lead = captureLead({ lead_uuid, mobile, name });
    const redirectUrl = getRedirectUrlForLead(lead.lead_uuid);
    res.json({ success: true, lead, redirect_url: redirectUrl });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Capture failed' });
  }
});

h5Router.get('/lead/:uuid', (req, res) => {
  const lead = getLeadByUuid(req.params.uuid);
  if (!lead) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const redirectUrl = getRedirectUrlForLead(lead.lead_uuid);
  res.json({ lead, redirect_url: redirectUrl });
});

// Demo: simulate WeChat subscribe event for testing
h5Router.post('/demo/subscribe', (req, res) => {
  const { app_id, channel_code, openid } = req.body as {
    app_id?: string;
    channel_code?: string;
    openid?: string;
  };

  const account = getAccountByAppId(app_id ?? 'demo_service_001');
  if (!account) {
    res.status(404).json({ error: 'Account not found' });
    return;
  }

  const channel = channel_code ? getChannelByCode(channel_code) : undefined;
  const lead = createSubscribeLead({
    openid: openid ?? `demo_user_${Date.now()}`,
    account,
    channel,
    eventKey: channel_code,
  });

  res.json({ success: true, lead, capture_url: `/h5/capture?lead_uuid=${lead.lead_uuid}` });
});
