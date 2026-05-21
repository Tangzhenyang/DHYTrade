import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Spin, Button, InputNumber, message, Space } from 'antd';
import {
  DollarOutlined, PieChartOutlined, RiseOutlined, ArrowDownOutlined, EditOutlined, ReloadOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { usePositionStore } from '../stores/positionStore';
import { useAuthStore } from '../stores/authStore';
import { setBaseCapital } from '../api/config';
import { refreshPositions } from '../api/positions';
import type { PositionDto } from '../api/positions';

const columns = [
  { title: '股票', dataIndex: 'stockName', key: 'name', width: 120 },
  { title: '代码', dataIndex: 'stockCode', key: 'code', width: 100 },
  {
    title: '持仓股数', dataIndex: 'shares', key: 'shares',
    render: (v: number) => <span style={{ fontFamily: 'var(--font-mono)' }}>{v.toLocaleString()}</span>
  },
  {
    title: '均价', dataIndex: 'avgCost', key: 'avgCost',
    render: (v: number) => <span style={{ fontFamily: 'var(--font-mono)' }}>{v.toFixed(2)}</span>
  },
  {
    title: '现价', dataIndex: 'currentPrice', key: 'price',
    render: (v: number) => <span style={{ fontFamily: 'var(--font-mono)' }}>{v.toFixed(2)}</span>
  },
  {
    title: '市值', dataIndex: 'marketValue', key: 'mv',
    render: (v: number) => <span style={{ fontFamily: 'var(--font-mono)' }}>{v.toLocaleString()}</span>
  },
  {
    title: '占比', dataIndex: 'ratioPct', key: 'ratio',
    render: (v: number) => `${v.toFixed(1)}%`
  },
  {
    title: '浮动盈亏', dataIndex: 'unrealizedPnl', key: 'pnl',
    render: (v: number, r: PositionDto) => (
      <span className={v >= 0 ? 'pnl-up' : 'pnl-down'} style={{ fontFamily: 'var(--font-mono)' }}>
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
  const [refreshingPrice, setRefreshingPrice] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleRefreshPrice = async () => {
    setRefreshingPrice(true);
    try {
      const res = await refreshPositions();
      message.success(res.data.message);
      refresh();
    } catch {
      message.error('刷新失败');
    } finally {
      setRefreshingPrice(false);
    }
  };

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
    title: { text: '仓位占比', left: 'center', textStyle: { color: 'var(--text-primary)' } },
    tooltip: { trigger: 'item' as const },
    legend: { bottom: 0, textStyle: { color: 'var(--text-secondary)' } },
    series: [{
      type: 'pie' as const,
      radius: ['40%', '70%'],
      data: positions.map(p => ({
        name: p.stockName,
        value: Number(p.totalCost.toFixed(0))
      })),
      itemStyle: { borderColor: 'var(--bg-surface)' },
    }],
  };

  return (
    <Spin spinning={loading}>
      <div style={{
        marginBottom: 16, display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 12 : 0
      }}>
        <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>仓位看板</h2>
        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefreshPrice}
          loading={refreshingPrice}
          style={{ width: isMobile ? '100%' : undefined }}
        >
          刷新行情
        </Button>
      </div>
      <Row gutter={[16, 24]}>
        <Col span={isMobile ? 24 : 8}>
          <Card className="animate-in stagger-1" style={{ background: 'var(--stat-card-bg)', border: '1px solid var(--border-default)' }}>
            {editing ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Statistic title="基准仓位" value={capitalInput} precision={0}
                  prefix={<DollarOutlined />} suffix="元"
                  valueStyle={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }} />
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
                  prefix={<DollarOutlined />} suffix="元"
                  valueStyle={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }} />
                {isOperator && (
                  <Button
                    type="link" size="small" icon={<EditOutlined />}
                    style={{ marginTop: 8, color: 'var(--accent)' }}
                    onClick={() => { setCapitalInput(baseCapital); setEditing(true); }}
                  >
                    设置
                  </Button>
                )}
              </>
            )}
          </Card>
        </Col>
        <Col span={isMobile ? 24 : 8}>
          <Card className="animate-in stagger-2" style={{ background: 'var(--stat-card-bg)', border: '1px solid var(--border-default)' }}>
            <Statistic title="当前市值" value={totalMarketValue} precision={0}
              prefix={<PieChartOutlined />} suffix="元"
              valueStyle={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }} />
          </Card>
        </Col>
        <Col span={isMobile ? 24 : 8}>
          <Card className="animate-in stagger-3" style={{ background: 'var(--stat-card-bg)', border: '1px solid var(--border-default)' }}>
            <Statistic title="浮动盈亏" value={totalPnl} precision={0}
              prefix={totalPnl >= 0 ? <RiseOutlined /> : <ArrowDownOutlined />}
              suffix="元"
              valueStyle={{
                color: totalPnl >= 0 ? 'var(--positive)' : 'var(--negative)',
                fontFamily: 'var(--font-mono)'
              }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={isMobile ? 24 : 10}>
          <Card className="animate-in stagger-1" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            <ReactECharts option={pieOption} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col span={isMobile ? 24 : 14}>
          <Card className="animate-in stagger-2" title={<span style={{ color: 'var(--text-primary)' }}>持仓明细</span>}
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            <Table
              columns={columns}
              dataSource={positions}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ x: isMobile ? 600 : 800 }}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </Card>
        </Col>
      </Row>
    </Spin>
  );
}
