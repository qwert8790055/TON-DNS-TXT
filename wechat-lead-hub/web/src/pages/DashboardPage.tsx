import { useEffect, useState } from 'react';
import { api, DashboardStats } from '../api/client';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api<DashboardStats>('/stats/dashboard').then(setStats).catch(console.error);
  }, []);

  if (!stats) return <div>加载中...</div>;

  const cards = [
    { label: '总线索', value: stats.total_leads },
    { label: '已关注', value: stats.subscribed },
    { label: '已承接', value: stats.captured },
    { label: '已转三方', value: stats.pushed },
    { label: '承接转化率', value: `${stats.conversion_rate}%` },
    { label: '转三方成功率', value: `${stats.push_success_rate}%` },
  ];

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>数据看板</h2>
      <div className="stats-grid">
        {cards.map((c) => (
          <div key={c.label} className="stat-card">
            <div className="value">{c.value}</div>
            <div className="label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>渠道转化</h3>
        <table className="table">
          <thead>
            <tr>
              <th>渠道码</th>
              <th>坐席</th>
              <th>总数</th>
              <th>已承接</th>
              <th>已转三方</th>
            </tr>
          </thead>
          <tbody>
            {stats.by_channel.map((c) => (
              <tr key={c.channel_code}>
                <td>{c.channel_code}</td>
                <td>{c.agent_name ?? '-'}</td>
                <td>{c.total}</td>
                <td>{c.captured}</td>
                <td>{c.pushed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>账号类型对比</h3>
        <table className="table">
          <thead>
            <tr>
              <th>账号ID</th>
              <th>类型</th>
              <th>总数</th>
              <th>已承接</th>
              <th>已转三方</th>
            </tr>
          </thead>
          <tbody>
            {stats.by_account.map((a) => (
              <tr key={a.account_id}>
                <td>{a.account_id}</td>
                <td>{a.account_type === 'service' ? '服务号' : '订阅号'}</td>
                <td>{a.total}</td>
                <td>{a.captured}</td>
                <td>{a.pushed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
