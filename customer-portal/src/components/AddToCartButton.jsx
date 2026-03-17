import { useCart } from '../context/CartContext';
import { useCustomerActivityTracking } from '../hooks/useCustomerActivityTracking';
import { Plus, Minus } from 'lucide-react';

const AddToCartButton = ({ product }) => {
    const { getQuantity, addToCart, updateQuantity } = useCart();
    const { trackAddToCart } = useCustomerActivityTracking();
    const quantity = getQuantity(product._id);

    if (quantity === 0) {
        return (
            <button
                onClick={() => {
                    addToCart(product);
                    trackAddToCart(product._id, product.name);
                }}
                className="bg-primary/10 text-primary font-bold px-4 py-1.5 rounded-lg text-sm transition-colors hover:bg-primary hover:text-primary-foreground active:scale-95"
            >
                ADD
            </button>
        );
    }

    return (
        <div className="flex items-center bg-primary text-primary-foreground rounded-lg h-8 overflow-hidden shadow-sm">
            <button
                className="px-2.5 h-full flex items-center justify-center hover:bg-black/10 transition-colors"
                onClick={() => updateQuantity(product._id, -1)}
            >
                <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-sm w-6 text-center">{quantity}</span>
            <button
                className="px-2.5 h-full flex items-center justify-center hover:bg-black/10 transition-colors"
                onClick={() => updateQuantity(product._id, 1)}
            >
                <Plus className="w-3.5 h-3.5" />
            </button>
        </div>
    );
};

export default AddToCartButton;
