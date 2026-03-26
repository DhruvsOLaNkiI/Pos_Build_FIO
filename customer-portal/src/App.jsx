import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import GopuffBanner from './components/GopuffBanner';
import GopuffHeader from './components/GopuffHeader';
import Footer from './components/Footer';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
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
      <Footer />
    </div>
  );
};

function App() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public Main App Routes */}
      <Route element={<AppLayout />}>
        <Route path="/select-company" element={<CompanySelection />} />
        <Route path="/" element={<Home />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/product/:id" element={<Product />} />
      </Route>

      {/* Protected Routes (Require Login) */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/loyalty" element={<Loyalty />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
