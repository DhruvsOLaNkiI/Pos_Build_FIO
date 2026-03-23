import { Plus, Minus, Store as StoreIcon } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

const GopuffProductCard = ({ product, className = "" }) => {
  const { addToCart, removeFromCart, cart } = useCart();
  
  // Find quantity in cart
  const cartItem = cart.find(item => item._id === product._id);
  const quantity = cartItem ? cartItem.quantity : 0;

  // Handle image path
  const imageUrl = product.imageUrls && product.imageUrls[0] 
    ? `http://localhost:5001${product.imageUrls[0]}`
    : (product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop');

  const price = product.sellingPrice || product.price || 0;

  return (
    <Link to={`/product/${product._id}`} className={`flex flex-col gap-2 group cursor-pointer h-full ${className}`}>
      <div className="relative bg-[#f8f9fa] rounded-xl p-4 aspect-square flex items-center justify-center border border-gray-100 group-hover:border-gray-200 transition-colors mb-2">
        {product.badge && (
          <div className="absolute top-2 left-2 text-[9px] font-black px-1.5 py-0.5 rounded-sm z-10 uppercase tracking-tighter bg-purple-100 text-purple-800">
            {product.badge}
          </div>
        )}
        {product.iconBadge === 'COLD' && (
          <div className="absolute top-2 left-2 bg-blue-100 text-blue-800 text-[9px] font-black px-1.5 py-0.5 rounded-sm z-10 flex items-center gap-1 uppercase tracking-tighter">
            ❄️ COLD
          </div>
        )}
        
        <img src={imageUrl} alt={product.name} className="w-3/4 h-3/4 object-contain group-hover:scale-110 transition-transform duration-300 mix-blend-multiply" />
        
        {/* Quantity Controls Overlay */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20">
          {quantity === 0 ? (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product);
              }}
              className="bg-white rounded-full p-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:bg-gray-50 transition-colors border border-gray-100"
            >
              <Plus className="w-5 h-5 text-blue-600 stroke-[3px]" />
            </button>
          ) : (
            <div 
              className="flex items-center justify-between bg-white rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-gray-100 px-1 py-1 w-[100px]" 
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => removeFromCart(product._id)} 
                className="p-1.5 hover:bg-gray-50 rounded-full transition-colors text-gray-500 hover:text-red-500"
              >
                <Minus className="w-5 h-5 stroke-[3px]" />
              </button>
              <span className="font-black text-[#0052FF] text-xl italic leading-none">{quantity}</span>
              <button 
                onClick={() => addToCart(product)} 
                className="p-1.5 hover:bg-gray-50 rounded-full transition-colors text-[#0052FF]"
              >
                <Plus className="w-5 h-5 stroke-[3px]" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 flex-1 px-1 mt-2">
        <h3 className="text-[11px] font-bold leading-tight line-clamp-2 min-h-[30px] text-gray-900 uppercase tracking-tight">{product.name}</h3>
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-sm text-black">₹{price.toLocaleString()}</span>
          {product.oldPrice && (
            <span className="text-gray-400 text-[10px] line-through font-bold italic">₹{product.oldPrice.toLocaleString()}</span>
          )}
        </div>
        <div className="flex flex-col gap-1 mt-auto">
          {product.storeName && (
            <div className="flex items-center gap-1 text-blue-600 text-[9px] font-black uppercase tracking-tighter">
              <StoreIcon className="w-3 h-3" />
              {product.storeName}
            </div>
          )}
          {product.promo && (
            <div className="bg-green-100 text-green-800 text-[9px] font-black px-1.5 py-0.5 rounded w-fit uppercase tracking-tighter italic">
              {product.promo}
            </div>
          )}
          {product.offerType === 'percentage' && (
            <div className="bg-red-100 text-red-700 text-[9px] font-black px-1.5 py-0.5 rounded w-fit uppercase tracking-tighter italic mt-1">
              {product.offerValue}% OFF
            </div>
          )}
          {product.offerType === 'flat' && (
            <div className="bg-red-100 text-red-700 text-[9px] font-black px-1.5 py-0.5 rounded w-fit uppercase tracking-tighter italic mt-1">
              FLAT ₹{product.offerValue} OFF
            </div>
          )}
          {product.famPromo && (
            <div className="text-[#2463EB] text-[9px] font-black w-fit flex items-center gap-1 uppercase tracking-tighter italic">
              <span className="bg-[#2463EB] text-white px-1 rounded-sm text-[8px] not-italic mr-0.5">FAM</span> {product.famPromo}
            </div>
          )}
          {product.stockWarning && (
            <div className="text-red-500 text-[9px] font-black uppercase tracking-tighter italic">
              {product.stockWarning}
            </div>
          )}
          <div className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mt-1 opacity-60">
            {product.size || (product.unit ? product.unit.shortName : 'unit')}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GopuffProductCard;
