import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, KeyOutlined } from '@ant-design/icons';
import { register } from '../api/auth';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: {
    username: string; email: string; password: string; inviteCode: string;
  }) => {
    setLoading(true);
    try {
      await register(values);
      message.success('注册成功，请登录');
      navigate('/login');
    } catch {
      message.error('注册失败，请检查邀请码是否正确');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', background: 'var(--bg-primary)', padding: 20,
    }}>
      <div style={{
        width: 380, maxWidth: '100%',
        background: 'var(--bg-surface)', borderRadius: 8,
        border: '1px solid var(--border-default)',
        padding: '40px 32px', boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 40, height: 40, background: 'var(--accent)',
            borderRadius: 6, display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 16, fontWeight: 700,
            color: 'var(--accent-text)', fontFamily: 'var(--font-mono)',
            marginBottom: 12,
          }}>注</div>
          <Typography.Title level={3} style={{ color: 'var(--text-primary)', margin: 0 }}>
            注册账号
          </Typography.Title>
        </div>

        <Divider style={{ borderColor: 'var(--border-default)', margin: '0 0 24px' }} />

        <Form onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined style={{ color: 'var(--text-secondary)' }} />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效邮箱' }]}>
            <Input prefix={<MailOutlined style={{ color: 'var(--text-secondary)' }} />} placeholder="邮箱" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: 'var(--text-secondary)' }} />} placeholder="密码" />
          </Form.Item>
          <Form.Item name="inviteCode" rules={[{ required: true, message: '请输入邀请码' }]}>
            <Input prefix={<KeyOutlined style={{ color: 'var(--text-secondary)' }} />} placeholder="邀请码" />
          </Form.Item>
          <Form.Item style={{ marginTop: 8 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>注 册</Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            已有账号？登录
          </Link>
        </div>
      </div>
    </div>
  );
}
