import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, AlertTriangle, Clock, Zap, Vote, Calendar, Users } from 'lucide-react';
import api from '../services/api';

interface WithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    isLoading: boolean;
    userBanks: any[];
}

interface SiteSettings {
    withdrawal_site_charges: number;
    withdrawal_pg_charges: number;
    normal_withdrawal_hours: number;
    express_withdrawal_hours: number;
    express_withdrawal_fee: number;
    min_withdrawal_amount: number;
    max_withdrawal_amount: number;
}

interface WithdrawalSource {
    votes: Array<{
        vote_id: string;
        name: string;
        available_balance: number;
        status: string;
    }>;
    events: Array<{
        event_id: string;
        name: string;
        available_balance: number;
        status: string;
    }>;
    referrals: {
        total_balance: number;
        available_balance: number;
    };
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isLoading,
    userBanks
}) => {
    const [formData, setFormData] = useState({
        amount: '',
        bank_account_id: '',
        source_type: 'VOTE',
        source_id: '',
        pace: 'NORMAL',
        notes: ''
    });

    // Fetch site settings for withdrawal configuration
    const { data: settingsData } = useQuery({
        queryKey: ['site-settings'],
        queryFn: () => api.get('/site-settings')
    });

    // Fetch available withdrawal sources
    const { data: sourcesData } = useQuery({
        queryKey: ['withdrawal-sources'],
        queryFn: () => api.get('/withdrawal-sources'),
        enabled: isOpen
    });

    const settings: SiteSettings = settingsData?.data || {
        withdrawal_site_charges: 2.5,
        withdrawal_pg_charges: 1.5,
        normal_withdrawal_hours: 24,
        express_withdrawal_hours: 2,
        express_withdrawal_fee: 500,
        min_withdrawal_amount: 1000,
        max_withdrawal_amount: 500000
    };

    const sources: WithdrawalSource = sourcesData?.data || {
        votes: [],
        events: [],
        referrals: { total_balance: 0, available_balance: 0 }
    };

    const calculateCharges = (amount: number, pace: string) => {
        const siteCharges = (amount * (settings.withdrawal_site_charges || 0)) / 100;
        const pgCharges = (amount * (settings.withdrawal_pg_charges || 0)) / 100;
        const expressCharges = pace === 'EXPRESS' ? (settings.express_withdrawal_fee || 0) : 0;
        const totalCharges = siteCharges + pgCharges + expressCharges;
        return {
            siteCharges: Number(siteCharges) || 0,
            pgCharges: Number(pgCharges) || 0,
            expressCharges: Number(expressCharges) || 0,
            totalCharges: Number(totalCharges) || 0,
            settledAmount: Number(amount - totalCharges) || 0
        };
    };

    const getMaxWithdrawableAmount = () => {
        if (formData.source_type === 'REFERRAL') {
            return sources.referrals.available_balance;
        }

        const selectedSource = formData.source_type === 'VOTE'
            ? sources.votes.find(v => v.vote_id === formData.source_id)
            : sources.events.find(e => e.event_id === formData.source_id);

        return selectedSource?.available_balance || 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const amount = parseFloat(formData.amount);
        const maxWithdrawable = getMaxWithdrawableAmount();

        // Validation
        if (amount < (settings.min_withdrawal_amount || 0)) {
            alert(`Minimum withdrawal amount is ₦${(settings.min_withdrawal_amount || 0).toLocaleString()}`);
            return;
        }

        if (amount > (settings.max_withdrawal_amount || 0)) {
            alert(`Maximum withdrawal amount is ₦${(settings.max_withdrawal_amount || 0).toLocaleString()}`);
            return;
        }

        if (amount > maxWithdrawable) {
            alert(`Insufficient balance. Maximum withdrawable amount is ₦${maxWithdrawable.toLocaleString()}`);
            return;
        }

        const charges = calculateCharges(amount, formData.pace);

        if ((charges.settledAmount || 0) <= 0) {
            alert('Withdrawal amount is too low after charges');
            return;
        }

        // Confirm withdrawal
        const sourceName = formData.source_type === 'REFERRAL'
            ? 'Referral Earnings'
            : formData.source_type === 'VOTE'
                ? sources.votes.find(v => v.vote_id === formData.source_id)?.name || 'Unknown Vote'
                : sources.events.find(e => e.event_id === formData.source_id)?.name || 'Unknown Event';

        const confirmMessage = `
            Withdrawal Summary:
            Source: ${sourceName}
            Amount: ₦${amount.toLocaleString()}
            Total Charges: ₦${(charges.totalCharges || 0).toLocaleString()}
            You will receive: ₦${(charges.settledAmount || 0).toLocaleString()}
            
            Processing Time: ${formData.pace === 'EXPRESS' ? (settings.express_withdrawal_hours || 0) : (settings.normal_withdrawal_hours || 0)} hours
            
            Do you want to proceed?
        `;

        if (window.confirm(confirmMessage)) {
            onSubmit({
                ...formData,
                amount: amount,
                withdrawal_type: formData.source_type,
                source_name: sourceName
            });
        }
    };

    const resetForm = () => {
        setFormData({
            amount: '',
            bank_account_id: '',
            source_type: 'VOTE',
            source_id: '',
            pace: 'NORMAL',
            notes: ''
        });
    };

    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    // Reset source_id when source_type changes
    useEffect(() => {
        setFormData(prev => ({ ...prev, source_id: '' }));
    }, [formData.source_type]);

    if (!isOpen) return null;

    const amount = parseFloat(formData.amount) || 0;
    const charges = calculateCharges(amount, formData.pace);
    const maxWithdrawable = getMaxWithdrawableAmount();

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-secondary-900 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Request Withdrawal</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Withdrawal Source Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Withdraw From
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, source_type: 'VOTE' }))}
                                className={`p-3 rounded-lg border text-center transition-colors ${formData.source_type === 'VOTE'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                <Vote className="w-5 h-5 mx-auto mb-1" />
                                <span className="text-xs font-medium">Votes</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, source_type: 'EVENT' }))}
                                className={`p-3 rounded-lg border text-center transition-colors ${formData.source_type === 'EVENT'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                <Calendar className="w-5 h-5 mx-auto mb-1" />
                                <span className="text-xs font-medium">Events</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, source_type: 'REFERRAL' }))}
                                className={`p-3 rounded-lg border text-center transition-colors ${formData.source_type === 'REFERRAL'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                <Users className="w-5 h-5 mx-auto mb-1" />
                                <span className="text-xs font-medium">Referrals</span>
                            </button>
                        </div>
                    </div>

                    {/* Source Selection */}
                    {formData.source_type !== 'REFERRAL' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select {formData.source_type === 'VOTE' ? 'Vote' : 'Event'}
                            </label>
                            <select
                                value={formData.source_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, source_id: e.target.value }))}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select {formData.source_type === 'VOTE' ? 'a vote' : 'an event'}</option>
                                {formData.source_type === 'VOTE'
                                    ? sources.votes.filter(vote => ['STARTED', 'COMPLETED', 'ACTIVE'].includes(vote.status)).map((vote) => (
                                        <option key={vote.vote_id} value={vote.vote_id}>
                                            {vote.name} - ₦{vote.available_balance.toLocaleString()} available
                                        </option>
                                    ))
                                    : sources.events.filter(event => ['STARTED', 'COMPLETED', 'ACTIVE'].includes(event.status)).map((event) => (
                                        <option key={event.event_id} value={event.event_id}>
                                            {event.name} - ₦{event.available_balance.toLocaleString()} available
                                        </option>
                                    ))
                                }
                            </select>
                        </div>
                    )}

                    {/* Referral Balance Display */}
                    {formData.source_type === 'REFERRAL' && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-blue-700">Referral Balance</span>
                                <span className="text-lg font-bold text-blue-900">
                                    ₦{sources.referrals.available_balance.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Amount Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount (₦)
                        </label>
                        <input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                            min={settings.min_withdrawal_amount || 0}
                            max={Math.min(settings.max_withdrawal_amount || 0, maxWithdrawable)}
                            step="0.01"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter withdrawal amount"
                        />
                        <div className="flex justify-between text-sm text-gray-500 mt-1">
                            <span>Min: ₦{(settings.min_withdrawal_amount || 0).toLocaleString()}</span>
                            <span>Available: ₦{maxWithdrawable.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Bank Account Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bank Account
                        </label>
                        <select
                            value={formData.bank_account_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, bank_account_id: e.target.value }))}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Bank Account</option>
                            {userBanks.map((bank) => (
                                <option key={bank.id} value={bank.id}>
                                    {bank.bank?.name || 'Unknown Bank'} - {bank.account_no} ({bank.account_name})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Processing Speed */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Processing Speed
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="pace"
                                    value="NORMAL"
                                    checked={formData.pace === 'NORMAL'}
                                    onChange={(e) => setFormData(prev => ({ ...prev, pace: e.target.value }))}
                                    className="mr-2"
                                />
                                <Clock className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                                <span>Normal ({settings.normal_withdrawal_hours || 0} hours) - Free</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="pace"
                                    value="EXPRESS"
                                    checked={formData.pace === 'EXPRESS'}
                                    onChange={(e) => setFormData(prev => ({ ...prev, pace: e.target.value }))}
                                    className="mr-2"
                                />
                                <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                                <span>Express ({settings.express_withdrawal_hours || 0} hours) - ₦{(settings.express_withdrawal_fee || 0).toLocaleString()}</span>
                            </label>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Add any additional notes..."
                        />
                    </div>

                    {/* Withdrawal Summary */}
                    {amount > 0 && (formData.source_type === 'REFERRAL' || formData.source_id) && (
                        <div className="bg-gray-50 dark:bg-secondary-800 p-4 rounded-lg">
                            <h4 className="font-medium mb-2 flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                                Withdrawal Summary
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Source:</span>
                                    <span className="font-medium">
                                        {formData.source_type === 'REFERRAL'
                                            ? 'Referral Earnings'
                                            : formData.source_type === 'VOTE'
                                                ? sources.votes.find(v => v.vote_id === formData.source_id)?.name || 'Unknown Vote'
                                                : sources.events.find(e => e.event_id === formData.source_id)?.name || 'Unknown Event'
                                        }
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Amount:</span>
                                    <span>₦{amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Site Charges ({(settings.withdrawal_site_charges || 0)}%):</span>
                                    <span>₦{(charges.siteCharges || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>PG Charges ({(settings.withdrawal_pg_charges || 0)}%):</span>
                                    <span>₦{(charges.pgCharges || 0).toLocaleString()}</span>
                                </div>
                                {formData.pace === 'EXPRESS' && (
                                    <div className="flex justify-between">
                                        <span>Express Fee:</span>
                                        <span>₦{(charges.expressCharges || 0).toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-medium pt-2 border-t">
                                    <span>You will receive:</span>
                                    <span className="text-green-600">₦{(charges.settledAmount || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span>Processing Time:</span>
                                    <span>{formData.pace === 'EXPRESS' ? (settings.express_withdrawal_hours || 0) : (settings.normal_withdrawal_hours || 0)} hours</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Warning Message */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start">
                            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                            <div className="text-sm text-yellow-700">
                                <p className="font-medium">Important:</p>
                                <ul className="mt-1 list-disc list-inside space-y-1">
                                    <li>Withdrawals are processed during business hours</li>
                                    <li>Express withdrawals have additional fees</li>
                                    <li>Ensure your bank details are correct</li>
                                    <li>Funds will be deducted from the selected source</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-secondary-800"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={
                                !formData.amount ||
                                !formData.bank_account_id ||
                                (formData.source_type !== 'REFERRAL' && !formData.source_id) ||
                                isLoading
                            }
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Processing...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WithdrawalModal; 