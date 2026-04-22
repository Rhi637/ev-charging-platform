import { useState } from 'react';
import {
  Line,
} from 'react-chartjs-2';
import '../utils/chartSetup';
import { useTheme } from '../context/ThemeContext';

const monthlyData = [
  { month: '2025-11', total: 980000, operator: 686000, property: 294000, ratio: '70/30', status: '已结算' },
  { month: '2025-12', total: 1050000, operator: 735000, property: 315000, ratio: '70/30', status: '已结算' },
  { month: '2026-01', total: 1120000, operator: 784000, property: 336000, ratio: '70/30', status: '已结算' },
  { month: '2026-02', total: 1080000, operator: 756000, property: 324000, ratio: '70/30', status: '已结算' },
  { month: '2026-03', total: 1180000, operator: 826000, property: 354000, ratio: '70/30', status: '已结算' },
  { month: '2026-04', total: 1258600, operator: 880020, property: 378580, ratio: '70/30', status: '待结算' },
];

const MONTHLY_REVENUE = 1258600;

export default function FinancialSettlement() {
  const [operatorRatio, setOperatorRatio] = useState(70);
  const { isDark } = useTheme();

  const propertyRatio = 100 - operatorRatio;
  const operatorRevenue = Math.round(MONTHLY_REVENUE * (operatorRatio / 100));
  const propertyRevenue = MONTHLY_REVENUE - operatorRevenue;

  const trendData = {
    labels: monthlyData.map((d) => d.month),
    datasets: [
      {
        label: '运营商收入',
        data: monthlyData.map((d) => d.operator),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: '物业方收入',
        data: monthlyData.map((d) => d.property),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249,115,22,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#f97316',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: isDark ? '#d1d5db' : '#6b7280', usePointStyle: true, padding: 20 },
      },
      tooltip: {
        backgroundColor: isDark ? '#1f2937' : '#fff',
        titleColor: isDark ? '#d1d5db' : '#111827',
        bodyColor: isDark ? '#d1d5db' : '#111827',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ¥${ctx.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: isDark ? '#d1d5db' : '#6b7280' },
        grid: { color: isDark ? '#4b5563' : 'rgba(75,85,99,0.3)' },
      },
      y: {
        ticks: {
          color: isDark ? '#d1d5db' : '#6b7280',
          callback: (v) => `¥${(v / 10000).toFixed(0)}万`,
        },
        grid: { color: isDark ? '#4b5563' : 'rgba(75,85,99,0.3)' },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">财务结算</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">查看营收数据与分账管理</p>
      </div>

      {/* 汇总卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 本月总营收 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">本月总营收</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">¥1,258,600</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        {/* 运营商分成 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">运营商分成</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">¥880,020</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        {/* 物业方分成 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">物业方分成</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">¥378,580</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 自动分账设置 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">自动分账设置</h2>

        {/* 分账比例可视化条 */}
        <div className="mb-6">
          <div className="flex rounded-full overflow-hidden h-8">
            <div
              className="bg-blue-500 dark:bg-blue-600 flex items-center justify-center transition-[width] duration-300"
              style={{ width: `${operatorRatio}%` }}
            >
              <span className="text-xs font-medium text-white">{operatorRatio}%</span>
            </div>
            <div
              className="bg-orange-500 dark:bg-orange-600 flex items-center justify-center transition-[width] duration-300"
              style={{ width: `${propertyRatio}%` }}
            >
              <span className="text-xs font-medium text-white">{propertyRatio}%</span>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-blue-600 dark:text-blue-400 font-medium">运营商占比 {operatorRatio}%</span>
            <span className="text-orange-600 dark:text-orange-400 font-medium">物业方占比 {propertyRatio}%</span>
          </div>
        </div>

        {/* 滑块 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            调整运营商分成比例
          </label>
          <input
            type="range"
            min="50"
            max="90"
            value={operatorRatio}
            onChange={(e) => setOperatorRatio(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${operatorRatio}%, #f97316 ${operatorRatio}%, #f97316 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
            <span>50%</span>
            <span>90%</span>
          </div>
        </div>

        {/* 实时计算结果 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">运营商净收入</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">¥{operatorRevenue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">物业方净收入</p>
            <p className="text-xl font-bold text-orange-600 dark:text-orange-400">¥{propertyRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* 月度结算明细 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">月度结算明细</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">月份</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">总营收</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">运营商收入</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">物业方收入</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">分账比例</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {monthlyData.map((row) => (
                <tr key={row.month} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">{row.month}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">¥{row.total.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-blue-600 dark:text-blue-400 font-medium">¥{row.operator.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-orange-600 dark:text-orange-400 font-medium">¥{row.property.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{row.ratio}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row.status === '已结算'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 月度营收趋势 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">月度营收趋势</h2>
        <div className="h-80">
          <Line data={trendData} options={trendOptions} />
        </div>
      </div>
    </div>
  );
}
