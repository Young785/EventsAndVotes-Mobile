import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ShoppingCart,
    Trash2,
    Plus,
    Minus,
    CreditCard,
    ArrowRight,
    ShoppingBag,
    AlertCircle,
    CheckCircle,
    ArrowLeft,
    User,
    Mail
} from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import paymentService, { CheckoutData } from '../services/paymentService';
import toast from 'react-hot-toast';

const CartPage: React.FC = () => {
    const [paymentMethod, setPaymentMethod] = useState('paystack');
    const [showCheckoutForm, setShowCheckoutForm] = useState(false);
    const [checkoutData, setCheckoutData] = useState<CheckoutData>({
        full_name: '',
        customer_email: '',
        cart_items: []
    });
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // Use frontend cart
    const {
        cartItems,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalAmount
    } = useCart();

    const handleRemoveItem = (nominee_id: string) => {
        removeFromCart(nominee_id);
    };

    const handleUpdateQuantity = (nominee_id: string, newQuantity: number) => {
        if (newQuantity < 1) {
            handleRemoveItem(nominee_id);
            return;
        }
        updateQuantity(nominee_id, newQuantity);
    };

    const handleQuantityInputChange = (nominee_id: string, value: string) => {
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= 1) {
            updateQuantity(nominee_id, numValue);
        } else if (value === '' || numValue === 0) {
            // Allow empty input temporarily, but don't update quantity to 0
            // User can type and we'll validate on blur
        }
    };

    const handleQuantityInputBlur = (nominee_id: string, value: string) => {
        const numValue = parseInt(value);
        if (isNaN(numValue) || numValue < 1) {
            // Reset to 1 if invalid input
            updateQuantity(nominee_id, 1);
        }
    };

    const showCheckoutFormHandler = () => {
        if (!user?.email) {
            // For guest users, show checkout form
            setShowCheckoutForm(true);
            return;
        }

        // For authenticated users, pre-fill data and proceed
        setCheckoutData({
            full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            customer_email: user.email,
            cart_items: []
        });
        setShowCheckoutForm(true);
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCheckingOut(true);

        try {
            // Prepare cart items for API
            const cartItemsForApi = cartItems.map(item => ({
                nominee_id: item.id,
                quantity: item.quantity,
                vote_id: item.vote_id || '' // Ensure vote_id is never undefined
            })).filter(item => item.vote_id); // Filter out items without vote_id

            if (cartItemsForApi.length === 0) {
                toast.error('No valid items in cart');
                setIsCheckingOut(false);
                return;
            }

            const checkoutDataWithCart = {
                ...checkoutData,
                cart_items: cartItemsForApi
            };

            await paymentService.completeCheckout(
                checkoutDataWithCart,
                (response) => {
                    // Payment successful
                    toast.success('Payment completed successfully!');
                    clearCart();
                    navigate('/votes', {
                        state: {
                            message: 'Your votes have been recorded successfully!'
                        }
                    });
                },
                (error) => {
                    // Payment failed
                    toast.error(error);
                    setIsCheckingOut(false);
                },
                () => {
                    // Payment cancelled
                    toast.error('Payment was cancelled');
                    setIsCheckingOut(false);
                }
            );
        } catch (error: any) {
            toast.error(error.message || 'Checkout failed');
            setIsCheckingOut(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleCheckout(e);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCheckoutData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-secondary-800 py-8">
                <div className="container mx-auto px-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center">
                            <Link
                                to="/votes"
                                className="flex items-center text-gray-600 hover:text-primary transition-colors mr-4"
                            >
                                <ArrowLeft className="w-5 h-5 mr-2" />
                                Continue Voting
                            </Link>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                                <ShoppingCart className="w-8 h-8 mr-3" />
                                Shopping Cart
                            </h1>
                        </div>
                    </div>

                    {/* Empty Cart */}
                    <div className="text-center py-16">
                        <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
                        <p className="text-gray-600 mb-8">
                            Looks like you haven't added any votes to your cart yet.
                        </p>
                        <Link
                            to="/votes"
                            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-300"
                        >
                            Start Voting
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-secondary-800 py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center">
                        <Link
                            to="/votes"
                            className="flex items-center text-gray-600 hover:text-primary transition-colors mr-4"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Continue Voting
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                            <ShoppingCart className="w-8 h-8 mr-3" />
                            Shopping Cart
                        </h1>
                    </div>
                    {cartItems.length > 0 && (
                        <button
                            onClick={() => clearCart()}
                            disabled={false}
                            className="text-red-600 hover:text-red-800 transition-colors"
                        >
                            Clear Cart
                        </button>
                    )}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-sm">
                            <div className="p-6 border-b border-gray-200 dark:border-secondary-700">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Cart Items ({cartItems.length})
                                </h2>
                            </div>
                            <div className="divide-y divide-gray-200">
                                {cartItems.map((item: any) => (
                                    <div key={item.id} className="p-6 flex items-center space-x-4">
                                        {/* Item Image */}
                                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                            <span className="text-white font-bold text-lg">
                                                {item.nominee_name?.charAt(0) || 'V'}
                                            </span>
                                        </div>

                                        {/* Item Details */}
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                {item.vote_title || 'Vote'}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Position: {item.position_title || 'N/A'}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Nominee: {item.nominee_name || 'N/A'}
                                            </p>
                                            <p className="text-lg font-bold text-primary">
                                                ₦{item.amount?.toLocaleString() || '0'}
                                            </p>
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleUpdateQuantity(item.nominee_id, item.quantity - 1)}
                                                disabled={false}
                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 dark:bg-secondary-800 transition-colors"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity || 1}
                                                onChange={(e) => handleQuantityInputChange(item.nominee_id, e.target.value)}
                                                onBlur={(e) => handleQuantityInputBlur(item.nominee_id, e.target.value)}
                                                className="w-16 text-center font-semibold border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary focus:border-transparent"
                                            />
                                            <button
                                                onClick={() => handleUpdateQuantity(item.nominee_id, item.quantity + 1)}
                                                disabled={false}
                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 dark:bg-secondary-800 transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            onClick={() => handleRemoveItem(item.nominee_id)}
                                            disabled={false}
                                            className="text-red-600 hover:text-red-800 transition-colors p-2"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-sm p-6 sticky top-8">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                                    <span className="font-semibold">₦{totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Processing Fee</span>
                                    <span className="font-semibold">₦0</span>
                                </div>
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex justify-between">
                                        <span className="text-lg font-semibold">Total</span>
                                        <span className="text-lg font-bold text-primary">
                                            ₦{totalAmount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {!showCheckoutForm ? (
                                <button
                                    onClick={showCheckoutFormHandler}
                                    disabled={isCheckingOut}
                                    className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-dark transition-colors duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <CreditCard className="w-5 h-5 mr-2" />
                                    Proceed to Checkout
                                </button>
                            ) : (
                                <form onSubmit={handleFormSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                type="text"
                                                id="full_name"
                                                name="full_name"
                                                value={checkoutData.full_name}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                                placeholder="Enter your full name"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700 mb-1">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                type="email"
                                                id="customer_email"
                                                name="customer_email"
                                                value={checkoutData.customer_email}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                                placeholder="Enter your email"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowCheckoutForm(false)}
                                            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isCheckingOut}
                                            className="flex-1 bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                        >
                                            {isCheckingOut ? (
                                                <LoadingSpinner />
                                            ) : (
                                                <>
                                                    Pay Now
                                                    <ArrowRight className="w-4 h-4 ml-2" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}

                            <p className="text-xs text-gray-500 text-center mt-4">
                                Secure payment powered by Paystack
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;