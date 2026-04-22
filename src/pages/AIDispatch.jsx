import { useMemo } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import '../utils/chartSetup';
import { useTheme } from '../context/ThemeContext';

// ── Mock 数据 ──────────────────────────────────────────────

const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

// 模拟真实充电需求曲线：早高峰(8-9)、午间回落、晚高峰(18-20)
const actualDemand = [
  12, 8, 5, 4, 3, 6, 18, 45, 72, 58, 42, 38, 35, 40, 48, 52, 65, 82, 95, 88, 70, 48, 30, 18,
];
const aiPrediction = [
  14, 9, 6, 5, 4, 7, 20, 48, 75, 55, 40, 36, 37, 42, 50, 54, 68, 85, 92, 90, 72, 50, 32, 20,
];
const confidenceUpper = aiPrediction.map((v) => v + 8);
const confidenceLower = aiPrediction.map((v) => Math.max(0, v - 8));

// 分时定价：谷时(0-6)、平时(7-10,15-16)、峰时(11-14,17-19)、尖峰(20-23)
const priceLevels = [
  0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6,
  1.2, 1.2, 1.2, 1.2,
  2.0, 2.0, 2.0, 2.0,
  1.2, 1.2,
  2.0, 2.0, 2.0,
  2.8, 2.8, 2.8, 2.8,
];

// 根据价格返回颜色
function priceColor(price) {
  if (price <= 0.6) return '#10b981';   // 谷时 - 绿色
  if (price <= 1.2) return '#f59e0b';   // 平时 - 黄色
  if (price <= 2.0) return '#ef4444';   // 峰时 - 红色
  return '#dc2626';                      // 尖峰 - 深红
}

// KPI 卡片
const kpiCards = [
  {
    title: '预测准确率',
    value: '94.7%',
    subtitle: '较上周 +1.2%',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
    icon: 'brain',
  },
  {
    title: '动态调价收益',
    value: '+23.5%',
    subtitle: '较上月 +5.8%',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    icon: 'trending-up',
  },
  {
    title: '故障预警命中',
    value: '91.2%',
    subtitle: '较上月 +3.4%',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    icon: 'bell',
  },
  {
    title: '利用率提升',
    value: '18.6%',
    subtitle: '较上月 +2.1%',
    iconBg: 'bg-violet-100 dark:bg-violet-900/40',
    iconColor: 'text-violet-600 dark:text-violet-400',
    icon: 'chart',
  },
];

// AI 决策建议
const aiDecisions = [
  {
    title: '负载均衡建议',
    description: '建议将国贸站3号桩切换至待机模式，预计节省电费 ¥340/天',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
    icon: 'scale',
  },
  {
    title: '峰谷套利机会',
    description: '预测明日14:00-16:00光伏发电过剩，建议提前充电，节省成本18%',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    icon: 'solar',
  },
  {
    title: '设备维护预警',
    description: '望京站7号桩温度异常趋势，建议48小时内检修，避免停机损失',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    icon: 'alert',
  },
];

// 模型性能指标
const modelMetrics = [
  { model: '需求预测', accuracy: '94.7%', mae: '2.3 kWh', data: '180万条', frequency: '每小时' },
  { model: '动态定价', accuracy: '89.2%', mae: '¥0.08', data: '45万条', frequency: '每15分钟' },
  { model: '故障预警', accuracy: '91.2%', mae: '-', data: '12万条', frequency: '实时' },
  { model: '用户画像', accuracy: '87.5%', mae: '-', data: '230万条', frequency: '每日' },
];

// ── 图标组件 ──────────────────────────────────────────────

function BrainIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function TrendingUpIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function BellIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

function ChartIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function ScaleIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
    </svg>
  );
}

function SolarIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  );
}

function AlertIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function CheckCircleIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

const iconMap = {
  brain: BrainIcon,
  'trending-up': TrendingUpIcon,
  bell: BellIcon,
  chart: ChartIcon,
  scale: ScaleIcon,
  solar: SolarIcon,
  alert: AlertIcon,
};

// ── 主组件 ──────────────────────────────────────────────

