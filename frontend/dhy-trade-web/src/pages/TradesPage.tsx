import { useEffect, useMemo, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber,
  Select, DatePicker, Tag, Popconfirm, Card, App, Checkbox, Space
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SettingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getTrades, addTrade, deleteTrade, updateTrade } from '../api/trades';
import { getPositions } from '../api/positions';
import { useAuthStore } from '../stores/authStore';
import { usePositionStore } from '../stores/positionStore';
import type { TradeRecordDto } from '../api/trades';
import { marketCurrencySymbols, marketLabels, marketOptions, type MarketType } from '../constants/markets';
import { getQuote, searchQuotes } from '../api/quotes';
import { getTradeFeeSettings, setTradeFeeSettings } from '../api/config';

function getErrorMessage(error: unknown, fallback: string) {
  const maybeAxiosError = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };

  return maybeAxiosError.response?.data?.message
    || maybeAxiosError.message
    || fallback;
}

export default function TradesPage() {
  const [trades, setTrades] = useState<TradeRecordDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingFeeSettings, setSavingFeeSettings] = useState(false);
  const [editingTrade, setEditingTrade] = useState<TradeRecordDto | null>(null);
  const [form] = Form.useForm();
  const [feeForm] = Form.useForm();
  const { message } = App.useApp();
  const { user } = useAuthStore();
  const refreshPositions = usePositionStore((state) => state.refresh);
  const isOperator = user?.role === 'SuperAdmin' || user?.role === 'Operator';
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const watchedMarketType = Form.useWatch('marketType', form) as MarketType | undefined;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadTrades = async () => {
    setLoading(true);
    try {
      const res = await getTrades();
      setTrades(res.data);
    } catch (error) {
      message.error(getErrorMessage(error, '加载交易记录失败，请检查后端服务'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTrades(); }, []);

  const formatMoney = (value: number, marketType: MarketType, digits = 2) => (
    `${marketCurrencySymbols[marketType]}${value.toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })}`
  );

  const openFeeModal = async () => {
    try {
      const response = await getTradeFeeSettings();
      feeForm.setFieldsValue(response.data);
      setFeeModalOpen(true);
    } catch (error) {
      message.error(getErrorMessage(error, '加载手续费设置失败'));
    }
  };

  const handleSaveFeeSettings = async () => {
    setSavingFeeSettings(true);
    try {
      const values = await feeForm.validateFields();
      await setTradeFeeSettings(values.ratePerTenThousand, values.waiveMinimumCommission ?? false);
      message.success('手续费设置已更新');
      setFeeModalOpen(false);
      loadTrades();
      await refreshPositions();
    } catch (error) {
      message.error(getErrorMessage(error, '保存手续费设置失败'));
    } finally {
      setSavingFeeSettings(false);
    }
  };

  const normalizeStockCode = (marketType: MarketType, stockCode: string) => {
    const normalized = stockCode.trim().toLowerCase().replace(/^(sh|sz|hk)/, '');
    if (!normalized) return '';

    if (marketType === 'HongKong') {
      return `hk${normalized.padStart(5, '0')}`;
    }

    return normalized.startsWith('6') ? `sh${normalized}` : `sz${normalized}`;
  };

  const isSellType = () => form.getFieldValue('type') === 'Sell';

  const applySellDefaults = async (marketType: MarketType, stockCode: string, stockName?: string) => {
    if (editingTrade || !isSellType()) {
      return;
    }

    try {
      const normalizedCode = normalizeStockCode(marketType, stockCode);
      const response = await getPositions();
      const matchedPosition = response.data.find((position) => (
        position.marketType === marketType
        && (
          (normalizedCode && position.stockCode === normalizedCode)
          || (!!stockName && position.stockName === stockName)
        )
      ));

      if (matchedPosition) {
        form.setFieldsValue({ lots: matchedPosition.shares / 100 });
      }
    } catch {
      // Ignore holding lookup failures and keep manual input available.
    }

    try {
      const quoteResponse = await getQuote(stockCode);
      form.setFieldsValue({ price: quoteResponse.data.currentPrice });
    } catch {
      // Ignore price lookup failures and keep manual input available.
    }
  };

  const fillQuoteInfo = async (marketType: MarketType, rawStockCode: string) => {
    const normalizedCode = normalizeStockCode(marketType, rawStockCode);
    if (!normalizedCode) return;

    form.setFieldValue('stockCode', normalizedCode);
    try {
      const response = await getQuote(normalizedCode);
      form.setFieldValue('stockName', response.data.stockName);
      await applySellDefaults(marketType, normalizedCode, response.data.stockName);
    } catch (error) {
      message.warning(getErrorMessage(error, '未能自动获取股票名称，请手动填写'));
    }
  };

  const fillStockCodeByName = async (marketType: MarketType, stockName: string) => {
    const keyword = stockName.trim();
    if (!keyword) {
      return;
    }

    try {
      const response = await searchQuotes(keyword, marketType);
      const exactMatch = response.data.find((item) => item.stockName === keyword) ?? response.data[0];
      if (!exactMatch) {
        message.warning('未能根据股票名称自动获取代码，请手动填写');
        return;
      }

      form.setFieldsValue({
        stockCode: exactMatch.stockCode,
        stockName: exactMatch.stockName,
      });

      await applySellDefaults(marketType, exactMatch.stockCode, exactMatch.stockName);
    } catch (error) {
      message.warning(getErrorMessage(error, '未能根据股票名称自动获取代码，请手动填写'));
    }
  };

  const resetModal = () => {
    setModalOpen(false);
    setEditingTrade(null);
    form.resetFields();
  };

  const openAddModal = () => {
    setEditingTrade(null);
    form.resetFields();
    form.setFieldsValue({ marketType: 'AShare', type: 'Buy' });
    setModalOpen(true);
  };

  const openEditModal = (trade: TradeRecordDto) => {
    setEditingTrade(trade);
    form.setFieldsValue({
      marketType: trade.marketType,
      stockCode: trade.stockCode,
      stockName: trade.stockName,
      type: trade.type,
      lots: trade.lots,
      price: trade.price,
      note: trade.note,
      tradedAt: dayjs(trade.tradedAt),
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const values = await form.validateFields();
      const payload = {
        marketType: values.marketType,
        stockCode: normalizeStockCode(values.marketType, values.stockCode),
        stockName: values.stockName,
        type: values.type,
        lots: values.lots,
        price: values.price || undefined,
        note: values.note,
        tradedAt: values.tradedAt?.toISOString(),
      };

      if (editingTrade) {
        await updateTrade(editingTrade.id, payload);
        message.success('操作记录已更新');
      } else {
        await addTrade(payload);
        message.success('操作记录已添加');
      }

      resetModal();
      loadTrades();
      await refreshPositions();
    } catch (error) {
      message.error(getErrorMessage(error, editingTrade ? '修改失败' : '添加失败'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTrade(id);
      message.success('已删除');
      loadTrades();
      await refreshPositions();
    } catch (error) {
      message.error(getErrorMessage(error, '删除失败'));
    }
  };

  const columns = useMemo(() => {
    const allColumns = [
      {
        title: '时间', dataIndex: 'tradedAt', key: 'time', width: 160,
        render: (v: string) => <span style={{ fontFamily: 'var(--font-mono)' }}>{dayjs(v).format('YYYY-MM-DD HH:mm')}</span>
      },
      {
        title: '市场', dataIndex: 'marketType', key: 'market', width: 90,
        render: (v: keyof typeof marketLabels) => <Tag>{marketLabels[v]}</Tag>
      },
      { title: '股票', dataIndex: 'stockName', key: 'name', width: 120 },
      { title: '代码', dataIndex: 'stockCode', key: 'code', width: 100 },
      {
        title: '方向', dataIndex: 'type', key: 'type', width: 80,
        render: (v: string) => (
          <Tag style={{
            background: v === 'Buy' ? 'var(--negative)' : 'var(--positive)',
            borderColor: 'transparent', color: '#fff', fontFamily: 'var(--font-mono)'
          }}>
            {v === 'Buy' ? '买入' : '卖出'}
          </Tag>
        )
      },
      {
        title: '手数', dataIndex: 'lots', key: 'lots',
        render: (v: number) => <span style={{ fontFamily: 'var(--font-mono)' }}>{v}</span>
      },
      {
        title: '成本价', dataIndex: 'price', key: 'price',
        render: (v: number, r: TradeRecordDto) => <span style={{ fontFamily: 'var(--font-mono)' }}>{formatMoney(v, r.marketType, 2)}</span>
      },
      {
        title: '金额', dataIndex: 'amount', key: 'amount',
        render: (v: number, r: TradeRecordDto) => <span style={{ fontFamily: 'var(--font-mono)' }}>{formatMoney(v, r.marketType, 2)}</span>
      },
      {
        title: '手续费', dataIndex: 'commission', key: 'comm',
        render: (v: number, r: TradeRecordDto) => <span style={{ fontFamily: 'var(--font-mono)' }}>{formatMoney(v, r.marketType, 2)}</span>
      },
      {
        title: '总成本', dataIndex: 'totalCost', key: 'cost',
        render: (v: number, r: TradeRecordDto) => <span style={{ fontFamily: 'var(--font-mono)' }}>{formatMoney(v, r.marketType, 2)}</span>
      },
      { title: '操作员', dataIndex: 'operatorName', key: 'op' },
      ...(isOperator ? [{
        title: '操作', key: 'action', width: 80,
        render: (_: unknown, r: TradeRecordDto) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="link" icon={<EditOutlined />} size="small" onClick={() => openEditModal(r)} />
            <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
              <Button type="link" danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          </div>
        ),
      }] : []),
    ];

    if (isMobile) {
      const essentialKeys = ['time', 'market', 'name', 'type', 'lots', 'price'];
      return allColumns.filter(col => essentialKeys.includes(col.key));
    }
    return allColumns;
  }, [isMobile, isOperator]);

  return (
    <Card className="animate-in stagger-1" title={<span style={{ color: 'var(--text-primary)' }}>交易记录</span>}
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      extra={
        isOperator && (
          <Space>
            <Button icon={<SettingOutlined />} onClick={openFeeModal}>
              手续费设置
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
              添加记录
            </Button>
          </Space>
        )
      }>
      <Table columns={columns} dataSource={trades} rowKey="id" loading={loading}
        pagination={{ pageSize: 20 }} size="small"
        scroll={{ x: isMobile ? 600 : undefined }}
        style={{ fontFamily: 'var(--font-mono)' }} />

      <Modal title={<span style={{ color: 'var(--text-primary)' }}>{editingTrade ? '修改操作记录' : '新增操作记录'}</span>}
        open={modalOpen} onCancel={resetModal}
        onOk={handleSubmit} confirmLoading={submitting}
        width={isMobile ? '100%' : 520}
        style={{ top: isMobile ? 0 : undefined }}>
        <Form form={form} layout="vertical">
          <Form.Item name="marketType" label="市场" rules={[{ required: true, message: '请选择市场' }]}
            initialValue="AShare">
            <Select
              options={marketOptions}
              onChange={(value: MarketType) => {
                const stockCode = form.getFieldValue('stockCode');
                if (stockCode) {
                  fillQuoteInfo(value, stockCode);
                }
              }}
            />
          </Form.Item>
          <Form.Item name="stockCode" label="股票代码" rules={[{ required: true, message: '请输入股票代码' }]}>
            <Input
              placeholder="A股如 002244，港股如 00700"
              onBlur={(event) => {
                const marketType = form.getFieldValue('marketType') as MarketType;
                if (marketType && event.target.value) {
                  fillQuoteInfo(marketType, event.target.value);
                }
              }}
            />
          </Form.Item>
          <Form.Item name="stockName" label="股票名称" rules={[{ required: true, message: '请输入股票名称' }]}>
            <Input
              placeholder="如 贵州茅台"
              onBlur={(event) => {
                const marketType = form.getFieldValue('marketType') as MarketType;
                if (marketType && event.target.value) {
                  void fillStockCodeByName(marketType, event.target.value);
                }
              }}
            />
          </Form.Item>
          <Form.Item name="type" label="方向" rules={[{ required: true, message: '请选择' }]}>
            <Select
              options={[
                { label: '买入', value: 'Buy' },
                { label: '卖出', value: 'Sell' },
              ]}
              onChange={(value: 'Buy' | 'Sell') => {
                if (value !== 'Sell' || editingTrade) {
                  return;
                }

                const marketType = form.getFieldValue('marketType') as MarketType;
                const stockCode = form.getFieldValue('stockCode') as string | undefined;
                const stockName = form.getFieldValue('stockName') as string | undefined;
                if (marketType && stockCode) {
                  void applySellDefaults(marketType, stockCode, stockName);
                }
              }}
            />
          </Form.Item>
          <Form.Item name="lots" label="手数" rules={[{ required: true, message: '请输入手数' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="price" label="成本价（留空则自动获取实时价）">
            <InputNumber
              min={0.01}
              step={0.01}
              style={{ width: '100%' }}
              placeholder="自动获取"
              addonBefore={marketCurrencySymbols[watchedMarketType ?? 'AShare']}
            />
          </Form.Item>
          <Form.Item name="tradedAt" label="交易时间（留空则为当前时间）">
            <DatePicker showTime style={{ width: '100%' }} placeholder="当前时间" />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<span style={{ color: 'var(--text-primary)' }}>手续费设置</span>}
        open={feeModalOpen}
        onCancel={() => setFeeModalOpen(false)}
        onOk={handleSaveFeeSettings}
        confirmLoading={savingFeeSettings}
        width={420}
      >
        <Form form={feeForm} layout="vertical" initialValues={{ ratePerTenThousand: 1, waiveMinimumCommission: false }}>
          <Form.Item
            name="ratePerTenThousand"
            label="手续费率（万分之）"
            rules={[{ required: true, message: '请输入手续费率' }]}
            extra="填写 1 表示万1，填写 2.5 表示万2.5"
          >
            <InputNumber min={0} step={0.1} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="waiveMinimumCommission" valuePropName="checked">
            <Checkbox>是否免5</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
