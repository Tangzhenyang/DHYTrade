import { useState } from 'react';
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
    render: (v: number) => v.toLocaleString()
  },
  {
    title: '现价', dataIndex: 'price', key: 'price',
    render: (v: number) => v.toFixed(2)
  },
  { title: '建议手数', dataIndex: 'suggestLots', key: 'lots' },
  {
    title: '实际金额', dataIndex: 'actualAmount', key: 'actual',
    render: (v: number) => v.toLocaleString()
  },
];

export default function CalculatorPage() {
  const [capital, setCapital] = useState<number>(1000000);
  const [items, setItems] = useState<CopyResultItem[]>([]);
  const [totalActual, setTotalActual] = useState(0);
  const [loading, setLoading] = useState(false);

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
    <Card title="跟仓计算器">
      <Space style={{ marginBottom: 24 }}>
        <Typography.Text strong>我的资金：</Typography.Text>
        <InputNumber
          value={capital}
          onChange={(v) => setCapital(v || 0)}
          min={1}
          step={100000}
          style={{ width: 200 }}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(v) => Number(v!.replace(/,/g, ''))}
          addonAfter="元"
        />
        <Button type="primary" icon={<CalculatorOutlined />}
          loading={loading} onClick={handleCalculate}>
          计算
        </Button>
      </Space>

      {items.length > 0 && (
        <>
          <Typography.Paragraph style={{ marginBottom: 16 }}>
            建议投入总金额：<Typography.Text strong>{totalActual.toLocaleString()} 元</Typography.Text>
          </Typography.Paragraph>
          <Table columns={columns} dataSource={items} rowKey="stockCode"
            pagination={false} size="small" />
        </>
      )}
    </Card>
  );
}
