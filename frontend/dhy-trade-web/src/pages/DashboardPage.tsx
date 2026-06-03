import { useEffect, useMemo, useRef, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Spin, Button, InputNumber, App, Space, Empty, Modal, Typography } from 'antd';
import {
  EditOutlined, ReloadOutlined, GlobalOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { usePositionStore } from '../stores/positionStore';
import { useAuthStore } from '../stores/authStore';
import { setBaseCapital } from '../api/config';
import { getExchangeRate, refreshPositions } from '../api/positions';
import type { ExchangeRateDto, PositionDto } from '../api/positions';
import { PnlValue, getPnlClassName, getPnlColor } from '../components/PnlValue';
import { marketConfigKeys, marketCurrencySymbols, marketCurrencyUnits, marketLabels, type MarketType } from '../constants/markets';

function getErrorMessage(error: unknown, fallback: string) {
  const maybeAxiosError = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };

  return maybeAxiosError.response?.data?.message
    || maybeAxiosError.message
    || fallback;
}

function getConfiguredBaseCapital(
  marketType: MarketType,
  positions: PositionDto[],
  configMap: Record<string, number>
) {
  const configValue = configMap[marketConfigKeys[marketType]];
  if (Number.isFinite(configValue) && configValue > 0) {
    return configValue;
  }

  if (marketType === 'AShare') {
    const legacyValue = configMap.BaseCapital;
    if (Number.isFinite(legacyValue) && legacyValue > 0) {
      return legacyValue;
    }
  }

  return positions.reduce((sum, position) => sum + position.totalCost, 0);
}

const marketOrder: MarketType[] = ['AShare', 'HongKong'];

function getCurrencyPrefix(marketType: MarketType) {
  return <span style={{ fontFamily: 'var(--font-mono)' }}>{marketCurrencySymbols[marketType]}</span>;
}

