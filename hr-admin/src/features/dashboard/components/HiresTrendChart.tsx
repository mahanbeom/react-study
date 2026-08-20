import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardSummary } from '../types';

// dataviz 팔레트 — validate_palette.js로 흰 배경 대비 검증 완료 (CVD/대비 전 항목 PASS)
const COLOR_HIRES = '#2a78d6';
const COLOR_RESIGNATIONS = '#eb6834';
const INK_MUTED = '#898781';
const GRID_LINE = '#e1e0d9';
const AXIS_LINE = '#c3c2b7';

function monthLabel(month: string): string {
  return `${Number(month.slice(5))}월`;
}

function tooltipLabel(label: unknown): string {
  const month = String(label);
  return `${month.slice(0, 4)}년 ${Number(month.slice(5))}월`;
}

export function HiresTrendChart({ data }: { data: DashboardSummary['monthlyTrend'] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2} barSize={12} margin={{ top: 8, right: 8 }}>
          <CartesianGrid vertical={false} stroke={GRID_LINE} strokeWidth={1} />
          <XAxis
            dataKey="month"
            tickFormatter={monthLabel}
            tick={{ fill: INK_MUTED, fontSize: 12 }}
            axisLine={{ stroke: AXIS_LINE }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: INK_MUTED, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            labelFormatter={tooltipLabel}
            cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
            contentStyle={{ borderRadius: 8, borderColor: GRID_LINE, fontSize: 13 }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13 }} />
          <Bar dataKey="hires" name="입사" fill={COLOR_HIRES} radius={[4, 4, 0, 0]} />
          <Bar dataKey="resignations" name="퇴사" fill={COLOR_RESIGNATIONS} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
