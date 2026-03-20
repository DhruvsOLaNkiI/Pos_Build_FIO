import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import GopuffBanner from './components/GopuffBanner';
import GopuffHeader from './components/GopuffHeader';
import Login from './pages/Login';
import Home from './pages/Home';
import Offers from './pages/Offers';
import Loyalty from './pages/Loyalty';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import Product from './pages/Product';

import { useState } from 'react';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const AppLayout = () => {
  const [view, setView] = useState('home'); // 'home' | 'all-products' | 'account'

  return (
    <div className="relative min-h-screen flex flex-col bg-white">
      <GopuffBanner onClick={() => setView('all-products')} />
      <GopuffHeader
        onViewHome={() => setView('home')}
        onViewAccount={() => setView('account')}
      />
      <main className="flex-1 w-full overflow-x-hidden">
        <Outlet context={{ view, setView }} />
      </main>
    </div>
  );
};

function App() {
  return (
    <Routes>
      {/* Public Auth Route */}
      <Route path="/login" element={<Login />} />

      {/* Main App Routes (Protected via Customer ID) */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Home />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/loyalty" element={<Loyalty />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/product/:id" element={<Product />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
