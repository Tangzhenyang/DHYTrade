import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table } from 'antd';
import { getAllStocksPnl } from '../api/history';
import type { StockPnlSummary } from '../api/history';

const columns = [
  { title: '股票', dataIndex: 'stockName', key: 'name' },
  { title: '代码', dataIndex: 'stockCode', key: 'code' },
  {
    title: '累计买入', dataIndex: 'totalBuyAmount', key: 'buy',
    render: (v: number) => <span style={{ fontFamily: 'var(--font-mono)' }}>{v.toLocaleString()}</span>
  },
  {
    title: '累计卖出', dataIndex: 'totalSellAmount', key: 'sell',
    render: (v: number) => <span style={{ fontFamily: 'var(--font-mono)' }}>{v.toLocaleString()}</span>
  },
  {
    title: '已实现盈亏', dataIndex: 'totalRealizedPnl', key: 'pnl',
    render: (v: number) => (
      <span className={v >= 0 ? 'pnl-up' : 'pnl-down'} style={{ fontFamily: 'var(--font-mono)' }}>
        {v >= 0 ? '+' : ''}{v.toLocaleString()}
      </span>
    )
  },
  { title: '交易次数', dataIndex: 'tradeCount', key: 'count' },
];

export default function HistoryPage() {
  const [data, setData] = useState<StockPnlSummary[]>([]);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    getAllStocksPnl().then(res => setData(res.data));
  }, []);

  return (
    <Card className="animate-in stagger-1" title={<span style={{ color: 'var(--text-primary)' }}>历史盈亏</span>}
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="stockCode"
        onRow={(r) => ({
          onClick: () => navigate(`/history/${r.stockCode}`),
          style: { cursor: 'pointer' },
        })}
        size="small"
        scroll={{ x: isMobile ? 600 : undefined }}
        style={{ fontFamily: 'var(--font-mono)' }}
      />
    </Card>
  );
}