export default function AIDispatch() {
  const { isDark } = useTheme();

  // 需求预测折线图
  const demandChartData = useMemo(
    () => ({
      labels: hours,
      datasets: [
        {
          label: '置信区间上限',
          data: confidenceUpper,
          borderColor: 'transparent',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          fill: '+1',
          pointRadius: 0,
          tension: 0.4,
        },
        {
          label: '置信区间下限',
          data: confidenceLower,
          borderColor: 'transparent',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          fill: false,
          pointRadius: 0,
          tension: 0.4,
        },
        {
          label: 'AI预测',
          data: aiPrediction,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          borderDash: [6, 4],
          borderWidth: 2.5,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: '#10b981',
          pointBorderColor: isDark ? '#1f2937' : '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 6,
        },
        {
          label: '实际需求',
          data: actualDemand,
          borderColor: '#3b82f6',
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return 'rgba(59,130,246,0.1)';
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(59,130,246,0.25)');
            gradient.addColorStop(1, 'rgba(59,130,246,0.01)');
            return gradient;
          },
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: isDark ? '#1f2937' : '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 6,
        },
      ],
    }),
    [isDark]
  );

  const demandChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: isDark ? '#d1d5db' : '#374151',
            usePointStyle: true,
            pointStyleWidth: 10,
            padding: 20,
            font: { size: 12 },
            filter: (item) => item.text !== '置信区间上限' && item.text !== '置信区间下限',
          },
        },
        tooltip: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          titleColor: isDark ? '#d1d5db' : '#111827',
          bodyColor: isDark ? '#d1d5db' : '#111827',
          borderColor: isDark ? '#374151' : '#e5e7eb',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (context) => {
              if (context.dataset.label.includes('置信区间')) return null;
              return `${context.dataset.label}：${context.parsed.y} kWh`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: isDark ? '#374151' : '#f3f4f6' },
          ticks: {
            color: isDark ? '#9ca3af' : '#6b7280',
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 12,
          },
        },
        y: {
          grid: { color: isDark ? '#374151' : '#f3f4f6' },
          ticks: {
            color: isDark ? '#9ca3af' : '#6b7280',
            callback: (value) => `${value} kWh`,
          },
          beginAtZero: true,
        },
      },
    }),
    [isDark]
  );

  // 动态定价柱状图
  const pricingChartData = useMemo(
    () => ({
      labels: hours,
      datasets: [
        {
          label: '电价 (¥/kWh)',
          data: priceLevels,
          backgroundColor: priceLevels.map((p) => {
            const c = priceColor(p);
            return c === '#10b981'
              ? 'rgba(16, 185, 129, 0.75)'
              : c === '#f59e0b'
                ? 'rgba(245, 158, 11, 0.75)'
                : c === '#ef4444'
                  ? 'rgba(239, 68, 68, 0.75)'
                  : 'rgba(220, 38, 38, 0.85)';
          }),
          borderColor: priceLevels.map(priceColor),
          borderWidth: 1.5,
          borderRadius: 4,
          barPercentage: 0.7,
        },
      ],
    }),
    []
  );

  const pricingChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          titleColor: isDark ? '#d1d5db' : '#111827',
          bodyColor: isDark ? '#d1d5db' : '#111827',
          borderColor: isDark ? '#374151' : '#e5e7eb',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (context) => `电价：¥${context.parsed.y.toFixed(2)}/kWh`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: isDark ? '#374151' : '#f3f4f6' },
          ticks: {
            color: isDark ? '#9ca3af' : '#6b7280',
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 12,
          },
        },
        y: {
          grid: { color: isDark ? '#374151' : '#f3f4f6' },
          ticks: {
            color: isDark ? '#9ca3af' : '#6b7280',
            callback: (value) => `¥${value.toFixed(1)}`,
          },
          beginAtZero: true,
          max: 3.2,
        },
      },
    }),
    [isDark]
  );

  return (
    <div className="space-y-6">
      {/* ── 页面标题 ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI 智能调度中心</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            基于机器学习的充电需求预测与动态定价引擎
          </p>
        </div>
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          模型状态: 运行中
        </span>
      </div>

      {/* ── KPI 卡片 ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => {
          const IconComp = iconMap[card.icon];
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    {card.subtitle}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  {IconComp && <IconComp className={`w-6 h-6 ${card.iconColor}`} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 图表区域 ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 充电需求预测 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            未来24小时充电需求预测
          </h2>
          <div className="h-80">
            <Line data={demandChartData} options={demandChartOptions} />
          </div>
        </div>

        {/* 动态定价策略 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            分时动态定价策略
          </h2>
          <div className="h-72">
            <Bar data={pricingChartData} options={pricingChartOptions} />
          </div>
          {/* 图例 */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
              谷时 ¥0.60
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
              <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
              平时 ¥1.20
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
              <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
              峰时 ¥2.00
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
              <span className="w-3 h-3 rounded-sm bg-red-700 inline-block" />
              尖峰 ¥2.80
            </span>
          </div>
        </div>
      </div>

      {/* ── AI 决策建议 ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {aiDecisions.map((decision, index) => {
          const IconComp = iconMap[decision.icon];
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg ${decision.iconBg} flex items-center justify-center shrink-0`}>
                  {IconComp && <IconComp className={`w-5 h-5 ${decision.iconColor}`} />}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {decision.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                    {decision.description}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                <span>查看详情</span>
                <svg className="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 模型性能指标 ───────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 pb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">模型性能指标</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            各AI子模型的运行状态与精度表现
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/30">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  模型
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  准确率
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  MAE
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  训练数据量
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  更新频率
                </th>
              </tr>
            </thead>
            <tbody>
              {modelMetrics.map((row, index) => (
                <tr
                  key={index}
                  className={`border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    index % 2 === 1 ? 'bg-gray-50/50 dark:bg-gray-900/20' : ''
                  }`}
                >
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {row.model}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                      {row.accuracy}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-300">
                    {row.mae}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-300">
                    {row.data}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400">
                      {row.frequency}
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
