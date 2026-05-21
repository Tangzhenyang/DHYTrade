import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
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

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
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
