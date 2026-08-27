import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';

export function SettingsPage() {
  const [settings, setSettings] = useState({ dedup_hours: '24', auto_push: '1', require_mobile: '1' });

  useEffect(() => {
    api<typeof settings>('/settings').then(setSettings);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await api('/settings', { method: 'PUT', body: JSON.stringify(settings) });
    alert('设置已保存');
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>系统设置</h2>
      <div className="card" style={{ maxWidth: 480 }}>
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <label className="label">去重时间窗口（小时）</label>
            <input className="input" type="number" value={settings.dedup_hours} onChange={(e) => setSettings({ ...settings, dedup_hours: e.target.value })} />
          </div>
          <div className="form-row">
            <label className="label">承接后自动推送三方</label>
            <select className="select" value={settings.auto_push} onChange={(e) => setSettings({ ...settings, auto_push: e.target.value })}>
              <option value="1">是</option>
              <option value="0">否</option>
            </select>
          </div>
          <div className="form-row">
            <label className="label">必须手机号验证</label>
            <select className="select" value={settings.require_mobile} onChange={(e) => setSettings({ ...settings, require_mobile: e.target.value })}>
              <option value="1">是</option>
              <option value="0">否</option>
            </select>
          </div>
          <button className="btn" type="submit">保存</button>
        </form>
      </div>
    </div>
  );
}
