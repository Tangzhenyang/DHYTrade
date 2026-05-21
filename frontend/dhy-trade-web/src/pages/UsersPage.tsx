import { useEffect, useState } from 'react';
import { Card, Table, Select, Switch, message } from 'antd';
import { getUsers, updateUserRole, toggleUserActive } from '../api/users';
import type { UserDto } from '../api/auth';

export default function UsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);

  const load = async () => {
    const res = await getUsers();
    setUsers(res.data);
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (id: string, role: string) => {
    await updateUserRole(id, role);
    message.success('角色已更新');
    load();
  };

  const handleActiveToggle = async (id: string, checked: boolean) => {
    await toggleUserActive(id, checked);
    message.success('状态已更新');
    load();
  };

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '角色', dataIndex: 'role', key: 'role',
      render: (role: string, record: UserDto) => (
        <Select value={role} style={{ width: 120 }}
          onChange={(v) => handleRoleChange(record.id, v)}
          options={[
            { label: '超级管理员', value: 'SuperAdmin' },
            { label: '操作员', value: 'Operator' },
            { label: '普通用户', value: 'User' },
          ]}
        />
      ),
    },
    {
      title: '状态', dataIndex: 'isActive', key: 'active',
      render: (v: boolean, record: UserDto) => (
        <Switch checked={v} onChange={(c) => handleActiveToggle(record.id, c)} />
      ),
    },
    {
      title: '注册时间', dataIndex: 'createdAt', key: 'time',
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
  ];

  return (
    <Card title="用户管理">
      <Table columns={columns} dataSource={users} rowKey="id" size="small" />
    </Card>
  );
}
