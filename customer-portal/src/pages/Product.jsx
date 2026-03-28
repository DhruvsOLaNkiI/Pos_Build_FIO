import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCustomerActivityTracking } from '../hooks/useCustomerActivityTracking';
import API from '../services/api';
import {
    Loader2, ArrowLeft, Plus, Minus, Store as StoreIcon,
    MapPin, Tag, Package, Building2, Shield, Calendar, ChevronRight,
    AlertTriangle, CheckCircle, X, ShoppingCart, Star, MessageSquare
} from 'lucide-react';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop';

const Product = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, removeFromCart, cart, getQuantity } = useCart();
    const { trackProductView } = useCustomerActivityTracking();

    const [product, setProduct] = useState(null);
    const [variants, setVariants] = useState([]);
    const [matchedOffer, setMatchedOffer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [imgError, setImgError] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const quantity = product ? getQuantity(product._id) : 0;

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError('');
                setImgError(false);
                setSelectedImageIndex(0);
                const [productRes, offersRes, reviewsRes] = await Promise.all([
                    API.get(`/products/${id}`),
                    API.get('/offers'),
                    API.get(`/products/${id}/reviews`)
                ]);
                if (productRes.data.success) {
                    const prod = productRes.data.product || productRes.data.data.product;
                    const vars = productRes.data.data?.variants || [];
                    setProduct(prod);
                    setVariants(vars);

                    // Find matching offer
                    if (offersRes.data?.success) {
                        const offers = offersRes.data.data || [];
                        const offer = offers.find(o =>
                            o.applicableTo === 'all' ||
                            (o.applicableTo === 'category' && o.applicableCategory && prod.category &&
                                o.applicableCategory.toLowerCase() === prod.category.toLowerCase()) ||
                            (o.applicableTo === 'product' && o.applicableProduct && prod._id === o.applicableProduct)
                        );
                        setMatchedOffer(offer || null);
                    }
                    if (reviewsRes.data?.success) {
                        setReviews(reviewsRes.data.data);
                    }
                } else {
                    setError('Product not found');
                }
            } catch (err) {
                console.error('Failed to fetch product', err);
                setError(err.response?.data?.message || 'Failed to load product');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchProduct();
    }, [id]);

    const handleAddToCart = () => { 
        if (product) {
            const productWithOffer = {
                ...product,
                offerType: matchedOffer?.type,
                offerValue: matchedOffer?.discountValue
            };
            addToCart(productWithOffer); 
        }
    };
    const handleRemoveFromCart = () => { if (product) removeFromCart(product._id); };

    const getImages = () => {
        if (!product) return [FALLBACK_IMG];
        if (product.imageUrls && product.imageUrls.length > 0) {
            return product.imageUrls.map(img => img.startsWith('http') ? img : `http://localhost:5001${img}`);
        }
        if (product.imageUrl) {
            return [product.imageUrl.startsWith('http') ? product.imageUrl : `http://localhost:5001${product.imageUrl}`];
        }
        return [FALLBACK_IMG];
    };

    const images = getImages();
    const originalPrice = product?.sellingPrice || 0;

    // Compute discounted price based on matched offer
    let discountedPrice = originalPrice;
    let discountLabel = null;
    let savingsAmount = 0;
    if (matchedOffer) {
        if (matchedOffer.type === 'percentage') {
            savingsAmount = Math.round(originalPrice * matchedOffer.discountValue / 100);
            if (matchedOffer.maxDiscountAmount) savingsAmount = Math.min(savingsAmount, matchedOffer.maxDiscountAmount);
            discountedPrice = originalPrice - savingsAmount;
            discountLabel = `${matchedOffer.discountValue}% OFF`;
        } else if (matchedOffer.type === 'flat') {
            savingsAmount = matchedOffer.discountValue;
            discountedPrice = Math.max(0, originalPrice - savingsAmount);
            discountLabel = `FLAT ₹${savingsAmount} OFF`;
        }
    }

    const price = discountedPrice;
    const stockQty = product?.stockQty ?? 0;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-6" />
                <p className="text-gray-400 font-black uppercase tracking-[0.2em] italic text-sm">LOADING PRODUCT...</p>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="flex flex-col items-center justify-center py-40">
                <Package className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 font-black uppercase tracking-wider text-lg">{error || 'PRODUCT NOT FOUND'}</p>
                <button onClick={() => navigate('/')} className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all">
                    GO HOME
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white animate-fade-in pb-32">
            {/* Back Button */}
            <div className="max-w-[1440px] mx-auto px-4 py-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-500 hover:text-black font-black text-xs uppercase tracking-widest transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> BACK
                </button>
            </div>

            <div className="max-w-[1440px] mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Left: Images */}
                    <div>
                        <div className="bg-[#f8f9fa] rounded-2xl p-8 flex items-center justify-center aspect-square border border-gray-100 overflow-hidden">
                            <img
                                src={imgError ? FALLBACK_IMG : images[selectedImageIndex]}
                                alt={product.name}
                                className="max-w-full max-h-full object-contain mix-blend-multiply"
                                onError={() => setImgError(true)}
                            />
                        </div>
                        {images.length > 1 && (
                            <div className="flex gap-3 mt-4 overflow-x-auto hide-scrollbar">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => { setSelectedImageIndex(idx); setImgError(false); }}
                                        className={`w-16 h-16 rounded-lg border-2 flex-shrink-0 overflow-hidden transition-colors ${idx === selectedImageIndex ? 'border-blue-600' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-contain p-1" onError={(e) => { e.target.src = FALLBACK_IMG; }} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Details */}
                    <div className="flex flex-col gap-6">
                        {/* Category & Brand & Type */}
                        <div className="flex items-center gap-3 flex-wrap">
                            {product.category && (
                                <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">{product.category}</span>
                            )}
                            {product.brand && (
                                <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">{product.brand}</span>
                            )}
                            {product.productType && (
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${product.productType === 'Variable' ? 'bg-purple-50 text-purple-700' : 'bg-green-50 text-green-700'}`}>
                                    {product.productType}
                                </span>
                            )}
                        </div>

                        {/* Name */}
                        <h1 className="font-extrabold italic text-3xl md:text-4xl tracking-tighter uppercase text-black leading-tight">
                            {product.name}
                        </h1>

                        {/* Rating Summary */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-4 h-4 ${star <= Math.round(product.averageRating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                                    />
                                ))}
                            </div>
                            <span className="text-sm font-black italic tracking-widest text-gray-400">
                                {product.averageRating || 0} / 5 ({product.totalReviews || 0} REVIEWS)
                            </span>
                        </div>

                        {/* Variant Info */}
                        {product.variant && (
                            <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4 text-gray-600" />
                                <span className="text-sm font-bold text-gray-800 uppercase">{product.variant}</span>
                            </div>
                        )}

                        {/* Offer Badge */}
                        {matchedOffer && discountLabel && (
                            <div className="flex items-center gap-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl px-4 py-3">
                                <div className="text-2xl">🔥</div>
                                <div>
                                    <p className="font-black text-base uppercase tracking-tight">{discountLabel}</p>
                                    <p className="text-xs opacity-80 font-bold">{matchedOffer.name || 'Limited Time Offer'}</p>
                                </div>
                                <div className="ml-auto text-right">
                                    <p className="text-xs opacity-80 font-bold">YOU SAVE</p>
                                    <p className="font-black text-lg">₹{savingsAmount.toLocaleString()}</p>
                                </div>
                            </div>
                        )}

                        {/* Price */}
                        <div className="flex items-baseline gap-3 flex-wrap">
                            <span className="font-extrabold text-4xl text-black">₹{price.toLocaleString()}</span>
                            {matchedOffer && savingsAmount > 0 && (
                                <span className="text-gray-400 text-2xl font-bold line-through">₹{originalPrice.toLocaleString()}</span>
                            )}
                        </div>

                        {/* Stock Status */}
                        <div className="flex items-center gap-2">
                            {stockQty > 10 ? (
                                <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                                    <CheckCircle className="w-3.5 h-3.5" /> IN STOCK ({stockQty} available)
                                </span>
                            ) : stockQty > 0 ? (
                                <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                                    <AlertTriangle className="w-3.5 h-3.5" /> ONLY {stockQty} LEFT
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 bg-red-50 text-red-700 text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                                    <X className="w-3.5 h-3.5" /> OUT OF STOCK
                                </span>
                            )}
                        </div>

                        {/* Store Info */}
                        {product.storeName && (
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
                                <div className="bg-blue-600 rounded-full p-2">
                                    <StoreIcon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-black text-sm text-blue-900 uppercase">{product.storeName}</p>
                                        {product.companyName && (
                                            <span className="text-[9px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full font-black uppercase">{product.companyName}</span>
                                        )}
                                    </div>
                                    {product.storeInfo?.address && (
                                        <p className="text-xs text-blue-600 font-bold flex items-center gap-1 mt-0.5">
                                            <MapPin className="w-3 h-3" /> {product.storeInfo.address}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Variant Selector */}
                        {variants.length > 0 && (
                            <div>
                                <h3 className="font-black text-xs uppercase tracking-widest text-gray-600 mb-3">SELECT VARIANT</h3>
                                <div className="flex flex-wrap gap-2">
                                    {variants.map(v => (
                                        <Link
                                            key={v._id}
                                            to={`/product/${v._id}`}
                                            className={`border-2 rounded-xl px-4 py-2 text-sm font-bold uppercase transition-all hover:border-blue-400 ${v._id === product._id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-800'}`}
                                        >
                                            {v.variant || v.name}
                                            <span className="block text-[10px] font-black text-gray-600 mt-0.5">₹{v.sellingPrice?.toLocaleString()}</span>
                                        </Link>
                                    ))}
                                    {product.variant && (
                                        <div className="border-2 border-blue-600 bg-blue-50 text-blue-700 rounded-xl px-4 py-2 text-sm font-bold uppercase">
                                            {product.variant}
                                            <span className="block text-[10px] font-black text-blue-400 mt-0.5">₹{price.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Add to Cart */}
                        <div className="mt-2">
                            {stockQty <= 0 ? (
                                <button disabled className="w-full bg-gray-300 text-gray-500 font-black uppercase tracking-widest py-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
                                    OUT OF STOCK
                                </button>
                            ) : quantity === 0 ? (
                                <button onClick={handleAddToCart} className="w-full bg-blue-600 text-white font-black uppercase tracking-widest py-4 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                    <ShoppingCart className="w-5 h-5" /> ADD TO CART — ₹{price.toLocaleString()}
                                    {matchedOffer && savingsAmount > 0 && (
                                        <span className="text-xs line-through opacity-60 ml-1">₹{originalPrice.toLocaleString()}</span>
                                    )}
                                </button>
                            ) : (
                                <div className="flex items-center justify-between bg-blue-600 rounded-xl py-3 px-6">
                                    <button onClick={handleRemoveFromCart} className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors">
                                        <Minus className="w-5 h-5 text-white stroke-[3px]" />
                                    </button>
                                    <span className="font-black text-white text-2xl italic">{quantity}</span>
                                    <button onClick={handleAddToCart} className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors">
                                        <Plus className="w-5 h-5 text-white stroke-[3px]" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {product.description && (
                            <div className="border-t border-gray-100 pt-6 mt-2">
                                <h3 className="font-black text-xs uppercase tracking-widest text-gray-600 mb-3">DESCRIPTION</h3>
                                <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">
                                    {product.description}
                                </p>
                            </div>
                        )}

                        {/* Product Details */}
                        <div className="border-t border-gray-100 pt-6 mt-2">
                            <h3 className="font-black text-xs uppercase tracking-widest text-gray-600 mb-4">PRODUCT DETAILS</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {product.manufacturer && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Building2 className="w-4 h-4 text-gray-600" />
                                        <div><p className="text-[10px] text-gray-500 font-bold uppercase">Manufacturer</p><p className="font-bold text-gray-900">{product.manufacturer}</p></div>
                                    </div>
                                )}
                                {product.warranty && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Shield className="w-4 h-4 text-gray-600" />
                                        <div><p className="text-[10px] text-gray-500 font-bold uppercase">Warranty</p><p className="font-bold text-gray-900">{product.warranty}</p></div>
                                    </div>
                                )}
                                {product.expiryDate && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="w-4 h-4 text-gray-600" />
                                        <div><p className="text-[10px] text-gray-500 font-bold uppercase">Expiry</p><p className="font-bold text-gray-900">{new Date(product.expiryDate).toLocaleDateString()}</p></div>
                                    </div>
                                )}
                                {product.unit && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Package className="w-4 h-4 text-gray-600" />
                                        <div><p className="text-[10px] text-gray-500 font-bold uppercase">Unit</p><p className="font-bold text-gray-900">{product.unit?.name || product.unit?.shortName || ''}</p></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Variants from other stores */}
                        {variants.filter(v => v.storeName && v.storeName !== product.storeName).length > 0 && (
                            <div className="border-t border-gray-100 pt-6">
                                <h3 className="font-black text-xs uppercase tracking-widest text-gray-600 mb-4">ALSO AVAILABLE AT</h3>
                                <div className="space-y-2">
                                    {variants.filter(v => v.storeName && v.storeName !== product.storeName).map(v => (
                                        <Link key={v._id} to={`/product/${v._id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <StoreIcon className="w-4 h-4 text-blue-600" />
                                                <div>
                                                    <p className="font-bold text-sm text-gray-900">{v.storeName}</p>
                                                    <p className="text-[10px] text-gray-600 font-bold uppercase">{v.variant || v.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-extrabold text-sm text-gray-900">₹{v.sellingPrice?.toLocaleString()}</span>
                                                <ChevronRight className="w-4 h-4 text-gray-600" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reviews Section */}
                        <div className="border-t border-gray-100 pt-6 mt-2">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-black text-xs uppercase tracking-widest text-gray-600">CUSTOMER REVIEWS</h3>
                                <button
                                    onClick={() => setIsReviewOpen(!isReviewOpen)}
                                    className="text-blue-600 font-extrabold text-[10px] uppercase tracking-widest hover:underline"
                                >
                                    {isReviewOpen ? 'CANCEL' : 'WRITE A REVIEW'}
                                </button>
                            </div>

                            {isReviewOpen && (
                                <div className="bg-gray-50 rounded-2xl p-6 mb-8 animate-in fade-in slide-in-from-top-4">
                                    <h4 className="font-black text-sm uppercase mb-4 tracking-tighter italic">Share your experience</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Rating</p>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <button
                                                        key={s}
                                                        onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                                                        className="transition-transform active:scale-90"
                                                    >
                                                        <Star className={`w-6 h-6 ${s <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Comment</p>
                                            <textarea
                                                className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                                placeholder="What did you like or dislike? How was the quality?"
                                                value={reviewForm.comment}
                                                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                            />
                                        </div>
                                        <button
                                            disabled={isSubmittingReview}
                                            onClick={async () => {
                                                setIsSubmittingReview(true);
                                                try {
                                                    const res = await API.post(`/products/${product._id}/reviews`, reviewForm);
                                                    if (res.data.success) {
                                                        const reviewsRes = await API.get(`/products/${product._id}/reviews`);
                                                        setReviews(reviewsRes.data.data);
                                                        setIsReviewOpen(false);
                                                        setReviewForm({ rating: 5, comment: '' });
                                                        // Update product stats locally
                                                        const { data: updatedProductRes } = await API.get(`/products/${product._id}`);
                                                        setProduct(updatedProductRes.product || updatedProductRes.data.product);
                                                    }
                                                } catch (err) {
                                                    alert(err.response?.data?.message || 'Failed to submit review. Are you logged in?');
                                                } finally {
                                                    setIsSubmittingReview(false);
                                                }
                                            }}
                                            className="w-full bg-black text-white font-black text-xs uppercase tracking-[0.2em] py-4 rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50"
                                        >
                                            {isSubmittingReview ? 'SUBMITTING...' : 'POST REVIEW'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {reviews.length === 0 ? (
                                <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                                    <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No reviews yet. Be the first!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.map((r) => (
                                        <div key={r._id} className="bg-[#fcfcfc] border border-gray-100 rounded-2xl p-5 shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-extrabold text-xs uppercase tracking-tight text-gray-900">{r.customer?.name}</p>
                                                    <div className="flex gap-0.5 mt-1">
                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                            <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(r.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-gray-600 text-sm leading-relaxed italic pr-4">“{r.comment}”</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Product;
