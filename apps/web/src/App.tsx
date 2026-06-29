/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { DashboardLayout } from './components/DashboardLayout';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ReferLanding } from './pages/ReferLanding';
import { AgentDashboard } from './pages/AgentDashboard';
import { BusinessDashboard } from './pages/BusinessDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

const RoleDashboard: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;
  switch (user.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'BUSINESS_OWNER':
      return <BusinessDashboard />;
    case 'AGENT':
      return <AgentDashboard />;
    default:
      return null;
  }
};

const Protected: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-zinc-500">
        Loading…
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <DashboardLayout>
      <RoleDashboard />
    </DashboardLayout>
  );
};

export default function App(): React.ReactElement {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/refer/:code" element={<ReferLanding />} />
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/" replace /> : <Signup />}
      />
      <Route path="/" element={<Protected />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
