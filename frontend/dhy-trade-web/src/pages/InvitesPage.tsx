import { useEffect, useState } from 'react';
import { Card, Table, Button, message, Typography, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getInvites, createInvite } from '../api/invites';
import dayjs from 'dayjs';

export default function InvitesPage() {
  const [invites, setInvites] = useState<any[]>([]);

  const load = async () => {
    const res = await getInvites();
    setInvites(res.data);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    await createInvite();
    message.success('邀请码已生成');
    load();
  };

  const columns = [
    {
      title: '邀请码', dataIndex: 'code', key: 'code',
      render: (v: string) => <Typography.Text copyable strong>{v}</Typography.Text>,
    },
    {
      title: '状态', dataIndex: 'isUsed', key: 'status',
      render: (v: boolean) => v ? <Tag color="default">已使用</Tag> : <Tag color="green">可用</Tag>,
    },
    {
      title: '有效期', dataIndex: 'expiresAt', key: 'expire',
      render: (v: string | null) => v ? dayjs(v).format('YYYY-MM-DD') : '永久有效',
    },
    {
      title: '创建时间', dataIndex: 'createdAt', key: 'time',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <Card title="邀请码管理" extra={
      <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
        生成邀请码
      </Button>
    }>
      <Table columns={columns} dataSource={invites} rowKey="id" size="small" />
    </Card>
  );
}
