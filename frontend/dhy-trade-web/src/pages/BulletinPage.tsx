import { useEffect, useState } from 'react';
import {
  Card, List, Typography, Button, Modal, Form,
  Input, Switch, Popconfirm, message, Tag, Space
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getBulletins, createBulletin, updateBulletin, deleteBulletin } from '../api/bulletins';
import { useAuthStore } from '../stores/authStore';
import type { BulletinDto } from '../api/bulletins';

export default function BulletinPage() {
  const [bulletins, setBulletins] = useState<BulletinDto[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const { user } = useAuthStore();
  const isOperator = user?.role === 'SuperAdmin' || user?.role === 'Operator';

  const load = async () => {
    const res = await getBulletins();
    setBulletins(res.data);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    const values = await form.validateFields();
    if (editingId) {
      await updateBulletin(editingId, values);
    } else {
      await createBulletin(values);
    }
    message.success('已保存');
    setModalOpen(false);
    form.resetFields();
    load();
  };

  const handleEdit = (b: BulletinDto) => {
    setEditingId(b.id);
    form.setFieldsValue(b);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteBulletin(id);
    message.success('已删除');
    load();
  };

  return (
    <Card title="公告栏" extra={
      isOperator && (
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingId(null);
          form.resetFields();
          setModalOpen(true);
        }}>
          发布公告
        </Button>
      )
    }>
      <List
        dataSource={bulletins}
        renderItem={(item) => (
          <List.Item
            extra={isOperator && (
              <Space>
                <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(item)} />
                <Popconfirm title="确定删除？" onConfirm={() => handleDelete(item.id)}>
                  <Button icon={<DeleteOutlined />} size="small" danger />
                </Popconfirm>
              </Space>
            )}
          >
            <List.Item.Meta
              title={
                <Space>
                  {item.isPinned && <Tag color="red">置顶</Tag>}
                  <Typography.Text strong>{item.title}</Typography.Text>
                </Space>
              }
              description={
                <>
                  <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                    {item.content}
                  </Typography.Paragraph>
                  <Typography.Text type="secondary">
                    {item.authorName} · {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                  </Typography.Text>
                </>
              }
            />
          </List.Item>
        )}
      />

      <Modal title={editingId ? '编辑公告' : '发布公告'} open={modalOpen}
        onCancel={() => setModalOpen(false)} onOk={handleSave}>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true }]}>
            <Input.TextArea rows={6} />
          </Form.Item>
          <Form.Item name="isPinned" label="置顶" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
