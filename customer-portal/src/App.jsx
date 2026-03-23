import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import GopuffBanner from './components/GopuffBanner';
import GopuffHeader from './components/GopuffHeader';
import Login from './pages/Login';
import CompanySelection from './pages/CompanySelection';
import Home from './pages/Home';
import Offers from './pages/Offers';
import Loyalty from './pages/Loyalty';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import Product from './pages/Product';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';

import { useState } from 'react';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const AppLayout = () => {
  const [view, setView] = useState('home'); // 'home' | 'all-products' | 'account'
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ category: '', brand: '', inStock: false, sort: '', priceRange: '' });

  return (
    <div className="relative min-h-screen flex flex-col bg-white">
      <GopuffBanner onClick={() => setView('all-products')} />
      <GopuffHeader
        onViewHome={() => { setView('home'); setFilters({ category: '', brand: '', inStock: false, sort: '', priceRange: '' }); }}
        onViewAccount={() => setView('account')}
        categories={categories}
        setFilters={(newFilters) => { setFilters(newFilters); setView('all-products'); }}
      />
      <main className="flex-1 w-full overflow-x-hidden">
        <Outlet context={{ view, setView, categories, setCategories, filters, setFilters }} />
      </main>
    </div>
  );
};

function App() {
  return (
    <Routes>
      {/* Public Auth Route */}
      <Route path="/login" element={<Login />} />

      {/* Company Selection (Protected) */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/select-company" element={<CompanySelection />} />
      </Route>

      {/* Main App Routes (Protected via Customer ID) */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Home />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/loyalty" element={<Loyalty />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
