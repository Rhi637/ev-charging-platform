import db from '../config/database.js';
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';

/**
 * 初始化数据库表结构并填充种子数据
 */
function initDatabase() {
  console.log('[数据库] 开始初始化...');

  // 创建用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      balance REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'frozen'))
    );
  `);

  // 创建充电站表
  db.exec(`
    CREATE TABLE IF NOT EXISTS stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'online' CHECK(status IN ('online', 'maintenance', 'offline')),
      total_plugs INTEGER NOT NULL DEFAULT 10,
      available_plugs INTEGER NOT NULL DEFAULT 10,
      power_kw REAL NOT NULL DEFAULT 120,
      price_per_kwh REAL NOT NULL DEFAULT 1.20,
      temperature REAL,
      current_power REAL,
      total_energy REAL NOT NULL DEFAULT 0,
      total_revenue REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // 创建充电会话表
  db.exec(`
    CREATE TABLE IF NOT EXISTS charging_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      station_id INTEGER NOT NULL,
      plug_id INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      energy_kwh REAL,
      cost REAL,
      status TEXT NOT NULL DEFAULT 'charging' CHECK(status IN ('charging', 'completed', 'cancelled', 'failed')),
      payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'refunded')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (station_id) REFERENCES stations(id)
    );
  `);

  // 创建支付记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_id INTEGER,
      amount REAL NOT NULL,
      method TEXT NOT NULL CHECK(method IN ('wechat', 'alipay', 'balance')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'success', 'failed')),
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (session_id) REFERENCES charging_sessions(id)
    );
  `);

  // 创建预约表
  db.exec(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      station_id INTEGER NOT NULL,
      reserved_date TEXT NOT NULL,
      reserved_time TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'completed', 'cancelled')),
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (station_id) REFERENCES stations(id)
    );
  `);

  // 创建故障告警表
  db.exec(`
    CREATE TABLE IF NOT EXISTS fault_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'resolved')),
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      FOREIGN KEY (station_id) REFERENCES stations(id)
    );
  `);

  console.log('[数据库] 表结构创建完成');

  // 检查是否已有数据，避免重复插入
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count > 0) {
    console.log('[数据库] 已存在数据，跳过种子数据填充');
    return;
  }

  console.log('[数据库] 开始填充种子数据...');
  seedData();
  console.log('[数据库] 种子数据填充完成');
}

/**
 * 填充种子数据
 */
