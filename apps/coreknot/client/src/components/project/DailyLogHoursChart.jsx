import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import ChartSurface, { CHART_MUTED } from '../ui/ChartSurface';

const formatDayLabel = (dateKey) => {
  if (!dateKey) return '';
  const d = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const DailyLogHoursChart = ({ byDay = [], totalEntries = 0 }) => {
  const data = useMemo(
    () =>
      (byDay || []).map((row) => ({
        date: row.date,
        label: formatDayLabel(row.date),
        manualHours: Number(row.manualHours) || 0,
        taskHours: Number(row.taskHours) || 0,
        hours: Number(row.hours) || 0,
        logCount: Number(row.logCount) || 0,
      })),
    [byDay]
  );

  const hasData = data.some((d) => d.hours > 0 || d.logCount > 0);

  return (
    <ChartSurface
      title="Daily log hours"
      subtitle={totalEntries ? `${totalEntries} log entries in range` : undefined}
      height={240}
    >
      {!hasData ? (
        <div className="h-[240px] flex items-center justify-center text-xs text-[var(--color-text-muted)] opacity-60">
          No daily logs in range
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...CHART_MUTED.grid} />
            <XAxis dataKey="label" tick={CHART_MUTED.axis} interval="preserveStartEnd" />
            <YAxis tick={CHART_MUTED.axis} allowDecimals />
            <Tooltip
              contentStyle={CHART_MUTED.tooltip}
              formatter={(value, name) => [`${Number(value).toFixed(1)}h`, name]}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''}
            />
            <Legend />
            <Bar dataKey="manualHours" name="Manual" stackId="hours" fill="#6366f1" radius={[0, 0, 0, 0]} />
            <Bar dataKey="taskHours" name="Task" stackId="hours" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartSurface>
  );
};

export default DailyLogHoursChart;
