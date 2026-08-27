import { useEffect, useState } from 'react';
import { api, Lead } from '../api/client';

const statusLabels: Record<string, string> = {
  subscribed: '已关注',
  captured: '已承接',
  pushing: '推送中',
  pushed: '已转三方',
  redirected: '待跳转',
  push_failed: '推送失败',
  duplicate: '重复',
};

export function LeadsPage() {
  const [items, setItems] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [mobile, setMobile] = useState('');

  async function load() {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (mobile) params.set('mobile', mobile);
    const res = await api<{ items: Lead[]; total: number }>(`/leads?${params}`);
    setItems(res.items);
    setTotal(res.total);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>线索管理</h2>
      <div className="toolbar">
        <select className="select" style={{ width: 160 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">全部状态</option>
          {Object.entries(statusLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input className="input" style={{ width: 200 }} placeholder="搜索手机号" value={mobile} onChange={(e) => setMobile(e.target.value)} />
        <button className="btn" onClick={load}>查询</button>
        <a className="btn secondary" href="/api/leads/export">导出 CSV</a>
      </div>

      <div className="card">
        <p style={{ color: '#6b7280' }}>共 {total} 条线索</p>
        <table className="table">
          <thead>
            <tr>
              <th>线索ID</th>
              <th>手机号</th>
              <th>渠道</th>
              <th>坐席</th>
              <th>账号类型</th>
              <th>状态</th>
              <th>关注时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.id}>
                <td><code>{l.lead_uuid.slice(0, 8)}...</code></td>
                <td>{l.mobile ?? '-'}</td>
                <td>{l.channel_code ?? '-'}</td>
                <td>{l.agent_name ?? '-'}</td>
                <td>{l.account_type === 'service' ? '服务号' : '订阅号'}</td>
                <td><span className={`badge ${l.status === 'pushed' ? 'success' : l.status === 'push_failed' ? 'danger' : ''}`}>{statusLabels[l.status] ?? l.status}</span></td>
                <td>{new Date(l.subscribed_at).toLocaleString('zh-CN')}</td>
                <td>
                  <button
                    className="btn secondary"
                    style={{ padding: '4px 8px', fontSize: 12 }}
                    onClick={async () => {
                      await api(`/leads/${l.id}/push`, { method: 'POST' });
                      load();
                    }}
                  >
                    重推三方
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
