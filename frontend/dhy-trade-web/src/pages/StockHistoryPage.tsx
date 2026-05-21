import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Table, Typography, Row, Col, Statistic } from 'antd';
import dayjs from 'dayjs';
import { getStockPnlDetail } from '../api/history';
import type { StockPnlDetail, PnlItem } from '../api/history';

const columns = [
  { title: '时间', dataIndex: 'tradedAt', key: 'time',
    render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
  { title: '卖出数量', dataIndex: 'shares', key: 'shares' },
  { title: '卖出价', dataIndex: 'price', key: 'price',
    render: (v: number) => v.toFixed(2) },
  { title: '卖出收入', dataIndex: 'revenue', key: 'revenue',
    render: (v: number) => v.toLocaleString() },
  { title: '匹配成本', dataIndex: 'matchedCost', key: 'cost',
    render: (v: number) => v.toLocaleString() },
  { title: '盈亏', dataIndex: 'pnl', key: 'pnl',
    render: (v: number) => (
      <span style={{ color: v >= 0 ? '#cf1322' : '#3f8600' }}>
        {v >= 0 ? '+' : ''}{v.toLocaleString()}
      </span>
    )
  },
];

export default function StockHistoryPage() {
  const { stockCode } = useParams<{ stockCode: string }>();
  const [detail, setDetail] = useState<StockPnlDetail | null>(null);

  useEffect(() => {
    if (stockCode) {
      getStockPnlDetail(stockCode).then(res => setDetail(res.data));
    }
  }, [stockCode]);

  if (!detail) return null;

  return (
    <Card title={`${detail.stockName} (${detail.stockCode}) 历史盈亏`}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Statistic title="累计买入" value={detail.totalBuyAmount} precision={0} />
        </Col>
        <Col span={6}>
          <Statistic title="累计卖出" value={detail.totalSellAmount} precision={0} />
        </Col>
        <Col span={6}>
          <Statistic title="已实现盈亏" value={detail.totalRealizedPnl} precision={0}
            valueStyle={{ color: detail.totalRealizedPnl >= 0 ? '#cf1322' : '#3f8600' }} />
        </Col>
        <Col span={6}>
          <Statistic title="交易次数" value={detail.tradeCount} />
        </Col>
      </Row>

      <Typography.Title level={5}>卖出盈亏明细</Typography.Title>
      <Table columns={columns} dataSource={detail.pnlItems} rowKey="tradeId"
        pagination={false} size="small" />
    </Card>
  );
}
