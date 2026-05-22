import { useState } from 'react';
import { App, Button, Card, Form, Input, Space, Typography } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { updateEmail, updatePassword } from '../api/profile';

function getErrorMessage(error: unknown, fallback: string) {
  const maybeAxiosError = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };

  return maybeAxiosError.response?.data?.message
    || maybeAxiosError.message
    || fallback;
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const { message } = App.useApp();
  const [emailForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateEmail = async () => {
    setSavingEmail(true);
    try {
      const values = await emailForm.validateFields();
      const response = await updateEmail(values.email, values.currentPassword);
      setUser(response.data);
      emailForm.setFieldsValue({ currentPassword: '' });
      message.success('邮箱已更新');
    } catch (error) {
      message.error(getErrorMessage(error, '邮箱更新失败'));
    } finally {
      setSavingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    setSavingPassword(true);
    try {
      const values = await passwordForm.validateFields();
      await updatePassword(values.currentPassword, values.newPassword);
      passwordForm.resetFields();
      message.success('密码已更新');
    } catch (error) {
      message.error(getErrorMessage(error, '密码更新失败'));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Space direction="vertical" size={24} style={{ width: '100%', paddingInline: 12 }}>
      <Card className="animate-in stagger-1" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
        <Space direction="vertical" size={8}>
          <Typography.Title level={3} style={{ margin: 0, color: 'var(--text-primary)' }}>个人中心</Typography.Title>
          <Typography.Text style={{ color: 'var(--text-secondary)' }}>管理你的邮箱和登录密码。</Typography.Text>
        </Space>
      </Card>

      <Card className="animate-in stagger-2" title={<span style={{ color: 'var(--text-primary)' }}>账户信息</span>}
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Text style={{ color: 'var(--text-secondary)' }}><UserOutlined /> 用户名：{user?.username}</Typography.Text>
          <Typography.Text style={{ color: 'var(--text-secondary)' }}>角色：{user?.role}</Typography.Text>
          <Typography.Text style={{ color: 'var(--text-secondary)' }}>当前邮箱：{user?.email}</Typography.Text>
        </Space>
      </Card>

      <Card className="animate-in stagger-3" title={<span style={{ color: 'var(--text-primary)' }}>修改邮箱</span>}
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
        <Form form={emailForm} layout="vertical" initialValues={{ email: user?.email }}>
          <Form.Item name="email" label="新邮箱" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}> 
            <Input prefix={<MailOutlined />} placeholder="name@example.com" />
          </Form.Item>
          <Form.Item name="currentPassword" label="当前密码" rules={[{ required: true, message: '请输入当前密码' }]}> 
            <Input.Password prefix={<LockOutlined />} placeholder="输入当前密码确认" />
          </Form.Item>
          <Button type="primary" loading={savingEmail} onClick={handleUpdateEmail}>更新邮箱</Button>
        </Form>
      </Card>

      <Card className="animate-in stagger-4" title={<span style={{ color: 'var(--text-primary)' }}>修改密码</span>}
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
        <Form form={passwordForm} layout="vertical">
          <Form.Item name="currentPassword" label="当前密码" rules={[{ required: true, message: '请输入当前密码' }]}> 
            <Input.Password prefix={<LockOutlined />} placeholder="当前密码" />
          </Form.Item>
          <Form.Item name="newPassword" label="新密码" rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '密码至少 6 位' }]}> 
            <Input.Password prefix={<LockOutlined />} placeholder="不少于 6 位" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的新密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="再次输入新密码" />
          </Form.Item>
          <Button type="primary" loading={savingPassword} onClick={handleUpdatePassword}>更新密码</Button>
        </Form>
      </Card>
    </Space>
  );
}