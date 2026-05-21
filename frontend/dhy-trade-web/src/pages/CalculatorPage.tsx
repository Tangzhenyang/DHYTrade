import { useState, useEffect } from 'react';
import { Card, InputNumber, Button, Table, Typography, Space } from 'antd';
import { CalculatorOutlined } from '@ant-design/icons';
import { calculateCopy } from '../api/copy';
import type { CopyResultItem } from '../api/copy';

const columns = [
  { title: '股票', dataIndex: 'stockName', key: 'name' },
  { title: '代码', dataIndex: 'stockCode', key: 'code' },
  {
    title: '目标占比', dataIndex: 'targetRatio', key: 'ratio',
    render: (v: number) => `${(v * 100).toFixed(1)}%`
  },
  {
    title: '目标金额', dataIndex: 'targetAmount', key: 'amount',
    render: (v: number) => <span style={{ fontFamily: 'var(--font-mono)' }}>{v.toLocaleString()}</span>
  },
  {
    title: '现价', dataIndex: 'price', key: 'price',
    render: (v: number) => <span style={{ fontFamily: 'var(--font-mono)' }}>{v.toFixed(2)}</span>
  },
  {
    title: '建议手数', dataIndex: 'suggestLots', key: 'lots',
    render: (v: number) => <span style={{ fontFamily: 'var(--font-mono)' }}>{v}</span>
  },
  {
    title: '实际金额', dataIndex: 'actualAmount', key: 'actual',
    render: (v: number) => <span style={{ fontFamily: 'var(--font-mono)' }}>{v.toLocaleString()}</span>
  },
];

export default function CalculatorPage() {
  const [capital, setCapital] = useState<number>(1000000);
  const [items, setItems] = useState<CopyResultItem[]>([]);
  const [totalActual, setTotalActual] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const res = await calculateCopy(capital);
      setItems(res.data.items);
      setTotalActual(res.data.totalActualAmount);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="animate-in stagger-1" title={<span style={{ color: 'var(--text-primary)' }}>跟仓计算器</span>}
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
      <Space style={{ marginBottom: 24, width: isMobile ? '100%' : undefined }}
        direction={isMobile ? 'vertical' : 'horizontal'}>
        <Typography.Text strong style={{ color: 'var(--text-primary)' }}>我的资金：</Typography.Text>
        <InputNumber
          value={capital}
          onChange={(v) => setCapital(v || 0)}
          min={1}
          step={100000}
          style={{ width: isMobile ? '100%' : 200 }}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(v) => Number(v!.replace(/,/g, ''))}
          addonAfter="元"
        />
        <Button type="primary" icon={<CalculatorOutlined />}
          loading={loading} onClick={handleCalculate}
          style={{ width: isMobile ? '100%' : undefined }}>
          计算
        </Button>
      </Space>

      {items.length > 0 && (
        <>
          <Typography.Paragraph style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
            建议投入总金额：<Typography.Text strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{totalActual.toLocaleString()} 元</Typography.Text>
          </Typography.Paragraph>
          <Table columns={columns} dataSource={items} rowKey="stockCode"
            pagination={false} size="small"
            scroll={{ x: isMobile ? 600 : undefined }}
            style={{ fontFamily: 'var(--font-mono)' }} />
        </>
      )}
    </Card>
  );
}
