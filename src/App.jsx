import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StationMonitor from './pages/StationMonitor';
import FinancialSettlement from './pages/FinancialSettlement';
import UserManagement from './pages/UserManagement';
import Marketing from './pages/Marketing';
import Analytics from './pages/Analytics';
import UserPortal from './pages/UserPortal';
import AIDispatch from './pages/AIDispatch';
import V2G from './pages/V2G';
import VirtualPowerPlant from './pages/VirtualPowerPlant';
import ChargingEcosystem from './pages/ChargingEcosystem';
import CountyExpansion from './pages/CountyExpansion';
import NotFound from './pages/NotFound';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">加载中…</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="stations" element={<StationMonitor />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="ai-dispatch" element={<AIDispatch />} />
        <Route path="v2g" element={<V2G />} />
        <Route path="vpp" element={<VirtualPowerPlant />} />
        <Route path="ecosystem" element={<ChargingEcosystem />} />
        <Route path="county" element={<CountyExpansion />} />
        <Route path="finance" element={<FinancialSettlement />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="marketing" element={<Marketing />} />
        <Route path="portal" element={<UserPortal />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
