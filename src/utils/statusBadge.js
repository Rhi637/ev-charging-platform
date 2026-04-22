export const statusBadge = (status) => {
  const map = {
    '在线': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    '维护中': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
    '离线': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    '正常': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    '冻结': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    '进行中': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    '已结束': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    '未开始': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  };
  return map[status] || '';
};
