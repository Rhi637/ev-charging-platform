import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import config from './config/config.js';

// 初始化数据库（创建表并填充种子数据）
import initDatabase from './models/init.js';
initDatabase();

const app = express();
const server = http.createServer(app);

// 初始化 Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// 加载 WebSocket 处理器
import { setupWebSocket } from './websocket/index.js';
setupWebSocket(io);

// 中间件
app.use(cors());
app.use(express.json());

// 路由
import authRoutes from './routes/auth.js';
import stationRoutes from './routes/stations.js';
import sessionRoutes from './routes/sessions.js';
import paymentRoutes from './routes/payments.js';
import reservationRoutes from './routes/reservations.js';
import statsRoutes from './routes/stats.js';
import userRoutes from './routes/users.js';

app.use('/api/auth', authRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error('[服务器错误]', err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
server.listen(config.port, () => {
  console.log(`[服务器] EV充电管理后台已启动，端口: ${config.port}`);
});

export { app, server, io };
