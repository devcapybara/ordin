import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProductList from '../components/products/ProductList';
import EmployeeList from '../components/dashboard/EmployeeList';
import FinanceDashboard from '../components/finance/FinanceDashboard';
import ActivityLogViewer from '../components/dashboard/ActivityLogViewer';
import RestaurantSettings from '../components/dashboard/RestaurantSettings';
import api from '../services/api';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0 });
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'employees' | 'finance' | 'logs' | 'settings'>('overview');

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/orders/stats');
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  const isManagerOrOwner = user?.role === 'OWNER' || user?.role === 'MANAGER';
  const isAccountant = user?.role === 'ACCOUNTANT';
  const canAccessInventory = user?.subscriptionPlan !== 'BASIC';
  const canAccessFinance = user?.subscriptionPlan !== 'BASIC'; // Finance is PRO feature

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex gap-4 items-center">
             <span className="text-gray-600">
                Welcome, <strong>{user?.username}</strong> ({user?.role}) 
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{user?.subscriptionPlan}</span>
             </span>
             <button
                onClick={logout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mb-6 border-b border-gray-200">
          <button
            className={`pb-3 px-2 text-sm font-medium transition-colors ${
              activeTab === 'overview' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          {isManagerOrOwner && (
            <>
              {canAccessInventory && (
                  <button
                    className={`pb-3 px-2 text-sm font-medium transition-colors ${
                      activeTab === 'products' 
                        ? 'border-b-2 border-blue-600 text-blue-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab('products')}
                  >
                    Product Management
                  </button>
              )}
              <button
                className={`pb-3 px-2 text-sm font-medium transition-colors ${
                  activeTab === 'employees' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('employees')}
              >
                Employees
              </button>
              {canAccessFinance && (
                  <button
                    className={`pb-3 px-2 text-sm font-medium transition-colors ${
                      activeTab === 'finance' 
                        ? 'border-b-2 border-blue-600 text-blue-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab('finance')}
                  >
                    Finance & Reports
                  </button>
              )}
              <button
                className={`pb-3 px-2 text-sm font-medium transition-colors ${
                  activeTab === 'logs' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('logs')}
              >
                Activity Logs
              </button>
              <button
                className={`pb-3 px-2 text-sm font-medium transition-colors ${
                  activeTab === 'settings' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </button>
            </>
          )}
        </div>
        
        {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Sales (Today)</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">Rp {stats.totalSales.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Orders (Today)</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalOrders}</p>
                </div>
                 <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Restaurant Status</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">Active</p>
                </div>
                
                {/* Upgrade Prompt for Basic Users */}
                {!canAccessInventory && (
                    <div className="col-span-3 bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-yellow-800">Unlock Full Potential</h4>
                            <p className="text-sm text-yellow-700">You are on the BASIC plan. Upgrade to PRO to access Inventory Management and Finance Reports.</p>
                        </div>
                        <button className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 text-sm font-medium">
                            Contact Admin
                        </button>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'products' && isManagerOrOwner && canAccessInventory && (
            <div className="animate-in fade-in duration-300">
              <ProductList />
            </div>
        )}

        {activeTab === 'employees' && isManagerOrOwner && (
            <div className="animate-in fade-in duration-300">
              <EmployeeList />
            </div>
        )}

        {activeTab === 'finance' && (isManagerOrOwner || isAccountant) && canAccessFinance && (
            <div className="animate-in fade-in duration-300">
              <FinanceDashboard />
            </div>
        )}

        {activeTab === 'logs' && isManagerOrOwner && (
            <div className="animate-in fade-in duration-300">
              <ActivityLogViewer />
            </div>
        )}

        {activeTab === 'settings' && isManagerOrOwner && (
            <div className="animate-in fade-in duration-300">
              <RestaurantSettings />
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
