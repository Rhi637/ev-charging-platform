import express from 'express';
import db from '../config/database.js';
import { auth, adminOnly } from '../middleware/auth.js';
import { formatDate } from '../utils/helpers.js';
import dayjs from 'dayjs';

const router = express.Router();

// 创建预约
router.post('/', auth, (req, res) => {
  try {
    const { station_id, date, time, duration } = req.body;

    if (!station_id || !date || !time || !duration) {
      return res.status(400).json({ error: '充电站ID、日期、时间和时长为必填项' });
    }

    if (duration < 15 || duration > 240) {
      return res.status(400).json({ error: '预约时长需在15分钟到240分钟之间' });
    }

    // 检查预约日期不能是过去的日期
    const reservedDate = dayjs(date);
    if (reservedDate.isBefore(dayjs(), 'day')) {
      return res.status(400).json({ error: '不能预约过去的日期' });
    }

    // 检查充电站是否存在且在线
    const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(station_id);
    if (!station) {
      return res.status(404).json({ error: '充电站不存在' });
    }
    if (station.status !== 'online') {
      return res.status(400).json({ error: '充电站当前不可用，无法预约' });
    }

    // 检查时间冲突
    const conflict = db.prepare(
      `SELECT id FROM reservations
       WHERE station_id = ? AND reserved_date = ? AND status IN ('pending', 'confirmed')
         AND (
           (reserved_time < ? AND time(datetime(reserved_date || ' ' || reserved_time), '+' || duration_minutes || ' minutes') > ?)
           OR
           (reserved_time < ? AND time(datetime(reserved_date || ' ' || reserved_time), '+' || duration_minutes || ' minutes') > ?)
           OR
           (reserved_time >= ? AND time(datetime(reserved_date || ' ' || reserved_time), '+' || duration_minutes || ' minutes') <= time(datetime(? || ' ' || ?), '+' || ? || ' minutes'))
         )`
    ).get(
      station_id, date,
      time, time,
      time, time,
      time, date, time, duration
    );

    if (conflict) {
      return res.status(400).json({ error: '该时段已被预约，请选择其他时间' });
    }

    // 检查用户是否已有同时段预约
    const userConflict = db.prepare(
      `SELECT id FROM reservations
       WHERE user_id = ? AND reserved_date = ? AND status IN ('pending', 'confirmed')
         AND (
           (reserved_time < ? AND time(datetime(reserved_date || ' ' || reserved_time), '+' || duration_minutes || ' minutes') > ?)
           OR
           (reserved_time < ? AND time(datetime(reserved_date || ' ' || reserved_time), '+' || duration_minutes || ' minutes') > ?)
         )`
    ).get(
      req.user.id, date,
      time, time,
      time, time
    );

    if (userConflict) {
      return res.status(400).json({ error: '您在该时段已有其他预约' });
    }

    const now = formatDate(new Date());
    const result = db.prepare(
      'INSERT INTO reservations (user_id, station_id, reserved_date, reserved_time, duration_minutes, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, station_id, date, time, duration, 'pending', now);

    const reservation = db.prepare(
      `SELECT r.*, s.name as station_name, s.address as station_address
       FROM reservations r
       JOIN stations s ON r.station_id = s.id
       WHERE r.id = ?`
    ).get(result.lastInsertRowid);

    res.status(201).json({
      message: '预约创建成功',
      reservation,
    });
  } catch (err) {
    console.error('[创建预约错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取当前用户的预约列表
router.get('/', auth, (req, res) => {
  try {
    const reservations = db.prepare(
      `SELECT r.*, s.name as station_name, s.address as station_address
       FROM reservations r
       JOIN stations s ON r.station_id = s.id
       WHERE r.user_id = ?
       ORDER BY r.reserved_date ASC, r.reserved_time ASC`
    ).all(req.user.id);

    res.json({ reservations });
  } catch (err) {
    console.error('[获取预约列表错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 取消预约
router.delete('/:id', auth, (req, res) => {
  try {
    const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);

    if (!reservation) {
      return res.status(404).json({ error: '预约不存在' });
    }

    // 验证所有权
    if (reservation.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权操作此预约' });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ error: '该预约已取消' });
    }

    if (reservation.status === 'completed') {
      return res.status(400).json({ error: '该预约已完成，无法取消' });
    }

    db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run('cancelled', req.params.id);

    res.json({
      message: '预约已取消',
      reservation_id: parseInt(req.params.id),
    });
  } catch (err) {
    console.error('[取消预约错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取充电站的预约列表（管理员）
router.get('/station/:stationId', auth, adminOnly, (req, res) => {
  try {
    const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(req.params.stationId);

    if (!station) {
      return res.status(404).json({ error: '充电站不存在' });
    }

    const reservations = db.prepare(
      `SELECT r.*, u.name as user_name, u.phone as user_phone
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       WHERE r.station_id = ?
       ORDER BY r.reserved_date ASC, r.reserved_time ASC`
    ).all(req.params.stationId);

    res.json({
      station_id: station.id,
      station_name: station.name,
      reservations,
    });
  } catch (err) {
    console.error('[获取充电站预约错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
