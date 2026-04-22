import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import { auth } from '../middleware/auth.js';
import { generateId, formatDate } from '../utils/helpers.js';
import config from '../config/config.js';

const router = express.Router();

// 注册新用户
router.post('/register', async (req, res) => {
  try {
    const { phone, password, name } = req.body;

    if (!phone || !password || !name) {
      return res.status(400).json({ error: '手机号、密码和姓名为必填项' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度不能少于6位' });
    }

    // 检查手机号是否已注册
    const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existingUser) {
      return res.status(400).json({ error: '该手机号已注册' });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    const now = formatDate(new Date());
    const result = db.prepare(
      'INSERT INTO users (phone, password_hash, name, role, balance, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(phone, passwordHash, name, 'user', 0, now, 'active');

    const user = db.prepare('SELECT id, phone, name, role, balance, status, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: '注册成功',
      user,
    });
  } catch (err) {
    console.error('[注册错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: '手机号和密码为必填项' });
    }

    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!user) {
      return res.status(400).json({ error: '手机号或密码错误' });
    }

    if (user.status === 'frozen') {
      return res.status(403).json({ error: '账户已被冻结，请联系管理员' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: '手机号或密码错误' });
    }

    // 生成 JWT 令牌
    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        balance: user.balance,
        status: user.status,
      },
    });
  } catch (err) {
    console.error('[登录错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取当前用户信息
router.get('/profile', auth, (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id, phone, name, role, balance, status, created_at FROM users WHERE id = ?'
    ).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ user });
  } catch (err) {
    console.error('[获取用户信息错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新用户资料
router.put('/profile', auth, (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: '姓名不能为空' });
    }

    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), req.user.id);

    const user = db.prepare(
      'SELECT id, phone, name, role, balance, status, created_at FROM users WHERE id = ?'
    ).get(req.user.id);

    res.json({
      message: '资料更新成功',
      user,
    });
  } catch (err) {
    console.error('[更新资料错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 充值余额
router.post('/recharge', auth, (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: '充值金额必须大于0' });
    }

    if (amount > 10000) {
      return res.status(400).json({ error: '单次充值金额不能超过10000元' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    if (user.status === 'frozen') {
      return res.status(403).json({ error: '账户已冻结，无法充值' });
    }

    // 使用事务确保数据一致性
    const recharge = db.transaction(() => {
      // 更新用户余额
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, req.user.id);

      // 创建充值支付记录
      const now = formatDate(new Date());
      const result = db.prepare(
        'INSERT INTO payments (user_id, session_id, amount, method, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(req.user.id, null, amount, 'balance', 'success', now);

      return result.lastInsertRowid;
    });

    const paymentId = recharge();

    // 获取更新后的用户信息
    const updatedUser = db.prepare(
      'SELECT id, phone, name, role, balance, status, created_at FROM users WHERE id = ?'
    ).get(req.user.id);

    res.json({
      message: '充值成功',
      paymentId,
      user: updatedUser,
    });
  } catch (err) {
    console.error('[充值错误]', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
