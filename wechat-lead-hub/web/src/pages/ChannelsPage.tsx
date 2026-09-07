import { FormEvent, useEffect, useState } from 'react';
import { api, Channel, WechatAccount } from '../api/client';

export function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [accounts, setAccounts] = useState<WechatAccount[]>([]);
  const [form, setForm] = useState({ name: '', code: '', account_id: 0, agent_name: '', team_name: '' });

  async function load() {
    const [c, a] = await Promise.all([
      api<Channel[]>('/channels'),
      api<WechatAccount[]>('/accounts'),
    ]);
    setChannels(c);
    setAccounts(a);
    if (a.length && !form.account_id) setForm((f) => ({ ...f, account_id: a[0].id }));
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await api('/channels', { method: 'POST', body: JSON.stringify(form) });
    setForm({ ...form, name: '', code: '', agent_name: '', team_name: '' });
    load();
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>渠道码管理</h2>
      <p style={{ color: '#6b7280' }}>为每个电销坐席/团队生成独立带参二维码，追踪来源与转化</p>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>创建渠道</h3>
        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-row">
              <label className="label">渠道名称</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-row">
              <label className="label">渠道码（唯一）</label>
              <input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            </div>
            <div className="form-row">
              <label className="label">绑定账号</label>
              <select className="select" value={form.account_id} onChange={(e) => setForm({ ...form, account_id: Number(e.target.value) })}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.account_type})</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label className="label">坐席名称</label>
              <input className="input" value={form.agent_name} onChange={(e) => setForm({ ...form, agent_name: e.target.value })} />
            </div>
            <div className="form-row">
              <label className="label">团队名称</label>
              <input className="input" value={form.team_name} onChange={(e) => setForm({ ...form, team_name: e.target.value })} />
            </div>
          </div>
          <button className="btn" type="submit">生成渠道码</button>
        </form>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>名称</th>
              <th>渠道码</th>
              <th>坐席</th>
              <th>团队</th>
              <th>二维码</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td><code>{c.code}</code></td>
                <td>{c.agent_name ?? '-'}</td>
                <td>{c.team_name ?? '-'}</td>
                <td>
                  {c.qrcode_url ? (
                    <a href={c.qrcode_url} target="_blank" rel="noreferrer">查看二维码</a>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
