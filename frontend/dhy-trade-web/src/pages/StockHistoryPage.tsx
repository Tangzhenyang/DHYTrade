import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Table, Typography, Row, Col, Statistic } from 'antd';
import dayjs from 'dayjs';
import { getStockPnlDetail } from '../api/history';
import type { StockPnlDetail, PnlItem } from '../api/history';

const columns = [
  {
    title: '时间', dataIndex: 'tradedAt', key: 'time',
    render: (v: string) => <span style={{ fontFamily: 'var(--font-mono)' }}>{dayjs(v).format('YYYY-MM-DD HH:mm')}</span>
  },
  { title: '卖出数量', dataIndex: 'shares', key: 'shares',
    render: (v: number) => <span style={{ fontFamily: 'var(--font-mono)' }}>{v}</span> },
  {
    title: '卖出价', dataIndex: 'price', key: 'price',
    render: (v: number) => <span style={{ fontFamily: 'var(--font-mono)' }}>{v.toFixed(2)}</span>
  },
  {
    title: '卖出收入', dataIndex: 'revenue', key: 'revenue',
    render: (v: number) => <span style={{ fontFamily: 'var(--font-mono)' }}>{v.toLocaleString()}</span>
  },
  {
    title: '匹配成本', dataIndex: 'matchedCost', key: 'cost',
    render: (v: number) => <span style={{ fontFamily: 'var(--font-mono)' }}>{v.toLocaleString()}</span>
  },
  {
    title: '盈亏', dataIndex: 'pnl', key: 'pnl',
    render: (v: number) => (
      <span className={v >= 0 ? 'pnl-up' : 'pnl-down'} style={{ fontFamily: 'var(--font-mono)' }}>
        {v >= 0 ? '+' : ''}{v.toLocaleString()}
      </span>
    )
  },
];

export default function StockHistoryPage() {
  const { stockCode } = useParams<{ stockCode: string }>();
  const [detail, setDetail] = useState<StockPnlDetail | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (stockCode) {
      getStockPnlDetail(stockCode).then(res => setDetail(res.data));
    }
  }, [stockCode]);

  if (!detail) return null;

  return (
    <Card className="animate-in stagger-1" title={<span style={{ color: 'var(--text-primary)' }}>{detail.stockName} ({detail.stockCode}) 历史盈亏</span>}
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={isMobile ? 12 : 6}>
          <Statistic title="累计买入" value={detail.totalBuyAmount} precision={0}
            valueStyle={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }} />
        </Col>
        <Col span={isMobile ? 12 : 6}>
          <Statistic title="累计卖出" value={detail.totalSellAmount} precision={0}
            valueStyle={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }} />
        </Col>
        <Col span={isMobile ? 12 : 6}>
          <Statistic title="已实现盈亏" value={detail.totalRealizedPnl} precision={0}
            valueStyle={{
              color: detail.totalRealizedPnl >= 0 ? 'var(--positive)' : 'var(--negative)',
              fontFamily: 'var(--font-mono)'
            }} />
        </Col>
        <Col span={isMobile ? 12 : 6}>
          <Statistic title="交易次数" value={detail.tradeCount}
            valueStyle={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }} />
        </Col>
      </Row>

      <Typography.Title level={5} style={{ color: 'var(--text-primary)' }}>卖出盈亏明细</Typography.Title>
      <Table columns={columns} dataSource={detail.pnlItems} rowKey="tradeId"
        pagination={false} size="small"
        scroll={{ x: isMobile ? 600 : undefined }}
        style={{ fontFamily: 'var(--font-mono)' }} />
    </Card>
  );
}
