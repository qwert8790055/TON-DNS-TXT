import { useState } from 'react';
import { api, Lead } from '../api/client';

export function DemoPage() {
  const [appId, setAppId] = useState('demo_service_001');
  const [channelCode, setChannelCode] = useState('service_agent_a');
  const [lead, setLead] = useState<Lead | null>(null);
  const [message, setMessage] = useState('');

  async function simulateSubscribe() {
    const res = await api<{ lead: Lead; capture_url: string }>('/h5/demo/subscribe', {
      method: 'POST',
      body: JSON.stringify({ app_id: appId, channel_code: channelCode }),
    });
    setLead(res.lead);
    setMessage(`模拟关注成功！承接链接：${res.capture_url}`);
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>演示测试</h2>
      <p style={{ color: '#6b7280' }}>无需真实微信环境，可模拟电销客户关注公众号的完整流程</p>

      <div className="card" style={{ maxWidth: 560 }}>
        <div className="form-row">
          <label className="label">AppID</label>
          <select className="select" value={appId} onChange={(e) => setAppId(e.target.value)}>
            <option value="demo_service_001">演示服务号</option>
            <option value="demo_subscribe_001">演示订阅号</option>
          </select>
        </div>
        <div className="form-row">
          <label className="label">渠道码</label>
          <select className="select" value={channelCode} onChange={(e) => setChannelCode(e.target.value)}>
            <option value="service_agent_a">service_agent_a（服务号-坐席A）</option>
            <option value="service_agent_b">service_agent_b（服务号-坐席B）</option>
            <option value="subscribe_agent_a">subscribe_agent_a（订阅号-坐席A）</option>
            <option value="subscribe_agent_b">subscribe_agent_b（订阅号-坐席B）</option>
          </select>
        </div>
        <button className="btn" onClick={simulateSubscribe}>模拟客户关注</button>

        {message && <p style={{ marginTop: 16, color: '#059669' }}>{message}</p>}

        {lead && (
          <div style={{ marginTop: 16, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
            <p><strong>线索ID：</strong>{lead.lead_uuid}</p>
            <p><strong>状态：</strong>{lead.status}</p>
            <a className="btn secondary" href={`/h5/capture?lead_uuid=${lead.lead_uuid}`} target="_blank" rel="noreferrer">
              打开 H5 承接页
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
