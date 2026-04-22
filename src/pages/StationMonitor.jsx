import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Line } from 'react-chartjs-2';
import '../utils/chartSetup';
import { statusBadge } from '../utils/statusBadge';
import { useTheme } from '../context/ThemeContext';
import { stations } from '../data/mockData';

// 修复 Leaflet 默认图标问题
delete L.Icon.Default.prototype._getIconUrl;

// 状态对应颜色映射
const statusColorMap = {
  '在线': '#22c55e',
  '维护中': '#f97316',
  '离线': '#ef4444',
};

// 创建自定义圆形标记图标
const createStationIcon = (status) => {
  const color = statusColorMap[status] || '#6b7280';
  return L.divIcon({
    className: 'custom-station-icon',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 3px solid rgba(255,255,255,0.9);
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

// 生成历史用电量模拟数据（最近7小时）
const generateHistoryData = () => {
  return [320, 450, 380, 520, 480, 390, 450];
};

// 获取最近7小时标签
const getHourLabels = () => {
  const now = new Date();
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
    labels.push(`${hour.getHours().toString().padStart(2, '0')}:00`);
  }
  return labels;
};

export default function StationMonitor() {
  const [selectedStation, setSelectedStation] = useState(null);
  const { isDark } = useTheme();

  // 模态框图表数据
  const modalChartData = {
    labels: getHourLabels(),
    datasets: [
      {
        label: '用电量 (kWh)',
        data: generateHistoryData(),
        borderColor: '#3b82f6',
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(59,130,246,0.1)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(59,130,246,0.3)');
          gradient.addColorStop(1, 'rgba(59,130,246,0.02)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: isDark ? '#1f2937' : '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const modalChartOptions = {
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
        padding: 10,
        callbacks: {
          label: (context) => `用电量：${context.parsed.y} kWh`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: isDark ? '#4b5563' : '#f3f4f6' },
        ticks: { color: isDark ? '#d1d5db' : '#6b7280', font: { size: 11 } },
      },
      y: {
        grid: { color: isDark ? '#4b5563' : '#f3f4f6' },
        ticks: {
          color: isDark ? '#d1d5db' : '#6b7280',
          font: { size: 11 },
          callback: (value) => `${value} kWh`,
        },
      },
    },
  };

  // 模拟站点统计数据
  const getStationStats = (station) => {
    const totalPlugs = 12;
    const availablePlugs = station.status === '在线' ? Math.floor(Math.random() * 5) + 2 : 0;
    const todayChargeCount = station.status === '在线' ? Math.floor(Math.random() * 30) + 15 : 0;
    const todayRevenue = station.status === '在线' ? Math.floor(Math.random() * 3000) + 1000 : 0;
    return { totalPlugs, availablePlugs, todayChargeCount, todayRevenue };
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">充电站监控</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">实时查看所有充电站的运行状态与位置分布</p>
      </div>

      {/* 地图区域 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 pb-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">站点分布地图</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">点击标记查看站点基本信息</p>
        </div>
        <div className="p-4">
          <div className="h-[400px] rounded-xl overflow-hidden">
            <MapContainer
              center={[39.95, 116.40]}
              zoom={11}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {stations.map((station) => (
                <Marker
                  key={station.id}
                  position={[station.lat, station.lng]}
                  icon={createStationIcon(station.status)}
                >
                  <Popup>
                    <div className="text-sm" style={{ minWidth: '180px' }}>
                      <p className="font-bold text-base mb-1">{station.name}</p>
                      <p className="mb-1">
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '1px 8px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: 500,
                            backgroundColor: statusColorMap[station.status] + '22',
                            color: statusColorMap[station.status],
                          }}
                        >
                          {station.status}
                        </span>
                      </p>
                      <p className="text-gray-600 mb-1" style={{ fontSize: '12px' }}>
                        {station.address}
                      </p>
                      <p className="text-gray-600" style={{ fontSize: '12px' }}>
                        当前功率：<strong>{station.currentPower} kW</strong>
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* 充电站列表 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">充电站列表</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {stations.map((station) => (
            <div
              key={station.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
                  {station.name}
                </h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${statusBadge(station.status)}`}
                >
                  {station.status}
                </span>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 truncate">
                {station.address}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">总功率输出</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {station.totalPower.toLocaleString()} kWh
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">今日营收</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    ¥{station.revenue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">设备温度</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {station.temperature}°C
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">当前功率</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {station.currentPower} kW
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStation(station)}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                查看详情
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 站点详情模态框 */}
      {selectedStation && (
        <button
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedStation(null)}
          aria-label="关闭"
        >
          {/* 背景遮罩 */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* 模态框内容 */}
          <div
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto modal-scroll"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setSelectedStation(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer z-10"
              aria-label="关闭"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-6">
              {/* 站点名称与状态 */}
              <div className="mb-5">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: statusColorMap[selectedStation.status] + '22' }}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke={statusColorMap[selectedStation.status]}
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedStation.name}
                    </h2>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(selectedStation.status)}`}
                    >
                      {selectedStation.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {selectedStation.address}
                </p>
              </div>

              {/* 实时数据 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">实时功率</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedStation.currentPower}
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">kW</span>
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">设备温度</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedStation.temperature}
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">°C</span>
                  </p>
                </div>
              </div>

              {/* 历史用电量趋势图表 */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  历史用电量趋势
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <div className="h-48">
                    <Line data={modalChartData} options={modalChartOptions} />
                  </div>
                </div>
              </div>

              {/* 站点统计 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">总充电桩数</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {getStationStats(selectedStation).totalPlugs} 个
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">可用充电桩</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {getStationStats(selectedStation).availablePlugs} 个
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">今日充电次数</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {getStationStats(selectedStation).todayChargeCount} 次
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">今日营收</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    ¥{getStationStats(selectedStation).todayRevenue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
