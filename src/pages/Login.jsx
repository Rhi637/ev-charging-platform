import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [tab, setTab] = useState('login');
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    name: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const validatePhone = (phone) => /^1[3-9]\d{9}$/.test(phone);
  const validatePassword = (password) => password.length >= 6;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.phone.trim()) {
      setError('请输入手机号');
      return;
    }
    if (!validatePhone(formData.phone)) {
      setError('请输入正确的手机号格式');
      return;
    }
    if (!formData.password) {
      setError('请输入密码');
      return;
    }
    if (!validatePassword(formData.password)) {
      setError('密码长度至少6位');
      return;
    }

    setLoading(true);
    try {
      await login(formData.phone, formData.password);
      navigate('/');
    } catch (err) {
      setError(err.message || '登录失败，请检查手机号和密码');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('请输入姓名');
      return;
    }
    if (!formData.phone.trim()) {
      setError('请输入手机号');
      return;
    }
    if (!validatePhone(formData.phone)) {
      setError('请输入正确的手机号格式');
      return;
    }
    if (!formData.password) {
      setError('请输入密码');
      return;
    }
    if (!validatePassword(formData.password)) {
      setError('密码长度至少6位');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      await register(formData.phone, formData.password, formData.name);
      navigate('/');
    } catch (err) {
      setError(err.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-2xl mb-4">
            <svg
              className="w-9 h-9 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">绿能充电</h1>
          <p className="text-gray-500 mt-1">智能充电管理平台</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(''); }}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'login'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setError(''); }}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'register'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              注册
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  手机号
                </label>
                <input
                  id="login-phone"
                  name="phone"
                  type="tel"
                  maxLength={11}
                  placeholder="请输入手机号"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800 placeholder-gray-400"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
                  密码
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  placeholder="请输入密码"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800 placeholder-gray-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="reg-name" className="block text-sm font-medium text-gray-700 mb-1">
                  姓名
                </label>
                <input
                  id="reg-name"
                  name="name"
                  type="text"
                  placeholder="请输入姓名"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800 placeholder-gray-400"
                />
              </div>
              <div>
                <label htmlFor="reg-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  手机号
                </label>
                <input
                  id="reg-phone"
                  name="phone"
                  type="tel"
                  maxLength={11}
                  placeholder="请输入手机号"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800 placeholder-gray-400"
                />
              </div>
              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
                  密码
                </label>
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  placeholder="请输入密码（至少6位）"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800 placeholder-gray-400"
                />
              </div>
              <div>
                <label htmlFor="reg-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                  确认密码
                </label>
                <input
                  id="reg-confirm-password"
                  name="confirmPassword"
                  type="password"
                  placeholder="请再次输入密码"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800 placeholder-gray-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? '注册中...' : '注册'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          绿能充电管理系统 v1.0
        </p>
      </div>
    </div>
  );
}
