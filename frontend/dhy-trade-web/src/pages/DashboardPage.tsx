import { useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Spin } from 'antd';
import {
  DollarOutlined, PieChartOutlined, RiseOutlined, ArrowDownOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { usePositionStore } from '../stores/positionStore';
import type { PositionDto } from '../api/positions';

const columns = [
  { title: '股票', dataIndex: 'stockName', key: 'name', width: 120 },
  { title: '代码', dataIndex: 'stockCode', key: 'code', width: 100 },
  {
    title: '持仓股数', dataIndex: 'shares', key: 'shares',
    render: (v: number) => v.toLocaleString()
  },
  {
    title: '均价', dataIndex: 'avgCost', key: 'avgCost',
    render: (v: number) => v.toFixed(2)
  },
  {
    title: '现价', dataIndex: 'currentPrice', key: 'price',
    render: (v: number) => v.toFixed(2)
  },
  {
    title: '市值', dataIndex: 'marketValue', key: 'mv',
    render: (v: number) => v.toLocaleString()
  },
  {
    title: '占比', dataIndex: 'ratioPct', key: 'ratio',
    render: (v: number) => `${v.toFixed(1)}%`
  },
  {
    title: '浮动盈亏', dataIndex: 'unrealizedPnl', key: 'pnl',
    render: (v: number, r: PositionDto) => (
      <span style={{ color: v >= 0 ? '#cf1322' : '#3f8600' }}>
        {v >= 0 ? '+' : ''}{v.toLocaleString()} ({(r.unrealizedPnlPct * 100).toFixed(2)}%)
      </span>
    )
  },
  {
    title: '持仓天数', dataIndex: 'holdDays', key: 'days',
    render: (v: number) => `${v}天`
  },
];

export default function DashboardPage() {
  const { positions, loading, totalCost, totalMarketValue, totalPnl, refresh } = usePositionStore();

  useEffect(() => { refresh(); }, [refresh]);

  const pieOption = {
    title: { text: '仓位占比', left: 'center' },
    tooltip: { trigger: 'item' as const },
    legend: { bottom: 0 },
    series: [{
      type: 'pie' as const,
      radius: ['40%', '70%'],
      data: positions.map(p => ({
        name: p.stockName,
        value: Number(p.totalCost.toFixed(0))
      })),
    }],
  };

  return (
    <Spin spinning={loading}>
      <Row gutter={[16, 24]}>
        <Col span={8}>
          <Card><Statistic title="基准仓位" value={totalCost} precision={0}
            prefix={<DollarOutlined />} suffix="元" />
          </Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="当前市值" value={totalMarketValue} precision={0}
            prefix={<PieChartOutlined />} suffix="元" />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="浮动盈亏" value={totalPnl} precision={0}
              prefix={totalPnl >= 0 ? <RiseOutlined /> : <ArrowDownOutlined />}
              suffix="元"
              valueStyle={{ color: totalPnl >= 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={10}>
          <Card><ReactECharts option={pieOption} style={{ height: 350 }} /></Card>
        </Col>
        <Col span={14}>
          <Card title="持仓明细">
            <Table
              columns={columns}
              dataSource={positions}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>
      </Row>
    </Spin>
  );
}
