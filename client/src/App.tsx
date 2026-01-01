import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import LoadingScreen from './components/ui/LoadingScreen';

// Lazy Load Pages
const Login = React.lazy(() => import('./pages/Login'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const SalesContact = React.lazy(() => import('./pages/SalesContact'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const POS = React.lazy(() => import('./pages/POS'));
const Kitchen = React.lazy(() => import('./pages/Kitchen'));
const Waiter = React.lazy(() => import('./pages/Waiter'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const SalesDashboard = React.lazy(() => import('./pages/SalesDashboard'));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// Component to handle role-based redirection on root path
const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case 'SUPER_ADMIN':
      return <Navigate to="/admin" />;
    case 'SALES':
      return <Navigate to="/dashboard/sales" />;
    case 'CASHIER':
      return <Navigate to="/pos" />;
    case 'KITCHEN':
      return <Navigate to="/kitchen" />;
    case 'WAITER':
      return <Navigate to="/waiter" />;
    case 'OWNER':
    case 'MANAGER':
    default:
      return <Navigate to="/dashboard" />;
  }
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/pos"
                element={
                  <ProtectedRoute>
                    <POS />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/kitchen"
                element={
                  <ProtectedRoute>
                    <Kitchen />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/waiter"
                element={
                  <ProtectedRoute>
                    <Waiter />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard/sales"
                element={
                  <ProtectedRoute>
                    <SalesDashboard />
                  </ProtectedRoute>
                }
              />

              <Route path="/" element={<LandingPage />} />
              <Route path="/sales-contact" element={<SalesContact />} />
              <Route path="/app" element={<RootRedirect />} />
            </Routes>
          </Suspense>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
