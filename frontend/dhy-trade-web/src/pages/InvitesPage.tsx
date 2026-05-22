import { useEffect, useState } from 'react';
import { Card, Table, Button, message, Typography, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getInvites, createInvite } from '../api/invites';
import dayjs from 'dayjs';

export default function InvitesPage() {
  const [invites, setInvites] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      render: (v: string) => <Typography.Text copyable strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{v}</Typography.Text>,
    },
    {
      title: '状态', dataIndex: 'isUsed', key: 'status',
      render: (v: boolean) => v
        ? <Tag style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>已使用</Tag>
        : <Tag style={{ background: 'var(--positive)', borderColor: 'transparent', color: '#fff' }}>可用</Tag>,
    },
    {
      title: '有效期', dataIndex: 'expiresAt', key: 'expire',
      render: (v: string | null) => v
        ? <span style={{ fontFamily: 'var(--font-mono)' }}>{dayjs(v).format('YYYY-MM-DD')}</span>
        : <span style={{ color: 'var(--text-muted)' }}>永久有效</span>,
    },
    {
      title: '创建时间', dataIndex: 'createdAt', key: 'time',
      render: (v: string) => <span style={{ fontFamily: 'var(--font-mono)' }}>{dayjs(v).format('YYYY-MM-DD HH:mm')}</span>,
    },
  ];

  return (
    <Card className="animate-in stagger-1" title={<span style={{ color: 'var(--text-primary)' }}>邀请码管理</span>}
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          生成邀请码
        </Button>
      }>
      <Table columns={columns} dataSource={invites} rowKey="id" size="small"
        scroll={{ x: isMobile ? 600 : undefined }}
        style={{ fontFamily: 'var(--font-mono)' }} />
    </Card>
  );
}
