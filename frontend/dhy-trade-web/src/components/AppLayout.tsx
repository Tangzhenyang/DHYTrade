import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout, Menu, Button, Typography, Dropdown, theme
} from 'antd';
import {
  DashboardOutlined, SwapOutlined, CalculatorOutlined,
  SoundOutlined, HistoryOutlined, UserOutlined,
  TeamOutlined, KeyOutlined, LogoutOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';

const { Header, Sider, Content } = Layout;

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { token: { colorBgContainer } } = theme.useToken();

  const isAdmin = user?.role === 'SuperAdmin';
  const isOperator = user?.role === 'SuperAdmin' || user?.role === 'Operator';

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '仓位看板' },
    { key: '/trades', icon: <SwapOutlined />, label: '交易记录' },
    { key: '/calculator', icon: <CalculatorOutlined />, label: '跟仓计算' },
    { key: '/bulletin', icon: <SoundOutlined />, label: '公告栏' },
    { key: '/history', icon: <HistoryOutlined />, label: '历史盈亏' },
  ];

  if (isAdmin) {
    menuItems.push(
      { key: '/admin/users', icon: <TeamOutlined />, label: '用户管理' },
      { key: '/admin/invites', icon: <KeyOutlined />, label: '邀请码' },
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = {
    items: [
      { key: 'role', label: `角色：${user?.role}`, disabled: true },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true, onClick: handleLogout },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ height: 48, margin: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
            {collapsed ? '跟' : '跟仓系统'}
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Dropdown menu={userMenu} placement="bottomRight">
            <Button type="text" icon={<UserOutlined />}>
              {user?.username}
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: colorBgContainer, borderRadius: 8, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
