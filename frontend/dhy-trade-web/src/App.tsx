import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp, theme as antTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TradesPage from './pages/TradesPage';
import CalculatorPage from './pages/CalculatorPage';
import BulletinPage from './pages/BulletinPage';
import HistoryPage from './pages/HistoryPage';
import StockHistoryPage from './pages/StockHistoryPage';
import UsersPage from './pages/UsersPage';
import InvitesPage from './pages/InvitesPage';
import ProfilePage from './pages/ProfilePage';

function ThemedApp() {
  const { theme } = useTheme();

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', 'Noto Sans SC', sans-serif",
          borderRadius: 10,
          colorPrimary: theme === 'dark' ? '#0a84ff' : '#0066cc',
          colorBgContainer: theme === 'dark' ? 'rgba(30, 30, 35, 0.75)' : 'rgba(255, 255, 255, 0.75)',
          colorBgElevated: theme === 'dark' ? 'rgba(40, 40, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          colorBorder: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          colorText: theme === 'dark' ? '#f5f5f7' : '#1d1d1f',
          colorTextSecondary: theme === 'dark' ? '#a1a1a6' : '#86868b',
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="trades" element={<TradesPage />} />
              <Route path="calculator" element={<CalculatorPage />} />
              <Route path="bulletin" element={<BulletinPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="history/:stockCode" element={<StockHistoryPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="admin/users" element={
                <ProtectedRoute roles={['SuperAdmin']}>
                  <UsersPage />
                </ProtectedRoute>
              } />
              <Route path="admin/invites" element={
                <ProtectedRoute roles={['SuperAdmin']}>
                  <InvitesPage />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}
