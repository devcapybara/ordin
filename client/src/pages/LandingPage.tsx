import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, LayoutGrid, Smartphone, ChefHat, BarChart3 } from 'lucide-react';
import Button from '../components/ui/Button';
import api from '../services/api';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [prices, setPrices] = useState({
      BASIC: 69000,
      PRO: 99000,
      ENTERPRISE: 149000
  });

  useEffect(() => {
      const fetchPrices = async () => {
          try {
              const { data } = await api.get('/config/prices');
              setPrices(data);
          } catch (error) {
              console.error('Failed to fetch prices', error);
          }
      };
      fetchPrices();
  }, []);

  const plans = [
    {
      name: 'Basic',
      price: prices.BASIC,
      description: 'Fitur esensial untuk kafe kecil',
      features: [
        'Sistem POS',
        'Manajemen Meja',
        'Laporan Dasar',
        'Hingga 5 Akun Staf',
        'Dukungan Email'
      ],
      recommended: false
    },
    {
      name: 'Pro',
      price: prices.PRO,
      description: 'Sempurna untuk restoran berkembang',
      features: [
        'Semua fitur Basic',
        'Kitchen Display System (KDS)',
        'Aplikasi Waiter',
        'Manajemen Inventaris',
        'Analitik Lanjutan',
        'Hingga 15 Akun Staf',
        'Dukungan Prioritas'
      ],
      recommended: true
    },
    {
      name: 'Enterprise',
      price: prices.ENTERPRISE,
      description: 'Untuk jaringan besar dan waralaba',
      features: [
        'Semua fitur Pro',
        'Manajemen Multi-outlet',
        'Akses API',
        'Integrasi Kustom',
        'Akun Staf Tak Terbatas',
        'Manajer Akun Dedikasi',
        'Dukungan Telepon 24/7'
      ],
      recommended: false
    }
  ];

  const calculatePrice = (basePrice: number) => {
    if (billingCycle === 'yearly') {
      // Pay for 10 months, get 12 months. So annual price = basePrice * 10.
      // Monthly equivalent display = (basePrice * 10) / 12
      return (basePrice * 10) / 12;
    }
    return basePrice;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <LayoutGrid className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold text-gray-900">Ordin App</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-blue-600 font-medium">Fitur</a>
            <a href="#pricing" className="text-gray-600 hover:text-blue-600 font-medium">Harga</a>
            <a href="#testimonials" className="text-gray-600 hover:text-blue-600 font-medium">Testimoni</a>
          </nav>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')} 
              className="text-gray-600 hover:text-blue-600 font-medium px-4 py-2"
            >
              Masuk
            </button>
            <Button onClick={() => navigate('/sales-contact')} className="hidden md:flex">
              Mulai Sekarang
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 md:pt-32 md:pb-24 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2 space-y-6">
              <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                Kelola Restoran Anda <span className="text-blue-600">Lebih Cerdas & Cepat</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-lg">
                Sistem POS, Kitchen Display, dan Manajemen Waiter all-in-one yang dirancang untuk merampingkan operasional dan meningkatkan keuntungan Anda.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
                  Coba Gratis <ArrowRight className="ml-2" size={20} />
                </Button>
                <button 
                  className="px-6 py-3 rounded-lg border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => navigate('/demo')}
                >
                  Lihat Demo
                </button>
              </div>
              <div className="pt-6 flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1"><Check size={16} className="text-green-500" /> Tanpa kartu kredit</div>
                <div className="flex items-center gap-1"><Check size={16} className="text-green-500" /> Pengaturan cepat</div>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="relative z-10 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1556740758-90de374c12ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                  alt="Restaurant POS System" 
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 z-0"></div>
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-50 z-0"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Segala yang Anda Butuhkan untuk Menjalankan Restoran Modern</h2>
            <p className="text-gray-600">Ordin App menghubungkan area depan, dapur, dan back-office dalam satu platform yang mulus.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-6">
                <Smartphone size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Aplikasi Waiter</h3>
              <p className="text-gray-600">Terima pesanan di meja dengan aplikasi pelayan ramah seluler kami. Kirim pesanan langsung ke dapur secara instan.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-6">
                <ChefHat size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Sistem Tampilan Dapur</h3>
              <p className="text-gray-600">Gantikan tiket kertas dengan layar digital. Tingkatkan akurasi pesanan dan lacak waktu memasak secara efisien.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Analitik Real-time</h3>
              <p className="text-gray-600">Lacak penjualan, inventaris, dan kinerja staf secara real-time. Buat keputusan berdasarkan data untuk mengembangkan bisnis Anda.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Harga Sederhana & Transparan</h2>
            <p className="text-gray-600 mb-8">Pilih paket yang sesuai dengan kebutuhan restoran Anda. Tanpa biaya tersembunyi.</p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>Bulanan</span>
              <button 
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="relative w-14 h-7 bg-blue-600 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none"
              >
                <div 
                  className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-0'}`}
                ></div>
              </button>
              <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
                Tahunan <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full ml-1 font-bold">Hemat ~17%</span>
              </span>
            </div>
            {billingCycle === 'yearly' && (
                <p className="text-sm text-green-600 font-medium">Bayar 10 bulan, dapat 12 bulan!</p>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div 
                key={plan.name} 
                className={`relative bg-white rounded-2xl p-8 border-2 transition-all duration-300 ${
                  plan.recommended 
                    ? 'border-blue-600 shadow-xl scale-105 z-10' 
                    : 'border-gray-100 shadow-lg hover:border-blue-200'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide">
                    Paling Populer
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-500 mb-6 text-sm h-10">{plan.description}</p>
                
                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-gray-900">Rp {formatPrice(calculatePrice(plan.price))}</span>
                    <span className="text-gray-500 mb-1">/bln</span>
                  </div>
                  {billingCycle === 'yearly' && (
                      <div className="text-xs text-gray-500 mt-1">
                          Tagihan Rp {formatPrice(plan.price * 10)} per tahun
                      </div>
                  )}
                </div>

                <Button 
                  className={`w-full py-3 mb-8 ${plan.recommended ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-900 hover:bg-gray-800'}`}
                  onClick={() => navigate('/sales-contact')}
                >
                  Pilih {plan.name}
                </Button>

                <ul className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                      <Check size={18} className="text-green-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <LayoutGrid className="text-blue-500" size={24} />
              <span className="text-xl font-bold">Ordin App</span>
            </div>
            <div className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Ordin App. Hak Cipta Dilindungi.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;