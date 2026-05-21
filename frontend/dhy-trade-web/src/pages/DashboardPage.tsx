import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Spin, Button, InputNumber, message, Space } from 'antd';
import {
  DollarOutlined, PieChartOutlined, RiseOutlined, ArrowDownOutlined, EditOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { usePositionStore } from '../stores/positionStore';
import { useAuthStore } from '../stores/authStore';
import { setBaseCapital } from '../api/config';
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
  const { positions, loading, totalCost, totalMarketValue, totalPnl, baseCapital, refresh } = usePositionStore();
  const { user } = useAuthStore();
  const isOperator = user?.role === 'SuperAdmin' || user?.role === 'Operator';
  const [editing, setEditing] = useState(false);
  const [capitalInput, setCapitalInput] = useState(baseCapital);
  const [saving, setSaving] = useState(false);

  useEffect(() => { refresh(); }, [refresh]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setBaseCapital(capitalInput);
      message.success('基准仓位已更新');
      setEditing(false);
      refresh();
    } catch {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

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
          <Card>
            {editing ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Statistic title="基准仓位" value={capitalInput} precision={0}
                  prefix={<DollarOutlined />} suffix="元" />
                <InputNumber
                  value={capitalInput}
                  onChange={(v) => setCapitalInput(v || 0)}
                  min={1}
                  step={100000}
                  style={{ width: '100%' }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => Number(v!.replace(/,/g, ''))}
                />
                <Space>
                  <Button size="small" type="primary" loading={saving} onClick={handleSave}>保存</Button>
                  <Button size="small" onClick={() => setEditing(false)}>取消</Button>
                </Space>
              </Space>
            ) : (
              <>
                <Statistic title="基准仓位" value={baseCapital} precision={0}
                  prefix={<DollarOutlined />} suffix="元" />
                {isOperator && (
                  <Button
                    type="link" size="small" icon={<EditOutlined />}
                    style={{ marginTop: 8 }}
                    onClick={() => { setCapitalInput(baseCapital); setEditing(true); }}
                  >
                    设置
                  </Button>
                )}
              </>
            )}
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
