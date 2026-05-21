import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Typography, Dropdown, Drawer, Switch, Space } from 'antd';
import {
  DashboardOutlined, SwapOutlined, CalculatorOutlined,
  SoundOutlined, HistoryOutlined, UserOutlined,
  TeamOutlined, KeyOutlined, LogoutOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, MenuOutlined,
  SunOutlined, MoonOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../contexts/ThemeContext';

const { Header, Sider, Content } = Layout;

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    const handler = () => {
      setIsMobile(window.innerWidth < 768);
      setMobileDrawerOpen(false);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const isAdmin = user?.role === 'SuperAdmin';

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

  const handleNav = (key: string) => {
    navigate(key);
    setMobileDrawerOpen(false);
  };

  const userMenu = {
    items: [
      {
        key: 'theme',
        icon: theme === 'dark' ? <SunOutlined /> : <MoonOutlined />,
        label: `切换${theme === 'dark' ? '亮色' : '暗色'}主题`,
        onClick: toggleTheme,
      },
      { type: 'divider' as const },
      { key: 'role', label: `角色：${user?.role}`, disabled: true },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true, onClick: handleLogout },
    ],
  };

  const logo = (
    <div style={{
      height: 48, display: 'flex', alignItems: 'center',
      justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
      paddingLeft: collapsed && !isMobile ? 0 : 20,
      gap: 10,
    }}>
      <div style={{
        width: 28, height: 28, background: 'var(--accent)',
        borderRadius: 4, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontWeight: 700, fontSize: 14,
        color: 'var(--accent-text)', fontFamily: 'var(--font-mono)',
        flexShrink: 0,
      }}>跟</div>
      {(!collapsed || isMobile) && (
        <Typography.Text strong style={{
          color: 'var(--text-primary)', fontSize: 16,
          fontFamily: 'var(--font-mono)', letterSpacing: 2,
        }}>跟仓</Typography.Text>
      )}
    </div>
  );

  const menuComponent = (
    <>
      {logo}
      <Menu
        style={{ marginTop: 16, background: 'transparent', borderInlineEnd: 'none' }}
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => handleNav(key)}
      />
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={240}
          style={{
            position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 10,
            overflow: 'auto',
          }}
        >
          {menuComponent}
        </Sider>
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <Drawer
          placement="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          width={240}
          styles={{ body: { padding: 0 }, header: { display: 'none' } }}
        >
          {menuComponent}
        </Drawer>
      )}

      {/* Main content area */}
      <Layout style={{
        marginLeft: isMobile ? 0 : (collapsed ? 64 : 240),
        transition: 'margin-left 0.2s',
      }}>
        <Header style={{
          padding: '0 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 52,
          position: 'sticky',
          top: 0,
          zIndex: 9,
        }}>
          <Space>
            {isMobile ? (
              <Button type="text" icon={<MenuOutlined />} onClick={() => setMobileDrawerOpen(true)} />
            ) : (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
              />
            )}
            {/* Mobile theme toggle */}
            {isMobile && (
              <Button
                type="text"
                icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleTheme}
                title="切换主题"
              />
            )}
          </Space>

          <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
            <Button type="text" icon={<UserOutlined />} style={{ color: 'var(--text-primary)' }}>
              <span className="hide-mobile">{user?.username}</span>
            </Button>
          </Dropdown>
        </Header>

        <Content style={{
          margin: isMobile ? 12 : 20,
          padding: isMobile ? 12 : 20,
          background: 'var(--bg-surface)',
          borderRadius: 8,
          border: '1px solid var(--border-default)',
          minHeight: 280,
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
