import dayjs from 'dayjs';

// 生成随机ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// 格式化日期为中文格式
const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss');

// 格式化货币
const formatCurrency = (amount) => `¥${Number(amount).toFixed(2)}`;

// 计算充电费用
const calculateCost = (energyKwh, pricePerKwh) => {
  const energyCost = energyKwh * pricePerKwh;
  const serviceFee = energyCost * 0.10;
  return Math.round((energyCost + serviceFee) * 100) / 100;
};

// 分页处理
const paginate = (array, page = 1, pageSize = 10) => {
  const offset = (page - 1) * pageSize;
  return {
    data: array.slice(offset, offset + pageSize),
    total: array.length,
    page: Number(page),
    pageSize: Number(pageSize),
    totalPages: Math.ceil(array.length / pageSize),
  };
};

export { generateId, formatDate, formatCurrency, calculateCost, paginate };
