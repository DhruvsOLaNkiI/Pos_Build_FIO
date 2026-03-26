import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import API from '../services/api';
import { useCustomerActivityTracking } from '../hooks/useCustomerActivityTracking';
import { Loader2, MapPin, X } from 'lucide-react';
import GopuffCategoryRow from '../components/GopuffCategoryRow';
import GopuffHeroGrid from '../components/GopuffHeroGrid';
import GopuffMarquee from '../components/GopuffMarquee';
import GopuffProductCarousel from '../components/GopuffProductCarousel';
import GopuffProductCard from '../components/GopuffProductCard';
import GopuffShopCategoriesGrid from '../components/GopuffShopCategoriesGrid';
import GopuffBottomHeroGrid from '../components/GopuffBottomHeroGrid';
import FilterBar from '../components/FilterBar';
import AccountView from '../components/AccountView';
import GopuffHeroSlider from '../components/GopuffHeroSlider';
import GopuffHeroCarousel from '../components/GopuffHeroCarousel';

const Home = () => {
    const { trackProductView } = useCustomerActivityTracking();
    const [products, setProducts] = useState([]);
    const [offers, setOffers] = useState([]);
    const [nearbyStoresData, setNearbyStoresData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [shopSettings, setShopSettings] = useState(null);
    const { view, setView, categories, setCategories, filters, setFilters } = useOutletContext();
    const [currentPincode, setCurrentPincode] = useState(() => localStorage.getItem('customer_pincode'));
    const [specialFilter, setSpecialFilter] = useState(null); // 'bulk' | 'offers' | 'deals'

    const handleCategoryNavigation = useCallback((categoryName) => {
        if (!categoryName) return;
        const lowerCat = categoryName.toLowerCase();
        
        if (['deals', 'offers', 'price drops'].includes(lowerCat)) {
            setSpecialFilter(lowerCat);
            setFilters({ category: '', brand: '', inStock: false, sort: '', priceRange: '' });
        } else {
            setSpecialFilter(null);
            // Match the actual category casing if possible
            const matchedCategory = categories.find(c => c.toLowerCase() === lowerCat) || categoryName;
            setFilters({ category: matchedCategory, brand: '', inStock: false, sort: '', priceRange: '' });
        }
        setView('all-products');
        window.scrollTo(0, 0);
    }, [categories, setFilters, setSpecialFilter, setView]);

    const handleBannerNavigation = useCallback((type) => {
        if (['deals', 'offers', 'price drops'].includes(type?.toLowerCase())) {
            setSpecialFilter(type.toLowerCase());
            setFilters({ category: '', brand: '', inStock: false, sort: '', priceRange: '' });
        } else {
            setSpecialFilter(null);
        }
        setView('all-products');
        window.scrollTo(0, 0);
    }, [setFilters, setSpecialFilter, setView]);


    const fetchOffers = useCallback(async () => {
        try {
            const { data } = await API.get('/offers');
            if (data.success) {
                setOffers(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch offers', error);
        }
    }, []);

    const fetchNearbyStores = useCallback(async (locationStr) => {
        if (!locationStr) return;
        try {
            // Check if it's lat,lng format or pincode
            let params;
            if (locationStr.includes(',')) {
                const [lat, lng] = locationStr.split(',');
                params = `lat=${lat}&lng=${lng}`;
            } else {
                params = `pincode=${locationStr}`;
            }
            const { data } = await API.get(`/stores/nearby?${params}`);
            if (data.success) {
                setNearbyStoresData(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch nearby stores', error);
        }
    }, []);

    useEffect(() => {
        const fetchProductsAndOffers = async () => {
            try {
                // Fetch settings, but handle unauthenticated errors gracefully if they arise (though Home is protected)
                const fetchSettings = async () => {
                    try {
                        const token = localStorage.getItem('customerToken');
                        if (!token) return { data: null };
                        return await API.get('/shop-settings');
                    } catch (e) {
                        console.error('Failed to fetch shop settings', e);
                        return { data: null };
                    }
                };

                const [prodRes, offRes, settingsRes] = await Promise.all([
                    API.get('/products'),
                    API.get('/offers'),
                    fetchSettings()
                ]);
                if (prodRes.data?.success) {
                    const allProds = prodRes.data.data;
                    setProducts(allProds);
                    const cats = [...new Set(allProds.map(p => p.category).filter(Boolean))].sort();
                    setCategories(cats);
                }
                if (offRes.data?.success) setOffers(offRes.data.data);
                if (settingsRes?.data?.success && settingsRes.data.data) {
                    setShopSettings(settingsRes.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProductsAndOffers();
        
        if (currentPincode) {
            fetchNearbyStores(currentPincode);
        }

        const handleLocationChange = (e) => {
            setCurrentPincode(e.detail);
            fetchNearbyStores(e.detail);
        };

        window.addEventListener('locationChanged', handleLocationChange);

        const handleSpecialFilter = (e) => {
            setSpecialFilter(e.detail);
            setView('all-products');
        };
        window.addEventListener('filterDeals', handleSpecialFilter);
        return () => {
            window.removeEventListener('locationChanged', handleLocationChange);
            window.removeEventListener('filterDeals', handleSpecialFilter);
        };
    }, [currentPincode, fetchNearbyStores, setCategories, setView]);

    // Merge all products from all nearby stores into one flat list
    const storeProducts = useMemo(() => {
        if (!nearbyStoresData || nearbyStoresData.length === 0) return [];
        const all = [];
        nearbyStoresData.forEach(({ products: prods }) => {
            if (Array.isArray(prods)) {
                prods.forEach(p => all.push(p));
            }
        });
        return all;
    }, [nearbyStoresData]);

    // Decide which products to use for the page
    const activeProducts = storeProducts.length > 0 ? storeProducts : products;

    // Derive categories and brands from products
    const allCategories = useMemo(() => {
        const cats = new Set();
        activeProducts.forEach(p => { if (p.category) cats.add(p.category); });
        return Array.from(cats).sort();
    }, [activeProducts]);

    const allBrands = useMemo(() => {
        const brs = new Set();
        activeProducts.forEach(p => { if (p.brand) brs.add(p.brand); });
        return Array.from(brs).sort();
    }, [activeProducts]);

    // Apply filters
    const filteredProducts = useMemo(() => {
        let result = [...activeProducts];

        // Apply Special Filters (Bulk, Offers, Deals)
        if (specialFilter === 'offers') {
            const offerCategories = offers
                .filter(o => o.applicableTo === 'category')
                .map(o => o.applicableCategory?.toLowerCase());
            const hasAllOffer = offers.some(o => o.applicableTo === 'all');
            
            result = result.filter(p => 
                hasAllOffer || (p.category && offerCategories.includes(p.category.toLowerCase()))
            );
        } else if (specialFilter === 'bulk') {
            // "Bulk" logic: high stock or variant name containing KG/Bulk
            result = result.filter(p => 
                (p.variant && (p.variant.toLowerCase().includes('kg') || p.variant.toLowerCase().includes('bulk'))) ||
                p.stockQty > 50
            );
        } else if (specialFilter === 'deals') {
            // "Deals" logic: price drops (could use oldPrice check if it existed)
            // For now, let's just use the same as home deals (matched offers)
            const offerCategories = offers
                .filter(o => o.applicableTo === 'category')
                .map(o => o.applicableCategory?.toLowerCase());
            result = result.filter(p => 
                offers.some(o => o.applicableTo === 'all') || 
                (p.category && offerCategories.includes(p.category.toLowerCase()))
            );
        }

        // Apply Search Filters
        if (filters.category) result = result.filter(p => p.category === filters.category);
        if (filters.brand) result = result.filter(p => p.brand === filters.brand);
        if (filters.inStock) result = result.filter(p => (p.stockQty || 0) > 0);
        if (filters.priceRange) {
            const PRICE_MAP = {
                'Under ₹100': { min: 0, max: 100 },
                '₹100 - ₹500': { min: 100, max: 500 },
                '₹500 - ₹1000': { min: 500, max: 1000 },
                'Above ₹1000': { min: 1000, max: Infinity },
            };
            const range = PRICE_MAP[filters.priceRange];
            if (range) result = result.filter(p => (p.sellingPrice || 0) >= range.min && (p.sellingPrice || 0) < range.max);
        }
        if (filters.sort) {
            switch (filters.sort) {
                case 'Price: Low to High':
                    result.sort((a, b) => (a.sellingPrice || 0) - (b.sellingPrice || 0));
                    break;
                case 'Price: High to Low':
                    result.sort((a, b) => (b.sellingPrice || 0) - (a.sellingPrice || 0));
                    break;
                case 'Name: A-Z':
                    result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                    break;
                case 'Name: Z-A':
                    result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
                    break;
                case 'Newest':
                    result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                    break;
            }
        }
        return result.map(p => {
            const matchedOffer = offers.find(o => 
                o.applicableTo === 'all' || 
                (o.applicableTo === 'category' && o.applicableCategory && p.category && o.applicableCategory.toLowerCase() === p.category.toLowerCase()) ||
                (o.applicableTo === 'product' && o.applicableProduct && p._id === o.applicableProduct)
            );
            if (matchedOffer) {
                return {
                    ...p,
                    offerType: matchedOffer.type,
                    offerValue: matchedOffer.discountValue,
                    oldPrice: matchedOffer.type === 'percentage' 
                        ? Math.round(p.sellingPrice / (1 - matchedOffer.discountValue / 100))
                        : (matchedOffer.type === 'flat' ? p.sellingPrice + matchedOffer.discountValue : null)
                };
            }
            return p;
        });
    }, [activeProducts, filters, offers]);

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

    // Compute DEALS products based on offers
    const dealProducts = useMemo(() => {
        if (!offers || offers.length === 0) return [];
        return activeProducts.filter(p => {
            return offers.some(o => 
                o.applicableTo === 'all' || 
                (o.applicableTo === 'category' && o.applicableCategory && p.category && o.applicableCategory.toLowerCase() === p.category.toLowerCase()) ||
                (o.applicableTo === 'product' && o.applicableProduct && p._id === o.applicableProduct)
            );
        }).slice(0, 15).map(p => {
            const matchedOffer = offers.find(o => 
                o.applicableTo === 'all' || 
                (o.applicableTo === 'category' && o.applicableCategory && p.category && o.applicableCategory.toLowerCase() === p.category.toLowerCase()) ||
                (o.applicableTo === 'product' && o.applicableProduct && p._id === o.applicableProduct)
            );
            return {
                ...p,
                badge: "OFFER APPLIED",
                famPromo: "Deal Available",
                offerType: matchedOffer?.type,
                offerValue: matchedOffer?.discountValue,
                oldPrice: matchedOffer?.type === 'percentage' 
                    ? Math.round(p.sellingPrice / (1 - (matchedOffer?.discountValue || 0) / 100))
                    : (matchedOffer?.type === 'flat' ? p.sellingPrice + (matchedOffer?.discountValue || 0) : null)
            };
        });
    }, [activeProducts, offers]);

    // Static categorizations for fallback (when no pincode)
    const trendingProducts = activeProducts.slice(0, 10).map(p => {
        const matchedOffer = offers.find(o => 
            o.applicableTo === 'all' || 
            (o.applicableTo === 'category' && o.applicableCategory && p.category && o.applicableCategory.toLowerCase() === p.category.toLowerCase()) ||
            (o.applicableTo === 'product' && o.applicableProduct && p._id === o.applicableProduct)
        );
        return {
            ...p,
            badge: matchedOffer ? "OFFER" : (Math.random() > 0.7 ? "NEW" : null),
            famPromo: matchedOffer ? "Deal Available" : (Math.random() > 0.8 ? "$4.19 Member Price" : null),
            offerType: matchedOffer?.type,
            offerValue: matchedOffer?.discountValue,
            oldPrice: matchedOffer?.type === 'percentage' 
                ? Math.round(p.sellingPrice / (1 - (matchedOffer?.discountValue || 0) / 100))
                : (matchedOffer?.type === 'flat' ? p.sellingPrice + (matchedOffer?.discountValue || 0) : p.oldPrice || null)
        };
    });

    const priceDrops = activeProducts.filter(p => (p.sellingPrice < (p.purchasePrice || p.sellingPrice) * 1.5) || (p.name || '').length % 2 === 0).slice(0, 10).map(p => ({
        ...p,
        badge: "NEW LOWER PRICE",
        oldPrice: Math.round(p.sellingPrice * 1.25),
        stockWarning: Math.random() > 0.8 ? "ONLY 2 LEFT" : null
    }));

    const handleClearLocation = () => {
        localStorage.removeItem('customer_pincode');
        localStorage.removeItem('customer_store_name');
        localStorage.removeItem('customer_store_id');
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
                <FilterBar
                    categories={allCategories}
                    brands={allBrands}
                    activeFilters={filters}
                    onFilterChange={setFilters}
                />
                <div className="max-w-[1440px] mx-auto px-4 py-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="font-extrabold italic text-4xl tracking-tighter uppercase text-black">
                                {filters.category || filters.brand || 'ALL PRODUCTS'}.
                            </h1>
                            <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-wider">
                                {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''}
                                {filters.inStock && ' · In Stock Only'}
                            </p>
                        </div>
                        <button
                            onClick={() => setView('home')}
                            className="bg-black text-white px-6 py-3 rounded-full font-black text-xs hover:bg-gray-800 transition-colors uppercase tracking-widest"
                        >
                            BACK HOME
                        </button>
                    </div>
                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <p className="font-black text-lg uppercase tracking-wider">No products found</p>
                            <p className="text-sm mt-2">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-y-10 gap-x-6">
                            {filteredProducts.map(product => (
                                <div key={product._id} onClick={() => trackProductView(product._id, product.name)}>
                                    <GopuffProductCard product={product} />
                                </div>
                            ))}
                        </div>
                    )}
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
                                        {(() => {
                                            const groups = {};
                                            nearbyStoresData.forEach(s => {
                                                const company = s.store.companyName || '';
                                                if (!groups[company]) groups[company] = [];
                                                const info = s.store.distance != null ? `${s.store.name} (${s.store.distance}km)` : s.store.name;
                                                groups[company].push(info);
                                            });
                                            return Object.entries(groups).map(([company, storeNames]) =>
                                                company ? `${company} — ${storeNames.join(', ')}` : storeNames.join(', ')
                                            ).join(' · ');
                                        })()}
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

            <GopuffCategoryRow onCategoryClick={handleCategoryNavigation} />
            
            {shopSettings?.heroSectionType === 'slider' ? (
                <GopuffHeroSlider onBannerClick={handleBannerNavigation} />
            ) : shopSettings?.heroSectionType === 'carousel' ? (
                <GopuffHeroCarousel onBannerClick={handleBannerNavigation} />
            ) : (
                <GopuffHeroGrid onBannerClick={handleBannerNavigation} />
            )}

            <GopuffMarquee />

            {/* When pincode is set: Show products grouped by CATEGORY as carousels */}
            {storeProducts.length > 0 ? (
                <>
                    {/* DEALS Section */}
                    {dealProducts.length > 0 && (
                        <GopuffProductCarousel
                            title="🔥 DEALS FOR YOU."
                            products={dealProducts}
                            totalItems={dealProducts.length}
                            onMoreClick={() => setView('all-products')}
                        />
                    )}

                    {/* Trending / Featured - first 10 products */}
                    <GopuffProductCarousel
                        title="TRENDING IN YOUR AREA."
                        products={trendingProducts}
                        onMoreClick={() => setView('all-products')}
                    />

                    <GopuffShopCategoriesGrid onCategoryClick={handleCategoryNavigation} />

                    {/* Dynamic Category Carousels */}
                    {Object.entries(categoryGroups).map(([category, catProducts]) => {
                        const productsWithOffers = catProducts.map(p => {
                            const matchedOffer = offers.find(o => 
                                o.applicableTo === 'all' || 
                                (o.applicableTo === 'category' && o.applicableCategory && p.category && o.applicableCategory.toLowerCase() === p.category.toLowerCase())
                            );
                            if (matchedOffer) {
                                return {
                                    ...p,
                                    offerType: matchedOffer.type,
                                    offerValue: matchedOffer.discountValue,
                                    oldPrice: matchedOffer.type === 'percentage' 
                                        ? Math.round(p.sellingPrice / (1 - matchedOffer.discountValue / 100))
                                        : (matchedOffer.type === 'flat' ? p.sellingPrice + matchedOffer.discountValue : null)
                                };
                            }
                            return p;
                        });
                        return (
                            <GopuffProductCarousel
                                key={category}
                                title={`${category.toUpperCase()}.`}
                                products={productsWithOffers.slice(0, 15)}
                                totalItems={catProducts.length}
                                onMoreClick={() => handleCategoryNavigation(category)}
                            />
                        );
                    })}

                    {priceDrops.length > 0 && (
                        <GopuffProductCarousel
                            title="PRICE DROPS."
                            products={priceDrops}
                            totalItems={priceDrops.length}
                            onMoreClick={() => handleCategoryNavigation('price drops')}
                        />
                    )}
                </>
            ) : (
                <>
                    {/* DEALS Section */}
                    {dealProducts.length > 0 && (
                        <GopuffProductCarousel
                            title="🔥 DEALS FOR YOU."
                            products={dealProducts}
                            totalItems={dealProducts.length}
                            onMoreClick={() => handleCategoryNavigation('deals')}
                        />
                    )}

                    {/* Default view - no pincode */}
                    <GopuffProductCarousel
                        title="TRENDING IN ATLANTA."
                        products={trendingProducts}
                        onMoreClick={() => setView('all-products')}
                    />

                    <GopuffShopCategoriesGrid onCategoryClick={(cat) => { setFilters({ ...filters, category: cat }); setView('all-products'); }} />

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
                                onMoreClick={() => { setFilters({ ...filters, category }); setView('all-products'); }}
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
