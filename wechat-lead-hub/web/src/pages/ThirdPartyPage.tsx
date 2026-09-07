import { FormEvent, useEffect, useState } from 'react';
import { api, ThirdPartyConfig } from '../api/client';

export function ThirdPartyPage() {
  const [configs, setConfigs] = useState<ThirdPartyConfig[]>([]);
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);
  const [form, setForm] = useState({
    name: '三方平台',
    mode: 'redirect' as 'api' | 'redirect' | 'manual',
    api_url: '',
    api_key: '',
    redirect_url_template: 'https://example-third-party.com/register?lead_id={lead_uuid}&mobile={mobile}&channel={channel_code}',
    callback_secret: '',
    retry_count: 3,
    enabled: 1,
  });

  async function load() {
    const [c, l] = await Promise.all([
      api<ThirdPartyConfig[]>('/third-party/configs'),
      api<Array<Record<string, unknown>>>('/third-party/push-logs'),
    ]);
    setConfigs(c);
    setLogs(l);
    if (c[0]) {
      setForm({
        name: c[0].name,
        mode: c[0].mode,
        api_url: c[0].api_url ?? '',
        api_key: c[0].api_key ?? '',
        redirect_url_template: c[0].redirect_url_template ?? '',
        callback_secret: c[0].callback_secret ?? '',
        retry_count: c[0].retry_count,
        enabled: c[0].enabled,
      });
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const existing = configs[0];
    if (existing) {
      await api(`/third-party/configs/${existing.id}`, { method: 'PUT', body: JSON.stringify(form) });
    } else {
      await api('/third-party/configs', { method: 'POST', body: JSON.stringify(form) });
    }
    load();
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>三方对接</h2>
      <p style={{ color: '#6b7280' }}>支持 API 推送、带参跳转、人工导出三种模式</p>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>三方配置</h3>
        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-row">
              <label className="label">名称</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-row">
              <label className="label">模式</label>
              <select className="select" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value as 'api' | 'redirect' | 'manual' })}>
                <option value="api">API 实时推送</option>
                <option value="redirect">带参跳转</option>
                <option value="manual">人工导出</option>
              </select>
            </div>
            <div className="form-row">
              <label className="label">API 地址</label>
              <input className="input" value={form.api_url} onChange={(e) => setForm({ ...form, api_url: e.target.value })} placeholder="https://third-party.com/api/leads" />
            </div>
            <div className="form-row">
              <label className="label">API Key</label>
              <input className="input" value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <label className="label">跳转链接模板（支持 {'{lead_uuid}'} {'{mobile}'} {'{channel_code}'} {'{agent_name}'}）</label>
            <input className="input" value={form.redirect_url_template} onChange={(e) => setForm({ ...form, redirect_url_template: e.target.value })} />
          </div>
          <div className="form-row">
            <label className="label">回调签名密钥</label>
            <input className="input" value={form.callback_secret} onChange={(e) => setForm({ ...form, callback_secret: e.target.value })} />
          </div>
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            三方回调地址：POST /api/third-party/callback，Body: {'{ lead_id, third_lead_id, status, sign }'}
          </p>
          <button className="btn" type="submit">保存配置</button>
        </form>
      </div>

      <div className="card">
        <h3>推送日志</h3>
        <table className="table">
          <thead>
            <tr>
              <th>线索</th>
              <th>手机号</th>
              <th>次数</th>
              <th>状态</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={String(log.id)}>
                <td><code>{String(log.lead_uuid ?? '').slice(0, 8)}...</code></td>
                <td>{String(log.mobile ?? '-')}</td>
                <td>{String(log.attempt)}</td>
                <td>{String(log.status)}</td>
                <td>{String(log.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
