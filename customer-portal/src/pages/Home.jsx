import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCustomerActivityTracking } from '../hooks/useCustomerActivityTracking';
import { Loader2, MapPin, Store as StoreIcon, X } from 'lucide-react';
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
    const [nearbyStoresData, setNearbyStoresData] = useState([]); // [{store: {...}, products: [...]}]
    const [loading, setLoading] = useState(true);
    const { view, setView } = useOutletContext();
    const [currentPincode, setCurrentPincode] = useState(() => localStorage.getItem('customer_pincode'));

    const fetchNearbyStores = useCallback(async (pincode) => {
        if (!pincode) return;
        try {
            const { data } = await API.get(`/stores/nearby?pincode=${pincode}`);
            if (data.success) {
                setNearbyStoresData(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch nearby stores', error);
        }
    }, []);

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
        
        if (currentPincode) {
            fetchNearbyStores(currentPincode);
        }

        const handleLocationChange = (e) => {
            setCurrentPincode(e.detail);
            fetchNearbyStores(e.detail);
        };

        window.addEventListener('locationChanged', handleLocationChange);
        return () => window.removeEventListener('locationChanged', handleLocationChange);
    }, [currentPincode, fetchNearbyStores]);

    // Merge all products from all nearby stores into one flat list
    const storeProducts = useMemo(() => {
        if (nearbyStoresData.length === 0) return [];
        const all = [];
        nearbyStoresData.forEach(({ products: prods }) => {
            prods.forEach(p => all.push(p));
        });
        return all;
    }, [nearbyStoresData]);

    // Decide which products to use for the page
    const activeProducts = storeProducts.length > 0 ? storeProducts : products;

    // Dynamically group products by category
    const categoryGroups = useMemo(() => {
        const groups = {};
        activeProducts.forEach(p => {
            const cat = p.category || 'Other';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(p);
        });
        return groups;
    }, [activeProducts]);

    // Static categorizations for fallback (when no pincode)
    const trendingProducts = activeProducts.slice(0, 10).map(p => ({
        ...p,
        badge: Math.random() > 0.7 ? "NEW" : null,
        famPromo: Math.random() > 0.8 ? "$4.19 Member Price" : null
    }));

    const priceDrops = activeProducts.filter(p => (p.sellingPrice < (p.purchasePrice || p.sellingPrice) * 1.5) || (p.name || '').length % 2 === 0).slice(0, 10).map(p => ({
        ...p,
        badge: "NEW LOWER PRICE",
        oldPrice: Math.round(p.sellingPrice * 1.25),
        stockWarning: Math.random() > 0.8 ? "ONLY 2 LEFT" : null
    }));

    const handleClearLocation = () => {
        localStorage.removeItem('customer_pincode');
        setCurrentPincode(null);
        setNearbyStoresData([]);
    };

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
                        {activeProducts.map(product => (
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

            {/* Store Location Banner - when pincode is active */}
            {nearbyStoresData.length > 0 && (
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                    <div className="max-w-[1440px] mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <MapPin className="h-5 w-5" />
                                <div>
                                    <p className="font-black text-sm uppercase tracking-tight">
                                        Delivering from {nearbyStoresData.length} store{nearbyStoresData.length > 1 ? 's' : ''} near {currentPincode}
                                    </p>
                                    <p className="text-blue-200 text-xs font-bold mt-0.5">
                                        {nearbyStoresData.map(s => s.store.name).join(' · ')}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={handleClearLocation}
                                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-tight transition-colors"
                            >
                                <X className="h-3 w-3" /> Clear
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <GopuffCategoryRow />
            <GopuffHeroGrid />
            <GopuffMarquee />

            {/* When pincode is set: Show products grouped by CATEGORY as carousels */}
            {storeProducts.length > 0 ? (
                <>
                    {/* Trending / Featured - first 10 products */}
                    <GopuffProductCarousel
                        title={`TRENDING NEAR ${currentPincode}.`}
                        products={trendingProducts}
                        onMoreClick={() => setView('all-products')}
                    />

                    <GopuffShopCategoriesGrid />

                    {/* Dynamic Category Carousels */}
                    {Object.entries(categoryGroups).map(([category, catProducts]) => (
                        <GopuffProductCarousel
                            key={category}
                            title={`${category.toUpperCase()}.`}
                            products={catProducts.slice(0, 15)}
                            totalItems={catProducts.length}
                            onMoreClick={() => setView('all-products')}
                        />
                    ))}

                    {/* Price Drops */}
                    {priceDrops.length > 0 && (
                        <GopuffProductCarousel
                            title="PRICE DROPS."
                            products={priceDrops}
                            totalItems={priceDrops.length}
                            onMoreClick={() => setView('all-products')}
                        />
                    )}
                </>
            ) : (
                <>
                    {/* Default view - no pincode */}
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

                    {/* Dynamic Category Carousels from all products */}
                    {Object.entries(categoryGroups)
                        .filter(([cat]) => cat !== 'Other')
                        .slice(0, 5)
                        .map(([category, catProducts]) => (
                            <GopuffProductCarousel
                                key={category}
                                title={`${category.toUpperCase()}.`}
                                products={catProducts.slice(0, 10)}
                                totalItems={catProducts.length}
                                onMoreClick={() => setView('all-products')}
                            />
                        ))}
                </>
            )}

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
