import { useState } from 'react';
import { users } from '../data/mockData';

const PAGE_SIZE = 10;

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [currentPage, setCurrentPage] = useState(1);

  // 过滤用户
  const filteredUsers = users.filter((user) => {
    const matchSearch =
      user.name.includes(searchTerm) || user.phone.includes(searchTerm);
    const matchStatus =
      statusFilter === '全部' || user.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // 分页计算
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const pagedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // 搜索或筛选变化时重置页码
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  // 冻结/解冻切换
  const [userList, setUserList] = useState(users);

  const handleToggleFreeze = (userId) => {
    setUserList((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === '正常' ? '冻结' : '正常' }
          : u
      )
    );
  };

  // 重新基于 userList 过滤
  const displayUsers = userList.filter((user) => {
    const matchSearch =
      user.name.includes(searchTerm) || user.phone.includes(searchTerm);
    const matchStatus =
      statusFilter === '全部' || user.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const displayTotalPages = Math.ceil(displayUsers.length / PAGE_SIZE);
  const displayPagedUsers = displayUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">用户管理</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">管理充电站注册用户信息</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* 总用户数 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">总用户数</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">12,680</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 本月新增 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">本月新增</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">856</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
        </div>

        {/* VIP用户 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">VIP用户</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">2,340</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l3.057-3L11 3l3-3 3 3 3.057-3L23 3l-3 3 3 3-3 3-3.057-3L14 9l-3 3-3-3-3.057 3L2 9l3-3-3-3 3-3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">用户列表</h2>

        {/* 搜索与筛选 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索用户姓名或手机号"
              value={searchTerm}
              onChange={handleSearchChange}
              aria-label="搜索用户姓名或手机号"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              aria-label="筛选用户状态"
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="全部">全部</option>
              <option value="正常">正常</option>
              <option value="冻结">冻结</option>
            </select>
          </div>
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">用户ID</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">姓名</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">手机号</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">注册日期</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">累计消费</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">充电次数</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">状态</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {displayPagedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">{user.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-200">{user.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{user.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{user.registerDate}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">¥{user.totalSpent.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">{user.chargeCount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === '正常'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                        查看详情
                      </button>
                      <button
                        onClick={() => handleToggleFreeze(user.id)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                          user.status === '正常'
                            ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40'
                            : 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40'
                        }`}
                      >
                        {user.status === '正常' ? '冻结' : '解冻'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            共 {displayUsers.length} 条记录
          </p>
          <div className="flex items-center gap-1 mt-3 sm:mt-0">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              上一页
            </button>
            {Array.from({ length: displayTotalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  page === currentPage
                    ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(displayTotalPages, p + 1))}
              disabled={currentPage === displayTotalPages || displayTotalPages === 0}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
