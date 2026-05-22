import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Typography, Dropdown, Drawer, Space } from 'antd';
import {
  DashboardOutlined, SwapOutlined, CalculatorOutlined,
  SoundOutlined, HistoryOutlined, UserOutlined,
  TeamOutlined, KeyOutlined, LogoutOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, MenuOutlined,
  SunOutlined, MoonOutlined, SettingOutlined
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
      { key: 'role', label: `角色：${user?.role}`, disabled: true },
      { key: 'profile', icon: <SettingOutlined />, label: '个人中心', onClick: () => navigate('/profile') },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true, onClick: handleLogout },
    ],
  };

  const logo = (
    <div style={{
      height: 56, display: 'flex', alignItems: 'center',
      justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
      paddingLeft: collapsed && !isMobile ? 0 : 20,
      gap: 12,
      borderBottom: '1px solid var(--border-default)',
    }}>
      <div style={{
        width: 32, height: 32,
        background: 'linear-gradient(135deg, var(--accent), #4fc3f7)',
        borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontWeight: 800, fontSize: 16,
        color: '#ffffff', fontFamily: 'var(--font-sans)',
        flexShrink: 0,
        boxShadow: '0 4px 12px var(--bg-glow)',
      }}>跟</div>
      {(!collapsed || isMobile) && (
        <Typography.Text strong style={{
          color: 'var(--text-primary)', fontSize: 16,
          fontFamily: 'var(--font-sans)', letterSpacing: 1.5,
          fontWeight: 700,
        }}>跟仓系统</Typography.Text>
      )}
    </div>
  );

  const menuComponent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {logo}
      <Menu
        style={{ marginTop: 16, background: 'transparent', borderInlineEnd: 'none' }}
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => handleNav(key)}
      />
    </div>
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
        marginLeft: isMobile ? 0 : (collapsed ? 80 : 240),
        transition: 'margin-left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <Header style={{
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 56,
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
          </Space>

          <Space size={16}>
            {/* Elegant Sun / Moon Dynamic Toggle styled like Apple & Windows 11 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-soft)',
              padding: '3px',
              borderRadius: 999,
              border: '1px solid var(--border-default)',
              position: 'relative',
              cursor: 'pointer',
              userSelect: 'none',
              height: 32,
              width: 60,
            }} onClick={toggleTheme} title={`切换到${theme === 'dark' ? '亮色' : '暗色'}主题`}>
              <div style={{
                display: 'flex',
                gap: 6,
                position: 'relative',
                zIndex: 1,
                width: '100%',
                justifyContent: 'space-between',
                padding: '0 4px',
              }}>
                <div style={{
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme === 'light' ? 'var(--accent)' : 'var(--text-muted)',
                  transition: 'color 0.2s',
                }}>
                  <SunOutlined style={{ fontSize: 13 }} />
                </div>
                <div style={{
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme === 'dark' ? 'var(--accent)' : 'var(--text-muted)',
                  transition: 'color 0.2s',
                }}>
                  <MoonOutlined style={{ fontSize: 12 }} />
                </div>
              </div>
              {/* Active sliding indicators inside pill */}
              <div style={{
                position: 'absolute',
                top: 2,
                left: theme === 'light' ? 2 : 30,
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: 'var(--bg-elevated)',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                border: '1px solid var(--border-default)',
                transition: 'left 0.28s cubic-bezier(0.25, 1, 0.5, 1)',
                zIndex: 0,
              }} />
            </div>

            <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
              <Button 
                type="text" 
                icon={<UserOutlined />} 
                style={{ 
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  height: 32,
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-soft)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <span className="hide-mobile" style={{ marginLeft: 4 }}>{user?.username}</span>
              </Button>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{
          margin: isMobile ? 12 : 24,
          padding: isMobile ? 16 : 24,
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-card)',
          backdropFilter: 'var(--panel-blur)',
          minHeight: 280,
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
