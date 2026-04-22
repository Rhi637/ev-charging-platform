import { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import '../utils/chartSetup';
import { useTheme } from '../context/ThemeContext';

// 市场机遇数据
const marketOpportunities = [
  {
    title: '县域充电桩缺口',
    value: '120万+',
    unit: '台',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
    valueColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    title: '县域覆盖率',
    value: '仅',
    unit: '18%',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    valueColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    title: '平均建站成本',
    value: '降低',
    unit: '30%',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    valueColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    title: '预计市场规模',
    value: '500',
    unit: '亿元',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    iconBg: 'bg-violet-100 dark:bg-violet-900/40',
    iconColor: 'text-violet-600 dark:text-violet-400',
    valueColor: 'text-violet-600 dark:text-violet-400',
  },
];

// 轻量化方案核心优势
const features = [
  {
    title: '云端监控',
    desc: '无需本地运维团队',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      </svg>
    ),
    color: 'text-blue-500 dark:text-blue-400',
    bgLight: 'bg-blue-50',
    bgDark: 'dark:bg-blue-900/20',
  },
  {
    title: '快速部署',
    desc: '7天完成建站',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    color: 'text-amber-500 dark:text-amber-400',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-900/20',
  },
  {
    title: '智能调度',
    desc: 'AI优化充电策略',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    color: 'text-purple-500 dark:text-purple-400',
    bgLight: 'bg-purple-50',
    bgDark: 'dark:bg-purple-900/20',
  },
  {
    title: '低成本运维',
    desc: '运维成本降低60%',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'text-emerald-500 dark:text-emerald-400',
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-900/20',
  },
  {
    title: '灵活扩容',
    desc: '按需增加充电桩',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
      </svg>
    ),
    color: 'text-cyan-500 dark:text-cyan-400',
    bgLight: 'bg-cyan-50',
    bgDark: 'dark:bg-cyan-900/20',
  },
  {
    title: '数据驱动',
    desc: '精准选址降低空置率',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    color: 'text-rose-500 dark:text-rose-400',
    bgLight: 'bg-rose-50',
    bgDark: 'dark:bg-rose-900/20',
  },
];

// 省份部署数据
const provinceDeployments = [
  { name: '河南省', covered: 8, signed: 42, building: 15, status: '重点推进' },
  { name: '山东省', covered: 6, signed: 38, building: 12, status: '重点推进' },
  { name: '河北省', covered: 4, signed: 28, building: 8, status: '扩展中' },
  { name: '安徽省', covered: 3, signed: 25, building: 4, status: '试点中' },
  { name: '湖南省', covered: 2, signed: 23, building: 3, status: '试点中' },
];

// 扩张路线图
const timeline = [
  {
    phase: '2026 Q2',
    title: '试点启动',
    desc: '试点3个县域',
    status: 'current',
    color: 'bg-blue-500',
    ring: 'ring-blue-200 dark:ring-blue-800',
  },
  {
    phase: '2026 Q3',
    title: '规模扩展',
    desc: '扩展至15个县域',
    status: 'upcoming',
    color: 'bg-emerald-500',
    ring: 'ring-emerald-200 dark:ring-emerald-800',
  },
  {
    phase: '2026 Q4',
    title: '加速覆盖',
    desc: '覆盖50个县域',
    status: 'upcoming',
    color: 'bg-amber-500',
    ring: 'ring-amber-200 dark:ring-amber-800',
  },
  {
    phase: '2027 Q2',
    title: '目标达成',
    desc: '目标100个县域',
    status: 'upcoming',
    color: 'bg-violet-500',
    ring: 'ring-violet-200 dark:ring-violet-800',
  },
];

