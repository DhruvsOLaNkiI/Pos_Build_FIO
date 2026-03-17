import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    // Initialize from local storage if available
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('__fio_customer_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // Save to local storage whenever cart changes
    useEffect(() => {
        localStorage.setItem('__fio_customer_cart', JSON.stringify(cart));
    }, [cart]);

    // Calculate totals
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const addToCart = (product) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find(item => item.product._id === product._id);
            if (existingItem) {
                // Increment quantity
                return prevCart.map(item =>
                    item.product._id === product._id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                // Add new item
                return [...prevCart, { product, quantity: 1, price: product.sellingPrice }];
            }
        });
    };

    const updateQuantity = (productId, delta) => {
        setCart((prevCart) => {
            return prevCart.map(item => {
                if (item.product._id === productId) {
                    const newQuantity = Math.max(0, item.quantity + delta);
                    return { ...item, quantity: newQuantity };
                }
                return item;
            }).filter(item => item.quantity > 0); // Automatically remove items with 0 quantity
        });
    };

    const removeFromCart = (productId) => {
        setCart((prevCart) => prevCart.filter(item => item.product._id !== productId));
    };

    const clearCart = () => {
        setCart([]);
    };

    const getQuantity = (productId) => {
        const item = cart.find(item => item.product._id === productId);
        return item ? item.quantity : 0;
    };

    return (
        <CartContext.Provider value={{
            cart,
            totalItems,
            subtotal,
            addToCart,
            updateQuantity,
            removeFromCart,
            clearCart,
            getQuantity
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
