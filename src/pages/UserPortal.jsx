import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { stationAPI, sessionAPI, paymentAPI, reservationAPI } from '../services/api';
import { connectSocket, disconnectSocket, onSessionProgress } from '../services/socket';

// 修复 Leaflet 默认图标路径问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// 状态映射（API 英文状态 -> 中文显示）
const statusMap = { online: '在线', maintenance: '维护中', offline: '离线' };

// 根据站点状态返回标记颜色
function getMarkerColor(status) {
  switch (status) {
    case '在线': return '#10b981';
    case '维护中': return '#f59e0b';
    case '离线': return '#ef4444';
    default: return '#6b7280';
  }
}

// 创建自定义 divIcon
function createStationIcon(status) {
  const color = getMarkerColor(status);
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// ==================== 新增：地图定位控制组件 ====================
function MapController({ targetLocation, flyToId, shouldFly }) {
  const map = useMap();
  
  useEffect(() => {
    if (targetLocation && shouldFly) {
      const { lat, lng, zoom = 14 } = targetLocation;
      map.flyTo([lat, lng], zoom, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  }, [targetLocation, shouldFly, map, flyToId]);
  
  return null;
}

// ==================== 新增：定位按钮组件 ====================
function LocateButton({ onLocate }) {
  const map = useMap();
  const [locating, setLocating] = useState(false);
  
  const handleLocate = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.flyTo([latitude, longitude], 14, {
            duration: 1.2
          });
          
          // 添加临时标记
          const userMarker = L.marker([latitude, longitude], {
            icon: L.divIcon({
              html: `<div style="
                background: #3b82f6;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="3" fill="white"/>
                </svg>
              </div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })
          }).addTo(map);
          
          // 5秒后移除标记
          setTimeout(() => map.removeLayer(userMarker), 5000);
          
          if (onLocate) onLocate({ lat: latitude, lng: longitude });
          setLocating(false);
        },
        (error) => {
          console.error('定位失败:', error);
          if (onLocate) onLocate(null, error);
          setLocating(false);
        }
      );
    } else {
      alert('您的浏览器不支持地理定位');
      setLocating(false);
    }
  };
  
  return (
    <button
      onClick={handleLocate}
      disabled={locating}
      className="absolute bottom-20 right-4 z-[1000] bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
      style={{ border: 'none', cursor: 'pointer' }}
      title="定位到我"
    >
      {locating ? (
        <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )}
    </button>
  );
}

// Toast 通知组件
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const configs = {
    success: { bg: 'bg-green-100 dark:bg-green-900/40', icon: 'fa-check', color: 'text-green-500 dark:text-green-400' },
    error: { bg: 'bg-red-100 dark:bg-red-900/40', icon: 'fa-times', color: 'text-red-500 dark:text-red-400' },
    info: { bg: 'bg-blue-100 dark:bg-blue-900/40', icon: 'fa-info', color: 'text-blue-500 dark:text-blue-400' },
  };
  const cfg = configs[type] || configs.success;

  return (
    <div className="fixed top-20 right-4 z-[60] bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 flex items-center space-x-3 max-w-sm animate-[slideUp_0.4s_ease-out]">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cfg.bg}`}>
        <i className={`fas ${cfg.icon} ${cfg.color} text-sm`} />
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-200">{message}</p>
    </div>
  );
}

// 电池电量环形图
function BatteryRing({ percent }) {
  const circumference = 2 * Math.PI * 52; // r=52
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="batteryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#10b981' }} />
            <stop offset="100%" style={{ stopColor: '#3b82f6' }} />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="52" stroke="#e5e7eb" strokeWidth="8" fill="none" />
        <circle
          cx="60" cy="60" r="52"
          stroke="url(#batteryGradient)"
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-800 dark:text-white">{Math.round(percent)}%</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">电池电量</span>
      </div>
    </div>
  );
}

// 加载旋转动画组件
function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <svg className="w-12 h-12 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">正在加载充电站数据...</p>
    </div>
  );
}

// 判断是否为演示模式（无后端环境）
const isDemoMode = !import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL === '';

// 演示模式模拟数据
const DEMO_STATIONS = [
  { id: 1, name: '国贸充电站', address: '北京市朝阳区国贸CBD', lat: 39.9087, lng: 116.4605, status: 'online', total_piles: 20, available_piles: 8, power_type: 'DC', max_power: 120, price_per_kwh: 1.2 },
  { id: 2, name: '中关村充电站', address: '北京市海淀区中关村大街', lat: 39.9839, lng: 116.3165, status: 'online', total_piles: 15, available_piles: 3, power_type: 'DC', max_power: 90, price_per_kwh: 1.0 },
  { id: 3, name: '望京充电站', address: '北京市朝阳区望京SOHO', lat: 39.9929, lng: 116.4803, status: 'maintenance', total_piles: 10, available_piles: 0, power_type: 'AC', max_power: 7, price_per_kwh: 0.8 },
  { id: 4, name: '三里屯充电站', address: '北京市朝阳区三里屯路', lat: 39.9339, lng: 116.4541, status: 'online', total_piles: 12, available_piles: 5, power_type: 'DC', max_power: 150, price_per_kwh: 1.5 },
  { id: 5, name: '西单充电站', address: '北京市西城区西单北大街', lat: 39.9127, lng: 116.3749, status: 'offline', total_piles: 8, available_piles: 0, power_type: 'AC', max_power: 7, price_per_kwh: 0.6 },
];

export default function UserPortal() {
  const { user } = useAuth();

  // 站点数据
  const [stationList, setStationList] = useState([]);
  const [loading, setLoading] = useState(true);

  // 充电会话
  const [activeSession, setActiveSession] = useState(null);
  const [isCharging, setIsCharging] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(35);
  const [currentPower, setCurrentPower] = useState(60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentCost, setCurrentCost] = useState(0);
  const [remainMinutes, setRemainMinutes] = useState(45);

  // 选中站点
  const [selectedStation, setSelectedStation] = useState(null);

  // 弹窗状态
  const [showScanModal, setShowScanModal] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Toast 状态
  const [toast, setToast] = useState(null);

  // 预约表单状态
  const [reserveStationId, setReserveStationId] = useState(1);
  const [reserveDate, setReserveDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:00');
  const [selectedDuration, setSelectedDuration] = useState(2);

  // 支付方式
  const [paymentMethod, setPaymentMethod] = useState('wechat');
  const [paymentAmount, setPaymentAmount] = useState('¥0.00');
  const [paymentSessionId, setPaymentSessionId] = useState(null);
  const [paying, setPaying] = useState(false);

  // 摄像头
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);

  // 充电计时器
  const chargingIntervalRef = useRef(null);

  // ==================== 新增：地图定位相关状态 ====================
  const [targetLocation, setTargetLocation] = useState(null);
  const [shouldFly, setShouldFly] = useState(false);
  const [flyToId, setFlyToId] = useState(0);

  // 设置默认预约日期（明天）
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setReserveDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  // ==================== 初始化：加载站点、检查活跃会话、连接 WebSocket ====================
  useEffect(() => {
    if (isDemoMode) {
      // 演示模式：使用模拟数据，不发起真实 API 请求
      setStationList(DEMO_STATIONS);
      const firstOnline = DEMO_STATIONS.find((s) => s.status === 'online');
      if (firstOnline) setReserveStationId(firstOnline.id);
      setLoading(false);
      return;
    }

    // 获取充电站列表
    stationAPI.list()
      .then((data) => {
        const list = Array.isArray(data) ? data : data.stations || data.data || [];
        setStationList(list);
        // 默认选中第一个在线站点
        const firstOnline = list.find((s) => s.status === 'online');
        if (firstOnline) setReserveStationId(firstOnline.id);
      })
      .catch((err) => {
        console.error('获取充电站列表失败:', err);
        showToast('获取充电站列表失败，请稍后重试', 'error');
      })
      .finally(() => setLoading(false));

    // 检查是否有活跃的充电会话
    sessionAPI.getActive()
      .then((session) => {
        if (session) {
          setActiveSession(session);
          setIsCharging(true);
          setBatteryLevel(session.battery_level || session.batteryLevel || 35);
          setCurrentPower(session.power_kw || session.powerKw || 60);
          setCurrentCost(session.cost || 0);
          setElapsedSeconds(session.elapsed_seconds || session.elapsedSeconds || 0);
          setRemainMinutes(session.remain_minutes || session.remainMinutes || 45);
          showToast('检测到进行中的充电会话', 'info');
        }
      })
      .catch(() => {
        // 没有活跃会话，静默处理
      });

    // 连接 WebSocket
    try {
      if (user?.id) {
        connectSocket(user.id, user.role);
      }
    } catch (err) {
      console.warn('WebSocket 连接失败（演示模式）:', err);
    }

    return () => {
      if (chargingIntervalRef.current) clearInterval(chargingIntervalRef.current);
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      disconnectSocket();
    };
  }, [user?.id, user?.role]);

  // ==================== 监听 WebSocket 充电进度 ====================
  useEffect(() => {
    const unsubscribe = onSessionProgress((data) => {
      if (data) {
        setBatteryLevel(data.battery_level ?? data.batteryLevel ?? batteryLevel);
        setCurrentPower(data.power_kw ?? data.powerKw ?? currentPower);
        setCurrentCost(data.cost ?? currentCost);
        setElapsedSeconds(data.elapsed_seconds ?? data.elapsedSeconds ?? elapsedSeconds);
        setRemainMinutes(data.remain_minutes ?? data.remainMinutes ?? remainMinutes);

        // 如果充电完成
        if (data.status === 'completed' || data.status === 'done') {
          clearInterval(chargingIntervalRef.current);
          chargingIntervalRef.current = null;
          setIsCharging(false);
          setActiveSession(null);
          showToast('充电完成！', 'success');
          setTimeout(() => {
            setPaymentSessionId(data.session_id || data.sessionId || data.id);
            setPaymentAmount(`¥${(data.cost ?? 0).toFixed(2)}`);
            setShowPaymentModal(true);
          }, 500);
        }
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [batteryLevel, currentPower, currentCost, elapsedSeconds, remainMinutes]);

  // Toast 工具函数
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // 将 API 站点字段映射为展示用的中文状态
  const getStationStatus = (station) => {
    return statusMap[station.status] || station.status || '未知';
  };

  // 获取站点展示用的距离（API 可能不返回距离，生成模拟值）
  const getStationDistance = (station, index) => {
    if (station.distance) return station.distance;
    return `${(index * 0.8 + 0.5).toFixed(1)}km`;
  };

  // 获取站点空闲/总数
  const getStationFree = (station) => {
    return station.available_plugs ?? station.availablePlugs ?? 0;
  };

  const getStationTotal = (station) => {
    return station.total_plugs ?? station.totalPlugs ?? 0;
  };

  // 获取站点价格
  const getStationPrice = (station) => {
    return station.price_per_kwh ?? station.pricePerKwh ?? 1.20;
  };

  // 获取站点功率
  const getStationPower = (station) => {
    const kw = station.power_kw ?? station.powerKw ?? 60;
    return `${kw}kW`;
  };

  // ==================== 修改：选择站点时同时定位到该站点 ====================
  const handleSelectStation = (station) => {
    setSelectedStation(station);
    const lat = station.lat ?? station.latitude;
    const lng = station.lng ?? station.longitude;
    
    if (lat && lng) {
      setTargetLocation({ lat, lng, zoom: 15 });
      setShouldFly(true);
      setFlyToId(prev => prev + 1);
    }
    
    const displayName = station.name || `充电站 #${station.id}`;
    showToast(`已定位到 ${displayName}`, 'info');
  };

  // ==================== 新增：手动定位到指定坐标 ====================
  const flyToCoordinates = (lat, lng, zoom = 14, message = null) => {
    if (lat && lng) {
      setTargetLocation({ lat, lng, zoom });
      setShouldFly(true);
      setFlyToId(prev => prev + 1);
      if (message) {
        showToast(message, 'info');
      }
    }
  };

  // ==================== 扫码充电 ====================
  const openScanModal = () => setShowScanModal(true);
  const closeScanModal = () => {
    setShowScanModal(false);
    stopCamera();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setScanning(true);

      // 模拟3秒后识别成功
      setTimeout(() => {
        stopCamera();
        closeScanModal();
        showToast('扫码成功！已识别充电桩: CG-2026-0088', 'success');
      }, 3000);
    } catch {
      showToast('无法访问摄像头，请检查权限设置', 'error');
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setScanning(false);
  };

  // ==================== 预约充电 ====================
  const openReserveModal = () => setShowReserveModal(true);
  const closeReserveModal = () => setShowReserveModal(false);

  const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
  const durations = [1, 2, 3, 4];

  const getEstimatedCost = () => {
    const station = stationList.find((s) => s.id === reserveStationId);
    const price = station ? getStationPrice(station) : 1.20;
    return (price * 60 * selectedDuration / 60).toFixed(2);
  };

  const submitReservation = async () => {
    const station = stationList.find((s) => s.id === reserveStationId);
    const stationName = station ? station.name : '未知站点';

    try {
      if (!isDemoMode) {
        await reservationAPI.create({
          station_id: reserveStationId,
          date: reserveDate,
          time_slot: selectedTimeSlot,
          duration: selectedDuration,
        });
      }
      closeReserveModal();
      showToast(`预约成功！${stationName} ${reserveDate}`, 'success');
    } catch (err) {
      console.error('预约失败:', err);
      showToast(`预约失败: ${err.message || '请稍后重试'}`, 'error');
    }
  };

  // ==================== 开始充电 ====================
  const startCharging = async () => {
    if (isCharging) return;
    if (!selectedStation) {
      showToast('请先选择一个充电站', 'error');
      return;
    }

    try {
      let session;
      if (isDemoMode) {
        // 演示模式：创建模拟会话
        session = { id: 'demo-session-1', station_id: selectedStation.id, battery_level: 35, power_kw: 60, cost: 0, elapsed_seconds: 0, remain_minutes: 45 };
      } else {
        session = await sessionAPI.start(selectedStation.id);
      }
      setActiveSession(session);
      setIsCharging(true);
      setBatteryLevel(session.battery_level || session.batteryLevel || 35);
      setCurrentPower(session.power_kw || session.powerKw || 60);
      setCurrentCost(session.cost || 0);
      setElapsedSeconds(session.elapsed_seconds || session.elapsedSeconds || 0);
      setRemainMinutes(session.remain_minutes || session.remainMinutes || 45);
      showToast('充电已开始！', 'success');

      // 本地计时器作为备用更新（WebSocket 为主）
      chargingIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          const newBattery = Math.min(80, 35 + next * (0.15 + Math.random() * 0.1));
          const newCost = next * (0.08 + Math.random() * 0.02);
          const power = 55 + Math.floor(Math.random() * 15);
          const remain = Math.max(0, Math.round((80 - newBattery) / 0.2));

          setBatteryLevel(newBattery);
          setCurrentCost(newCost);
          setCurrentPower(power);
          setRemainMinutes(remain);

          if (newBattery >= 80) {
            clearInterval(chargingIntervalRef.current);
            chargingIntervalRef.current = null;
            setIsCharging(false);
            setActiveSession(null);
            showToast('充电完成！电池已充至80%', 'success');
            setTimeout(() => {
              setPaymentSessionId(activeSession?.id);
              setPaymentAmount(`¥${newCost.toFixed(2)}`);
              setShowPaymentModal(true);
            }, 500);
          }

          return next;
        });
      }, 1000);
    } catch (err) {
      console.error('启动充电失败:', err);
      showToast(`启动充电失败: ${err.message || '请检查站点状态后重试'}`, 'error');
    }
  };

  // ==================== 停止充电 ====================
  const stopCharging = async () => {
    if (!activeSession) return;

    try {
      if (!isDemoMode) {
        await sessionAPI.stop(activeSession.id);
      }
      if (chargingIntervalRef.current) {
        clearInterval(chargingIntervalRef.current);
        chargingIntervalRef.current = null;
      }
      setIsCharging(false);

      if (currentCost > 0) {
        setTimeout(() => {
          setPaymentSessionId(activeSession.id);
          setPaymentAmount(`¥${currentCost.toFixed(2)}`);
          setShowPaymentModal(true);
        }, 500);
      } else {
        setActiveSession(null);
        showToast('充电已停止', 'info');
      }
    } catch (err) {
      console.error('停止充电失败:', err);
      showToast(`停止充电失败: ${err.message || '请稍后重试'}`, 'error');
    }
  };

  // ==================== 支付 ====================
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaying(false);
  };

  const handlePayment = async () => {
    if (!paymentSessionId) {
      showToast('缺少会话信息，无法支付', 'error');
      return;
    }

    setPaying(true);
    try {
      if (!isDemoMode) {
        await paymentAPI.confirm(paymentSessionId);
      }
      closePaymentModal();
      showToast('支付成功！感谢使用绿能充电', 'success');
      setBatteryLevel(35);
      setCurrentCost(0);
      setElapsedSeconds(0);
      setActiveSession(null);
      setPaymentSessionId(null);
    } catch (err) {
      console.error('支付失败:', err);
      showToast(`支付失败: ${err.message || '请稍后重试'}`, 'error');
      setPaying(false);
    }
  };

  // 格式化时间
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 手机号脱敏
  const maskPhone = (phone) => {
    if (!phone) return '未绑定';
    if (phone.length === 11) {
      return `${phone.slice(0, 3)}****${phone.slice(7)}`;
    }
    return `${phone.slice(0, 3)}****`;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">充电服务</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">查找附近充电站，轻松开启充电之旅</p>
      </div>

      {/* ==================== 用户信息栏 ==================== */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 rounded-2xl shadow-sm p-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">{user?.name || '用户'}</h3>
              <p className="text-blue-100 text-sm">{maskPhone(user?.phone)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <p className="text-blue-100 text-xs">账户余额</p>
              <p className="text-xl font-bold">
                ¥{(user?.balance ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-blue-100 text-xs">当前状态</p>
              <p className="text-sm font-medium flex items-center">
                {isCharging ? (
                  <>
                    <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse mr-1.5" />
                    充电中
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 bg-blue-300 rounded-full mr-1.5" />
                    空闲
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 地图 + 站点列表 ==================== */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 地图区域 */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800 dark:text-white flex items-center">
                  <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  附近充电站
                </h2>
                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center">
                    <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1" />
                    在线
                  </span>
                  <span className="flex items-center">
                    <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-1" />
                    维护中
                  </span>
                  <span className="flex items-center">
                    <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1" />
                    离线
                  </span>
                </div>
              </div>
              <div className="h-[400px] relative">
                <MapContainer
                  center={[39.95, 116.40]}
                  zoom={12}
                  className="h-full w-full"
                  style={{ borderRadius: '0 0 16px 16px' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {stationList.map((station, index) => {
                    const displayStatus = getStationStatus(station);
                    const lat = station.lat ?? station.latitude ?? 39.95;
                    const lng = station.lng ?? station.longitude ?? 116.40;
                    return (
                      <Marker
                        key={station.id}
                        position={[lat, lng]}
                        icon={createStationIcon(displayStatus)}
                        eventHandlers={{
                          click: () => handleSelectStation(station)
                        }}
                      >
                        <Popup>
                          <div style={{ minWidth: 180, fontFamily: 'system-ui, sans-serif' }}>
                            <h4 style={{ fontWeight: 600, marginBottom: 6, fontSize: 14, color: '#111827' }}>
                              {station.name || `充电站 #${station.id}`}
                            </h4>
                            <p style={{ color: '#6b7280', fontSize: 12, margin: '3px 0' }}>
                              状态: <span style={{ color: getMarkerColor(displayStatus), fontWeight: 500 }}>
                                {displayStatus}
                              </span>
                            </p>
                            <p style={{ color: '#6b7280', fontSize: 12, margin: '3px 0' }}>
                              地址: {station.address || '暂无地址信息'}
                            </p>
                            <p style={{ color: '#6b7280', fontSize: 12, margin: '3px 0' }}>
                              距离: {getStationDistance(station, index)}
                            </p>
                            <p style={{ color: '#6b7280', fontSize: 12, margin: '3px 0' }}>
                              价格: ¥{getStationPrice(station).toFixed(2)}/kWh
                            </p>
                            <p style={{ color: '#6b7280', fontSize: 12, margin: '3px 0' }}>
                              空闲: {getStationFree(station)}/{getStationTotal(station)}
                            </p>
                            <button
                              onClick={() => handleSelectStation(station)}
                              style={{
                                marginTop: 8,
                                padding: '4px 12px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: 6,
                                fontSize: 12,
                                cursor: 'pointer',
                                width: '100%'
                              }}
                            >
                              定位到此站
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                  {/* 定位按钮 */}
                  <LocateButton onLocate={(loc, err) => {
                    if (loc) showToast('已定位到您的位置', 'success');
                    else if (err) showToast('定位失败，请检查权限', 'error');
                  }} />
                  {/* 地图定位控制器 */}
                  <MapController 
                    targetLocation={targetLocation} 
                    flyToId={flyToId}
                    shouldFly={shouldFly}
                  />
                </MapContainer>
              </div>
            </div>
          </div>

          {/* 站点列表侧栏 */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-white flex items-center">
                  <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  充电站列表
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ maxHeight: 380 }}>
                {stationList.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">
                    暂无充电站数据
                  </div>
                ) : (
                  stationList.map((station, index) => {
                    const isSelected = selectedStation && selectedStation.id === station.id;
                    const displayStatus = getStationStatus(station);
                    const statusColor = displayStatus === '在线'
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'
                      : displayStatus === '维护中'
                        ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400'
                        : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400';
                    const free = getStationFree(station);
                    const total = getStationTotal(station);
                    const price = getStationPrice(station);
                    const power = getStationPower(station);
                    const distance = getStationDistance(station, index);

                    return (
                      <div
                        key={station.id}
                        onClick={() => handleSelectStation(station)}
                        className={`rounded-xl p-4 cursor-pointer transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-500'
                            : 'bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-800 dark:text-white text-sm truncate flex-1 mr-2">
                            {station.name || `充电站 #${station.id}`}
                          </h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${statusColor}`}>
                            {displayStatus}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <svg className="w-3 h-3 text-blue-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            {distance}
                          </div>
                          <div className="flex items-center">
                            <svg className="w-3 h-3 text-orange-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            ¥{price.toFixed(2)}
                          </div>
                          <div className="flex items-center">
                            <svg className={`w-3 h-3 mr-1 ${free > 0 ? 'text-green-400' : 'text-red-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            {free}/{total}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-gray-400 dark:text-gray-500">{power} 直流快充</span>
                          <button
                            className="text-xs text-blue-500 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 flex items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              const lat = station.lat ?? station.latitude;
                              const lng = station.lng ?? station.longitude;
                              const displayName = station.name || `充电站 #${station.id}`;
                              if (lat && lng) {
                                flyToCoordinates(lat, lng, 16, `正在为您导航至 ${displayName}...`);
                              } else {
                                showToast(`无法获取 ${displayName} 的位置信息`, 'error');
                              }
                            }}
                          >
                            导航
                            <svg className="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 操作按钮区 ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 扫码充电 */}
        <button
          onClick={openScanModal}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-4 px-6 rounded-xl font-medium text-sm flex items-center justify-center space-x-2 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span>扫码充电</span>
        </button>

        {/* 预约充电位 */}
        <button
          onClick={openReserveModal}
          className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-6 rounded-xl font-medium text-sm flex items-center justify-center space-x-2 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>预约充电位</span>
        </button>

        {/* 开始充电 */}
        <button
          onClick={startCharging}
          disabled={isCharging}
          className={`bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-4 px-6 rounded-xl font-medium text-sm flex items-center justify-center space-x-2 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/30 ${
            isCharging ? 'opacity-50 cursor-not-allowed hover:translate-y-0 hover:shadow-none' : ''
          }`}
        >
          {isCharging ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>充电中...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>开始充电</span>
            </>
          )}
        </button>
      </div>

      {/* ==================== 充电进度仪表盘 ==================== */}
      {(isCharging || (batteryLevel > 35 && batteryLevel < 80)) && (
        <div className="animate-[slideUp_0.4s_ease-out]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6" style={{ boxShadow: '0 0 20px rgba(16,185,129,0.15)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-800 dark:text-white text-lg flex items-center">
                <svg className="w-5 h-5 text-emerald-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                充电进行中
              </h3>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">正在充电</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* 电池电量 */}
              <div className="flex flex-col items-center">
                <BatteryRing percent={batteryLevel} />
              </div>

              {/* 充电功率 */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/20 rounded-xl p-5 flex flex-col items-center justify-center">
                <svg className="w-8 h-8 text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-2xl font-bold text-gray-800 dark:text-white">{currentPower}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">充电功率 (kW)</span>
              </div>

              {/* 已用时间 */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/20 rounded-xl p-5 flex flex-col items-center justify-center">
                <svg className="w-8 h-8 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-2xl font-bold text-gray-800 dark:text-white">{formatTime(elapsedSeconds)}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">已充电时间</span>
              </div>

              {/* 费用 */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-900/20 rounded-xl p-5 flex flex-col items-center justify-center">
                <svg className="w-8 h-8 text-orange-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-2xl font-bold text-gray-800 dark:text-white">¥{currentCost.toFixed(2)}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">当前费用</span>
              </div>
            </div>

            {/* 预估信息 + 停止按钮 */}
            <div className="mt-6 flex flex-wrap items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-300">
                <span className="flex items-center">
                  <svg className="w-4 h-4 text-blue-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  预计剩余: <strong className="text-gray-800 dark:text-white ml-1">{remainMinutes}分钟</strong>
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 text-green-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  目标电量: <strong className="text-gray-800 dark:text-white ml-1">80%</strong>
                </span>
              </div>
              <button
                onClick={stopCharging}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-[box-shadow] duration-200 hover:shadow-lg hover:shadow-red-500/30"
              >
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  停止充电
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 扫码充电弹窗 ==================== */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-[slideUp_0.4s_ease-out] overflow-hidden">
            {/* 标题栏 */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                扫码充电
              </h3>
              <button
                onClick={closeScanModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="关闭"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 摄像头区域 */}
            <div className="p-5">
              <div className="relative bg-gray-900 rounded-xl overflow-hidden mb-4" style={{ aspectRatio: 1 }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* 扫描叠加层 */}
                {cameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-white/80 rounded-2xl relative">
                      {/* 四角装饰 */}
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />
                      {/* 扫描线 */}
                      <div className="absolute left-0 right-0 h-0.5 bg-blue-400 animate-pulse" style={{ top: '50%' }} />
                    </div>
                  </div>
                )}

                {/* 摄像头占位符 */}
                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <svg className="w-12 h-12 mb-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                    <p className="text-sm text-gray-400">点击下方按钮开启摄像头</p>
                  </div>
                )}
              </div>

              <button
                onClick={startCamera}
                disabled={scanning}
                className={`w-full py-3 rounded-xl font-medium text-sm text-white transition-[background-color,box-shadow] duration-300 ${
                  scanning
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:shadow-blue-500/30'
                }`}
              >
                {scanning ? (
                  <span className="flex items-center justify-center">
                    <svg className="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    扫描中...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                    开启摄像头扫码
                  </span>
                )}
              </button>
              <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
                请将充电桩上的二维码对准扫描框
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 预约充电位弹窗 ==================== */}
      {showReserveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-[slideUp_0.4s_ease-out] overflow-hidden">
            {/* 标题栏 */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                预约充电位
              </h3>
              <button
                onClick={closeReserveModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="关闭"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 表单内容 */}
            <div className="p-5 space-y-4">
              {/* 选择充电站 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  选择充电站
                </label>
                <select
                  value={reserveStationId}
                  onChange={(e) => setReserveStationId(Number(e.target.value))}
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-[border-color,box-shadow]"
                >
                  {stationList.filter((s) => s.status === 'online').map((s) => (
                    <option key={s.id} value={s.id}>{s.name || `充电站 #${s.id}`}</option>
                  ))}
                </select>
              </div>

              {/* 选择日期 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  预约日期
                </label>
                <input
                  type="date"
                  value={reserveDate}
                  onChange={(e) => setReserveDate(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-[border-color,box-shadow]"
                />
              </div>

              {/* 选择时段 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  预约时段
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`rounded-lg py-2 text-sm transition-[border-color,background-color] duration-200 ${
                        selectedTimeSlot === slot
                          ? 'border-2 border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                          : 'border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* 充电时长 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  充电时长
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {durations.map((dur) => (
                    <button
                      key={dur}
                      onClick={() => setSelectedDuration(dur)}
                      className={`rounded-lg py-2 text-sm transition-[border-color,background-color] duration-200 ${
                        selectedDuration === dur
                          ? 'border-2 border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                          : 'border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      {dur}小时
                    </button>
                  ))}
                </div>
              </div>

              {/* 预估费用 */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">预估费用</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">¥{getEstimatedCost()}</span>
              </div>

              {/* 确认按钮 */}
              <button
                onClick={submitReservation}
                className="w-full py-3 rounded-xl font-medium text-sm text-white bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-[background-color,box-shadow] duration-300 hover:shadow-lg hover:shadow-blue-500/30"
              >
                <span className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  确认预约
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 支付弹窗 ==================== */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-[slideUp_0.4s_ease-out] overflow-hidden">
            {/* 标题栏 */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                支付费用
              </h3>
              <button
                onClick={closePaymentModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="关闭"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 支付内容 */}
            <div className="p-5">
              {/* 应付金额 */}
              <div className="text-center mb-5">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">应付金额</p>
                <p className="text-4xl font-bold text-gray-800 dark:text-white">{paymentAmount}</p>
              </div>

              {/* 支付方式选择 */}
              <div className="space-y-3 mb-5">
                {/* 微信支付 */}
                <button
                  onClick={() => setPaymentMethod('wechat')}
                  className={`w-full flex items-center p-4 rounded-xl transition-[border-color,background-color] duration-200 ${
                    paymentMethod === 'wechat'
                      ? 'border-2 border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-2 border-gray-200 dark:border-gray-600 hover:border-green-400'
                  }`}
                >
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05a6.093 6.093 0 01-.259-1.795c0-3.8 3.503-6.873 7.82-6.873.273 0 .538.02.803.042C16.86 4.53 13.142 2.188 8.691 2.188zm-2.87 4.401a1.026 1.026 0 110 2.052 1.026 1.026 0 010-2.052zm5.633 0a1.026 1.026 0 110 2.052 1.026 1.026 0 010-2.052z" />
                      <path d="M23.997 14.58c0-3.236-3.14-5.858-7.018-5.858-3.877 0-7.018 2.622-7.018 5.858 0 3.237 3.14 5.858 7.018 5.858.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.046c.133 0 .241-.11.241-.246 0-.06-.024-.12-.04-.178l-.326-1.233a.492.492 0 01.177-.554c1.515-1.123 2.483-2.775 2.483-4.365zm-9.56-1.2a.856.856 0 110 1.713.856.856 0 010-1.713zm5.084 0a.856.856 0 110 1.713.856.856 0 010-1.713z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-800 dark:text-white">微信支付</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">推荐使用</p>
                  </div>
                  {paymentMethod === 'wechat' ? (
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </button>

                {/* 支付宝 */}
                <button
                  onClick={() => setPaymentMethod('alipay')}
                  className={`w-full flex items-center p-4 rounded-xl transition-[border-color,background-color] duration-200 ${
                    paymentMethod === 'alipay'
                      ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-2 border-gray-200 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21.422 15.358c-3.32-1.326-6.092-2.77-6.092-2.77s1.39-3.21 1.73-5.374h-4.665V5.642h5.665V4.538h-5.665V1.5h-2.727s0 .045-.003.128c-.01.28-.04.69-.08 1.19-.07.678-.18 1.476-.33 1.72H3.635v1.104h5.272c-.23 1.19-.67 2.6-1.18 3.73-1.56-.54-3.37-1.01-4.98-.81-2.82.35-3.49 2.57-2.7 4.07.79 1.5 3.09 2.07 5.09 1.48 1.39-.41 2.54-1.32 3.48-2.56 1.82 1.02 5.55 2.84 5.55 2.84l1.25-1.58zM5.46 16.29c-2.09.5-3.38-.63-3.08-1.88.3-1.25 2.05-1.72 3.63-1.12 1.04.4 2.02 1.09 2.02 1.09s-1.21 1.57-2.57 1.91z" />
                      <path d="M19.665 8.214h-3.39v1.5h3.39c-.16 1.5-.65 2.8-1.34 3.85 1.09.56 2.14 1.15 3.04 1.76l1.25-1.58s-1.7-1.08-3.04-1.72c.94-1.36 1.54-3.08 1.54-5.08h-4.665V5.642h5.665V4.538h-5.665V1.5h-2.727v3.038h-1.5v1.104h1.5v1.572h-1.5v1.5h1.5c0 2-.6 3.72-1.54 5.08 1.34.64 3.04 1.72 3.04 1.72l1.25-1.58c-.9-.61-1.95-1.2-3.04-1.76.69-1.05 1.18-2.35 1.34-3.85h-3.39v-1.5h3.39z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-800 dark:text-white">支付宝</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">快捷支付</p>
                  </div>
                  {paymentMethod === 'alipay' ? (
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* 模拟支付二维码 */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 text-center mb-4">
                <div className="w-40 h-40 mx-auto bg-white dark:bg-gray-600 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-500 flex flex-col items-center justify-center mb-3">
                  <svg className="w-12 h-12 text-gray-300 dark:text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <p className="text-xs text-gray-400 dark:text-gray-500">模拟支付二维码</p>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  请使用<span className={`font-medium ${paymentMethod === 'wechat' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    {paymentMethod === 'wechat' ? '微信' : '支付宝'}
                  </span>扫描二维码完成支付
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">支付将自动模拟完成</p>
              </div>

              {/* 确认支付按钮 */}
              <button
                onClick={handlePayment}
                disabled={paying}
                className={`w-full py-3 rounded-xl font-medium text-sm text-white transition-[background-color,box-shadow] duration-300 ${
                  paying
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:shadow-blue-500/30'
                }`}
              >
                <span className="flex items-center justify-center">
                  {paying ? (
                    <>
                      <svg className="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      支付处理中...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      确认支付
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Toast 通知 ==================== */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