export default function CountyExpansion() {
  const { isDark } = useTheme();

  // 建站成本对比 - 柱状图
  const barData = {
    labels: ['设备成本', '施工成本', '运营成本(万/月)', '回本周期(月)'],
    datasets: [
      {
        label: '传统方案',
        data: [8, 3, 2, 24],
        backgroundColor: isDark ? 'rgba(239,68,68,0.7)' : 'rgba(239,68,68,0.8)',
        borderColor: isDark ? 'rgba(239,68,68,0.9)' : 'rgba(239,68,68,1)',
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
      {
        label: '轻量化方案',
        data: [5, 1.5, 0.8, 14],
        backgroundColor: isDark ? 'rgba(34,197,94,0.7)' : 'rgba(34,197,94,0.8)',
        borderColor: isDark ? 'rgba(34,197,94,0.9)' : 'rgba(34,197,94,1)',
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: isDark ? '#d1d5db' : '#374151',
          padding: 20,
          usePointStyle: true,
          pointStyleWidth: 10,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        titleColor: isDark ? '#d1d5db' : '#111827',
        bodyColor: isDark ? '#d1d5db' : '#374151',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label;
            const value = context.parsed.y;
            const idx = context.dataIndex;
            if (idx === 0) return `${label}: ¥${value}万`;
            if (idx === 1) return `${label}: ¥${value}万`;
            if (idx === 2) return `${label}: ¥${value}万/月`;
            return `${label}: ${value}个月`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: isDark ? 'rgba(75,85,99,0.3)' : 'rgba(209,213,219,0.5)' },
        ticks: { color: isDark ? '#9ca3af' : '#6b7280', font: { size: 11 } },
      },
      y: {
        grid: { color: isDark ? 'rgba(75,85,99,0.3)' : 'rgba(209,213,219,0.5)' },
        ticks: { color: isDark ? '#9ca3af' : '#6b7280', font: { size: 11 } },
        beginAtZero: true,
      },
    },
  };

  const statusBadge = (status) => {
    switch (status) {
      case '重点推进':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
      case '扩展中':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
      case '试点中':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* ===== 1. 页面头部 ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">县域下沉市场</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
              蓝海市场
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">专为三四线城市定制的轻量化充电运营方案</p>
        </div>
      </div>

      {/* ===== 2. 市场机遇 ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {marketOpportunities.map((item, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  <span className={item.valueColor}>{item.value}</span>
                  <span className="text-lg">{item.unit}</span>
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${item.iconBg} flex items-center justify-center ${item.iconColor}`}>
                {item.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== 3. 建站成本对比 (柱状图) ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">建站成本对比: 传统方案 vs 轻量化方案</h2>
        <div className="h-[320px]">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>

      {/* ===== 4. 已覆盖县域分布 ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">已覆盖县域分布</h2>

        {/* GIS 系统介绍 */}
        <div className="rounded-xl p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800/40 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">GIS智能选址系统</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">基于出行数据+消费数据精准定位优质点位</p>
            </div>
          </div>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">23</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">已覆盖县域</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">156</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">签约站点</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">42</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">在建站点</p>
          </div>
        </div>

        {/* 省份部署卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {provinceDeployments.map((province, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600/50"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{province.name}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(province.status)}`}>
                  {province.status}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">已覆盖</span>
                  <span className="font-medium text-gray-900 dark:text-white">{province.covered} 个</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">签约</span>
                  <span className="font-medium text-gray-900 dark:text-white">{province.signed} 个</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">在建</span>
                  <span className="font-medium text-gray-900 dark:text-white">{province.building} 个</span>
                </div>
              </div>
              {/* 进度条 */}
              <div className="mt-3 w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${(province.covered / 10) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 5. 轻量化方案核心优势 ===== */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">轻量化方案核心优势</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex items-start gap-4 transition-shadow hover:shadow-md"
            >
              <div className={`w-10 h-10 rounded-lg ${feature.bgLight} ${feature.bgDark} flex items-center justify-center shrink-0 ${feature.color}`}>
                {feature.icon}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{feature.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 6. 扩张路线图 ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">扩张路线图</h2>
        <div className="relative">
          {/* 时间线连接线 */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 dark:bg-gray-700 hidden sm:block" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {timeline.map((item, index) => (
              <div key={index} className="relative flex sm:flex-col items-start sm:items-center gap-4 sm:gap-3">
                {/* 节点圆点 */}
                <div className="relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full ${item.color} ${item.ring} ring-4 flex items-center justify-center ${
                      item.status === 'current' ? 'animate-pulse' : ''
                    }`}
                  >
                    {item.status === 'current' ? (
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs font-bold text-white">{index + 1}</span>
                    )}
                  </div>
                </div>

                {/* 内容 */}
                <div className="sm:text-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    item.status === 'current'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {item.phase}
                  </span>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mt-2">{item.title}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
