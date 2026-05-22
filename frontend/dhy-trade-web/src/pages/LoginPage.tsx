import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';

function YellowCroakerIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="login-croaker-body" x1="6" y1="8" x2="25" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFD76A" />
          <stop offset="1" stopColor="#F3A61B" />
        </linearGradient>
      </defs>
      <path d="M7 16C7 11.6 11.2 8 16.6 8C20.1 8 23.1 9.5 24.8 11.7L28 10L26.8 14L29 16L26.8 18L28 22L24.8 20.3C23.1 22.5 20.1 24 16.6 24C11.2 24 7 20.4 7 16Z" fill="url(#login-croaker-body)" stroke="#C88408" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M13.5 12.2L11.4 9.8L15.2 10.6L13.5 12.2Z" fill="#F7C94A" stroke="#C88408" strokeWidth="1" strokeLinejoin="round"/>
      <path d="M13.5 19.8L11.4 22.2L15.2 21.4L13.5 19.8Z" fill="#F7C94A" stroke="#C88408" strokeWidth="1" strokeLinejoin="round"/>
      <circle cx="11.7" cy="15" r="1.35" fill="#24324A" />
      <path d="M16.2 16.8C17.2 17.6 18.7 17.6 19.7 16.8" stroke="#A76500" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success('登录成功');
      navigate('/dashboard');
    } catch {
      message.error('用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', background: 'var(--bg-primary)',
      padding: 20,
    }}>
      <div style={{
        width: 380, maxWidth: '100%',
        background: 'var(--bg-surface)', borderRadius: 8,
        border: '1px solid var(--border-default)',
        padding: '40px 32px', boxShadow: 'var(--shadow-card)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56,
            borderRadius: '50%', display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            background: 'radial-gradient(circle at 30% 30%, rgba(255, 215, 106, 0.22), rgba(243, 166, 27, 0.08))',
            boxShadow: '0 10px 24px rgba(243, 166, 27, 0.16)',
          }}><YellowCroakerIcon /></div>
          <Typography.Title level={3} style={{ color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-mono)', letterSpacing: 4 }}>
            大黄鱼跟仓系统
          </Typography.Title>
          <Typography.Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            Da Huang Yu Trade
          </Typography.Text>
        </div>

        <Divider style={{ borderColor: 'var(--border-default)', margin: '0 0 24px' }} />

        <Form onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined style={{ color: 'var(--text-secondary)' }} />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: 'var(--text-secondary)' }} />} placeholder="密码" />
          </Form.Item>
          <Form.Item style={{ marginTop: 8 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登 录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          <Link to="/register" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            没有账号？注册
          </Link>
        </div>
      </div>
    </div>
  );
}
