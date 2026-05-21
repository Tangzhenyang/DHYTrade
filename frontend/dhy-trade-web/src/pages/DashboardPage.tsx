import { useEffect, useRef, useState } from 'react';
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
  const [leftPct, setLeftPct] = useState(40); // default 4:6
  const [dragging, setDragging] = useState(false);
  const chartRef = useRef<any>(null);

  // Resize chart when splitter moves
  useEffect(() => {
    const timer = setTimeout(() => {
      chartRef.current?.getEchartsInstance()?.resize();
    }, 50);
    return () => clearTimeout(timer);
  }, [leftPct]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      chartRef.current?.getEchartsInstance()?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = () => {
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.getElementById('split-container');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.max(20, Math.min(70, pct)));
    };

    const handleMouseUp = () => setDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [dragging]);

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
      <Row gutter={[16, 16]} style={{ alignItems: 'stretch' }}>
        <Col span={isMobile ? 24 : 8} style={{ display: 'flex' }}>
          <Card className="animate-in stagger-1" style={{ background: 'var(--stat-card-bg)', border: '1px solid var(--border-default)', width: '100%', minHeight: 120 }}>
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
        <Col span={isMobile ? 24 : 8} style={{ display: 'flex' }}>
          <Card className="animate-in stagger-2" style={{ background: 'var(--stat-card-bg)', border: '1px solid var(--border-default)', width: '100%', minHeight: 120 }}>
            <Statistic title="当前市值" value={totalMarketValue} precision={0}
              prefix={<PieChartOutlined />} suffix="元"
              valueStyle={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }} />
          </Card>
        </Col>
        <Col span={isMobile ? 24 : 8} style={{ display: 'flex' }}>
          <Card className="animate-in stagger-3" style={{ background: 'var(--stat-card-bg)', border: '1px solid var(--border-default)', width: '100%', minHeight: 120 }}>
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

      <div id="split-container" style={{ marginTop: 24, display: isMobile ? 'block' : 'flex', height: 400 }}>
        {/* Chart panel */}
        <div style={{
          width: isMobile ? '100%' : `${leftPct}%`,
          height: '100%',
          paddingRight: isMobile ? 0 : 8,
          paddingBottom: isMobile ? 8 : 0,
          transition: 'width 0.05s',
        }}>
          <Card style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', height: '100%' }}>
            <ReactECharts ref={chartRef} option={pieOption} style={{ height: 340 }} />
          </Card>
        </div>

        {/* Drag handle */}
        {!isMobile && (
          <div
            onMouseDown={handleMouseDown}
            style={{
              width: 8, cursor: 'col-resize',
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, userSelect: 'none',
            }}
          >
            <div style={{
              width: 3, height: 40, borderRadius: 2,
              background: 'var(--border-default)',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.target as HTMLElement).style.background = 'var(--accent)'}
              onMouseLeave={e => (e.target as HTMLElement).style.background = 'var(--border-default)'}
            />
          </div>
        )}

        {/* Table panel */}
        <div style={{
          width: isMobile ? '100%' : `${100 - leftPct}%`,
          height: '100%',
          paddingLeft: isMobile ? 0 : 8,
          transition: 'width 0.05s',
        }}>
          <Card className="animate-in stagger-2" title={<span style={{ color: 'var(--text-primary)' }}>持仓明细</span>}
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', height: '100%', overflow: 'auto' }}>
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
        </div>
      </div>
    </Spin>
  );
}
