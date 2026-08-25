import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, Lead } from '../api/client';

export function SuccessPage() {
  const [params] = useSearchParams();
  const leadUuid = params.get('lead_uuid') ?? '';
  const [lead, setLead] = useState<Lead | null>(null);

  useEffect(() => {
    if (leadUuid) {
      api<{ lead: Lead; redirect_url: string | null }>(`/h5/lead/${leadUuid}`).then((r) => setLead(r.lead));
    }
  }, [leadUuid]);

  return (
    <div className="h5-page">
      <div className="h5-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h1 className="h5-title">登记成功</h1>
        <p className="h5-sub">您的信息已提交，专属顾问将尽快与您联系</p>
        {lead && (
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            状态：{lead.status === 'pushed' ? '已转三方' : lead.status === 'redirected' ? '等待跳转' : '处理中'}
          </p>
        )}
      </div>
    </div>
  );
}
