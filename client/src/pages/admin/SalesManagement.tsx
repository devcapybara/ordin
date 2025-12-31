import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash, User, MapPin, Phone, Mail, Eye, DollarSign, ExternalLink, X } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import { indonesiaRegions } from '../../data/regions';

interface SalesAgent {
  _id: string;
  username: string;
  email: string;
  region: string;
  whatsappNumber: string;
}

const SalesManagement: React.FC = () => {
  const [agents, setAgents] = useState<SalesAgent[]>([]);
  const [mainContact, setMainContact] = useState('');
  const [loading, setLoading] = useState(true);
  
  // CRUD Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<SalesAgent | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    region: '',
    whatsappNumber: ''
  });

  // Detail/Payout Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedSales, setSelectedSales] = useState<SalesAgent | null>(null);
  const [salesDetail, setSalesDetail] = useState<any>(null);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [proofUrl, setProofUrl] = useState('');

  useEffect(() => {
    fetchAgents();
    fetchMainContact();
  }, []);

  const fetchMainContact = async () => {
    try {
        const { data } = await api.get('/admin/config/MAIN_ADMIN_CONTACT');
        setMainContact(data.value || '');
    } catch (error) {
        console.error('Failed to fetch main contact', error);
    }
  }

  const saveMainContact = async () => {
      try {
          await api.post('/admin/config', {
              key: 'MAIN_ADMIN_CONTACT',
              value: mainContact,
              description: 'Nomor WhatsApp Admin Utama untuk Sales'
          });
          alert('Kontak Admin Utama berhasil disimpan');
      } catch (error) {
          console.error('Failed to save main contact', error);
          alert('Gagal menyimpan kontak admin utama');
      }
  }

  const fetchAgents = async () => {
    try {
      const { data } = await api.get('/admin/sales');
      setAgents(data);
    } catch (error) {
      console.error('Failed to fetch sales agents', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAgent) {
        await api.put(`/admin/sales/${editingAgent._id}`, formData);
      } else {
        await api.post('/admin/sales', formData);
      }
      fetchAgents();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Operation failed', error);
      alert('Gagal menyimpan data sales');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this sales agent?')) return;
    try {
      await api.delete(`/admin/sales/${id}`);
      fetchAgents();
    } catch (error) {
      console.error('Delete failed', error);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      region: '',
      whatsappNumber: ''
    });
    setEditingAgent(null);
  };

  const openEditModal = (agent: SalesAgent) => {
    setEditingAgent(agent);
    setFormData({
      username: agent.username,
      email: agent.email,
      password: '', 
      region: agent.region || '',
      whatsappNumber: agent.whatsappNumber || ''
    });
    setIsModalOpen(true);
  };

  const openViewModal = async (agent: SalesAgent) => {
      setSelectedSales(agent);
      setViewModalOpen(true);
      setSalesDetail(null); // Reset detail while loading
      try {
          const { data } = await api.get(`/admin/sales/${agent._id}/detail`);
          setSalesDetail(data);
          setPayoutAmount(data.stats.currentMonthEstimate || 0);
          setProofUrl('');
      } catch (error) {
          console.error('Failed to fetch sales detail', error);
          alert('Gagal mengambil detail sales');
      }
  };

  const handlePayout = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedSales) return;
      if (!window.confirm('Apakah Anda yakin ingin mencatat pencairan komisi ini?')) return;

      try {
          await api.post(`/admin/sales/${selectedSales._id}/payout`, {
              amount: payoutAmount,
              proofUrl
          });
          alert('Pencairan komisi berhasil dicatat');
          
          // Refresh detail
          const { data } = await api.get(`/admin/sales/${selectedSales._id}/detail`);
          setSalesDetail(data);
          setPayoutAmount(0); // Reset amount after payout? Or keep it? Usually reset.
          setProofUrl('');
      } catch (error) {
          console.error('Payout failed', error);
          alert('Gagal mencatat pencairan komisi');
      }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Konfigurasi Kontak Utama</h3>
        <div className="flex gap-4 items-end">
            <div className="flex-1 max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp Admin Pusat (Format: 628...)</label>
                <input 
                    type="text" 
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    value={mainContact}
                    onChange={(e) => setMainContact(e.target.value)}
                    placeholder="628123456789"
                />
            </div>
            <Button onClick={saveMainContact}>Simpan Kontak</Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">*Nomor ini akan muncul di halaman Sales Contact jika user tidak menemukan sales di wilayahnya.</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Sales Management</h2>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <Plus size={18} className="mr-2" /> Add Sales Agent
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Name</th>
              <th className="p-4 font-semibold text-gray-600">Contact</th>
              <th className="p-4 font-semibold text-gray-600">Region</th>
              <th className="p-4 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr>
            ) : agents.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">No sales agents found</td></tr>
            ) : (
              agents.map(agent => (
                <tr key={agent._id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        {agent.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{agent.username}</div>
                        <div className="text-xs text-gray-500">ID: {agent._id.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-600 flex flex-col gap-1">
                      <div className="flex items-center gap-2"><Mail size={14} /> {agent.email}</div>
                      <div className="flex items-center gap-2"><Phone size={14} /> {agent.whatsappNumber || '-'}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={14} /> {agent.region || 'Nasional'}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openViewModal(agent)} 
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="View Details & Payouts"
                      >
                        <Eye size={18} />
                      </button>
                      <button onClick={() => openEditModal(agent)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(agent._id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                        <Trash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">{editingAgent ? 'Edit Sales Agent' : 'New Sales Agent'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input 
                  type="text" 
                  required 
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  required 
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingAgent && <span className="text-gray-400 font-normal">(Leave empty to keep current)</span>}
                </label>
                <input 
                  type="password" 
                  required={!editingAgent}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number (62...)</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="628123456789"
                  value={formData.whatsappNumber}
                  onChange={e => setFormData({...formData, whatsappNumber: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <input 
                  type="text" 
                  list="region-list"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Pilih atau ketik Kota/Kabupaten"
                  value={formData.region}
                  onChange={e => setFormData({...formData, region: e.target.value})}
                />
                <datalist id="region-list">
                  {indonesiaRegions.map((region) => (
                    <option key={region} value={region} />
                  ))}
                </datalist>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <Button type="submit">
                  {editingAgent ? 'Update Agent' : 'Create Agent'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail & Payout Modal */}
      {viewModalOpen && selectedSales && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <div>
                          <h2 className="text-2xl font-bold text-gray-800">{selectedSales.username}</h2>
                          <p className="text-gray-500">{selectedSales.region || 'No Region'} - {selectedSales.email}</p>
                      </div>
                      <button onClick={() => setViewModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                          <X size={24} />
                      </button>
                  </div>

                  {!salesDetail ? (
                      <div className="text-center py-10">Loading detail...</div>
                  ) : (
                      <div className="grid md:grid-cols-2 gap-8">
                          {/* Left: Stats & Payout Form */}
                          <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-blue-50 p-4 rounded-lg">
                                      <p className="text-sm text-gray-500">Total Tenants</p>
                                      <p className="text-2xl font-bold text-blue-700">{salesDetail.stats.totalTenants}</p>
                                  </div>
                                  <div className="bg-green-50 p-4 rounded-lg">
                                      <p className="text-sm text-gray-500">Active Tenants</p>
                                      <p className="text-2xl font-bold text-green-700">{salesDetail.stats.activeTenants}</p>
                                  </div>
                              </div>
                              
                              <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                                  <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                                      <DollarSign size={18} /> Estimasi Komisi Bulan Ini
                                  </h3>
                                  <p className="text-3xl font-bold text-purple-700 mb-2">
                                      Rp {salesDetail.stats.currentMonthEstimate.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-purple-600 mb-6">
                                      *Berdasarkan {salesDetail.stats.currentMonthTenantsCount} tenant aktif yang didaftarkan bulan ini.
                                  </p>

                                  <form onSubmit={handlePayout} className="space-y-4 pt-4 border-t border-purple-200">
                                      <h4 className="font-semibold text-gray-800">Catat Pencairan Komisi</h4>
                                      <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Pencairan (Rp)</label>
                                          <input 
                                              type="number" 
                                              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                              value={payoutAmount}
                                              onChange={(e) => setPayoutAmount(Number(e.target.value))}
                                              required
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Link Bukti Transfer</label>
                                          <input 
                                              type="text" 
                                              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                              placeholder="https://..."
                                              value={proofUrl}
                                              onChange={(e) => setProofUrl(e.target.value)}
                                              required
                                          />
                                      </div>
                                      <Button type="submit" className="w-full">
                                          Simpan Pencairan
                                      </Button>
                                  </form>
                              </div>
                          </div>

                          {/* Right: Payout History */}
                          <div>
                              <h3 className="font-bold text-gray-800 mb-4">Riwayat Pencairan</h3>
                              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                                  <table className="w-full text-sm text-left">
                                      <thead className="bg-gray-100 border-b">
                                          <tr>
                                              <th className="p-3">Tanggal</th>
                                              <th className="p-3">Jumlah</th>
                                              <th className="p-3">Bukti</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y">
                                          {salesDetail.payouts.length === 0 ? (
                                              <tr><td colSpan={3} className="p-4 text-center text-gray-500">Belum ada riwayat.</td></tr>
                                          ) : (
                                              salesDetail.payouts.map((payout: any) => (
                                                  <tr key={payout._id}>
                                                      <td className="p-3">{new Date(payout.createdAt).toLocaleDateString()}</td>
                                                      <td className="p-3 font-medium">Rp {payout.amount.toLocaleString()}</td>
                                                      <td className="p-3">
                                                          <a href={payout.proofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                                              Link <ExternalLink size={12} />
                                                          </a>
                                                      </td>
                                                  </tr>
                                              ))
                                          )}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default SalesManagement;
