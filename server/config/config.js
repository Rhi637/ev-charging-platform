export default {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'ev-charging-secret-key-2026',
  jwtExpiresIn: '7d',
  // 充电费率（元/kWh）
  defaultPricePerKwh: 1.20,
  // 服务费率
  serviceFeeRate: 0.10,
};
