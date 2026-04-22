import express from 'express';
import db from '../config/database.js';
import { auth } from '../middleware/auth.js';
import { formatDate, formatCurrency, paginate } from '../utils/helpers.js';
import dayjs from 'dayjs';

const router = express.Router();

// 获取支付历史
router.get('/history', auth, (req, res) => {
  try {
    const { page, pageSize } = req.query;

    const payments = db.prepare(
      `SELECT p.*,
              CASE WHEN p.session_id IS NOT NULL THEN
                (SELECT s.name FROM stations s
                 JOIN charging_sessions cs ON cs.station_id = s.id
                 WHERE cs.id = p.session_id)
              ELSE NULL END as station_name
       FROM payments p
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`
    ).all(req.user.id);

    const result = paginate(payments, page || 1, pageSize || 10);

    res.json(result);
  } catch (err) {
    console.error('[获取支付历史错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 创建支付订单
router.post('/create', auth, (req, res) => {
  try {
    const { session_id, method } = req.body;

    if (!session_id || !method) {
      return res.status(400).json({ error: '会话ID和支付方式为必填项' });
    }

    const validMethods = ['wechat', 'alipay', 'balance'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({ error: '无效的支付方式，支持：微信、支付宝、余额' });
    }

    // 查询充电会话
    const session = db.prepare('SELECT * FROM charging_sessions WHERE id = ?').get(session_id);

    if (!session) {
      return res.status(404).json({ error: '充电会话不存在' });
    }

    // 验证所有权
    if (session.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权操作此充电会话' });
    }

    if (session.status !== 'completed') {
      return res.status(400).json({ error: '只能为已完成的充电会话创建支付' });
    }

    if (session.payment_status === 'paid') {
      return res.status(400).json({ error: '该会话已支付' });
    }

    // 检查是否已有待支付的订单
    const existingPayment = db.prepare(
      'SELECT id FROM payments WHERE session_id = ? AND status = ?'
    ).get(session_id, 'pending');

    if (existingPayment) {
      return res.status(400).json({ error: '该会话已有待支付的订单' });
    }

    const amount = session.cost;

    // 余额支付时检查余额
    if (method === 'balance') {
      const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
      if (user.balance < amount) {
        return res.status(400).json({ error: '余额不足，当前余额：' + formatCurrency(user.balance) });
      }
    }

    const now = formatDate(new Date());
    const result = db.prepare(
      'INSERT INTO payments (user_id, session_id, amount, method, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, session_id, amount, method, 'pending', now);

    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: '支付订单创建成功',
      payment,
    });
  } catch (err) {
    console.error('[创建支付错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 确认支付（模拟）
router.post('/:id/confirm', auth, (req, res) => {
  try {
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);

    if (!payment) {
      return res.status(404).json({ error: '支付记录不存在' });
    }

    // 验证所有权
    if (payment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权操作此支付记录' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ error: '该支付订单状态异常，无法确认支付' });
    }

    // 使用事务处理支付确认
    const confirmPayment = db.transaction(() => {
      const now = formatDate(new Date());

      // 余额支付：扣除余额
      if (payment.method === 'balance') {
        const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
        if (user.balance < payment.amount) {
          throw new Error('余额不足');
        }
        db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?')
          .run(payment.amount, req.user.id);
      }

      // 更新支付状态
      db.prepare('UPDATE payments SET status = ? WHERE id = ?').run('success', req.params.id);

      // 更新充电会话支付状态
      if (payment.session_id) {
        db.prepare('UPDATE charging_sessions SET payment_status = ? WHERE id = ?')
          .run('paid', payment.session_id);
      }

      return true;
    });

    try {
      confirmPayment();

      const updatedPayment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);

      res.json({
        message: '支付成功',
        payment: updatedPayment,
      });
    } catch (payErr) {
      if (payErr.message === '余额不足') {
        return res.status(400).json({ error: '余额不足，请选择其他支付方式或先充值' });
      }
      throw payErr;
    }
  } catch (err) {
    console.error('[确认支付错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取支付统计
router.get('/stats', auth, (req, res) => {
  try {
    const userId = req.user.id;

    // 总消费金额
    const totalSpent = db.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM payments
       WHERE user_id = ? AND status = ? AND session_id IS NOT NULL`
    ).get(userId, 'success');

    // 月度消费统计（最近12个月）
    const monthlyBreakdown = db.prepare(
      `SELECT strftime('%Y-%m', created_at) as month,
              COUNT(*) as count,
              SUM(amount) as total
       FROM payments
       WHERE user_id = ? AND status = ? AND session_id IS NOT NULL
         AND created_at >= datetime('now', '-12 months')
       GROUP BY strftime('%Y-%m', created_at)
       ORDER BY month DESC`
    ).all(userId, 'success');

    // 支付方式分布
    const methodDistribution = db.prepare(
      `SELECT method, COUNT(*) as count, SUM(amount) as total
       FROM payments
       WHERE user_id = ? AND status = ? AND session_id IS NOT NULL
       GROUP BY method`
    ).all(userId, 'success');

    // 本月消费
    const currentMonth = dayjs().format('YYYY-MM');
    const monthSpent = db.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM payments
       WHERE user_id = ? AND status = ? AND session_id IS NOT NULL
         AND strftime('%Y-%m', created_at) = ?`
    ).get(userId, 'success', currentMonth);

    res.json({
      total_spent: totalSpent.total,
      current_month_spent: monthSpent.total,
      monthly_breakdown: monthlyBreakdown,
      method_distribution: methodDistribution,
    });
  } catch (err) {
    console.error('[获取支付统计错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
