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
    render: (v: number) => v.toLocaleString()
  },
  {
    title: '累计卖出', dataIndex: 'totalSellAmount', key: 'sell',
    render: (v: number) => v.toLocaleString()
  },
  {
    title: '已实现盈亏', dataIndex: 'totalRealizedPnl', key: 'pnl',
    render: (v: number) => (
      <span style={{ color: v >= 0 ? '#cf1322' : '#3f8600' }}>
        {v >= 0 ? '+' : ''}{v.toLocaleString()}
      </span>
    )
  },
  { title: '交易次数', dataIndex: 'tradeCount', key: 'count' },
];

export default function HistoryPage() {
  const [data, setData] = useState<StockPnlSummary[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getAllStocksPnl().then(res => setData(res.data));
  }, []);

  return (
    <Card title="历史盈亏">
      <Table
        columns={columns}
        dataSource={data}
        rowKey="stockCode"
        onRow={(r) => ({
          onClick: () => navigate(`/history/${r.stockCode}`),
          style: { cursor: 'pointer' },
        })}
      />
    </Card>
  );
}
