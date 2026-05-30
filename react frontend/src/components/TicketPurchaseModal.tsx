import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    X,
    CreditCard,
    User,
    Mail,
    Phone,
    Ticket,
    DollarSign,
    AlertCircle,
    CheckCircle,
    Loader2
} from 'lucide-react';
import { eventsApi } from '../services/api';
import { Event, TicketTier } from '../types';
import { toast } from 'react-hot-toast';

interface TicketSelection {
    tierId: number;
    quantity: number;
    tier: TicketTier;
}

interface TicketPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event;
    selectedTickets?: TicketSelection[];
    onPurchaseSuccess: (data: any) => void;
}

const TicketPurchaseModal: React.FC<TicketPurchaseModalProps> = ({
    isOpen,
    onClose,
    event,
    selectedTickets = [],
    onPurchaseSuccess
}) => {
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [agreeToTerms, setAgreeToTerms] = useState(false);

    const purchaseMutation = useMutation({
        mutationFn: (data: any) => eventsApi.purchaseTicket(data),
        onSuccess: (response) => {
            toast.success('Ticket purchase initiated successfully!');
            onPurchaseSuccess(response.data);
            onClose();
            resetForm();
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to purchase tickets';
            toast.error(message);
        }
    });

    const resetForm = () => {
        setCustomerInfo({ name: '', email: '', phone: '' });
        setErrors({});
        setAgreeToTerms(false);
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!customerInfo.name.trim()) {
            newErrors.name = 'Full name is required';
        }

        if (!customerInfo.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!customerInfo.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(customerInfo.phone.replace(/\D/g, ''))) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        if (!agreeToTerms) {
            newErrors.terms = 'You must agree to the terms and conditions';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (selectedTickets.length === 0) {
            toast.error('Please select at least one ticket');
            return;
        }

        const purchaseData = {
            event_id: event.id,
            customer_info: customerInfo,
            tickets: selectedTickets.map(selection => ({
                ticket_tier_id: selection.tierId,
                quantity: selection.quantity
            }))
        };

        purchaseMutation.mutate(purchaseData);
    };

    const getTotalCost = () => {
        return selectedTickets.reduce((total, selection) => {
            return total + (selection.tier.price * selection.quantity);
        }, 0);
    };

    const getTotalTickets = () => {
        return selectedTickets.reduce((total, selection) => total + selection.quantity, 0);
    };

    const handleInputChange = (field: string, value: string) => {
        setCustomerInfo(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-secondary-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Purchase Tickets</h2>
                        <p className="text-gray-600 dark:text-gray-400">{event.title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Order Summary */}
                <div className="p-6 bg-gray-50 dark:bg-secondary-800 border-b border-gray-200 dark:border-secondary-700">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                    <div className="space-y-3">
                        {selectedTickets.map((selection) => (
                            <div key={selection.tierId} className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{selection.tier.name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        ${selection.tier.price} × {selection.quantity}
                                    </p>
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    ${(selection.tier.price * selection.quantity).toFixed(2)}
                                </span>
                            </div>
                        ))}
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-secondary-700">
                            <div>
                                <p className="font-bold text-lg text-gray-900 dark:text-white">Total</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{getTotalTickets()} tickets</p>
                            </div>
                            <span className="font-bold text-lg text-green-600">
                                ${getTotalCost().toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Customer Information Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name *
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    id="name"
                                    value={customerInfo.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className={`pl-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                                        errors.name ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter your full name"
                                />
                            </div>
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address *
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="email"
                                    id="email"
                                    value={customerInfo.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className={`pl-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                                        errors.email ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter your email address"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number *
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="tel"
                                    id="phone"
                                    value={customerInfo.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    className={`pl-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                                        errors.phone ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter your phone number"
                                />
                            </div>
                            {errors.phone && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.phone}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Terms and Conditions */}
                    <div className="mt-6">
                        <div className="flex items-start">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={agreeToTerms}
                                onChange={(e) => setAgreeToTerms(e.target.checked)}
                                className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <label htmlFor="terms" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                I agree to the{' '}
                                <a href="/terms" target="_blank" className="text-primary hover:underline">
                                    Terms and Conditions
                                </a>{' '}
                                and{' '}
                                <a href="/privacy" target="_blank" className="text-primary hover:underline">
                                    Privacy Policy
                                </a>
                            </label>
                        </div>
                        {errors.terms && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {errors.terms}
                            </p>
                        )}
                    </div>

                    {/* Purchase Information */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start">
                            <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium">What happens next?</p>
                                <ul className="mt-1 space-y-1">
                                    <li>• You'll be redirected to our secure payment gateway</li>
                                    <li>• After payment, tickets will be emailed to you</li>
                                    <li>• Present your ticket QR code at the event entrance</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:bg-secondary-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={purchaseMutation.isPending || selectedTickets.length === 0}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {purchaseMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    {getTotalCost() > 0 ? 'Proceed to Payment' : 'Get Free Tickets'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TicketPurchaseModal; 