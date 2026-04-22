import express from 'express';
import db from '../config/database.js';
import { auth } from '../middleware/auth.js';
import { formatDate, calculateCost, paginate } from '../utils/helpers.js';
import dayjs from 'dayjs';

const router = express.Router();

// 开始充电
router.post('/start', auth, (req, res) => {
  try {
    const { station_id } = req.body;

    if (!station_id) {
      return res.status(400).json({ error: '充电站ID为必填项' });
    }

    // 检查用户状态
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    if (user.status === 'frozen') {
      return res.status(403).json({ error: '账户已冻结，无法充电' });
    }

    // 检查是否已有进行中的充电会话
    const activeSession = db.prepare(
      'SELECT id FROM charging_sessions WHERE user_id = ? AND status = ?'
    ).get(req.user.id, 'charging');

    if (activeSession) {
      return res.status(400).json({ error: '您已有正在进行的充电会话，请先结束当前充电' });
    }

    // 检查充电站状态
    const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(station_id);
    if (!station) {
      return res.status(404).json({ error: '充电站不存在' });
    }
    if (station.status !== 'online') {
      return res.status(400).json({ error: '充电站当前不可用，状态：' + getStationStatusText(station.status) });
    }
    if (station.available_plugs <= 0) {
      return res.status(400).json({ error: '充电站已满，暂无可用充电桩' });
    }

    // 使用事务创建充电会话
    const startCharging = db.transaction(() => {
      // 找到一个可用的充电桩
      const usedPlugIds = db.prepare(
        'SELECT plug_id FROM charging_sessions WHERE station_id = ? AND status = ?'
      ).all(station_id, 'charging').map((s) => s.plug_id);

      let plugId = 1;
      while (usedPlugIds.includes(plugId) && plugId <= station.total_plugs) {
        plugId++;
      }

      if (plugId > station.total_plugs) {
        throw new Error('无可用充电桩');
      }

      // 创建充电会话
      const now = formatDate(new Date());
      const result = db.prepare(
        'INSERT INTO charging_sessions (user_id, station_id, plug_id, start_time, status, payment_status) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(req.user.id, station_id, plugId, now, 'charging', 'pending');

      // 减少可用充电桩数
      db.prepare('UPDATE stations SET available_plugs = available_plugs - 1 WHERE id = ?').run(station_id);

      return { sessionId: result.lastInsertRowid, plugId };
    });

    const { sessionId, plugId } = startCharging();

    res.status(201).json({
      message: '充电已开始',
      session: {
        id: sessionId,
        station_id,
        plug_id: plugId,
        start_time: formatDate(new Date()),
        status: 'charging',
      },
    });
  } catch (err) {
    console.error('[开始充电错误]', err);
    if (err.message === '无可用充电桩') {
      return res.status(400).json({ error: '充电站已满，暂无可用充电桩' });
    }
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 停止充电
router.post('/:id/stop', auth, (req, res) => {
  try {
    const session = db.prepare('SELECT * FROM charging_sessions WHERE id = ?').get(req.params.id);

    if (!session) {
      return res.status(404).json({ error: '充电会话不存在' });
    }

    // 验证所有权或管理员权限
    if (session.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权操作此充电会话' });
    }

    if (session.status !== 'charging') {
      return res.status(400).json({ error: '该会话不在充电中，无法停止' });
    }

    // 获取充电站信息
    const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(session.station_id);

    // 使用事务停止充电
    const stopCharging = db.transaction(() => {
      const now = formatDate(new Date());
      const startTime = dayjs(session.start_time);
      const endTime = dayjs(now);
      const durationMinutes = endTime.diff(startTime, 'minute');

      // 模拟充电量（根据充电桩功率和时长计算）
      const energyKwh = Math.round((station.power_kw * durationMinutes / 60) * 100) / 100;

      // 计算费用
      const cost = calculateCost(energyKwh, station.price_per_kwh);

      // 更新充电会话
      db.prepare(
        `UPDATE charging_sessions SET
          end_time = ?, energy_kwh = ?, cost = ?, status = ?
        WHERE id = ?`
      ).run(now, energyKwh, cost, 'completed', req.params.id);

      // 恢复可用充电桩数
      db.prepare('UPDATE stations SET available_plugs = available_plugs + 1 WHERE id = ?')
        .run(session.station_id);

      // 更新充电站累计数据
      db.prepare(
        'UPDATE stations SET total_energy = total_energy + ?, total_revenue = total_revenue + ? WHERE id = ?'
      ).run(energyKwh, cost, session.station_id);

      return { energyKwh, cost, durationMinutes };
    });

    const result = stopCharging();

    res.json({
      message: '充电已停止',
      session: {
        id: session.id,
        energy_kwh: result.energyKwh,
        cost: result.cost,
        duration_minutes: result.durationMinutes,
        status: 'completed',
        payment_status: 'pending',
      },
    });
  } catch (err) {
    console.error('[停止充电错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取当前用户的活跃充电会话
router.get('/active', auth, (req, res) => {
  try {
    const session = db.prepare(
      `SELECT cs.*, s.name as station_name, s.address as station_address, s.price_per_kwh
       FROM charging_sessions cs
       JOIN stations s ON cs.station_id = s.id
       WHERE cs.user_id = ? AND cs.status = ?`
    ).get(req.user.id, 'charging');

    if (!session) {
      return res.json({ session: null, message: '当前无进行中的充电会话' });
    }

    // 计算已充电时长
    const startTime = dayjs(session.start_time);
    const now = dayjs();
    const durationMinutes = now.diff(startTime, 'minute');

    res.json({
      session: {
        ...session,
        duration_minutes: durationMinutes,
      },
    });
  } catch (err) {
    console.error('[获取活跃会话错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取充电历史
router.get('/history', auth, (req, res) => {
  try {
    const { page, pageSize } = req.query;

    const sessions = db.prepare(
      `SELECT cs.*, s.name as station_name, s.address as station_address
       FROM charging_sessions cs
       JOIN stations s ON cs.station_id = s.id
       WHERE cs.user_id = ?
       ORDER BY cs.start_time DESC`
    ).all(req.user.id);

    const result = paginate(sessions, page || 1, pageSize || 10);

    res.json({
      ...result,
    });
  } catch (err) {
    console.error('[获取充电历史错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取充电会话详情
router.get('/:id', auth, (req, res) => {
  try {
    const session = db.prepare(
      `SELECT cs.*, s.name as station_name, s.address as station_address, s.power_kw, s.price_per_kwh
       FROM charging_sessions cs
       JOIN stations s ON cs.station_id = s.id
       WHERE cs.id = ?`
    ).get(req.params.id);

    if (!session) {
      return res.status(404).json({ error: '充电会话不存在' });
    }

    // 验证所有权或管理员权限
    if (session.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权查看此充电会话' });
    }

    // 获取关联的支付记录
    const payment = db.prepare(
      'SELECT * FROM payments WHERE session_id = ?'
    ).get(req.params.id);

    res.json({
      session,
      payment: payment || null,
    });
  } catch (err) {
    console.error('[获取会话详情错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * 获取充电站状态中文描述
 */
function getStationStatusText(status) {
  const statusMap = {
    online: '在线',
    offline: '离线',
    maintenance: '维护中',
  };
  return statusMap[status] || status;
}

export default router;
