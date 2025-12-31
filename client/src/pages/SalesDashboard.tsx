import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, UserPlus, Building, CreditCard, User, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import api from '../services/api';

interface Tenant {
  _id: string;
  name: string;
  ownerEmail: string;
  plan: string;
  status: string;
  joinedAt: string;
  potentialCommission: number;
}

const SalesDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    restaurantName: '',
    phone: '',
    subscriptionPlan: 'BASIC',
    billingCycle: 'MONTHLY'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  const [stats, setStats] = useState({
      tenants: [] as Tenant[],
      rates: { BASIC: 0, PRO: 0, ENTERPRISE: 0 },
      totalEarnings: 0,
      totalTenants: 0
  });
  const [prices, setPrices] = useState({
      BASIC: 69000,
      PRO: 99000,
      ENTERPRISE: 149000
  });

  useEffect(() => {
      fetchStats();
      fetchPrices();
  }, []);

  const fetchPrices = async () => {
      try {
          const { data } = await api.get('/config/prices');
          setPrices(data);
      } catch (error) {
          console.error('Failed to fetch prices', error);
      }
  };

  const fetchStats = async () => {
      try {
          const { data } = await api.get('/sales/stats');
          setStats(data);
      } catch (error) {
          console.error('Failed to fetch stats', error);
      }
  }

  const getPriceDisplay = (basePrice: number) => {
      if (formData.billingCycle === 'YEARLY') {
          return `Rp ${(basePrice * 10).toLocaleString()}/tahun`;
      }
      return `Rp ${basePrice.toLocaleString()}/bulan`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await api.post('/sales/tenants', formData);
      setMessage({ type: 'success', text: 'Tenant berhasil didaftarkan!' });
      setFormData({
        username: '',
        email: '',
        password: '',
        restaurantName: '',
        phone: '',
        subscriptionPlan: 'BASIC',
        billingCycle: 'MONTHLY'
      });
      fetchStats(); // Refresh stats
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Gagal mendaftarkan tenant' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Sales Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Halo, {user?.username}</span>
          <button onClick={logout} className="text-red-600 hover:text-red-700 font-medium flex items-center gap-2">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto py-10 px-6">
        
        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <Users size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500">Total Tenant</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalTenants}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <DollarSign size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500">Estimasi Komisi</p>
                    <p className="text-2xl font-bold text-gray-800">Rp {stats.totalEarnings.toLocaleString()}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100">
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <TrendingUp size={16} /> Info Komisi
                </p>
                <div className="text-xs space-y-2 text-gray-600">
                    <div className="flex justify-between border-b pb-1">
                        <span>Basic:</span> 
                        <div className="text-right">
                            <div className="font-medium">Rp {(stats.rates.BASIC || 0).toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">/bln</span></div>
                            <div className="font-medium">Rp {((stats.rates.BASIC || 0) * 10).toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">/thn</span></div>
                        </div>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                        <span>Pro:</span>
                        <div className="text-right">
                            <div className="font-medium">Rp {(stats.rates.PRO || 0).toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">/bln</span></div>
                            <div className="font-medium">Rp {((stats.rates.PRO || 0) * 10).toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">/thn</span></div>
                        </div>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                        <span>Enterprise:</span>
                        <div className="text-right">
                            <div className="font-medium">Rp {(stats.rates.ENTERPRISE || 0).toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">/bln</span></div>
                            <div className="font-medium">Rp {((stats.rates.ENTERPRISE || 0) * 10).toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">/thn</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <div className="flex items-center gap-3 mb-6 border-b pb-4">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <UserPlus size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Daftarkan Tenant Baru</h2>
              <p className="text-sm text-gray-500">Isi formulir di bawah ini untuk mendaftarkan restoran baru.</p>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Owner Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <User size={18} /> Informasi Pemilik
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username Pemilik</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password Awal</label>
                  <input
                    type="password"
                    required
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
                  <input
                    type="tel"
                    required
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              {/* Restaurant & Plan */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Building size={18} /> Detail Restoran
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Restoran</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.restaurantName}
                    onChange={e => setFormData({...formData, restaurantName: e.target.value})}
                  />
                </div>
                
                <h3 className="font-semibold text-gray-700 flex items-center gap-2 pt-2">
                  <CreditCard size={18} /> Paket Langganan
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Paket</label>
                  <select
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.subscriptionPlan}
                    onChange={e => setFormData({...formData, subscriptionPlan: e.target.value})}
                  >
                    <option value="BASIC">Basic ({getPriceDisplay(prices.BASIC)})</option>
                    <option value="PRO">Pro ({getPriceDisplay(prices.PRO)})</option>
                    <option value="ENTERPRISE">Enterprise ({getPriceDisplay(prices.ENTERPRISE)})</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Siklus Tagihan</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="billing"
                        value="MONTHLY"
                        checked={formData.billingCycle === 'MONTHLY'}
                        onChange={e => setFormData({...formData, billingCycle: e.target.value})}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Bulanan</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="billing"
                        value="YEARLY"
                        checked={formData.billingCycle === 'YEARLY'}
                        onChange={e => setFormData({...formData, billingCycle: e.target.value})}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Tahunan (Bonus 2 Bulan)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? 'Memproses...' : (
                  <>
                    <UserPlus size={20} /> Daftarkan Tenant
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Tenants List */}
        <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Users size={20} /> Daftar Tenant Saya
            </h2>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Nama Restoran</th>
                            <th className="p-4 font-semibold text-gray-600">Pemilik</th>
                            <th className="p-4 font-semibold text-gray-600">Paket</th>
                            <th className="p-4 font-semibold text-gray-600">Status</th>
                            <th className="p-4 font-semibold text-gray-600">Bergabung</th>
                            <th className="p-4 font-semibold text-gray-600">Est. Komisi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {stats.tenants.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">Belum ada tenant yang terdaftar.</td></tr>
                        ) : (
                            stats.tenants.map(tenant => (
                                <tr key={tenant._id} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-900">{tenant.name}</td>
                                    <td className="p-4 text-gray-600">{tenant.ownerEmail}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            tenant.plan === 'ENTERPRISE' ? 'bg-purple-100 text-purple-700' :
                                            tenant.plan === 'PRO' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {tenant.plan}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            tenant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {tenant.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600 text-sm">
                                        {new Date(tenant.joinedAt).toLocaleDateString('id-ID')}
                                    </td>
                                    <td className="p-4 font-medium text-green-600">
                                        Rp {tenant.potentialCommission.toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;