function seedData() {
  const insert = db.transaction(() => {
    // ========== 种子用户 ==========
    const adminPassword = bcrypt.hashSync('123456', 10);
    const userPassword = bcrypt.hashSync('123456', 10);

    const insertUser = db.prepare(`
      INSERT INTO users (phone, password_hash, name, role, balance, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // 管理员用户
    insertUser.run('admin', adminPassword, '系统管理员', 'admin', 0, dayjs().subtract(90, 'day').format('YYYY-MM-DD HH:mm:ss'), 'active');
    insertUser.run('operator', adminPassword, '运营管理员', 'admin', 0, dayjs().subtract(60, 'day').format('YYYY-MM-DD HH:mm:ss'), 'active');

    // 普通用户
    const users = [
      { phone: '13812345621', name: '张伟', balance: 520.00 },
      { phone: '13912348834', name: '李娜', balance: 180.50 },
      { phone: '15012349876', name: '王磊', balance: 1000.00 },
      { phone: '18612343210', name: '赵敏', balance: 45.80 },
      { phone: '17712346543', name: '陈浩', balance: 320.00 },
      { phone: '13312347890', name: '刘芳', balance: 15.00 },
    ];

    const userIds = [1, 2]; // 管理员ID
    users.forEach((u, i) => {
      insertUser.run(
        u.phone,
        userPassword,
        u.name,
        'user',
        u.balance,
        dayjs().subtract(30 - i * 3, 'day').format('YYYY-MM-DD HH:mm:ss'),
        'active'
      );
      userIds.push(i + 3); // 用户ID从3开始
    });

    // ========== 种子充电站 ==========
    const insertStation = db.prepare(`
      INSERT INTO stations (name, address, lat, lng, status, total_plugs, available_plugs, power_kw, price_per_kwh, temperature, current_power, total_energy, total_revenue, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const stations = [
      {
        name: '朝阳公园充电站',
        address: '北京市朝阳区朝阳公园南路1号',
        lat: 39.9342, lng: 116.4737,
        status: 'online', total_plugs: 12, available_plugs: 5,
        power_kw: 120, price_per_kwh: 1.20,
        temperature: 28.5, current_power: 840,
        total_energy: 15680, total_revenue: 20698.56,
      },
      {
        name: '国贸中心充电站',
        address: '北京市朝阳区建国门外大街1号',
        lat: 39.9087, lng: 116.4594,
        status: 'online', total_plugs: 8, available_plugs: 2,
        power_kw: 180, price_per_kwh: 1.50,
        temperature: 30.2, current_power: 1080,
        total_energy: 22340, total_revenue: 36861.00,
      },
      {
        name: '中关村科技园充电站',
        address: '北京市海淀区中关村大街27号',
        lat: 39.9819, lng: 116.3112,
        status: 'online', total_plugs: 16, available_plugs: 8,
        power_kw: 120, price_per_kwh: 1.15,
        temperature: 26.8, current_power: 960,
        total_energy: 28950, total_revenue: 36583.50,
      },
      {
        name: '望京SOHO充电站',
        address: '北京市朝阳区望京街10号',
        lat: 39.9929, lng: 116.4803,
        status: 'online', total_plugs: 10, available_plugs: 4,
        power_kw: 150, price_per_kwh: 1.35,
        temperature: 29.1, current_power: 900,
        total_energy: 18760, total_revenue: 27861.90,
      },
      {
        name: '西单大悦城充电站',
        address: '北京市西城区西单北大街131号',
        lat: 39.9125, lng: 116.3740,
        status: 'maintenance', total_plugs: 6, available_plugs: 0,
        power_kw: 120, price_per_kwh: 1.20,
        temperature: 25.0, current_power: 0,
        total_energy: 9870, total_revenue: 13027.40,
      },
      {
        name: '亦庄经济开发区充电站',
        address: '北京市大兴区亦庄经济开发区科创五街',
        lat: 39.7950, lng: 116.5060,
        status: 'online', total_plugs: 20, available_plugs: 12,
        power_kw: 240, price_per_kwh: 1.00,
        temperature: 27.3, current_power: 1920,
        total_energy: 35620, total_revenue: 39182.00,
      },
      {
        name: '三里屯太古里充电站',
        address: '北京市朝阳区三里屯路19号',
        lat: 39.9337, lng: 116.4540,
        status: 'online', total_plugs: 8, available_plugs: 3,
        power_kw: 120, price_per_kwh: 1.40,
        temperature: 31.0, current_power: 600,
        total_energy: 12450, total_revenue: 19278.00,
      },
      {
        name: '通州万达广场充电站',
        address: '北京市通州区新华西街58号',
        lat: 39.9025, lng: 116.6622,
        status: 'offline', total_plugs: 10, available_plugs: 0,
        power_kw: 120, price_per_kwh: 1.10,
        temperature: null, current_power: 0,
        total_energy: 8340, total_revenue: 10008.00,
      },
    ];

    stations.forEach((s) => {
      insertStation.run(
        s.name, s.address, s.lat, s.lng, s.status,
        s.total_plugs, s.available_plugs, s.power_kw, s.price_per_kwh,
        s.temperature, s.current_power, s.total_energy, s.total_revenue,
        dayjs().subtract(120, 'day').format('YYYY-MM-DD HH:mm:ss')
      );
    });

    // ========== 种子充电会话 ==========
    const insertSession = db.prepare(`
      INSERT INTO charging_sessions (user_id, station_id, plug_id, start_time, end_time, energy_kwh, cost, status, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const sessions = [
      // 7天前的会话
      { userId: 3, stationId: 1, plugId: 1, dayOffset: 7, hour: 8, duration: 45, energy: 38.5, cost: 50.82, status: 'completed', paymentStatus: 'paid' },
      { userId: 4, stationId: 2, plugId: 3, dayOffset: 7, hour: 9, duration: 60, energy: 52.0, cost: 85.80, status: 'completed', paymentStatus: 'paid' },
      { userId: 5, stationId: 3, plugId: 2, dayOffset: 7, hour: 14, duration: 30, energy: 25.3, cost: 31.88, status: 'completed', paymentStatus: 'paid' },

      // 6天前
      { userId: 6, stationId: 4, plugId: 5, dayOffset: 6, hour: 10, duration: 55, energy: 45.6, cost: 67.64, status: 'completed', paymentStatus: 'paid' },
      { userId: 3, stationId: 6, plugId: 8, dayOffset: 6, hour: 16, duration: 40, energy: 68.0, cost: 74.80, status: 'completed', paymentStatus: 'paid' },
      { userId: 7, stationId: 1, plugId: 4, dayOffset: 6, hour: 20, duration: 35, energy: 30.2, cost: 39.86, status: 'completed', paymentStatus: 'paid' },

      // 5天前
      { userId: 8, stationId: 7, plugId: 2, dayOffset: 5, hour: 7, duration: 50, energy: 42.1, cost: 64.89, status: 'completed', paymentStatus: 'paid' },
      { userId: 4, stationId: 3, plugId: 6, dayOffset: 5, hour: 11, duration: 25, energy: 20.8, cost: 26.21, status: 'completed', paymentStatus: 'paid' },
      { userId: 5, stationId: 2, plugId: 1, dayOffset: 5, hour: 15, duration: 70, energy: 60.5, cost: 99.83, status: 'completed', paymentStatus: 'paid' },

      // 4天前
      { userId: 3, stationId: 4, plugId: 3, dayOffset: 4, hour: 9, duration: 38, energy: 32.4, cost: 48.12, status: 'completed', paymentStatus: 'paid' },
      { userId: 6, stationId: 6, plugId: 12, dayOffset: 4, hour: 13, duration: 90, energy: 152.0, cost: 167.20, status: 'completed', paymentStatus: 'paid' },
      { userId: 7, stationId: 1, plugId: 7, dayOffset: 4, hour: 18, duration: 20, energy: 17.2, cost: 22.70, status: 'completed', paymentStatus: 'paid' },

      // 3天前
      { userId: 8, stationId: 3, plugId: 9, dayOffset: 3, hour: 8, duration: 55, energy: 46.3, cost: 58.35, status: 'completed', paymentStatus: 'paid' },
      { userId: 4, stationId: 7, plugId: 5, dayOffset: 3, hour: 12, duration: 42, energy: 35.6, cost: 54.96, status: 'completed', paymentStatus: 'paid' },
      { userId: 5, stationId: 6, plugId: 15, dayOffset: 3, hour: 17, duration: 65, energy: 110.5, cost: 121.55, status: 'completed', paymentStatus: 'paid' },

      // 2天前
      { userId: 3, stationId: 2, plugId: 4, dayOffset: 2, hour: 10, duration: 48, energy: 41.0, cost: 67.65, status: 'completed', paymentStatus: 'paid' },
      { userId: 6, stationId: 1, plugId: 2, dayOffset: 2, hour: 14, duration: 33, energy: 28.5, cost: 37.62, status: 'completed', paymentStatus: 'paid' },
      { userId: 7, stationId: 4, plugId: 8, dayOffset: 2, hour: 19, duration: 28, energy: 23.8, cost: 35.35, status: 'completed', paymentStatus: 'paid' },
      { userId: 8, stationId: 3, plugId: 11, dayOffset: 2, hour: 21, duration: 15, energy: 12.5, cost: 15.75, status: 'cancelled', paymentStatus: 'refunded' },

      // 1天前
      { userId: 4, stationId: 6, plugId: 3, dayOffset: 1, hour: 9, duration: 72, energy: 123.0, cost: 135.30, status: 'completed', paymentStatus: 'paid' },
      { userId: 5, stationId: 1, plugId: 6, dayOffset: 1, hour: 15, duration: 40, energy: 34.2, cost: 45.14, status: 'completed', paymentStatus: 'paid' },
      { userId: 3, stationId: 7, plugId: 1, dayOffset: 1, hour: 20, duration: 50, energy: 42.8, cost: 66.13, status: 'completed', paymentStatus: 'paid' },

      // 今天 - 进行中
      { userId: 6, stationId: 2, plugId: 2, dayOffset: 0, hour: 8, duration: null, energy: 18.5, cost: null, status: 'charging', paymentStatus: 'pending' },
      { userId: 8, stationId: 3, plugId: 4, dayOffset: 0, hour: 10, duration: null, energy: 12.3, cost: null, status: 'charging', paymentStatus: 'pending' },

      // 失败记录
      { userId: 7, stationId: 5, plugId: 1, dayOffset: 3, hour: 11, duration: 5, energy: 2.1, cost: 2.77, status: 'failed', paymentStatus: 'refunded' },
    ];

    const sessionIds = [];
    sessions.forEach((s) => {
      const startTime = dayjs().subtract(s.dayOffset, 'day').hour(s.hour).minute(0).second(0);
      const endTime = s.duration ? startTime.add(s.duration, 'minute') : null;

      const result = insertSession.run(
        s.userId, s.stationId, s.plugId,
        startTime.format('YYYY-MM-DD HH:mm:ss'),
        endTime ? endTime.format('YYYY-MM-DD HH:mm:ss') : null,
        s.energy, s.cost, s.status, s.paymentStatus
      );
      sessionIds.push(result.lastInsertRowid);
    });

    // ========== 种子支付记录 ==========
    const insertPayment = db.prepare(`
      INSERT INTO payments (user_id, session_id, amount, method, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const payments = [
      { userId: 3, sessionId: sessionIds[0], amount: 50.82, method: 'wechat', status: 'success', dayOffset: 7, hour: 9 },
      { userId: 4, sessionId: sessionIds[1], amount: 85.80, method: 'alipay', status: 'success', dayOffset: 7, hour: 10 },
      { userId: 5, sessionId: sessionIds[2], amount: 31.88, method: 'balance', status: 'success', dayOffset: 7, hour: 15 },
      { userId: 6, sessionId: sessionIds[3], amount: 67.64, method: 'wechat', status: 'success', dayOffset: 6, hour: 11 },
      { userId: 3, sessionId: sessionIds[4], amount: 74.80, method: 'alipay', status: 'success', dayOffset: 6, hour: 17 },
      { userId: 7, sessionId: sessionIds[5], amount: 39.86, method: 'balance', status: 'success', dayOffset: 6, hour: 21 },
      { userId: 8, sessionId: sessionIds[6], amount: 64.89, method: 'wechat', status: 'success', dayOffset: 5, hour: 8 },
      { userId: 4, sessionId: sessionIds[7], amount: 26.21, method: 'balance', status: 'success', dayOffset: 5, hour: 12 },
      { userId: 6, sessionId: sessionIds[10], amount: 167.20, method: 'alipay', status: 'success', dayOffset: 4, hour: 15 },
      { userId: 5, sessionId: sessionIds[14], amount: 121.55, method: 'wechat', status: 'success', dayOffset: 3, hour: 18 },
      { userId: 4, sessionId: sessionIds[18], amount: 135.30, method: 'alipay', status: 'success', dayOffset: 1, hour: 10 },
      { userId: 3, sessionId: sessionIds[20], amount: 66.13, method: 'balance', status: 'success', dayOffset: 1, hour: 21 },
      // 充值记录（无关联会话）
      { userId: 3, sessionId: null, amount: 200.00, method: 'wechat', status: 'success', dayOffset: 5, hour: 7 },
      { userId: 5, sessionId: null, amount: 500.00, method: 'alipay', status: 'success', dayOffset: 3, hour: 9 },
      { userId: 7, sessionId: null, amount: 100.00, method: 'wechat', status: 'failed', dayOffset: 2, hour: 16 },
    ];

    payments.forEach((p) => {
      const created = dayjs().subtract(p.dayOffset, 'day').hour(p.hour).minute(30).second(0);
      insertPayment.run(
        p.userId, p.sessionId, p.amount, p.method, p.status,
        created.format('YYYY-MM-DD HH:mm:ss')
      );
    });

    // ========== 种子预约记录 ==========
    const insertReservation = db.prepare(`
      INSERT INTO reservations (user_id, station_id, reserved_date, reserved_time, duration_minutes, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const reservations = [
      { userId: 3, stationId: 1, date: dayjs().add(1, 'day').format('YYYY-MM-DD'), time: '09:00', duration: 60, status: 'confirmed' },
      { userId: 4, stationId: 2, date: dayjs().add(1, 'day').format('YYYY-MM-DD'), time: '14:00', duration: 45, status: 'confirmed' },
      { userId: 5, stationId: 6, date: dayjs().add(2, 'day').format('YYYY-MM-DD'), time: '10:00', duration: 90, status: 'pending' },
      { userId: 6, stationId: 3, date: dayjs().add(1, 'day').format('YYYY-MM-DD'), time: '19:00', duration: 30, status: 'confirmed' },
      { userId: 8, stationId: 7, date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), time: '08:00', duration: 40, status: 'completed' },
    ];

    reservations.forEach((r) => {
      const created = dayjs().subtract(1, 'day').hour(12).minute(0).second(0);
      insertReservation.run(
        r.userId, r.stationId, r.date, r.time, r.duration, r.status,
        created.format('YYYY-MM-DD HH:mm:ss')
      );
    });

    // ========== 种子故障告警 ==========
    const insertAlert = db.prepare(`
      INSERT INTO fault_alerts (station_id, type, description, severity, status, created_at, resolved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const alerts = [
      {
        stationId: 5, type: '设备故障', description: '3号充电桩通信模块异常，无法正常启动充电',
        severity: 'high', status: 'active',
        createdAt: dayjs().subtract(2, 'day').hour(14).minute(20).format('YYYY-MM-DD HH:mm:ss'),
        resolvedAt: null,
      },
      {
        stationId: 8, type: '电力中断', description: '站点主电源跳闸，所有充电桩离线',
        severity: 'high', status: 'active',
        createdAt: dayjs().subtract(1, 'day').hour(6).minute(45).format('YYYY-MM-DD HH:mm:ss'),
        resolvedAt: null,
      },
      {
        stationId: 1, type: '温度告警', description: '7号充电桩温度传感器读数异常偏高（42.5°C）',
        severity: 'medium', status: 'resolved',
        createdAt: dayjs().subtract(4, 'day').hour(11).minute(30).format('YYYY-MM-DD HH:mm:ss'),
        resolvedAt: dayjs().subtract(4, 'day').hour(15).minute(0).format('YYYY-MM-DD HH:mm:ss'),
      },
    ];

    alerts.forEach((a) => {
      insertAlert.run(
        a.stationId, a.type, a.description, a.severity, a.status,
        a.createdAt, a.resolvedAt
      );
    });
  });

  insert();
}

export default initDatabase;
