import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, Lead } from '../api/client';

export function CapturePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const leadUuid = params.get('lead_uuid') ?? '';
  const appId = params.get('app_id');
  const channel = params.get('channel');

  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [smsHint, setSmsHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lead, setLead] = useState<Lead | null>(null);

  useEffect(() => {
    if (!leadUuid && appId) {
      window.location.href = `/api/h5/oauth/start?app_id=${appId}&channel=${channel ?? ''}`;
      return;
    }
    if (leadUuid) {
      api<{ lead: Lead }>(`/h5/lead/${leadUuid}`).then((r) => setLead(r.lead)).catch(() => {});
    }
  }, [leadUuid, appId, channel]);

  async function sendCode() {
    setError('');
    const res = await api<{ success: boolean; code?: string; message: string }>('/h5/sms/send', {
      method: 'POST',
      body: JSON.stringify({ mobile }),
    });
    setSmsHint(res.code ? `演示模式验证码：${res.code}` : res.message);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api<{ success: boolean; lead: Lead; redirect_url: string | null }>('/h5/capture', {
        method: 'POST',
        body: JSON.stringify({ lead_uuid: leadUuid, mobile, code, name }),
      });
      if (res.redirect_url) {
        window.location.href = res.redirect_url;
        return;
      }
      navigate(`/h5/success?lead_uuid=${res.lead.lead_uuid}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setLoading(false);
    }
  }

  if (!leadUuid && !appId) {
    return (
      <div className="h5-page">
        <div className="h5-card">
          <p>缺少参数，请通过公众号链接进入</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h5-page">
      <div className="h5-card">
        <h1 className="h5-title">服务开通登记</h1>
        <p className="h5-sub">
          {lead?.agent_name ? `专属顾问：${lead.agent_name}` : '请填写信息完成服务开通'}
          {lead?.channel_code ? ` · 渠道：${lead.channel_code}` : ''}
        </p>

        <form onSubmit={onSubmit}>
          <div className="form-row">
            <label className="label">手机号</label>
            <input className="input" type="tel" maxLength={11} value={mobile} onChange={(e) => setMobile(e.target.value)} required />
          </div>
          <div className="form-row">
            <label className="label">验证码</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" value={code} onChange={(e) => setCode(e.target.value)} required />
              <button type="button" className="btn secondary" onClick={sendCode} style={{ whiteSpace: 'nowrap' }}>
                获取验证码
              </button>
            </div>
            {smsHint && <p style={{ fontSize: 13, color: '#059669', marginTop: 6 }}>{smsHint}</p>}
          </div>
          <div className="form-row">
            <label className="label">姓名（选填）</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
            提交即表示您同意我们收集手机号用于服务开通与后续联系。投资有风险，请理性决策。
          </p>
          {error && <p style={{ color: '#dc2626' }}>{error}</p>}
          <button className="btn" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? '提交中...' : '确认开通'}
          </button>
        </form>
      </div>
    </div>
  );
}
