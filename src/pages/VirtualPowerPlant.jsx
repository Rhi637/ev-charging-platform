import { useState } from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import '../utils/chartSetup';
import { useTheme } from '../context/ThemeContext';

// 霓虹色系
const NEON = {
  green: '#00f5d4',
  blue: '#00bbf9',
  purple: '#9b5de5',
  pink: '#f15bb5',
  yellow: '#fee440',
};

// 24小时标签
const hourlyLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

// 基线负荷（kW）
const baselineLoad = [
  8200, 7800, 7500, 7300, 7200, 7400, 7800, 8500,
  9200, 10500, 11200, 11800, 11500, 11000, 10800, 11200,
  12000, 12500, 11800, 10800, 10200, 9800, 9200, 8600,
];

// 实际负荷（kW）- VPP参与调节后
const actualLoad = [
  8200, 7800, 7500, 7300, 7200, 7400, 7800, 8500,
  9000, 9800, 10200, 10600, 10800, 10200, 10000, 10400,
  11200, 11800, 11000, 10200, 9800, 9500, 9000, 8600,
];

// VPP调节量（kW）= 基线 - 实际（正值表示削减负荷）
const vppAdjustment = baselineLoad.map((b, i) => b - actualLoad[i]);

// 需求响应事件时间点
const demandResponseEvents = [10, 14, 19];

// 聚合资源分布数据
const resourceDistribution = [
  { name: '公共充电站', value: 45, color: NEON.blue },
  { name: '私人充电桩', value: 25, color: NEON.green },
  { name: 'V2G车辆', value: 20, color: NEON.purple },
  { name: '储能系统', value: 10, color: NEON.yellow },
];

// 收益来源数据（近6个月）
const revenueBreakdown = {
  labels: ['11月', '12月', '1月', '2月', '3月', '4月'],
  demandResponse: [18200, 21500, 19800, 24300, 22100, 28600],
  peakArbitrage: [12500, 14200, 13800, 15600, 14900, 17200],
  capacityMarket: [8600, 9200, 8900, 10100, 9800, 11500],
  ancillaryService: [5200, 6100, 5800, 6900, 6500, 7800],
};

// 实时电网事件数据
const gridEvents = [
  { time: '19:00', type: '紧急调峰', power: '2,400 kW', duration: '2小时', status: '进行中' },
  { time: '14:00', type: '需求响应', power: '1,800 kW', duration: '1.5小时', status: '已完成' },
  { time: '10:00', type: '频率调节', power: '800 kW', duration: '45分钟', status: '已完成' },
  { time: '08:30', type: '需求响应', power: '1,200 kW', duration: '1小时', status: '已完成' },
  { time: '03:00', type: '频率调节', power: '500 kW', duration: '30分钟', status: '已完成' },
];

