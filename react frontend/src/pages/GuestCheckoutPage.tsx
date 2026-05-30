import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ShoppingCart,
    User,
    Mail,
    CreditCard,
    ArrowRight,
    ArrowLeft,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { cartApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const GuestCheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        full_name: '',
        customer_email: '',
        payment_method: 'paystack'
    });

    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // Fetch cart data
    const { data: cartData, isLoading, error } = useQuery({
        queryKey: ['cart'],
        queryFn: cartApi.getCart
    });

    // Checkout mutation
    const checkoutMutation = useMutation({
        mutationFn: cartApi.checkout,
        onSuccess: (response) => {
            if (response.data?.checkout_url) {
                window.location.href = response.data.checkout_url;
            } else {
                toast.success('Checkout initiated successfully');
                queryClient.invalidateQueries({ queryKey: ['cart'] });
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Checkout failed. Please try again.');
            setIsCheckingOut(false);
        }
    });

    const cartItems = cartData?.data?.carts || [];
    const totalAmount = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.full_name || !formData.customer_email) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (cartItems.length === 0) {
            toast.error('Your cart is empty');
            return;
        }

        setIsCheckingOut(true);
        checkoutMutation.mutate(formData);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Cart</h2>
                    <p className="text-gray-600 mb-4">Failed to load your cart. Please try again.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-300"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                    <p className="text-gray-600 mb-6">Add some items to your cart to proceed with checkout.</p>
                    <Link
                        to="/votes"
                        className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-300"
                    >
                        Browse Votes
                        <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center">
                        <Link
                            to="/cart"
                            className="flex items-center text-gray-600 hover:text-primary transition-colors mr-4"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Back to Cart
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                            <CreditCard className="w-8 h-8 mr-3" />
                            Guest Checkout
                        </h1>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Checkout Form */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Your Information</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Full Name */}
                            <div>
                                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        id="full_name"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleInputChange}
                                        required
                                        maxLength={20}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="Enter your full name"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        id="customer_email"
                                        name="customer_email"
                                        value={formData.customer_email}
                                        onChange={handleInputChange}
                                        required
                                        maxLength={30}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="Enter your email address"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    You'll receive confirmation and voting details at this email
                                </p>
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Method
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value="paystack"
                                            checked={formData.payment_method === 'paystack'}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">
                                            Paystack (Card, Bank Transfer, USSD)
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Sign up suggestion */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                                    <div>
                                        <h4 className="text-sm font-medium text-blue-900">Want to save time?</h4>
                                        <p className="text-sm text-blue-700 mt-1">
                                            <Link to="/register" className="underline hover:no-underline">
                                                Create an account
                                            </Link> to save your information for faster checkout and track your voting history.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isCheckingOut || checkoutMutation.isPending}
                                className="w-full flex justify-center items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {isCheckingOut || checkoutMutation.isPending ? (
                                    <>
                                        <LoadingSpinner />
                                        <span className="ml-2">Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        Proceed to Payment
                                        <ArrowRight className="ml-2 w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                        <div className="space-y-4">
                            {cartItems.map((item: any, index: number) => (
                                <div key={index} className="flex justify-between items-start border-b border-gray-200 pb-4">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900">
                                            {item.name}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Position: {item.position}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Level: {item.level}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Quantity: {item.quantity}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-gray-900">
                                            ₦{(item.price * item.quantity).toLocaleString()}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            ₦{item.price.toLocaleString()} each
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-gray-200 pt-4 mt-6">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-900">Total</span>
                                <span className="text-lg font-bold text-gray-900">
                                    ₦{totalAmount.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 text-xs text-gray-500">
                            <p>
                                * Payment will be processed securely through Paystack
                            </p>
                            <p>
                                * By proceeding, you agree to our terms of service and privacy policy
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuestCheckoutPage; 