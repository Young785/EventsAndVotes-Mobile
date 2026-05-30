import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CartItem {
    id: string;
    nominee_id: string;
    quantity: number;
    vote_title?: string;
    position_title?: string;
    nominee_name?: string;
    amount?: number;
    vote_id?: string;
    level?: string;
    // Legacy support
    name?: string;
    nick_name?: string;
    position?: string;
    price?: number;
}

const CART_STORAGE_KEY = 'eventsandvotes_cart';

export const useCart = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const queryClient = useQueryClient();

    // Load cart from localStorage on mount
    useEffect(() => {
        const loadCartFromStorage = () => {
            try {
                const savedCart = localStorage.getItem(CART_STORAGE_KEY);
                if (savedCart) {
                    const parsedCart = JSON.parse(savedCart);
                    setCartItems(parsedCart);
                } else {
                    setCartItems([]);
                }
            } catch (error) {
                console.error('Error loading cart from localStorage:', error);
                localStorage.removeItem(CART_STORAGE_KEY);
            }
        };

        // Initial load
        loadCartFromStorage();

        // Listen for custom event within the same tab
        window.addEventListener('cartUpdated', loadCartFromStorage);
        // Listen for storage changes from other tabs/windows
        window.addEventListener('storage', (e) => {
            if (e.key === CART_STORAGE_KEY) {
                loadCartFromStorage();
            }
        });

        return () => {
            window.removeEventListener('cartUpdated', loadCartFromStorage);
        };
    }, []);

    // Save cart to localStorage whenever it changes
    const saveCart = (items: CartItem[]) => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
            setCartItems(items);
            // Invalidate cart queries to update UI
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            // Notify other components/hooks in this tab
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (error) {
            console.error('Error saving cart to localStorage:', error);
        }
    };

    const addToCart = (nominee_id: string, quantity: number = 1, itemDetails?: Partial<CartItem>) => {
        const existingItemIndex = cartItems.findIndex(item => item.nominee_id === nominee_id);

        if (existingItemIndex >= 0) {
            // Update existing item quantity
            const updatedItems = [...cartItems];
            updatedItems[existingItemIndex].quantity += quantity;
            saveCart(updatedItems);
        } else {
            // Add new item with proper structure
            const newItem: CartItem = {
                id: nominee_id, // For compatibility
                nominee_id,
                quantity,
                vote_title: itemDetails?.vote_title || itemDetails?.name || 'Vote',
                position_title: itemDetails?.position_title || itemDetails?.position || 'Position',
                nominee_name: itemDetails?.nominee_name || itemDetails?.nick_name || 'Nominee',
                amount: itemDetails?.amount || itemDetails?.price || 0,
                vote_id: itemDetails?.vote_id || '',
                level: itemDetails?.level || '',
                ...itemDetails
            };
            saveCart([...cartItems, newItem]);
        }
    };

    const removeFromCart = (nominee_id: string) => {
        const updatedItems = cartItems.filter(item => item.nominee_id !== nominee_id);
        saveCart(updatedItems);
    };

    const updateQuantity = (nominee_id: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(nominee_id);
            return;
        }

        const updatedItems = cartItems.map(item =>
            item.nominee_id === nominee_id ? { ...item, quantity } : item
        );
        saveCart(updatedItems);
    };

    const clearCart = () => {
        saveCart([]);
        localStorage.removeItem(CART_STORAGE_KEY);
        // Notify listeners that cart is now empty
        window.dispatchEvent(new Event('cartUpdated'));
    };

    const getCartCount = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    };

    const getTotalAmount = () => {
        return cartItems.reduce((total, item) => {
            const price = item.amount || item.price || 0;
            return total + price * item.quantity;
        }, 0);
    };

    const isInCart = (nominee_id: string) => {
        return cartItems.some(item => item.nominee_id === nominee_id);
    };

    const getItemQuantity = (nominee_id: string) => {
        const item = cartItems.find(item => item.nominee_id === nominee_id);
        return item?.quantity || 0;
    };

    return {
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartCount,
        getTotalAmount,
        isInCart,
        getItemQuantity,
        cartCount: getCartCount(),
        totalAmount: getTotalAmount()
    };
}; 