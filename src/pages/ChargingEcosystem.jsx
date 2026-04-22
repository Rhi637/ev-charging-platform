import { useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import '../utils/chartSetup';
import { useTheme } from '../context/ThemeContext';

// 商业模式卡片数据
const businessModels = [
  {
    title: '充电+零售',
    description: '充电等待期间，用户可在合作商铺消费，平台获取15%佣金',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
    iconBgLight: 'bg-orange-100',
    iconBgDark: 'dark:bg-orange-900/40',
    iconColorLight: 'text-orange-600',
    iconColorDark: 'dark:text-orange-400',
    accentBorder: 'border-l-orange-500 dark:border-l-orange-400',
  },
  {
    title: '充电+餐饮',
    description: '合作餐厅提供充电优惠套餐，平均客单价提升35%',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.126-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
      </svg>
    ),
    iconBgLight: 'bg-amber-100',
    iconBgDark: 'dark:bg-amber-900/40',
    iconColorLight: 'text-amber-600',
    iconColorDark: 'dark:text-amber-400',
    accentBorder: 'border-l-amber-500 dark:border-l-amber-400',
  },
  {
    title: '充电+物流',
    description: '为物流车辆提供专属充电+配货信息服务',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    iconBgLight: 'bg-blue-100',
    iconBgDark: 'dark:bg-blue-900/40',
    iconColorLight: 'text-blue-600',
    iconColorDark: 'dark:text-blue-400',
    accentBorder: 'border-l-blue-500 dark:border-l-blue-400',
  },
];

// 合作伙伴数据
const partners = [
  { name: '便利店品牌', detail: '覆盖320家门店', sub: '月均引流1.2万人次', color: 'text-orange-500 dark:text-orange-400', bgLight: 'bg-orange-50', bgDark: 'dark:bg-orange-900/20' },
  { name: '连锁餐饮', detail: '合作86家餐厅', sub: '充电优惠套餐', color: 'text-amber-500 dark:text-amber-400', bgLight: 'bg-amber-50', bgDark: 'dark:bg-amber-900/20' },
  { name: '物流园区', detail: '12个园区', sub: '专属充电站', color: 'text-blue-500 dark:text-blue-400', bgLight: 'bg-blue-50', bgDark: 'dark:bg-blue-900/20' },
  { name: '商业地产', detail: '5家购物中心', sub: '充电+购物', color: 'text-purple-500 dark:text-purple-400', bgLight: 'bg-purple-50', bgDark: 'dark:bg-purple-900/20' },
  { name: '景区旅游', detail: '8个景区', sub: '充电+门票优惠', color: 'text-emerald-500 dark:text-emerald-400', bgLight: 'bg-emerald-50', bgDark: 'dark:bg-emerald-900/20' },
  { name: '汽车服务', detail: '23家门店', sub: '洗车/保养', color: 'text-rose-500 dark:text-rose-400', bgLight: 'bg-rose-50', bgDark: 'dark:bg-rose-900/20' },
];

// 标杆案例数据
const successCases = [
  { scene: '物流园区A', partner: '顺丰速运', growth: '+45%', revenue: '¥12万/月', satisfaction: '4.9/5' },
  { scene: '购物中心B', partner: '万达广场', growth: '+32%', revenue: '¥28万/月', satisfaction: '4.7/5' },
  { scene: '景区C', partner: '故宫周边', growth: '+68%', revenue: '¥8.5万/月', satisfaction: '4.8/5' },
];

export default function ChargingEcosystem() {
  const { isDark } = useTheme();
  const [stationCount, setStationCount] = useState(10);

  // 生态收入构成 - 环形图
  const doughnutData = {
    labels: ['充电服务费', '佣金收入', '广告收入', '增值服务', '数据服务'],
    datasets: [
      {
        data: [55, 20, 12, 8, 5],
        backgroundColor: ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ec4899'],
        borderColor: isDark ? '#1f2937' : '#ffffff',
        borderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: isDark ? '#d1d5db' : '#374151',
          padding: 16,
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
          label: (context) => `${context.label}: ${context.parsed}%`,
        },
      },
    },
  };

  // ROI 计算
  const monthlyRevenue = (stationCount * 2.8).toFixed(1);
  const yearlyRevenue = (stationCount * 2.8 * 12).toFixed(1);
  const paybackPeriod = Math.max(6, Math.round(18 - stationCount * 0.12));

  return (
    <div className="space-y-6">
      {/* ===== 1. 页面头部 ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">充电+生态</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400">
              新商业模式
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">超越充电，构建一站式出行服务生态</p>
        </div>
      </div>

      {/* ===== 2. 商业模式概览 ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {businessModels.map((model, index) => (
          <div
            key={index}
            className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 ${model.accentBorder} transition-shadow hover:shadow-md`}
          >
            <div className={`w-12 h-12 rounded-xl ${model.iconBgLight} ${model.iconBgDark} flex items-center justify-center ${model.iconColorLight} ${model.iconColorDark} mb-4`}>
              {model.icon}
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{model.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{model.description}</p>
          </div>
        ))}
      </div>

      {/* ===== 3. 合作伙伴网络 ===== */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">合作伙伴网络</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((partner, index) => (
            <div
              key={index}
              className={`bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex items-start gap-4 transition-shadow hover:shadow-md`}
            >
              <div className={`w-10 h-10 rounded-lg ${partner.bgLight} ${partner.bgDark} flex items-center justify-center shrink-0`}>
                <svg className={`w-5 h-5 ${partner.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{partner.name}</h4>
                <p className={`text-sm font-medium ${partner.color} mt-0.5`}>{partner.detail}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{partner.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 4. 生态收入构成 (环形图) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">生态收入构成</h2>
          <div className="h-[320px]">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>

        {/* ===== 5. 标杆案例 ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">标杆案例</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">场景</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">合作方</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">充电量增长</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">生态收入</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">用户满意度</th>
                </tr>
              </thead>
              <tbody>
                {successCases.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                    <td className="py-3 px-3 font-medium text-gray-900 dark:text-white">{item.scene}</td>
                    <td className="py-3 px-3 text-gray-600 dark:text-gray-300">{item.partner}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                        {item.growth}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-orange-600 dark:text-orange-400 font-medium">{item.revenue}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {item.satisfaction}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===== 6. 生态合作 ROI 计算 ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">生态合作 ROI 计算</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 输入区 */}
          <div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">合作站点数</label>
                <span className="text-sm font-bold px-2.5 py-0.5 rounded-md bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400">
                  {stationCount} 个
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={stationCount}
                onChange={(e) => setStationCount(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1</span>
                <span>100</span>
              </div>
            </div>
            <div className="mt-6 p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/40">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-orange-500 dark:text-orange-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <p className="text-sm text-orange-700 dark:text-orange-300 leading-relaxed">
                  基于历史数据模型，每个合作站点平均每月可带来 ¥2.8万 生态收入，实际收益因合作类型和地区差异有所不同。
                </p>
              </div>
            </div>
          </div>

          {/* 输出区 */}
          <div className="space-y-4">
            <div className="rounded-xl p-5 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800/40">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">预计月增收</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">¥{monthlyRevenue}万</p>
            </div>
            <div className="rounded-xl p-5 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800/40">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">预计年增收</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">¥{yearlyRevenue}万</p>
            </div>
            <div className="rounded-xl p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800/40">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">投资回报周期</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{paybackPeriod} 个月</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
