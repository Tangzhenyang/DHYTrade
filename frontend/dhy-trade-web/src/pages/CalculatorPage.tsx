import { useState, useEffect } from 'react';
import { Card, InputNumber, Button, Table, Typography, Space, Select } from 'antd';
import { CalculatorOutlined } from '@ant-design/icons';
import { calculateCopy } from '../api/copy';
import type { CopyResultItem } from '../api/copy';
import { marketCurrencySymbols, marketCurrencyUnits, marketLabels, marketOptions, type MarketType } from '../constants/markets';

function formatMoney(value: number, marketType: MarketType, digits = 0) {
  return `${marketCurrencySymbols[marketType]}${value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export default function CalculatorPage() {
  const [capital, setCapital] = useState<number>(1000000);
  const [marketType, setMarketType] = useState<MarketType>('AShare');
  const [items, setItems] = useState<CopyResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const totalActual = items.reduce((sum, item) => sum + item.actualAmount, 0);

  const updateItemLots = (stockCode: string, lots: number | null) => {
    const nextLots = Math.max(0, Math.floor(lots || 0));
    setItems((prev) =>
      prev.map((item) =>
        item.stockCode === stockCode
          ? {
              ...item,
              suggestLots: nextLots,
              actualAmount: nextLots * 100 * item.price,
            }
          : item
      )
    );
  };

  const columns = [
    { title: '股票', dataIndex: 'stockName', key: 'name' },
    { title: '代码', dataIndex: 'stockCode', key: 'code' },
    {
      title: '目标占比', dataIndex: 'targetRatio', key: 'ratio',
      render: (v: number) => `${(v * 100).toFixed(1)}%`
    },
    {
      title: '目标金额', dataIndex: 'targetAmount', key: 'amount',
      render: (v: number) => <span style={{ fontFamily: 'var(--font-mono)' }}>{formatMoney(v, marketType)}</span>
    },
    {
      title: '现价', dataIndex: 'price', key: 'price',
      render: (v: number) => <span style={{ fontFamily: 'var(--font-mono)' }}>{formatMoney(v, marketType, 2)}</span>
    },
    {
      title: '手数', dataIndex: 'suggestLots', key: 'lots',
      render: (v: number, record: CopyResultItem) => (
        <InputNumber
          value={v}
          min={0}
          step={1}
          precision={0}
          onChange={(value) => updateItemLots(record.stockCode, value)}
          style={{ width: 96 }}
        />
      )
    },
    {
      title: '实际金额', dataIndex: 'actualAmount', key: 'actual',
      render: (v: number) => <span style={{ fontFamily: 'var(--font-mono)' }}>{formatMoney(v, marketType)}</span>
    },
  ];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const res = await calculateCopy(marketType, capital);
      setItems(res.data.items);
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
        <Select
          value={marketType}
          onChange={(value) => setMarketType(value)}
          options={marketOptions}
          style={{ width: isMobile ? '100%' : 140 }}
        />
        <InputNumber
          value={capital}
          onChange={(v) => setCapital(v || 0)}
          min={1}
          step={100000}
          style={{ width: isMobile ? '100%' : 200 }}
          addonBefore={marketCurrencySymbols[marketType]}
          addonAfter={marketCurrencyUnits[marketType]}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(v) => Number(v!.replace(/,/g, ''))}
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
            {marketLabels[marketType]}建议投入总金额：<Typography.Text strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{formatMoney(totalActual, marketType)} {marketCurrencyUnits[marketType]}</Typography.Text>
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
