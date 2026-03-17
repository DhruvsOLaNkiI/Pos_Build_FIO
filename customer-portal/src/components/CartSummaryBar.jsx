import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

const CartSummaryBar = () => {
    const { totalItems, subtotal } = useCart();
    const navigate = useNavigate();

    return (
        <AnimatePresence>
            {totalItems > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="fixed bottom-[80px] left-0 right-0 z-40 px-4 max-w-md mx-auto md:hidden"
                >
                    <div
                        className="bg-primary text-primary-foreground rounded-2xl p-3 flex items-center justify-between shadow-xl cursor-pointer active:scale-95 transition-transform"
                        onClick={() => navigate('/cart')}
                    >
                        <div className="flex flex-col">
                            <span className="font-bold flex items-center gap-1.5 text-sm">
                                <ShoppingBag className="w-4 h-4" />
                                {totalItems} {totalItems === 1 ? 'item' : 'items'}
                            </span>
                            <span className="text-xs opacity-90 font-medium">
                                Total {formatCurrency(subtotal)} plus taxes
                            </span>
                        </div>
                        <div className="flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-xl font-bold text-sm">
                            View Cart
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CartSummaryBar;
