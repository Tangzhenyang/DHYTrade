import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';

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
            width: 48, height: 48, background: 'var(--accent)',
            borderRadius: 6, display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 20, fontWeight: 700,
            color: 'var(--accent-text)', fontFamily: 'var(--font-mono)',
            marginBottom: 16,
          }}>跟</div>
          <Typography.Title level={3} style={{ color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-mono)', letterSpacing: 4 }}>
            跟仓系统
          </Typography.Title>
          <Typography.Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            DHY Trade
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
