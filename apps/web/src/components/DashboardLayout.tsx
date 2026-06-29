import React from 'react';
import { Layers, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Badge } from './ui';

const roleLabel: Record<string, string> = {
  ADMIN: 'Admin',
  BUSINESS_OWNER: 'Business',
  AGENT: 'Sales Agent',
};

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 text-white p-2 rounded-xl">
              <Layers className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Referra<span className="text-emerald-600">IOS</span>
            </span>
            {user && <Badge tone="green">{roleLabel[user.role]}</Badge>}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 hidden sm:block">
              {user?.email}
            </span>
            <button
              onClick={() => logout()}
              title="Sign out"
              className="p-2 text-zinc-500 hover:text-red-600 rounded-lg hover:bg-zinc-100"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">{children}</main>
    </div>
  );
};
