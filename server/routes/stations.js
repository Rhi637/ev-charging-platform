import express from 'express';
import db from '../config/database.js';
import { auth, adminOnly } from '../middleware/auth.js';
import { formatDate } from '../utils/helpers.js';
import dayjs from 'dayjs';

const router = express.Router();

// 获取充电站列表
router.get('/', (req, res) => {
  try {
    const { status, lat, lng, radius } = req.query;
    let stations;

    if (status) {
      stations = db.prepare('SELECT * FROM stations WHERE status = ?').all(status);
    } else {
      stations = db.prepare('SELECT * FROM stations').all();
    }

    // 如果提供了经纬度，计算距离并按距离排序
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radiusKm = parseFloat(radius) || 50;

      stations = stations.map((station) => {
        const distance = calculateDistance(userLat, userLng, station.lat, station.lng);
        return { ...station, distance: Math.round(distance * 100) / 100 };
      });

      // 按距离过滤
      stations = stations.filter((s) => s.distance <= radiusKm);

      // 按距离排序
      stations.sort((a, b) => a.distance - b.distance);
    }

    res.json({ stations });
  } catch (err) {
    console.error('[获取充电站列表错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取充电站详情
router.get('/:id', (req, res) => {
  try {
    const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.id);

    if (!station) {
      return res.status(404).json({ error: '充电站不存在' });
    }

    res.json({ station });
  } catch (err) {
    console.error('[获取充电站详情错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取充电站可用充电桩
router.get('/:id/plugs', (req, res) => {
  try {
    const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.id);

    if (!station) {
      return res.status(404).json({ error: '充电站不存在' });
    }

    // 获取正在充电的会话占用的充电桩
    const activeSessions = db.prepare(
      'SELECT plug_id FROM charging_sessions WHERE station_id = ? AND status = ?'
    ).all(req.params.id, 'charging');

    const usedPlugIds = new Set(activeSessions.map((s) => s.plug_id));

    // 构建充电桩列表
    const plugs = [];
    for (let i = 1; i <= station.total_plugs; i++) {
      plugs.push({
        plug_id: i,
        status: usedPlugIds.has(i) ? 'charging' : 'available',
        power_kw: station.power_kw,
        price_per_kwh: station.price_per_kwh,
      });
    }

    res.json({
      station_id: station.id,
      station_name: station.name,
      total_plugs: station.total_plugs,
      available_plugs: station.available_plugs,
      plugs,
    });
  } catch (err) {
    console.error('[获取充电桩列表错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 创建充电站（管理员）
router.post('/', auth, adminOnly, (req, res) => {
  try {
    const { name, address, lat, lng, total_plugs, power_kw, price_per_kwh } = req.body;

    if (!name || !address || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: '名称、地址、经纬度为必填项' });
    }

    const now = formatDate(new Date());
    const result = db.prepare(
      `INSERT INTO stations (name, address, lat, lng, status, total_plugs, available_plugs, power_kw, price_per_kwh, total_energy, total_revenue, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      name, address, lat, lng,
      'online',
      total_plugs || 10,
      total_plugs || 10,
      power_kw || 120,
      price_per_kwh || 1.20,
      0, 0, now
    );

    const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: '充电站创建成功',
      station,
    });
  } catch (err) {
    console.error('[创建充电站错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新充电站（管理员）
router.put('/:id', auth, adminOnly, (req, res) => {
  try {
    const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.id);

    if (!station) {
      return res.status(404).json({ error: '充电站不存在' });
    }

    const { name, address, lat, lng, status, total_plugs, power_kw, price_per_kwh } = req.body;

    db.prepare(`
      UPDATE stations SET
        name = COALESCE(?, name),
        address = COALESCE(?, address),
        lat = COALESCE(?, lat),
        lng = COALESCE(?, lng),
        status = COALESCE(?, status),
        power_kw = COALESCE(?, power_kw),
        price_per_kwh = COALESCE(?, price_per_kwh)
      WHERE id = ?
    `).run(name, address, lat, lng, status, power_kw, price_per_kwh, req.params.id);

    // 如果更新了总充电桩数，同步更新可用充电桩数
    if (total_plugs !== undefined && total_plugs !== station.total_plugs) {
      const activeCount = db.prepare(
        'SELECT COUNT(*) as count FROM charging_sessions WHERE station_id = ? AND status = ?'
      ).get(req.params.id, 'charging').count;

      const newAvailable = Math.max(0, total_plugs - activeCount);
      db.prepare('UPDATE stations SET total_plugs = ?, available_plugs = ? WHERE id = ?')
        .run(total_plugs, newAvailable, req.params.id);
    }

    const updatedStation = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.id);

    res.json({
      message: '充电站更新成功',
      station: updatedStation,
    });
  } catch (err) {
    console.error('[更新充电站错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取充电站统计数据
router.get('/:id/stats', (req, res) => {
  try {
    const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.id);

    if (!station) {
      return res.status(404).json({ error: '充电站不存在' });
    }

    const today = dayjs().format('YYYY-MM-DD');

    // 今日充电会话
    const todaySessions = db.prepare(
      `SELECT COUNT(*) as count,
              COALESCE(SUM(energy_kwh), 0) as total_energy,
              COALESCE(SUM(cost), 0) as total_revenue
       FROM charging_sessions
       WHERE station_id = ? AND date(start_time) = ?`
    ).get(req.params.id, today);

    // 今日活跃充电数
    const activeSessions = db.prepare(
      'SELECT COUNT(*) as count FROM charging_sessions WHERE station_id = ? AND status = ?'
    ).get(req.params.id, 'charging').count;

    // 今日各时段充电分布
    const hourlyData = db.prepare(
      `SELECT strftime('%H', start_time) as hour, COUNT(*) as sessions
       FROM charging_sessions
       WHERE station_id = ? AND date(start_time) = ?
       GROUP BY strftime('%H', start_time)
       ORDER BY hour`
    ).all(req.params.id, today);

    res.json({
      station_id: station.id,
      station_name: station.name,
      today: {
        sessions: todaySessions.count,
        energy_kwh: todaySessions.total_energy,
        revenue: todaySessions.total_revenue,
        active_charging: activeSessions,
      },
      hourly_distribution: hourlyData,
      total_energy: station.total_energy,
      total_revenue: station.total_revenue,
    });
  } catch (err) {
    console.error('[获取充电站统计错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * 使用 Haversine 公式计算两点之间的距离（千米）
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // 地球半径（千米）
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

export default router;
