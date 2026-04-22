import { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
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

// 24小时充放电模拟数据（谷时充电，峰时放电）
const hourlyLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

// 充电功率（kW）- 谷时（22:00-07:00）高，峰时低
const chargePower = [
  280, 320, 350, 380, 360, 340, 300, 250,  // 00-07 谷时充电
  150, 80, 60, 50, 70, 90, 60, 40,          // 08-15 峰时低充电
  50, 80, 120, 180, 250, 300, 320, 310,     // 16-23 晚间回升
];

// 放电功率（kW）- 峰时（09:00-12:00, 14:00-17:00）高
const dischargePower = [
  0, 0, 0, 0, 0, 0, 0, 0,                   // 00-07 无放电
  50, 180, 280, 320, 250, 120, 200, 300,    // 08-15 峰时放电
  350, 280, 150, 60, 20, 0, 0, 0,           // 16-23 逐渐停止
];

// V2G充电站模拟数据
const v2gStations = [
  { name: '天河体育中心站', vehicles: 186, charge: 2450, discharge: 3280, status: '运行中' },
  { name: '珠江新城商务站', vehicles: 245, charge: 3120, discharge: 2860, status: '运行中' },
  { name: '番禺万博广场站', vehicles: 132, charge: 1890, discharge: 2100, status: '运行中' },
  { name: '海珠琶洲会展站', vehicles: 98, charge: 1200, discharge: 980, status: '待机' },
  { name: '白云万达广场站', vehicles: 167, charge: 2340, discharge: 2560, status: '维护' },
];

// KPI 卡片配置
const kpiCards = [
  {
    title: '接入车辆数',
    value: '1,247 辆',
    iconColor: NEON.blue,
    glowColor: 'rgba(0,187,249,0.3)',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M8 17v-4m8 4v-4m-8 0h8m-8 0V9a4 4 0 018 0v4M5 17h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: '今日放电量',
    value: '12,580 kWh',
    iconColor: NEON.green,
    glowColor: 'rgba(0,245,212,0.3)',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: '车主总收益',
    value: '¥8,340',
    iconColor: NEON.yellow,
    glowColor: 'rgba(254,228,64,0.3)',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: '电网调节能力',
    value: '3,200 kW',
    iconColor: NEON.purple,
    glowColor: 'rgba(155,93,229,0.3)',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

// 状态样式映射
function getStatusStyle(status) {
  switch (status) {
    case '运行中':
      return {
        bg: 'rgba(0,245,212,0.15)',
        color: NEON.green,
        border: 'rgba(0,245,212,0.4)',
        glow: '0 0 8px rgba(0,245,212,0.3)',
      };
    case '待机':
      return {
        bg: 'rgba(254,228,64,0.15)',
        color: NEON.yellow,
        border: 'rgba(254,228,64,0.4)',
        glow: '0 0 8px rgba(254,228,64,0.3)',
      };
    case '维护':
      return {
        bg: 'rgba(251,146,60,0.15)',
        color: '#fb923c',
        border: 'rgba(251,146,60,0.4)',
        glow: '0 0 8px rgba(251,146,60,0.3)',
      };
    default:
      return { bg: 'rgba(156,163,175,0.15)', color: '#9ca3af', border: 'rgba(156,163,175,0.4)', glow: 'none' };
  }
}

export default function V2G() {
  const { isDark } = useTheme();

  // 收益模拟器状态
  const [batteryCapacity, setBatteryCapacity] = useState(60);
  const [dischargeRatio, setDischargeRatio] = useState(30);
  const [dischargePrice, setDischargePrice] = useState(0.85);

  // 实时计算收益
  const revenue = useMemo(() => {
    const daily = (batteryCapacity * (dischargeRatio / 100) * dischargePrice);
    const monthly = daily * 30;
    const yearly = daily * 365;
    return {
      daily: daily.toFixed(2),
      monthly: monthly.toFixed(2),
      yearly: yearly.toFixed(2),
    };
  }, [batteryCapacity, dischargeRatio, dischargePrice]);

  // 充放电功率曲线数据
  const powerChartData = {
    labels: hourlyLabels,
    datasets: [
      {
        label: '充电功率',
        data: chargePower,
        borderColor: NEON.blue,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(0,187,249,0.1)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(0,187,249,0.35)');
          gradient.addColorStop(1, 'rgba(0,187,249,0.02)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
        pointBackgroundColor: NEON.blue,
        pointBorderColor: '#111827',
        pointBorderWidth: 2,
        borderWidth: 2,
      },
      {
        label: '放电功率',
        data: dischargePower.map((v) => -v),
        borderColor: NEON.green,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(0,245,212,0.1)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(0,245,212,0.02)');
          gradient.addColorStop(1, 'rgba(0,245,212,0.35)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
        pointBackgroundColor: NEON.green,
        pointBorderColor: '#111827',
        pointBorderWidth: 2,
        borderWidth: 2,
      },
    ],
  };

  const powerChartOptions = {
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
            const val = Math.abs(context.parsed.y);
            return `${context.dataset.label}: ${val} kW`;
          },
        },
      },
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
          callback: (value) => `${Math.abs(value)} kW`,
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
              V2G 车网互动
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
              V2G 已启用
            </span>
          </div>
          <p className="text-gray-400 mt-1 text-sm">电动车变充电宝，双向充放电智能管理</p>
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

      {/* ===== 3. 双列内容区 ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 左列 - 24小时充放电功率曲线 */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <h2
            className="text-lg font-semibold text-white mb-4"
            style={{ textShadow: '0 0 10px rgba(0,187,249,0.4)' }}
          >
            24小时充放电功率曲线
          </h2>
          <div className="h-[320px]">
            <Line data={powerChartData} options={powerChartOptions} />
          </div>
        </div>

        {/* 右列 - 车主收益模拟器 */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <h2
            className="text-lg font-semibold text-white mb-5"
            style={{ textShadow: '0 0 10px rgba(254,228,64,0.4)' }}
          >
            车主收益模拟器
          </h2>

          <div className="space-y-6">
            {/* 电池容量滑块 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-300">电池容量</label>
                <span
                  className="text-sm font-bold px-2 py-0.5 rounded"
                  style={{ color: NEON.blue, background: 'rgba(0,187,249,0.1)' }}
                >
                  {batteryCapacity} kWh
                </span>
              </div>
              <input
                type="range"
                min={40}
                max={100}
                step={5}
                value={batteryCapacity}
                onChange={(e) => setBatteryCapacity(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${NEON.blue} 0%, ${NEON.blue} ${((batteryCapacity - 40) / 60) * 100}%, rgba(75,85,99,0.5) ${((batteryCapacity - 40) / 60) * 100}%, rgba(75,85,99,0.5) 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>40 kWh</span>
                <span>100 kWh</span>
              </div>
            </div>

            {/* 日均放电比例滑块 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-300">日均放电比例</label>
                <span
                  className="text-sm font-bold px-2 py-0.5 rounded"
                  style={{ color: NEON.green, background: 'rgba(0,245,212,0.1)' }}
                >
                  {dischargeRatio}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={50}
                step={5}
                value={dischargeRatio}
                onChange={(e) => setDischargeRatio(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${NEON.green} 0%, ${NEON.green} ${((dischargeRatio - 10) / 40) * 100}%, rgba(75,85,99,0.5) ${((dischargeRatio - 10) / 40) * 100}%, rgba(75,85,99,0.5) 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10%</span>
                <span>50%</span>
              </div>
            </div>

            {/* 放电单价滑块 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-300">放电单价</label>
                <span
                  className="text-sm font-bold px-2 py-0.5 rounded"
                  style={{ color: NEON.yellow, background: 'rgba(254,228,64,0.1)' }}
                >
                  ¥{dischargePrice.toFixed(2)}/kWh
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={1.5}
                step={0.05}
                value={dischargePrice}
                onChange={(e) => setDischargePrice(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${NEON.yellow} 0%, ${NEON.yellow} ${((dischargePrice - 0.5) / 1.0) * 100}%, rgba(75,85,99,0.5) ${((dischargePrice - 0.5) / 1.0) * 100}%, rgba(75,85,99,0.5) 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>¥0.50</span>
                <span>¥1.50</span>
              </div>
            </div>

            {/* 收益计算结果 */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{
                background: 'linear-gradient(135deg, rgba(0,245,212,0.08), rgba(0,187,249,0.08))',
                border: '1px solid rgba(0,245,212,0.2)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">日收益</span>
                <span className="text-lg font-bold" style={{ color: NEON.green, textShadow: '0 0 10px rgba(0,245,212,0.4)' }}>
                  ¥{revenue.daily}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">月收益</span>
                <span className="text-lg font-bold" style={{ color: NEON.blue, textShadow: '0 0 10px rgba(0,187,249,0.4)' }}>
                  ¥{revenue.monthly}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">年收益</span>
                <span className="text-lg font-bold" style={{ color: NEON.yellow, textShadow: '0 0 10px rgba(254,228,64,0.4)' }}>
                  ¥{revenue.yearly}
                </span>
              </div>
            </div>

            {/* 参考提示 */}
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
              style={{
                background: 'rgba(155,93,229,0.1)',
                border: '1px solid rgba(155,93,229,0.3)',
                color: NEON.purple,
              }}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              参考: 广州试点车主最高日赚 ¥200
            </div>
          </div>
        </div>
      </div>

      {/* ===== 4. V2G 充电站列表 ===== */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-5 pb-4">
          <h2
            className="text-lg font-semibold text-white"
            style={{ textShadow: '0 0 10px rgba(0,187,249,0.4)' }}
          >
            V2G 充电站列表
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-white/10">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">站点名称</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">接入车辆</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">今日充电(kWh)</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">今日放电(kWh)</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">状态</th>
              </tr>
            </thead>
            <tbody>
              {v2gStations.map((station, index) => {
                const statusStyle = getStatusStyle(station.status);
                return (
                  <tr
                    key={index}
                    className={`border-t border-white/5 transition-colors duration-300 ${
                      index % 2 === 1 ? 'bg-white/[0.02]' : ''
                    } hover:bg-white/[0.04]`}
                  >
                    <td className="px-6 py-4 text-gray-200 font-medium">{station.name}</td>
                    <td className="px-6 py-4 text-white" style={{ textShadow: '0 0 8px rgba(0,245,212,0.3)' }}>
                      {station.vehicles} 辆
                    </td>
                    <td className="px-6 py-4 text-gray-300">{station.charge.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-300">{station.discharge.toLocaleString()}</td>
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
                        {station.status === '运行中' && (
                          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusStyle.color }} />
                        )}
                        {station.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== 5. V2G 政策支持 ===== */}
      <div
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        style={{ boxShadow: '0 0 30px rgba(155,93,229,0.15)' }}
      >
        <h2
          className="text-lg font-semibold text-white mb-5"
          style={{ textShadow: '0 0 10px rgba(155,93,229,0.4)' }}
        >
          V2G 政策支持
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              label: '广州',
              value: '全国首批V2G试点城市',
              color: NEON.green,
              glow: 'rgba(0,245,212,0.2)',
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
            },
            {
              label: '聚合能力',
              value: '30万千瓦',
              color: NEON.blue,
              glow: 'rgba(0,187,249,0.2)',
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
            },
            {
              label: '累计放电',
              value: '160.45万度',
              color: NEON.yellow,
              glow: 'rgba(254,228,64,0.2)',
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
            },
            {
              label: '个人结算',
              value: '全国首张V2G结算单已发放',
              color: NEON.purple,
              glow: 'rgba(155,93,229,0.2)',
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
            },
          ].map((item, index) => (
            <div
              key={index}
              className="rounded-xl p-4 transition-colors duration-300"
              style={{
                background: `${item.color}08`,
                border: `1px solid ${item.color}25`,
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: `${item.color}15`, color: item.color, boxShadow: `0 0 10px ${item.glow}` }}
                >
                  {item.icon}
                </div>
                <span className="text-sm text-gray-400">{item.label}</span>
              </div>
              <p className="text-sm font-semibold text-white" style={{ textShadow: `0 0 8px ${item.glow}` }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
