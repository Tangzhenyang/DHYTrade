import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber,
  Select, DatePicker, Tag, Popconfirm, message, Card
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getTrades, addTrade, deleteTrade } from '../api/trades';
import { useAuthStore } from '../stores/authStore';
import type { TradeRecordDto } from '../api/trades';

export default function TradesPage() {
  const [trades, setTrades] = useState<TradeRecordDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const { user } = useAuthStore();
  const isOperator = user?.role === 'SuperAdmin' || user?.role === 'Operator';

  const loadTrades = async () => {
    setLoading(true);
    try {
      const res = await getTrades();
      setTrades(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTrades(); }, []);

  const handleAdd = async () => {
    setSubmitting(true);
    try {
      const values = await form.validateFields();
      await addTrade({
        stockCode: values.stockCode,
        stockName: values.stockName,
        type: values.type,
        lots: values.lots,
        note: values.note,
        tradedAt: values.tradedAt?.toISOString(),
      });
      message.success('操作记录已添加');
      setModalOpen(false);
      form.resetFields();
      loadTrades();
    } catch {
      // handled by form validation or API
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTrade(id);
    message.success('已删除');
    loadTrades();
  };

  const columns = [
    { title: '时间', dataIndex: 'tradedAt', key: 'time', width: 160,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '股票', dataIndex: 'stockName', key: 'name', width: 120 },
    { title: '代码', dataIndex: 'stockCode', key: 'code', width: 100 },
    { title: '方向', dataIndex: 'type', key: 'type', width: 80,
      render: (v: string) => <Tag color={v === 'Buy' ? 'red' : 'green'}>{v === 'Buy' ? '买入' : '卖出'}</Tag> },
    { title: '手数', dataIndex: 'lots', key: 'lots' },
    { title: '价格', dataIndex: 'price', key: 'price', render: (v: number) => v.toFixed(2) },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: number) => v.toLocaleString() },
    { title: '手续费', dataIndex: 'commission', key: 'comm', render: (v: number) => v.toFixed(2) },
    { title: '操作员', dataIndex: 'operatorName', key: 'op' },
    ...(isOperator ? [{
      title: '操作', key: 'action', width: 80,
      render: (_: unknown, r: TradeRecordDto) => (
        <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
          <Button type="link" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    }] : []),
  ];

  return (
    <Card title="交易记录" extra={
      isOperator && (
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          添加记录
        </Button>
      )
    }>
      <Table columns={columns} dataSource={trades} rowKey="id" loading={loading}
        pagination={{ pageSize: 20 }} size="small" />

      <Modal title="新增操作记录" open={modalOpen} onCancel={() => setModalOpen(false)}
        onOk={handleAdd} confirmLoading={submitting}>
        <Form form={form} layout="vertical">
          <Form.Item name="stockCode" label="股票代码" rules={[{ required: true }]}>
            <Input placeholder="如 sh600519" />
          </Form.Item>
          <Form.Item name="stockName" label="股票名称" rules={[{ required: true }]}>
            <Input placeholder="如 贵州茅台" />
          </Form.Item>
          <Form.Item name="type" label="方向" rules={[{ required: true }]}>
            <Select options={[
              { label: '买入', value: 'Buy' },
              { label: '卖出', value: 'Sell' },
            ]} />
          </Form.Item>
          <Form.Item name="lots" label="手数" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="tradedAt" label="交易时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