function formatMoney(value: number, marketType: MarketType, digits = 0) {
  return `${marketCurrencySymbols[marketType]}${value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

function normalizeUtcLikeDate(value: string) {
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  return `${value}Z`;
}

function formatShanghaiDateTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(normalizeUtcLikeDate(value)));
}

function getColumns(marketType: MarketType) {
  return [
    { title: '股票', dataIndex: 'stockName', key: 'name', width: 120 },
    { title: '代码', dataIndex: 'stockCode', key: 'code', width: 100 },
    {
      title: '持仓股数', dataIndex: 'shares', key: 'shares',
      render: (v: number) => <span style={{ fontFamily: 'var(--font-mono)' }}>{v.toLocaleString()}</span>
    },
    {
      title: '均价', dataIndex: 'avgCost', key: 'avgCost',
      render: (v: number) => <span style={{ fontFamily: 'var(--font-mono)' }}>{formatMoney(v, marketType, 2)}</span>
    },
    {
      title: '现价', dataIndex: 'currentPrice', key: 'price',
      render: (v: number) => <span style={{ fontFamily: 'var(--font-mono)' }}>{formatMoney(v, marketType, 2)}</span>
    },
    {
      title: '市值', dataIndex: 'marketValue', key: 'mv',
      render: (v: number) => <span style={{ fontFamily: 'var(--font-mono)' }}>{formatMoney(v, marketType)}</span>
    },
    {
      title: '占比', dataIndex: 'ratioPct', key: 'ratio',
      render: (v: number) => `${v.toFixed(1)}%`
    },
    {
      title: '浮动盈亏', dataIndex: 'unrealizedPnl', key: 'pnl',
      render: (v: number, r: PositionDto) => (
        <PnlValue
          value={v}
          text={`${formatMoney(v, marketType)} (${(r.unrealizedPnlPct * 100).toFixed(2)}%)`}
        />
      )
    },
    {
      title: '持仓天数', dataIndex: 'holdDays', key: 'days',
      render: (v: number) => `${v}天`
    },
  ];
}

interface MarketSectionSummary {
  marketType: MarketType;
  positions: PositionDto[];
  baseCapital: number;
  totalMarketValue: number;
  totalPnl: number;
}

export default function DashboardPage() {
  const { positions, loading, configMap, refresh } = usePositionStore();
  const { user } = useAuthStore();
  const isOperator = user?.role === 'SuperAdmin' || user?.role === 'Operator';
  const [savingMarket, setSavingMarket] = useState<MarketType | null>(null);
  const [editingMarket, setEditingMarket] = useState<MarketType | null>(null);
  const [refreshingPrice, setRefreshingPrice] = useState(false);
  const [refreshingExchangeRate, setRefreshingExchangeRate] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRateDto | null>(null);
  const [lastMarketRefreshAt, setLastMarketRefreshAt] = useState<string | null>(null);
  const [exchangeRateModalOpen, setExchangeRateModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const refreshingPriceRef = useRef(false);
  const [capitalInputs, setCapitalInputs] = useState<Record<MarketType, number>>({
    AShare: 0,
    HongKong: 0,
  });
  const { message } = App.useApp();

  const refreshMarketData = async () => {
    await refresh();
    setLastMarketRefreshAt(new Date().toISOString());
  };

  useEffect(() => {
    void refreshMarketData();
  }, [refresh]);

  useEffect(() => {
    const loadExchangeRate = async () => {
      try {
        const response = await getExchangeRate();
        setExchangeRate(response.data);
      } catch {
        setExchangeRate(null);
      }
    };

    void loadExchangeRate();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== 'visible' || refreshingPriceRef.current) {
        return;
      }

      refreshingPriceRef.current = true;

      void refreshPositions()
        .then(() => refreshMarketData())
        .catch(() => {})
        .finally(() => {
          refreshingPriceRef.current = false;
        });
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [refresh]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };

    const handleWindowFocus = () => {
      void refresh();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [refresh]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const marketSummaries = useMemo(() => {
    return marketOrder.map((marketType) => {
      const marketPositions = positions.filter((position) => position.marketType === marketType);
      return {
        marketType,
        positions: marketPositions,
        baseCapital: getConfiguredBaseCapital(marketType, marketPositions, configMap),
        totalMarketValue: marketPositions.reduce((sum, position) => sum + position.marketValue, 0),
        totalPnl: marketPositions.reduce((sum, position) => sum + position.unrealizedPnl, 0),
      } satisfies MarketSectionSummary;
    });
  }, [configMap, positions]);

  useEffect(() => {
    setCapitalInputs({
      AShare: marketSummaries.find((item) => item.marketType === 'AShare')?.baseCapital ?? 0,
      HongKong: marketSummaries.find((item) => item.marketType === 'HongKong')?.baseCapital ?? 0,
    });
  }, [marketSummaries]);

  const totalSummary = useMemo(() => ({
    baseCapitalRmb: marketSummaries.reduce((sum, item) => sum + (
      item.marketType === 'HongKong'
        ? item.baseCapital * (exchangeRate?.rate ?? 0)
        : item.baseCapital
    ), 0),
    totalMarketValueRmb: marketSummaries.reduce((sum, item) => sum + (
      item.marketType === 'HongKong'
        ? item.totalMarketValue * (exchangeRate?.rate ?? 0)
        : item.totalMarketValue
    ), 0),
    totalPnlRmb: marketSummaries.reduce((sum, item) => sum + (
      item.marketType === 'HongKong'
        ? item.totalPnl * (exchangeRate?.rate ?? 0)
        : item.totalPnl
    ), 0),
  }), [exchangeRate?.rate, marketSummaries]);

  const handleRefreshPrice = async () => {
    if (refreshingPriceRef.current) {
      return;
    }

    refreshingPriceRef.current = true;
    setRefreshingPrice(true);
    try {
      await refreshPositions();
      await refreshMarketData();
      message.success('行情已刷新');
    } catch (error) {
      message.error(getErrorMessage(error, '刷新失败，请检查后端服务'));
    } finally {
      refreshingPriceRef.current = false;
      setRefreshingPrice(false);
    }
  };

  const handleRefreshExchangeRate = async () => {
    setRefreshingExchangeRate(true);
    try {
      const response = await getExchangeRate();
      setExchangeRate({
        ...response.data,
        quoteTime: new Date().toISOString(),
      });
      message.success('汇率已更新');
    } catch (error) {
      message.error(getErrorMessage(error, '汇率更新失败，请稍后重试'));
    } finally {
      setRefreshingExchangeRate(false);
    }
  };

  const handleSave = async (marketType: MarketType) => {
    setSavingMarket(marketType);
    try {
      await setBaseCapital(marketType, capitalInputs[marketType]);
      message.success(`${marketLabels[marketType]}基准仓位已更新`);
      setEditingMarket(null);
      refresh();
    } catch (error) {
      message.error(getErrorMessage(error, '保存失败'));
    } finally {
      setSavingMarket(null);
    }
  };

  return (
    <Spin spinning={loading}>
      <div style={{
        marginBottom: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 12 : 0,
      }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>仓位看板</h2>
          <div style={{ color: 'var(--text-secondary)', marginTop: 6 }}>总览按人民币折算展示，港股部分按实时汇率换算。</div>
        </div>
        <Space style={{ width: isMobile ? '100%' : undefined }} direction={isMobile ? 'vertical' : 'horizontal'}>
          <Button
            icon={<GlobalOutlined />}
            onClick={() => setExchangeRateModalOpen(true)}
            style={{ width: isMobile ? '100%' : undefined }}
          >
            查看汇率
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefreshPrice}
            loading={refreshingPrice}
            style={{ width: isMobile ? '100%' : undefined }}
          >
            刷新行情
          </Button>
        </Space>
      </div>

      <Card className="animate-in stagger-1" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', marginBottom: 24 }}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div>
            <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>总览</h3>
            <div style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 13 }}>
              最近更新时间：{lastMarketRefreshAt ? formatShanghaiDateTime(lastMarketRefreshAt) : '暂无'}
            </div>
          </div>
          <Row gutter={[16, 16]}>
            <Col span={isMobile ? 24 : 8}>
              <Card style={{ background: 'var(--stat-card-bg)', border: '1px solid var(--border-default)' }}>
                <Statistic title="总基准仓位（人民币）" value={totalSummary.baseCapitalRmb} precision={0}
                  prefix={<span style={{ fontFamily: 'var(--font-mono)' }}>¥</span>}
                  suffix="人民币"
                  valueStyle={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }} />
              </Card>
            </Col>
            <Col span={isMobile ? 24 : 8}>
              <Card style={{ background: 'var(--stat-card-bg)', border: '1px solid var(--border-default)' }}>
                <Statistic title="总当前市值（人民币）" value={totalSummary.totalMarketValueRmb} precision={0}
                  prefix={<span style={{ fontFamily: 'var(--font-mono)' }}>¥</span>}
                  suffix="人民币"
                  valueStyle={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }} />
              </Card>
            </Col>
            <Col span={isMobile ? 24 : 8}>
              <Card style={{ background: 'var(--stat-card-bg)', border: '1px solid var(--border-default)' }}>
                <Statistic title="总浮动盈亏（人民币）" value={totalSummary.totalPnlRmb} precision={0}
                  prefix={<span className={getPnlClassName(totalSummary.totalPnlRmb)} style={{ fontFamily: 'var(--font-mono)' }}>{totalSummary.totalPnlRmb >= 0 ? '▲ ¥' : '▼ ¥'}</span>}
                  suffix="人民币"
                  valueStyle={{
                    color: getPnlColor(totalSummary.totalPnlRmb),
                    fontFamily: 'var(--font-mono)',
                  }} />
              </Card>
            </Col>
          </Row>
        </Space>
      </Card>

      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        {marketSummaries.map((summary, index) => {
          const pieOption = {
            title: { text: `${marketLabels[summary.marketType]}仓位占比`, left: 'center', textStyle: { color: 'var(--text-primary)' } },
            tooltip: { trigger: 'item' as const },
            legend: { bottom: 0, textStyle: { color: 'var(--text-secondary)' } },
            series: [{
              type: 'pie' as const,
              radius: ['40%', '70%'],
              data: summary.positions.map((position) => ({
                name: position.stockName,
                value: Number(position.totalCost.toFixed(0)),
              })),
              itemStyle: { borderColor: 'var(--bg-surface)' },
            }],
          };

          return (
            <Card
              key={summary.marketType}
              className={`animate-in stagger-${Math.min(index + 2, 4)}`}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>{marketLabels[summary.marketType]}</h3>

                  {isOperator && editingMarket !== summary.marketType && (
                    <Button
                      type="link"
                      size="small"
                      icon={<EditOutlined />}
                      style={{ color: 'var(--accent)' }}
                      onClick={() => setEditingMarket(summary.marketType)}
                    >
                      设置基准仓位
                    </Button>
                  )}
                </div>

                <Row gutter={[16, 16]}>
                  <Col span={isMobile ? 24 : 8}>
                    <Card style={{ background: 'var(--stat-card-bg)', border: '1px solid var(--border-default)', minHeight: 140 }}>
                      {editingMarket === summary.marketType ? (
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Statistic title={`${marketLabels[summary.marketType]}基准仓位`} value={capitalInputs[summary.marketType]} precision={0}
                            prefix={getCurrencyPrefix(summary.marketType)} suffix={marketCurrencyUnits[summary.marketType]}
                            valueStyle={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }} />
                          <InputNumber
                            value={capitalInputs[summary.marketType]}
                            onChange={(value) => setCapitalInputs((current) => ({
                              ...current,
                              [summary.marketType]: value || 0,
                            }))}
                            min={1}
                            step={100000}
                            style={{ width: '100%' }}
                            addonBefore={marketCurrencySymbols[summary.marketType]}
                            addonAfter={marketCurrencyUnits[summary.marketType]}
                            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(v) => Number(v!.replace(/,/g, ''))}
                          />
                          <Space>
                            <Button size="small" type="primary" loading={savingMarket === summary.marketType} onClick={() => handleSave(summary.marketType)}>保存</Button>
                            <Button size="small" onClick={() => setEditingMarket(null)}>取消</Button>
                          </Space>
                        </Space>
                      ) : (
                        <Statistic title={`${marketLabels[summary.marketType]}基准仓位`} value={summary.baseCapital} precision={0}
                          prefix={getCurrencyPrefix(summary.marketType)} suffix={marketCurrencyUnits[summary.marketType]}
                          valueStyle={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }} />
                      )}
                    </Card>
                  </Col>
                  <Col span={isMobile ? 24 : 8}>
                    <Card style={{ background: 'var(--stat-card-bg)', border: '1px solid var(--border-default)', minHeight: 140 }}>
                      <Statistic title={`${marketLabels[summary.marketType]}当前市值`} value={summary.totalMarketValue} precision={0}
                        prefix={getCurrencyPrefix(summary.marketType)} suffix={marketCurrencyUnits[summary.marketType]}
                        valueStyle={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }} />
                    </Card>
                  </Col>
                  <Col span={isMobile ? 24 : 8}>
                    <Card style={{ background: 'var(--stat-card-bg)', border: '1px solid var(--border-default)', minHeight: 140 }}>
                      <Statistic title={`${marketLabels[summary.marketType]}浮动盈亏`} value={summary.totalPnl} precision={0}
                        prefix={<span className={getPnlClassName(summary.totalPnl)} style={{ fontFamily: 'var(--font-mono)' }}>{summary.totalPnl >= 0 ? `▲ ${marketCurrencySymbols[summary.marketType]}` : `▼ ${marketCurrencySymbols[summary.marketType]}`}</span>} suffix={marketCurrencyUnits[summary.marketType]}
                        valueStyle={{
                          color: getPnlColor(summary.totalPnl),
                          fontFamily: 'var(--font-mono)',
                        }} />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col span={isMobile ? 24 : 8}>
                    <Card style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', minHeight: 420 }}>
                      {summary.positions.length > 0 ? (
                        <ReactECharts option={pieOption} style={{ height: 340 }} />
                      ) : (
                        <div style={{ height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Empty description={`${marketLabels[summary.marketType]}暂无持仓`} />
                        </div>
                      )}
                    </Card>
                  </Col>
                  <Col span={isMobile ? 24 : 16}>
                    <Card title={<span style={{ color: 'var(--text-primary)' }}>{marketLabels[summary.marketType]}持仓明细</span>}
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', minHeight: 420 }}>
                      <Table
                        columns={getColumns(summary.marketType)}
                        dataSource={summary.positions}
                        rowKey="id"
                        size="small"
                        pagination={false}
                        locale={{ emptyText: `${marketLabels[summary.marketType]}暂无持仓` }}
                        scroll={{ x: isMobile ? 600 : 900 }}
                        style={{ fontFamily: 'var(--font-mono)' }}
                      />
                    </Card>
                  </Col>
                </Row>
              </Space>
            </Card>
          );
        })}
      </Space>

      <Modal
        title={<span style={{ color: 'var(--text-primary)' }}>港币兑人民币汇率</span>}
        open={exchangeRateModalOpen}
        onCancel={() => setExchangeRateModalOpen(false)}
        footer={null}
      >
        {exchangeRate ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Typography.Text style={{ color: 'var(--text-primary)' }}>
              1 港币 = <strong>{exchangeRate.rate.toFixed(4)}</strong> 人民币
            </Typography.Text>
            <Typography.Text style={{ color: 'var(--text-primary)' }}>
              1 人民币 = <strong>{(1 / exchangeRate.rate).toFixed(4)}</strong> 港币
            </Typography.Text>
            <Typography.Text style={{ color: 'var(--text-secondary)' }}>
              更新时间：{formatShanghaiDateTime(exchangeRate.quoteTime)}
            </Typography.Text>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleRefreshExchangeRate}
              loading={refreshingExchangeRate}
            >
              更新汇率
            </Button>
          </Space>
        ) : (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Empty description="暂时无法获取汇率" />
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleRefreshExchangeRate}
              loading={refreshingExchangeRate}
            >
              更新汇率
            </Button>
          </Space>
        )}
      </Modal>
    </Spin>
  );
}