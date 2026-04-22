import { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import '../utils/chartSetup';
import { useTheme } from '../context/ThemeContext';
import {
  heatmapData,
  userSegments,
  hourlySessions,
  behaviorMetrics,
  analyticsRevenueData,
} from '../data/mockData';

// 修复 Leaflet 默认图标路径问题
delete L.Icon.Default.prototype._getIconUrl;

// 霓虹色系
const NEON = {
  green: '#00f5d4',
  blue: '#00bbf9',
  purple: '#9b5de5',
  pink: '#f15bb5',
  yellow: '#fee440',
};

// KPI 卡片配置
const kpiCards = [
  {
    title: '总充电量',
    value: '196,500 kWh',
    iconColor: NEON.blue,
    glowColor: 'rgba(0,187,249,0.3)',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: '总营收',
    value: '¥2,568,000',
    iconColor: NEON.green,
    glowColor: 'rgba(0,245,212,0.3)',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: '平均利用率',
    value: '76.8%',
    iconColor: '#00e5ff',
    glowColor: 'rgba(0,229,255,0.3)',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    title: '活跃站点',
    value: '6/8',
    iconColor: NEON.purple,
    glowColor: 'rgba(155,93,229,0.3)',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// 根据强度获取颜色（绿 -> 青 -> 蓝）
function getIntensityColor(intensity) {
  if (intensity >= 80) return NEON.blue;
  if (intensity >= 60) return '#00e5ff';
  if (intensity >= 40) return NEON.green;
  return '#66ffcc';
}

export default function Analytics() {
  const { isDark } = useTheme();
  const [startDate, setStartDate] = useState('2026-04-14');
  const [endDate, setEndDate] = useState('2026-04-20');
  const [stationGroup, setStationGroup] = useState('all');

  // 用户分群饼图数据
  const totalUsers = userSegments.reduce((sum, s) => sum + s.value, 0);

  const doughnutData = {
    labels: userSegments.map((s) => s.name),
    datasets: [
      {
        data: userSegments.map((s) => s.value),
        backgroundColor: userSegments.map((s) => s.color),
        borderColor: 'rgba(17,24,39,0.8)',
        borderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

  const doughnutOptions = {
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
            const pct = ((context.parsed / totalUsers) * 100).toFixed(1);
            return `${context.label}: ${context.parsed.toLocaleString()} 人 (${pct}%)`;
          },
        },
      },
    },
  };

  // 各时段充电柱状图数据
  const barData = {
    labels: hourlySessions.map((s) => s.hour),
    datasets: [
      {
        label: '充电次数',
        data: hourlySessions.map((s) => s.sessions),
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(0,187,249,0.6)';
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(0,187,249,0.3)');
          gradient.addColorStop(1, 'rgba(0,245,212,0.8)');
          return gradient;
        },
        borderColor: NEON.blue,
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: NEON.green,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#d1d5db',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => `充电次数: ${context.parsed.y} 次`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(75,85,99,0.3)' },
        ticks: { color: '#9ca3af', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(75,85,99,0.3)' },
        ticks: { color: '#9ca3af', font: { size: 11 } },
      },
    },
  };

  // 营收与充电量趋势折线图数据
  const trendData = {
    labels: analyticsRevenueData.map((d) => d.date),
    datasets: [
      {
        label: '营收',
        data: analyticsRevenueData.map((d) => d.revenue),
        borderColor: NEON.blue,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(0,187,249,0.1)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(0,187,249,0.3)');
          gradient.addColorStop(1, 'rgba(0,187,249,0.02)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: NEON.blue,
        pointBorderColor: '#111827',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        yAxisID: 'y',
      },
      {
        label: '充电量',
        data: analyticsRevenueData.map((d) => d.energy),
        borderColor: NEON.green,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(0,245,212,0.1)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(0,245,212,0.3)');
          gradient.addColorStop(1, 'rgba(0,245,212,0.02)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: NEON.green,
        pointBorderColor: '#111827',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        yAxisID: 'y1',
      },
    ],
  };

  const trendOptions = {
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
            if (context.dataset.label === '营收') {
              return `营收: ¥${context.parsed.y.toLocaleString()}`;
            }
            return `充电量: ${context.parsed.y.toLocaleString()} kWh`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(75,85,99,0.3)' },
        ticks: { color: '#9ca3af' },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: { color: 'rgba(75,85,99,0.3)' },
        ticks: {
          color: NEON.blue,
          callback: (value) => `¥${(value / 1000).toFixed(0)}k`,
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: {
          color: NEON.green,
          callback: (value) => `${(value / 1000).toFixed(0)}k`,
        },
      },
    },
  };

  return (
    <div className="bg-gray-950 min-h-screen -mx-6 -my-6 px-6 py-6 space-y-6">
      {/* ===== 1. 页面头部 ===== */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-bold text-white"
            style={{ textShadow: '0 0 20px rgba(0,245,212,0.5), 0 0 40px rgba(0,245,212,0.2)' }}
          >
            运营数据看板
          </h1>
          <p className="text-gray-400 mt-1 text-sm">大数据分析 · 全局运营洞察</p>
        </div>

        {/* 筛选器行 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 whitespace-nowrap">开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 backdrop-blur-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 whitespace-nowrap">结束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 backdrop-blur-sm"
            />
          </div>
          <select
            value={stationGroup}
            onChange={(e) => setStationGroup(e.target.value)}
            aria-label="选择站点组"
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 backdrop-blur-sm"
          >
            <option value="all" className="bg-gray-900">全部站点组</option>
            <option value="commercial" className="bg-gray-900">商业区</option>
            <option value="residential" className="bg-gray-900">居民区</option>
            <option value="transport" className="bg-gray-900">交通枢纽</option>
          </select>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
            style={{
              background: 'rgba(0,245,212,0.15)',
              border: '1px solid rgba(0,245,212,0.4)',
              color: NEON.green,
              boxShadow: '0 0 15px rgba(0,245,212,0.2)',
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            下载报告
          </button>
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

      {/* ===== 3. 主内容区（两列） ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 左列 - 充电需求热力图 */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <h2
            className="text-lg font-semibold text-white mb-4"
            style={{ textShadow: '0 0 10px rgba(0,187,249,0.4)' }}
          >
            充电需求热力图
          </h2>
          <div className="h-[450px] rounded-xl overflow-hidden">
            <MapContainer
              center={[39.95, 116.40]}
              zoom={11}
              style={{ height: '100%', width: '100%' }}
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />
              {heatmapData.map((point, index) => (
                <CircleMarker
                  key={index}
                  center={[point.lat, point.lng]}
                  radius={point.intensity / 5}
                  pathOptions={{
                    color: getIntensityColor(point.intensity),
                    fillColor: getIntensityColor(point.intensity),
                    fillOpacity: 0.6,
                    weight: 1,
                  }}
                >
                  <Popup>
                    <div className="text-gray-800 text-sm">
                      <p className="font-semibold">{point.name}</p>
                      <p>需求强度: {point.intensity}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* 右列 - 两个图表 */}
        <div className="space-y-6">
          {/* 用户分群分析 */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
            <h2
              className="text-lg font-semibold text-white mb-4"
              style={{ textShadow: '0 0 10px rgba(0,245,212,0.4)' }}
            >
              用户分群分析
            </h2>
            <div className="relative h-[210px]">
              <Doughnut data={doughnutData} options={doughnutOptions} />
              {/* 中心文字 */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white" style={{ textShadow: '0 0 10px rgba(0,245,212,0.5)' }}>
                    {totalUsers.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">总用户数</p>
                </div>
              </div>
            </div>
          </div>

          {/* 各时段充电次数 */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
            <h2
              className="text-lg font-semibold text-white mb-4"
              style={{ textShadow: '0 0 10px rgba(0,229,255,0.4)' }}
            >
              各时段充电次数
            </h2>
            <div className="h-[210px]">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* ===== 4. 营收与充电量趋势（全宽） ===== */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
        <h2
          className="text-lg font-semibold text-white mb-4"
          style={{ textShadow: '0 0 10px rgba(0,187,249,0.4)' }}
        >
          营收与充电量趋势
        </h2>
        <div className="h-72">
          <Line data={trendData} options={trendOptions} />
        </div>
      </div>

      {/* ===== 5. 用户行为指标表格（全宽） ===== */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-5 pb-4">
          <h2
            className="text-lg font-semibold text-white"
            style={{ textShadow: '0 0 10px rgba(155,93,229,0.4)' }}
          >
            用户行为指标
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-white/10">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  指标名称
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  数值
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  变化趋势
                </th>
              </tr>
            </thead>
            <tbody>
              {behaviorMetrics.map((item, index) => (
                <tr
                  key={index}
                  className={`border-t border-white/5 transition-colors duration-300 ${
                    index % 2 === 1 ? 'bg-white/[0.02]' : ''
                  } hover:bg-white/[0.04]`}
                >
                  <td className="px-6 py-4 text-gray-200 font-medium">{item.metric}</td>
                  <td className="px-6 py-4 text-white" style={{ textShadow: '0 0 8px rgba(0,245,212,0.3)' }}>
                    {item.value}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="inline-flex items-center gap-1 text-sm font-medium"
                      style={{
                        color: item.trend === 'up' ? NEON.green : NEON.pink,
                        textShadow: item.trend === 'up'
                          ? '0 0 8px rgba(0,245,212,0.4)'
                          : '0 0 8px rgba(241,91,181,0.4)',
                      }}
                    >
                      {item.trend === 'up' ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      )}
                      {item.change}
                    </span>
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
