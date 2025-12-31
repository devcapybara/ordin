import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import { Save } from 'lucide-react';

const GlobalSettings: React.FC = () => {
    const [commissionRates, setCommissionRates] = useState({
        BASIC: 0,
        PRO: 0,
        ENTERPRISE: 0
    });
    const [prices, setPrices] = useState({
        BASIC: 0,
        PRO: 0,
        ENTERPRISE: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const [commRes, priceRes] = await Promise.all([
                api.get('/admin/config/SALES_COMMISSION_RATES'),
                api.get('/admin/config/SUBSCRIPTION_PRICES')
            ]);

            if (commRes.data && commRes.data.value) {
                setCommissionRates(commRes.data.value);
            } else {
                setCommissionRates({ BASIC: 19000, PRO: 29000, ENTERPRISE: 49000 });
            }

            if (priceRes.data && priceRes.data.value) {
                setPrices(priceRes.data.value);
            } else {
                setPrices({ BASIC: 69000, PRO: 99000, ENTERPRISE: 149000 });
            }
        } catch (error) {
            console.error('Failed to fetch settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await Promise.all([
                api.post('/admin/config', {
                    key: 'SALES_COMMISSION_RATES',
                    value: commissionRates,
                    description: 'Komisi Sales per Paket Langganan'
                }),
                api.post('/admin/config', {
                    key: 'SUBSCRIPTION_PRICES',
                    value: prices,
                    description: 'Harga Langganan Bulanan'
                })
            ]);
            alert('Pengaturan berhasil disimpan');
        } catch (error) {
            console.error('Failed to save settings', error);
            alert('Gagal menyimpan pengaturan');
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="max-w-4xl">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Pengaturan Komisi Sales</h2>
                <p className="text-gray-500 mb-6">Tentukan nominal komisi yang diterima sales agent untuk setiap paket langganan yang berhasil didaftarkan.</p>
                
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Paket Basic</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">Rp</span>
                            <input 
                                type="number" 
                                className="w-full pl-10 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                value={commissionRates.BASIC}
                                onChange={(e) => setCommissionRates({...commissionRates, BASIC: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Paket Pro</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">Rp</span>
                            <input 
                                type="number" 
                                className="w-full pl-10 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                value={commissionRates.PRO}
                                onChange={(e) => setCommissionRates({...commissionRates, PRO: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Paket Enterprise</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">Rp</span>
                            <input 
                                type="number" 
                                className="w-full pl-10 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                value={commissionRates.ENTERPRISE}
                                onChange={(e) => setCommissionRates({...commissionRates, ENTERPRISE: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button onClick={handleSave}>
                        <Save size={18} className="mr-2" /> Simpan Perubahan
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Pengaturan Harga Langganan</h2>
                <p className="text-gray-500 mb-6">Atur harga langganan bulanan untuk setiap paket. Harga tahunan akan otomatis dihitung (x10).</p>
                
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Harga Basic (Bulanan)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">Rp</span>
                            <input 
                                type="number" 
                                className="w-full pl-10 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                value={prices.BASIC}
                                onChange={(e) => setPrices({...prices, BASIC: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Harga Pro (Bulanan)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">Rp</span>
                            <input 
                                type="number" 
                                className="w-full pl-10 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                value={prices.PRO}
                                onChange={(e) => setPrices({...prices, PRO: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Harga Enterprise (Bulanan)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">Rp</span>
                            <input 
                                type="number" 
                                className="w-full pl-10 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                value={prices.ENTERPRISE}
                                onChange={(e) => setPrices({...prices, ENTERPRISE: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button onClick={handleSave}>
                        <Save size={18} className="mr-2" /> Simpan Perubahan
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default GlobalSettings;