// KPI 卡片配置
const kpiCards = [
  {
    title: '聚合站点数',
    value: '86 个',
    iconColor: NEON.blue,
    glowColor: 'rgba(0,187,249,0.3)',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    title: '总调节功率',
    value: '15,600 kW',
    iconColor: NEON.green,
    glowColor: 'rgba(0,245,212,0.3)',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: '今日响应次数',
    value: '23 次',
    iconColor: NEON.purple,
    glowColor: 'rgba(155,93,229,0.3)',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    title: '累计收益',
    value: '¥286,500',
    iconColor: NEON.yellow,
    glowColor: 'rgba(254,228,64,0.3)',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

// 事件状态样式
function getEventStatusStyle(status) {
  switch (status) {
    case '进行中':
      return {
        bg: 'rgba(0,245,212,0.15)',
        color: NEON.green,
        border: 'rgba(0,245,212,0.4)',
        glow: '0 0 8px rgba(0,245,212,0.3)',
      };
    case '已完成':
      return {
        bg: 'rgba(0,187,249,0.15)',
        color: NEON.blue,
        border: 'rgba(0,187,249,0.4)',
        glow: '0 0 8px rgba(0,187,249,0.3)',
      };
    default:
      return { bg: 'rgba(156,163,175,0.15)', color: '#9ca3af', border: 'rgba(156,163,175,0.4)', glow: 'none' };
  }
}

// 事件类型样式
function getEventTypeStyle(type) {
  switch (type) {
    case '紧急调峰':
      return {
        bg: 'rgba(241,91,181,0.15)',
        color: NEON.pink,
        border: 'rgba(241,91,181,0.4)',
      };
    case '需求响应':
      return {
        bg: 'rgba(0,245,212,0.15)',
        color: NEON.green,
        border: 'rgba(0,245,212,0.4)',
      };
    case '频率调节':
      return {
        bg: 'rgba(155,93,229,0.15)',
        color: NEON.purple,
        border: 'rgba(155,93,229,0.4)',
      };
    default:
      return { bg: 'rgba(156,163,175,0.15)', color: '#9ca3af', border: 'rgba(156,163,175,0.4)' };
  }
}

export default function VirtualPowerPlant() {
  const { isDark } = useTheme();

  // 电网交互曲线数据
  const gridChartData = {
    labels: hourlyLabels,
    datasets: [
      {
        label: '基线负荷',
        data: baselineLoad,
        borderColor: '#6b7280',
        borderDash: [8, 4],
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.3,
      },
      {
        label: '实际负荷',
        data: actualLoad,
        borderColor: NEON.blue,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointBackgroundColor: NEON.blue,
        pointBorderColor: '#111827',
        pointBorderWidth: 2,
        fill: false,
        tension: 0.3,
      },
      {
        label: 'VPP调节量',
        data: vppAdjustment,
        borderColor: NEON.green,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(0,245,212,0.1)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(0,245,212,0.35)');
          gradient.addColorStop(1, 'rgba(0,245,212,0.02)');
          return gradient;
        },
        fill: true,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointBackgroundColor: NEON.green,
        pointBorderColor: '#111827',
        pointBorderWidth: 2,
        tension: 0.3,
      },
    ],
  };

  const gridChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        labels: {
          color: '#d1d5db',
          padding: 20,
          usePointStyle: true,
          pointStyleWidth: 10,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#d1d5db',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} kW`;
          },
        },
      },
      annotation: undefined,
    },
    scales: {
      x: {
        grid: { color: 'rgba(75,85,99,0.3)' },
        ticks: { color: '#9ca3af', font: { size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
      },
      y: {
        grid: { color: 'rgba(75,85,99,0.3)' },
        ticks: {
          color: '#9ca3af',
          font: { size: 11 },
          callback: (value) => `${(value / 1000).toFixed(1)}k`,
        },
      },
    },
  };

  // 聚合资源分布饼图数据
  const resourceData = {
    labels: resourceDistribution.map((r) => r.name),
    datasets: [
      {
        data: resourceDistribution.map((r) => r.value),
        backgroundColor: resourceDistribution.map((r) => r.color),
        borderColor: 'rgba(17,24,39,0.8)',
        borderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

  const resourceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#d1d5db',
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#d1d5db',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => {
            return `${context.label}: ${context.parsed}%`;
          },
        },
      },
    },
  };

  // 收益来源柱状图数据
  const revenueData = {
    labels: revenueBreakdown.labels,
    datasets: [
      {
        label: '需求响应',
        data: revenueBreakdown.demandResponse,
        backgroundColor: NEON.green,
        borderColor: NEON.green,
        borderWidth: 0,
        borderRadius: 3,
      },
      {
        label: '峰谷套利',
        data: revenueBreakdown.peakArbitrage,
        backgroundColor: NEON.blue,
        borderColor: NEON.blue,
        borderWidth: 0,
        borderRadius: 3,
      },
      {
        label: '容量市场',
        data: revenueBreakdown.capacityMarket,
        backgroundColor: NEON.purple,
        borderColor: NEON.purple,
        borderWidth: 0,
        borderRadius: 3,
      },
      {
        label: '辅助服务',
        data: revenueBreakdown.ancillaryService,
        backgroundColor: NEON.yellow,
        borderColor: NEON.yellow,
        borderWidth: 0,
        borderRadius: 3,
      },
    ],
  };

  const revenueOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#d1d5db',
          padding: 20,
          usePointStyle: true,
          pointStyleWidth: 10,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#d1d5db',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ¥${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { color: 'rgba(75,85,99,0.3)' },
        ticks: { color: '#9ca3af', font: { size: 11 } },
      },
      y: {
        stacked: true,
        grid: { color: 'rgba(75,85,99,0.3)' },
        ticks: {
          color: '#9ca3af',
          font: { size: 11 },
          callback: (value) => `¥${(value / 1000).toFixed(0)}k`,
        },
      },
    },
  };

  return (
    <div className="bg-gray-950 min-h-screen -mx-6 -my-6 px-6 py-6 space-y-6">
      {/* ===== 1. 页面头部 ===== */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1
              className="text-3xl font-bold text-white"
              style={{ textShadow: '0 0 20px rgba(0,245,212,0.5), 0 0 40px rgba(0,245,212,0.2)' }}
            >
              虚拟电厂 (VPP)
            </h1>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: 'rgba(0,245,212,0.15)',
                color: NEON.green,
                border: '1px solid rgba(0,245,212,0.4)',
                boxShadow: '0 0 12px rgba(0,245,212,0.3)',
              }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: NEON.green, boxShadow: '0 0 6px rgba(0,245,212,0.6)' }}
              />
              VPP 在线
            </span>
          </div>
          <p className="text-gray-400 mt-1 text-sm">聚合分散充电资源，参与电网调节获取收益</p>
        </div>
      </div>

      {/* ===== 2. KPI 卡片行 ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpiCards.map((card, index) => (
          <div
            key={index}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 transition-colors duration-300 hover:border-white/20"
            style={{ boxShadow: `0 0 25px ${card.glowColor}` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{card.title}</p>
                <p
                  className="text-2xl font-bold text-white mt-1"
                  style={{ textShadow: `0 0 10px ${card.glowColor}` }}
                >
                  {card.value}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: `${card.iconColor}15`,
                  color: card.iconColor,
                  boxShadow: `0 0 15px ${card.glowColor}`,
                }}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== 3. 今日电网交互曲线（全宽） ===== */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-lg font-semibold text-white"
            style={{ textShadow: '0 0 10px rgba(0,187,249,0.4)' }}
          >
            今日电网交互曲线
          </h2>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-gray-500 inline-block" style={{ borderTop: '2px dashed #6b7280' }} />
              基线负荷
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 inline-block" style={{ background: NEON.blue }} />
              实际负荷
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 inline-block" style={{ background: NEON.green }} />
              VPP调节量
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 inline-block" style={{ borderTop: '2px dashed #f15bb5' }} />
              需求响应
            </span>
          </div>
        </div>
        <div className="relative h-80">
          <Line data={gridChartData} options={gridChartOptions} />
          {/* 需求响应事件垂直标记线 - 使用绝对定位叠加 */}
          {demandResponseEvents.map((hour) => {
            const leftPercent = (hour / 23) * 100;
            return (
              <div
                key={hour}
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{
                  left: `${leftPercent}%`,
                  width: '1px',
                  borderLeft: '2px dashed rgba(241,91,181,0.6)',
                  zIndex: 10,
                }}
              >
                <span
                  className="absolute -top-1 left-1 text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap"
                  style={{
                    background: 'rgba(241,91,181,0.2)',
                    color: NEON.pink,
                    border: '1px solid rgba(241,91,181,0.4)',
                  }}
                >
                  {String(hour).padStart(2, '0')}:00 响应
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== 4. 资源分布 + 收益来源（两列） ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 左列 - 聚合资源分布 */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <h2
            className="text-lg font-semibold text-white mb-4"
            style={{ textShadow: '0 0 10px rgba(0,245,212,0.4)' }}
          >
            聚合资源分布
          </h2>
          <div className="relative h-[300px]">
            <Doughnut data={resourceData} options={resourceOptions} />
            {/* 中心文字 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-2xl font-bold text-white" style={{ textShadow: '0 0 10px rgba(0,245,212,0.5)' }}>
                  86
                </p>
                <p className="text-xs text-gray-400">聚合站点</p>
              </div>
            </div>
          </div>
        </div>

        {/* 右列 - 收益来源分析 */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <h2
            className="text-lg font-semibold text-white mb-4"
            style={{ textShadow: '0 0 10px rgba(254,228,64,0.4)' }}
          >
            收益来源分析
          </h2>
          <div className="h-[300px]">
            <Bar data={revenueData} options={revenueOptions} />
          </div>
        </div>
      </div>

      {/* ===== 5. 实时电网事件（表格） ===== */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-5 pb-4">
          <h2
            className="text-lg font-semibold text-white"
            style={{ textShadow: '0 0 10px rgba(241,91,181,0.4)' }}
          >
            实时电网事件
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-white/10">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">时间</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">事件类型</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">调节功率</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">持续时间</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">状态</th>
              </tr>
            </thead>
            <tbody>
              {gridEvents.map((event, index) => {
                const statusStyle = getEventStatusStyle(event.status);
                const typeStyle = getEventTypeStyle(event.type);
                return (
                  <tr
                    key={index}
                    className={`border-t border-white/5 transition-colors duration-300 ${
                      index % 2 === 1 ? 'bg-white/[0.02]' : ''
                    } hover:bg-white/[0.04]`}
                  >
                    <td className="px-6 py-4 text-gray-200 font-medium font-mono">{event.time}</td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: typeStyle.bg,
                          color: typeStyle.color,
                          border: `1px solid ${typeStyle.border}`,
                        }}
                      >
                        {event.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white" style={{ textShadow: '0 0 8px rgba(0,245,212,0.3)' }}>
                      {event.power}
                    </td>
                    <td className="px-6 py-4 text-gray-300">{event.duration}</td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`,
                          boxShadow: statusStyle.glow,
                        }}
                      >
                        {event.status === '进行中' && (
                          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusStyle.color }} />
                        )}
                        {event.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
