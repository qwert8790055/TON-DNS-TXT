import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { isLoggedIn } from './api/client';
import { AdminLayout } from './components/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AccountsPage } from './pages/AccountsPage';
import { ChannelsPage } from './pages/ChannelsPage';
import { LeadsPage } from './pages/LeadsPage';
import { ThirdPartyPage } from './pages/ThirdPartyPage';
import { SettingsPage } from './pages/SettingsPage';
import { DemoPage } from './pages/DemoPage';
import { CapturePage } from './pages/CapturePage';
import { SuccessPage } from './pages/SuccessPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isLoggedIn()) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="channels" element={<ChannelsPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="third-party" element={<ThirdPartyPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="demo" element={<DemoPage />} />
      </Route>
      <Route path="/h5/capture" element={<CapturePage />} />
      <Route path="/h5/success" element={<SuccessPage />} />
    </Routes>
  );
}
