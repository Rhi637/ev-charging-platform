import express from 'express';
import db from '../config/database.js';
import { auth, adminOnly } from '../middleware/auth.js';
import { paginate } from '../utils/helpers.js';

const router = express.Router();

// 所有用户管理路由都需要管理员权限
router.use(auth, adminOnly);

// 获取用户列表
router.get('/', (req, res) => {
  try {
    const { page, pageSize, name, phone, status } = req.query;

    let query = 'SELECT id, phone, name, role, balance, status, created_at FROM users WHERE 1=1';
    const params = [];

    if (name) {
      query += ' AND name LIKE ?';
      params.push(`%${name}%`);
    }

    if (phone) {
      query += ' AND phone LIKE ?';
      params.push(`%${phone}%`);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const users = db.prepare(query).all(...params);
    const result = paginate(users, page || 1, pageSize || 10);

    res.json(result);
  } catch (err) {
    console.error('[获取用户列表错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 冻结/解冻用户
router.put('/:id/status', (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['active', 'frozen'].includes(status)) {
      return res.status(400).json({ error: '无效的状态，支持：active、frozen' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 不能冻结管理员
    if (user.role === 'admin' && status === 'frozen') {
      return res.status(400).json({ error: '不能冻结管理员账户' });
    }

    if (user.status === status) {
      return res.status(400).json({ error: '用户状态未发生变化' });
    }

    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, req.params.id);

    const updatedUser = db.prepare(
      'SELECT id, phone, name, role, balance, status, created_at FROM users WHERE id = ?'
    ).get(req.params.id);

    const statusText = status === 'frozen' ? '冻结' : '解冻';

    res.json({
      message: `用户已${statusText}`,
      user: updatedUser,
    });
  } catch (err) {
    console.error('[更新用户状态错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取用户详情（含充电历史摘要）
router.get('/:id/details', (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id, phone, name, role, balance, status, created_at FROM users WHERE id = ?'
    ).get(req.params.id);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 充电统计摘要
    const chargingStats = db.prepare(
      `SELECT
         COUNT(*) as total_sessions,
         COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed_sessions,
         COALESCE(SUM(CASE WHEN status = 'charging' THEN 1 ELSE 0 END), 0) as active_sessions,
         COALESCE(SUM(energy_kwh), 0) as total_energy,
         COALESCE(SUM(cost), 0) as total_spent
       FROM charging_sessions
       WHERE user_id = ?`
    ).get(req.params.id);

    // 支付统计
    const paymentStats = db.prepare(
      `SELECT
         COUNT(*) as total_payments,
         COALESCE(SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END), 0) as total_paid,
         COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount
       FROM payments
       WHERE user_id = ?`
    ).get(req.params.id);

    // 预约统计
    const reservationStats = db.prepare(
      `SELECT
         COUNT(*) as total_reservations,
         COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed_reservations,
         COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) as cancelled_reservations
       FROM reservations
       WHERE user_id = ?`
    ).get(req.params.id);

    // 最近5条充电记录
    const recentSessions = db.prepare(
      `SELECT cs.id, cs.start_time, cs.end_time, cs.energy_kwh, cs.cost, cs.status,
              s.name as station_name
       FROM charging_sessions cs
       JOIN stations s ON cs.station_id = s.id
       WHERE cs.user_id = ?
       ORDER BY cs.start_time DESC
       LIMIT 5`
    ).all(req.params.id);

    res.json({
      user,
      charging_stats: chargingStats,
      payment_stats: paymentStats,
      reservation_stats: reservationStats,
      recent_sessions: recentSessions,
    });
  } catch (err) {
    console.error('[获取用户详情错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
