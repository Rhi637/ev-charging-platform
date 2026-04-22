import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import '../utils/chartSetup';
import { statusBadge } from '../utils/statusBadge';
import { useTheme } from '../context/ThemeContext';
import { stations, revenueData } from '../data/mockData';

const kpiCards = [
  {
    title: '总充电站数',
    value: '128',
    subtitle: '较上月 +3',
    icon: 'bolt',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
    trend: 'green',
  },
  {
    title: '今日营收',
    value: '¥52,680',
    subtitle: '较昨日 +12.5%',
    icon: 'yuan-sign',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    trend: 'green',
  },
  {
    title: '平均利用率',
    value: '76.8%',
    subtitle: '较昨日 +2.1%',
    icon: 'chart-line',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    trend: 'green',
  },
  {
    title: '活跃用户',
    value: '3,842',
    subtitle: '较昨日 +156',
    icon: 'users',
    iconBg: 'bg-violet-100 dark:bg-violet-900/40',
    iconColor: 'text-violet-600 dark:text-violet-400',
    trend: 'green',
  },
];

const quickStats = [
  { label: '今日充电次数', value: '1,247次' },
  { label: '平均充电时长', value: '45分钟' },
  { label: '客户满意度', value: '4.8/5.0' },
];

export default function Dashboard() {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const { isDark } = useTheme();

  // 图表数据
  const chartData = {
    labels: revenueData.map((d) => d.date),
    datasets: [
      {
        label: '营收（元）',
        data: revenueData.map((d) => d.revenue),
        borderColor: '#3b82f6',
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(59,130,246,0.1)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(59,130,246,0.35)');
          gradient.addColorStop(1, 'rgba(59,130,246,0.02)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#1f2937' : '#fff',
        titleColor: isDark ? '#d1d5db' : '#111827',
        bodyColor: isDark ? '#d1d5db' : '#111827',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => `营收：¥${context.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: isDark ? '#4b5563' : '#f3f4f6' },
        ticks: { color: isDark ? '#d1d5db' : '#6b7280' },
      },
      y: {
        grid: { color: isDark ? '#4b5563' : '#f3f4f6' },
        ticks: {
          color: isDark ? '#d1d5db' : '#6b7280',
          callback: (value) => `¥${(value / 1000).toFixed(0)}k`,
        },
      },
    },
  };

  // 排序逻辑
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedStations = [...stations].sort((a, b) => {
    if (!sortKey) return 0;
    let valA = a[sortKey];
    let valB = b[sortKey];
    if (typeof valA === 'string') {
      return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortDir === 'asc' ? valA - valB : valB - valA;
  });

  const SortIcon = ({ columnKey }) => {
    if (sortKey !== columnKey) {
      return (
        <svg className="inline-block w-3 h-3 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDir === 'asc' ? (
      <svg className="inline-block w-3 h-3 ml-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="inline-block w-3 h-3 ml-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">数据概览</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">充电站运营实时数据监控</p>
      </div>

      {/* KPI 卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  {card.subtitle}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full ${card.iconBg} flex items-center justify-center`}>
                <svg className={`w-6 h-6 ${card.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {card.icon === 'bolt' && (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  )}
                  {card.icon === 'yuan-sign' && (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                  {card.icon === 'chart-line' && (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  )}
                  {card.icon === 'users' && (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  )}
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 营收趋势图表 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">营收趋势（近7天）</h2>
        <div className="h-72">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* 快速统计 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {quickStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 text-center"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 充电站概览表格 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 pb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">充电站概览</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-gray-100 dark:border-gray-700">
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('name')}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('name')}
                >
                  站点名称 <SortIcon columnKey="name" />
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('status')}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('status')}
                >
                  状态 <SortIcon columnKey="status" />
                </th>
                <th
                  className="text-right px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('totalPower')}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('totalPower')}
                >
                  总发电量 (kWh) <SortIcon columnKey="totalPower" />
                </th>
                <th
                  className="text-right px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('revenue')}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('revenue')}
                >
                  营收 (¥) <SortIcon columnKey="revenue" />
                </th>
                <th
                  className="text-center px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('faultAlerts')}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('faultAlerts')}
                >
                  故障告警 <SortIcon columnKey="faultAlerts" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStations.map((station, index) => (
                <tr
                  key={station.id}
                  className={`border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    index % 2 === 1 ? 'bg-gray-50/50 dark:bg-gray-900/20' : ''
                  }`}
                >
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{station.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(station.status)}`}>
                      {station.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">
                    {station.totalPower.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">
                    ¥{station.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {station.faultAlerts > 0 ? (
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
                        {station.faultAlerts} 条告警
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                        无
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
