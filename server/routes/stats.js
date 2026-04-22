import express from 'express';
import db from '../config/database.js';
import { auth, adminOnly } from '../middleware/auth.js';
import dayjs from 'dayjs';

const router = express.Router();

// 所有统计路由都需要管理员权限
router.use(auth, adminOnly);

// 仪表盘概览 KPI
router.get('/overview', (req, res) => {
  try {
    // 充电站总数
    const stationCount = db.prepare('SELECT COUNT(*) as count FROM stations').get().count;
    const onlineStationCount = db.prepare("SELECT COUNT(*) as count FROM stations WHERE status = 'online'").get().count;

    // 今日收入
    const today = dayjs().format('YYYY-MM-DD');
    const todayRevenue = db.prepare(
      `SELECT COALESCE(SUM(cost), 0) as total
       FROM charging_sessions
       WHERE date(end_time) = ? AND payment_status = 'paid'`
    ).get(today).total;

    // 平均利用率（在线充电站的使用率）
    const utilization = db.prepare(
      `SELECT
         AVG(CASE WHEN s.total_plugs > 0
           THEN (s.total_plugs - s.available_plugs) * 100.0 / s.total_plugs
           ELSE 0 END) as avg_rate
       FROM stations s
       WHERE s.status = 'online'`
    ).get().avg_rate;

    // 活跃用户数（今日有充电记录的用户）
    const activeUsers = db.prepare(
      `SELECT COUNT(DISTINCT user_id) as count
       FROM charging_sessions
       WHERE date(start_time) = ? AND status != 'failed'`
    ).get(today).count;

    // 今日充电会话数
    const todaySessions = db.prepare(
      `SELECT COUNT(*) as count
       FROM charging_sessions
       WHERE date(start_time) = ?`
    ).get(today).count;

    // 今日充电量
    const todayEnergy = db.prepare(
      `SELECT COALESCE(SUM(energy_kwh), 0) as total
       FROM charging_sessions
       WHERE date(end_time) = ? AND status = 'completed'`
    ).get(today).total;

    // 总用户数
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'").get().count;

    res.json({
      total_stations: stationCount,
      online_stations: onlineStationCount,
      today_revenue: todayRevenue,
      today_sessions: todaySessions,
      today_energy_kwh: todayEnergy,
      avg_utilization: Math.round(utilization * 100) / 100,
      active_users: activeUsers,
      total_users: totalUsers,
    });
  } catch (err) {
    console.error('[获取概览统计错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 收入趋势（最近N天）
router.get('/revenue-trend', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;

    if (days < 1 || days > 90) {
      return res.status(400).json({ error: '查询天数需在1到90天之间' });
    }

    const startDate = dayjs().subtract(days - 1, 'day').format('YYYY-MM-DD');

    const trend = db.prepare(
      `SELECT date(end_time) as date,
              COUNT(*) as sessions,
              COALESCE(SUM(cost), 0) as revenue,
              COALESCE(SUM(energy_kwh), 0) as energy
       FROM charging_sessions
       WHERE date(end_time) >= ? AND payment_status = 'paid'
       GROUP BY date(end_time)
       ORDER BY date ASC`
    ).all(startDate);

    // 填充没有数据的日期
    const fullTrend = [];
    for (let i = 0; i < days; i++) {
      const date = dayjs().subtract(days - 1 - i, 'day').format('YYYY-MM-DD');
      const found = trend.find((t) => t.date === date);
      fullTrend.push({
        date,
        sessions: found ? found.sessions : 0,
        revenue: found ? found.revenue : 0,
        energy: found ? found.energy : 0,
      });
    }

    res.json({
      period_days: days,
      trend: fullTrend,
    });
  } catch (err) {
    console.error('[获取收入趋势错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 今日各时段充电分布
router.get('/hourly-sessions', (req, res) => {
  try {
    const today = dayjs().format('YYYY-MM-DD');

    const hourlyData = db.prepare(
      `SELECT strftime('%H', start_time) as hour,
              COUNT(*) as sessions,
              COALESCE(SUM(energy_kwh), 0) as energy,
              COALESCE(SUM(cost), 0) as revenue
       FROM charging_sessions
       WHERE date(start_time) = ?
       GROUP BY strftime('%H', start_time)
       ORDER BY hour ASC`
    ).all(today);

    // 填充24小时
    const fullHourly = [];
    for (let h = 0; h < 24; h++) {
      const hourStr = String(h).padStart(2, '0');
      const found = hourlyData.find((d) => d.hour === hourStr);
      fullHourly.push({
        hour: hourStr,
        sessions: found ? found.sessions : 0,
        energy: found ? found.energy : 0,
        revenue: found ? found.revenue : 0,
      });
    }

    res.json({
      date: today,
      hourly_data: fullHourly,
    });
  } catch (err) {
    console.error('[获取时段分布错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 用户充电频率分层
router.get('/user-segments', (req, res) => {
  try {
    const thirtyDaysAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');

    const userStats = db.prepare(
      `SELECT user_id, COUNT(*) as session_count,
              COALESCE(SUM(energy_kwh), 0) as total_energy,
              COALESCE(SUM(cost), 0) as total_spent
       FROM charging_sessions
       WHERE date(start_time) >= ? AND status = 'completed'
       GROUP BY user_id`
    ).all(thirtyDaysAgo);

    // 分层统计
    const segments = {
      light: { label: '轻度用户 (<5次)', count: 0, users: [] },
      medium: { label: '中度用户 (5-20次)', count: 0, users: [] },
      heavy: { label: '重度用户 (>20次)', count: 0, users: [] },
      inactive: { label: '未活跃用户', count: 0 },
    };

    // 获取所有活跃用户
    const activeUserIds = new Set(userStats.map((u) => u.user_id));
    const totalActiveUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'").get().count;
    segments.inactive.count = totalActiveUsers - activeUserIds.size;

    userStats.forEach((stat) => {
      const user = db.prepare('SELECT name, phone FROM users WHERE id = ?').get(stat.user_id);
      const userInfo = {
        user_id: stat.user_id,
        name: user ? user.name : '未知',
        session_count: stat.session_count,
        total_energy: stat.total_energy,
        total_spent: stat.total_spent,
      };

      if (stat.session_count < 5) {
        segments.light.count++;
        segments.light.users.push(userInfo);
      } else if (stat.session_count <= 20) {
        segments.medium.count++;
        segments.medium.users.push(userInfo);
      } else {
        segments.heavy.count++;
        segments.heavy.users.push(userInfo);
      }
    });

    res.json({
      period: '最近30天',
      total_active_users: activeUserIds.size,
      segments,
    });
  } catch (err) {
    console.error('[获取用户分层错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 充电站排名
router.get('/station-ranking', (req, res) => {
  try {
    const { sortBy, limit } = req.query;
    const orderBy = sortBy === 'energy' ? 'total_energy' : 'total_revenue';
    const topN = parseInt(limit) || 10;

    const rankings = db.prepare(
      `SELECT s.id, s.name, s.address, s.status,
              s.total_energy, s.total_revenue,
              s.total_plugs, s.available_plugs,
              s.power_kw, s.price_per_kwh,
              COUNT(cs.id) as total_sessions
       FROM stations s
       LEFT JOIN charging_sessions cs ON cs.station_id = s.id AND cs.status = 'completed'
       GROUP BY s.id
       ORDER BY ${orderBy} DESC
       LIMIT ?`
    ).all(topN);

    res.json({
      sort_by: orderBy,
      rankings,
    });
  } catch (err) {
    console.error('[获取充电站排名错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 用户行为指标
router.get('/behavior-metrics', (req, res) => {
  try {
    const thirtyDaysAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');

    // 平均充电时长（分钟）
    const avgDuration = db.prepare(
      `SELECT AVG(
         (julianday(end_time) - julianday(start_time)) * 24 * 60
       ) as avg_minutes
       FROM charging_sessions
       WHERE date(start_time) >= ? AND status = 'completed' AND end_time IS NOT NULL`
    ).get(thirtyDaysAgo).avg_minutes || 0;

    // 平均等待时间（从预约到开始充电的时间）
    const avgWaitTime = db.prepare(
      `SELECT AVG(
         (julianday(cs.start_time) - julianday(r.reserved_date || ' ' || r.reserved_time)) * 24 * 60
       ) as avg_wait_minutes
       FROM charging_sessions cs
       JOIN reservations r ON r.user_id = cs.user_id AND r.station_id = cs.station_id
       WHERE cs.date(start_time) >= ? AND cs.status = 'completed'`
    ).get(thirtyDaysAgo).avg_wait_minutes || 0;

    // 回头率（有多次充电记录的用户占比）
    const repeatUsers = db.prepare(
      `SELECT COUNT(*) as count
       FROM (
         SELECT user_id
         FROM charging_sessions
         WHERE date(start_time) >= ? AND status = 'completed'
         GROUP BY user_id
         HAVING COUNT(*) > 1
       )`
    ).get(thirtyDaysAgo).count;

    const totalUsersWithSessions = db.prepare(
      `SELECT COUNT(DISTINCT user_id) as count
       FROM charging_sessions
       WHERE date(start_time) >= ? AND status = 'completed'`
    ).get(thirtyDaysAgo).count;

    const repeatRate = totalUsersWithSessions > 0
      ? Math.round((repeatUsers / totalUsersWithSessions) * 10000) / 100
      : 0;

    // 平均每次充电量
    const avgEnergy = db.prepare(
      `SELECT AVG(energy_kwh) as avg
       FROM charging_sessions
       WHERE date(start_time) >= ? AND status = 'completed'`
    ).get(thirtyDaysAgo).avg || 0;

    // 平均每次消费
    const avgCost = db.prepare(
      `SELECT AVG(cost) as avg
       FROM charging_sessions
       WHERE date(start_time) >= ? AND status = 'completed'`
    ).get(thirtyDaysAgo).avg || 0;

    // 取消率
    const cancelledSessions = db.prepare(
      `SELECT COUNT(*) as count
       FROM charging_sessions
       WHERE date(start_time) >= ? AND status = 'cancelled'`
    ).get(thirtyDaysAgo).count;

    const totalSessions = db.prepare(
      `SELECT COUNT(*) as count
       FROM charging_sessions
       WHERE date(start_time) >= ?`
    ).get(thirtyDaysAgo).count;

    const cancelRate = totalSessions > 0
      ? Math.round((cancelledSessions / totalSessions) * 10000) / 100
      : 0;

    // 预约完成率
    const completedReservations = db.prepare(
      `SELECT COUNT(*) as count
       FROM reservations
       WHERE date(created_at) >= ? AND status = 'completed'`
    ).get(thirtyDaysAgo).count;

    const totalReservations = db.prepare(
      `SELECT COUNT(*) as count
       FROM reservations
       WHERE date(created_at) >= ?`
    ).get(thirtyDaysAgo).count;

    const reservationCompletionRate = totalReservations > 0
      ? Math.round((completedReservations / totalReservations) * 10000) / 100
      : 0;

    // 高峰时段
    const peakHour = db.prepare(
      `SELECT strftime('%H', start_time) as hour, COUNT(*) as count
       FROM charging_sessions
       WHERE date(start_time) >= ? AND status != 'failed'
       GROUP BY strftime('%H', start_time)
       ORDER BY count DESC
       LIMIT 1`
    ).get(thirtyDaysAgo);

    res.json({
      period: '最近30天',
      avg_duration_minutes: Math.round(avgDuration * 100) / 100,
      avg_wait_minutes: Math.round(avgWaitTime * 100) / 100,
      repeat_rate: repeatRate,
      avg_energy_per_session: Math.round(avgEnergy * 100) / 100,
      avg_cost_per_session: Math.round(avgCost * 100) / 100,
      cancel_rate: cancelRate,
      reservation_completion_rate: reservationCompletionRate,
      peak_hour: peakHour ? `${peakHour.hour}:00` : '无数据',
      peak_hour_sessions: peakHour ? peakHour.count : 0,
    });
  } catch (err) {
    console.error('[获取行为指标错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
