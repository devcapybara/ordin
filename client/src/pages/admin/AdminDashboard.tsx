import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Users, Settings, Activity, UserPlus } from 'lucide-react';
import TenantList from './TenantList';
import SalesManagement from './SalesManagement';
import GlobalSettings from './GlobalSettings';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'tenants' | 'sales' | 'settings'>('tenants');

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="text-blue-400" />
            SaaS Admin
          </h1>
          <p className="text-xs text-slate-400 mt-1">Super Admin Panel</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('tenants')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'tenants' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Users size={20} />
            Tenant Management
          </button>

          <button 
            onClick={() => setActiveTab('sales')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'sales' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <UserPlus size={20} />
            Sales Management
          </button>
          
          <button 
             onClick={() => setActiveTab('settings')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
               activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
             }`}
          >
            <Settings size={20} />
            Global Settings
          </button>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-sm">{user?.username}</p>
              <p className="text-xs text-slate-400">Super Admin</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 rounded text-red-400 hover:bg-slate-700 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {activeTab === 'tenants' && <TenantList />}
          {activeTab === 'sales' && <SalesManagement />}
          {activeTab === 'settings' && <GlobalSettings />}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;