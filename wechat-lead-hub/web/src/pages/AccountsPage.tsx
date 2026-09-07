import { FormEvent, useEffect, useState } from 'react';
import { api, WechatAccount } from '../api/client';

export function AccountsPage() {
  const [accounts, setAccounts] = useState<WechatAccount[]>([]);
  const [form, setForm] = useState({
    name: '',
    app_id: '',
    app_secret: '',
    account_type: 'service' as 'service' | 'subscribe',
    token: '',
    encoding_aes_key: '',
    welcome_text: '欢迎关注！请点击链接完成服务开通。',
  });

  async function load() {
    setAccounts(await api<WechatAccount[]>('/accounts'));
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await api('/accounts', { method: 'POST', body: JSON.stringify(form) });
    setForm({ ...form, name: '', app_id: '', app_secret: '', token: '' });
    load();
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>微信账号管理</h2>
      <p style={{ color: '#6b7280' }}>支持同时接入服务号和订阅号，Webhook 地址格式：/api/wechat/{'{app_id}'}</p>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>添加账号</h3>
        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-row">
              <label className="label">名称</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-row">
              <label className="label">类型</label>
              <select className="select" value={form.account_type} onChange={(e) => setForm({ ...form, account_type: e.target.value as 'service' | 'subscribe' })}>
                <option value="service">服务号</option>
                <option value="subscribe">订阅号</option>
              </select>
            </div>
            <div className="form-row">
              <label className="label">AppID</label>
              <input className="input" value={form.app_id} onChange={(e) => setForm({ ...form, app_id: e.target.value })} required />
            </div>
            <div className="form-row">
              <label className="label">AppSecret</label>
              <input className="input" value={form.app_secret} onChange={(e) => setForm({ ...form, app_secret: e.target.value })} required />
            </div>
            <div className="form-row">
              <label className="label">Token</label>
              <input className="input" value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} required />
            </div>
            <div className="form-row">
              <label className="label">EncodingAESKey（可选）</label>
              <input className="input" value={form.encoding_aes_key} onChange={(e) => setForm({ ...form, encoding_aes_key: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <label className="label">关注欢迎语</label>
            <textarea className="textarea" rows={2} value={form.welcome_text} onChange={(e) => setForm({ ...form, welcome_text: e.target.value })} />
          </div>
          <button className="btn" type="submit">添加账号</button>
        </form>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>名称</th>
              <th>类型</th>
              <th>AppID</th>
              <th>Webhook</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td><span className="badge">{a.account_type === 'service' ? '服务号' : '订阅号'}</span></td>
                <td><code>{a.app_id}</code></td>
                <td><code>/api/wechat/{a.app_id}</code></td>
                <td>{a.enabled ? '启用' : '禁用'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
