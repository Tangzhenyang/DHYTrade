import { CaretDownFilled, CaretUpFilled } from '@ant-design/icons';

interface PnlValueProps {
  value: number;
  text: string;
}

export function getPnlClassName(value: number) {
  return value >= 0 ? 'pnl-up' : 'pnl-down';
}

export function getPnlColor(value: number) {
  return value >= 0 ? 'var(--negative)' : 'var(--positive)';
}

export function PnlValue({ value, text }: PnlValueProps) {
  const className = getPnlClassName(value);
  const Icon = value >= 0 ? CaretUpFilled : CaretDownFilled;

  return (
    <span className={className} style={{ fontFamily: 'var(--font-mono)' }}>
      <Icon style={{ marginRight: 6, fontSize: 12 }} />
      {text}
    </span>
  );
}