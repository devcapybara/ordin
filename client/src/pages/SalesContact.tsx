import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, MapPin, User, ArrowLeft, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import api from '../services/api';

interface SalesAgent {
  username: string;
  region?: string;
  whatsappNumber?: string;
  email: string;
}

const SalesContact: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<SalesAgent[]>([]);
  const [mainContact, setMainContact] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Grouping state
  const [groupedAgents, setGroupedAgents] = useState<Record<string, SalesAgent[]>>({});
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [agentsRes, contactRes] = await Promise.all([
        api.get('/sales/agents'),
        api.get('/sales/main-contact')
      ]);
      
      const agentsData: SalesAgent[] = agentsRes.data;
      setAgents(agentsData);
      setMainContact(contactRes.data.contact);

      // Group agents by region
      const grouped: Record<string, SalesAgent[]> = {};
      agentsData.forEach(agent => {
        const region = agent.region || 'Nasional / Lainnya';
        if (!grouped[region]) {
          grouped[region] = [];
        }
        grouped[region].push(agent);
      });
      
      setGroupedAgents(grouped);
      
      // Auto expand all regions initially
      const initialExpanded: Record<string, boolean> = {};
      Object.keys(grouped).forEach(key => initialExpanded[key] = true);
      setExpandedRegions(initialExpanded);

    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRegion = (region: string) => {
    setExpandedRegions(prev => ({
      ...prev,
      [region]: !prev[region]
    }));
  };

  const handleWhatsApp = (number?: string, name?: string) => {
    if (!number) return;
    let cleanNumber = number.replace(/\D/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '62' + cleanNumber.substring(1);
    }
    
    const message = `Halo ${name || 'Admin'}, saya tertarik untuk berlangganan Ordin App. Bisa bantu saya?`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center text-gray-600 hover:text-blue-600 mb-8 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" /> Kembali ke Beranda
        </button>
        
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Hubungi Tim Sales Kami</h1>
          <p className="text-gray-600">Pilih sales representative di area Anda untuk bantuan pendaftaran dan info lebih lanjut.</p>
        </div>

        {loading ? (
          <div className="text-center py-12">Memuat data sales...</div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm mb-8">
            <p className="text-gray-500">Belum ada data sales yang tersedia saat ini.</p>
          </div>
        ) : (
          <div className="space-y-6 mb-12">
            {Object.entries(groupedAgents).sort().map(([region, regionAgents]) => (
              <div key={region} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <button 
                  onClick={() => toggleRegion(region)}
                  className="w-full flex items-center justify-between p-6 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="text-blue-600" size={20} />
                    <h2 className="text-lg font-bold text-gray-800">{region}</h2>
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                      {regionAgents.length} Sales
                    </span>
                  </div>
                  {expandedRegions[region] ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                </button>
                
                {expandedRegions[region] && (
                  <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    {regionAgents.map((agent, idx) => (
                      <div key={idx} className="bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-300 transition-colors shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                            <User size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{agent.username}</h3>
                            <p className="text-xs text-gray-500 truncate max-w-[150px]">{agent.email}</p>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => handleWhatsApp(agent.whatsappNumber, agent.username)}
                          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                          disabled={!agent.whatsappNumber}
                        >
                          <Phone size={16} />
                          {agent.whatsappNumber ? 'Chat WhatsApp' : 'Tidak Tersedia'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer Note */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-4">
                <HelpCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Tidak menemukan sales di wilayahmu?</h3>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                Jangan khawatir, Anda tetap bisa mendaftar dengan menghubungi Admin Utama kami secara langsung.
            </p>
            {mainContact ? (
                <button 
                    onClick={() => handleWhatsApp(mainContact, 'Admin Pusat')}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
                >
                    <Phone size={20} />
                    Hubungi Admin Pusat
                </button>
            ) : (
                <p className="text-sm text-red-500 italic">
                    (Nomor kontak admin belum dikonfigurasi)
                </p>
            )}
        </div>
      </div>
    </div>
  );
};

export default SalesContact;