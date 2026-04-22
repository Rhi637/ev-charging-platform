import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-8xl font-bold text-gray-200 dark:text-gray-700 mb-4">404</div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">页面未找到</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">您访问的页面不存在或已被移除</p>
      <Link
        to="/"
        className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
      >
        返回首页
      </Link>
    </div>
  );
}
