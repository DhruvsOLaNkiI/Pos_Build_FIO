import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCustomerActivityTracking } from '../hooks/useCustomerActivityTracking';
import { Loader2 } from 'lucide-react';
import GopuffCategoryRow from '../components/GopuffCategoryRow';
import GopuffHeroGrid from '../components/GopuffHeroGrid';
import GopuffMarquee from '../components/GopuffMarquee';
import GopuffProductCarousel from '../components/GopuffProductCarousel';
import GopuffProductCard from '../components/GopuffProductCard';
import GopuffShopCategoriesGrid from '../components/GopuffShopCategoriesGrid';
import GopuffBottomHeroGrid from '../components/GopuffBottomHeroGrid';
import FilterBar from '../components/FilterBar';
import AccountView from '../components/AccountView';

const Home = () => {
    const { trackProductView } = useCustomerActivityTracking();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { view, setView } = useOutletContext();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data } = await API.get('/products');
                setProducts(data.data);
            } catch (error) {
                console.error('Failed to fetch products', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Categorize products for different sections
    const trendingProducts = products.slice(0, 10).map(p => ({
        ...p,
        badge: Math.random() > 0.7 ? "NEW" : null,
        famPromo: Math.random() > 0.8 ? "$4.19 Member Price" : null
    }));

    const priceDrops = products.filter(p => (p.sellingPrice < p.purchasePrice * 1.5) || p.name.length % 2 === 0).slice(0, 10).map(p => ({
        ...p,
        badge: "NEW LOWER PRICE",
        oldPrice: Math.round(p.sellingPrice * 1.25),
        stockWarning: Math.random() > 0.8 ? "ONLY 2 LEFT" : null
    }));

    const drinkProducts = products.filter(p => p.category === 'Drinks' || p.category === 'Beverages' || p.name.toLowerCase().includes('drink')).slice(0, 10).map(p => ({
        ...p,
        iconBadge: "COLD",
        promo: Math.random() > 0.7 ? "Spend $25 Save $5" : null
    }));

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-6" />
                <p className="text-gray-400 font-black font-condensed uppercase tracking-[0.2em] italic text-sm">INITIALIZING GOPUFF EXPERIENCE...</p>
            </div>
        );
    }

    if (view === 'account') {
        return <AccountView onViewHome={() => setView('home')} />;
    }

    if (view === 'all-products') {
        return (
            <main className="animate-fade-in bg-white min-h-screen pb-20">
                <FilterBar />
                <div className="max-w-[1440px] mx-auto px-4 py-8">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="font-extrabold italic text-4xl tracking-tighter uppercase text-black">ALL PRODUCTS.</h1>
                        <button
                            onClick={() => setView('home')}
                            className="bg-black text-white px-6 py-3 rounded-full font-black text-xs hover:bg-gray-800 transition-colors uppercase tracking-widest"
                        >
                            BACK HOME
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-y-10 gap-x-6">
                        {products.map(product => (
                            <div key={product._id} onClick={() => trackProductView(product._id, product.name)}>
                                <GopuffProductCard product={product} />
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <div className="min-h-screen bg-white animate-fade-in pb-20">
            <GopuffCategoryRow />
            <GopuffHeroGrid />
            <GopuffMarquee />

            <GopuffProductCarousel
                title="TRENDING IN ATLANTA."
                products={trendingProducts}
                onMoreClick={() => setView('all-products')}
            />

            <GopuffShopCategoriesGrid />

            <GopuffProductCarousel
                title="PRICE DROPS."
                products={priceDrops}
                totalItems={210}
                onMoreClick={() => setView('all-products')}
            />

            <GopuffProductCarousel
                title="DRINKS."
                products={drinkProducts}
                totalItems={924}
                onMoreClick={() => setView('all-products')}
            />

            <GopuffBottomHeroGrid />

            {/* Final Footer */}
            <footer className="bg-gray-50 border-t border-gray-100 py-16 px-4 text-center mt-20">
                <div className="font-extrabold font-condensed italic text-6xl text-blue-600 mb-6 lowercase tracking-tighter">
                    go<span className="text-black">puff</span>
                </div>
                <div className="text-[10px] text-gray-400 leading-relaxed uppercase font-black tracking-[0.3em] max-w-sm mx-auto opacity-60 italic">
                    © 2026 Gopuff Redesign Project · All rights reserved.<br />
                    Powered by the future of instant delivery.
                </div>
            </footer>
        </div>
    );
};

export default Home;
