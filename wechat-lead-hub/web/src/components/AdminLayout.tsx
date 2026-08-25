import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearToken } from '../api/client';

const links = [
  { to: '/admin', label: '数据看板', end: true },
  { to: '/admin/accounts', label: '微信账号' },
  { to: '/admin/channels', label: '渠道码管理' },
  { to: '/admin/leads', label: '线索管理' },
  { to: '/admin/third-party', label: '三方对接' },
  { to: '/admin/settings', label: '系统设置' },
  { to: '/admin/demo', label: '演示测试' },
];

export function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>微信接粉中台</h1>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button
          className="btn secondary"
          style={{ marginTop: 24, width: '100%' }}
          onClick={() => {
            clearToken();
            navigate('/admin/login');
          }}
        >
          退出登录
        </button>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
