# ⚡ 绿能充电 - 电动汽车充电管理平台

> 一站式电动汽车充电站运营管理系统，涵盖用户充电服务、站点监控、财务结算、运营分析等核心功能。

[🌐 English Version](README.md) · [在线演示](https://rhi637.github.io/ev-charging-platform/) · [▶️ B站视频](https://www.bilibili.com/video/BV1wGoMBiEcB/) · [▶️ YouTube](https://youtu.be/WXWEZkXSj6M)

---

## ✨ 功能特性

### 👤 用户端（C端）
- 🗺️ 附近充电站地图搜索（Leaflet）
- 📷 扫码充电（摄像头调用）
- 📅 充电车位预约
- ⚡ 实时充电监控（WebSocket）
- 💳 微信/支付宝支付模拟
- 🔋 电池电量、功率、费用实时显示

### 📊 管理后台（B端）
- 📈 运营数据仪表盘（KPI卡片、趋势图表）
- 🗺️ 充电站实时监控（地图标记 + 详情弹窗）
- 💰 财务结算与自动分账（可调比例滑块）
- 👥 用户管理（搜索、冻结/解冻、分页）
- 📢 营销活动管理
- 📊 大数据运营看板（热力图、用户分群、时段分析）

### 🔧 后端服务
- 🔐 JWT 用户认证（注册/登录/角色权限）
- 📡 RESTful API（30+ 接口）
- 🔌 WebSocket 实时通信（充电桩状态推送）
- 💾 SQLite 数据库（6张表 + 种子数据）
- 📊 运营数据统计聚合

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + Vite 8 |
| 路由 | React Router v7 |
| 样式 | Tailwind CSS v4 |
| 图表 | Chart.js + react-chartjs-2 |
| 地图 | React-Leaflet + Leaflet |
| 实时通信 | Socket.IO |
| 后端框架 | Express.js |
| 数据库 | SQLite (better-sqlite3) |
| 认证 | JWT (jsonwebtoken) |
| 密码加密 | bcryptjs |

## 🚀 快速开始

### 环境要求
- Node.js >= 18
- npm >= 9

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/Rhi637/ev-charging-platform.git
cd ev-charging-platform

# 安装依赖
npm install

# 同时启动前端 + 后端
npm run dev:all
```

访问 http://localhost:5173 查看前端，后端 API 运行在 http://localhost:3001

### 测试账号

| 角色 | 手机号 | 密码 |
|------|--------|------|
| 系统管理员 | admin | 123456 |
| 运营管理员 | operator | 123456 |
| 普通用户 | 13812345621 | 123456 |

## 📁 项目结构

```
ev-admin/
├── server/                    # 后端服务
│   ├── index.js               # Express 入口 + Socket.IO
│   ├── config/                # 配置（数据库、应用配置）
│   ├── models/                # 数据模型与初始化
│   ├── routes/                # API 路由（7个模块）
│   ├── middleware/             # 中间件（JWT认证）
│   ├── websocket/             # WebSocket 实时通信
│   └── utils/                 # 工具函数
├── src/                       # 前端源码
│   ├── components/            # 公共组件（Layout）
│   ├── context/               # React Context（主题、认证）
│   ├── pages/                 # 页面组件（8个页面）
│   ├── services/              # API 服务层 + Socket.IO
│   ├── data/                  # 模拟数据
│   └── utils/                 # 工具函数
├── index.html                 # HTML 入口
├── vite.config.js             # Vite 配置
├── netlify.toml               # Netlify 部署配置
└── package.json
```

## 🌐 部署

### 前端部署（Netlify / Vercel）
1. `npm run build` 构建产物在 `dist/` 目录
2. 上传到 Netlify 或连接 GitHub 自动部署

### 后端部署（Render / 云服务器）
详见 [部署指南](#部署指南)

## 📄 许可证

[Apache License 2.0](LICENSE)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📮 联系方式

- 项目主页：https://github.com/Rhi637/ev-charging-platform
- Issue：https://github.com/Rhi637/ev-charging-platform/issues
