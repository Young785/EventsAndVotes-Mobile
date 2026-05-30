import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    DollarSign,
    Plus,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Download,
    CreditCard,
    TrendingUp,
    Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

interface WithdrawalLimits {
    min_withdrawal: number;
    max_withdrawal: number;
}

interface WithdrawalStats {
    total_earnings: number;
    total_withdrawn: number;
    pending_withdrawals: number;
    total_requests: number;
    withdrawal_limits: WithdrawalLimits;
}

interface Withdrawal {
    id: number;
    amount: number;
    status: string;
    created_at: string;
    updated_at: string;
    note: string;
    withdrawal_id: string;
    bank_account: {
        bank_name: string;
        account_number: string;
        account_name: string;
    };
}

interface BankAccount {
    id: number;
    bank_name: string;
    account_number: string;
    account_name: string;
}

// API functions
const fetchReferralWithdrawals = async (page = 1) => {
    const response = await fetch(`/api/referral-withdrawals?page=${page}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) throw new Error('Failed to fetch withdrawals');
    return response.json();
};

const fetchWithdrawalStats = async () => {
    const response = await fetch('/api/referral-withdrawals/stats', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
};

const fetchBankAccounts = async () => {
    const response = await fetch('/api/bank-accounts', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) throw new Error('Failed to fetch bank accounts');
    return response.json();
};

const createWithdrawal = async (data: { amount: number; bank_account_id: number; reason?: string }) => {
    const response = await fetch('/api/referral-withdrawals', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create withdrawal');
    }
    return response.json();
};

const ReferralWithdrawalsPage: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);
    const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
    const [withdrawalForm, setWithdrawalForm] = useState({
        amount: '',
        bank_account_id: '',
        reason: ''
    });

    // Fetch data
    const { data: withdrawalsData, isLoading: withdrawalsLoading } = useQuery({
        queryKey: ['referral-withdrawals', currentPage],
        queryFn: () => fetchReferralWithdrawals(currentPage)
    });

    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['referral-withdrawal-stats'],
        queryFn: fetchWithdrawalStats
    });

    const { data: bankAccountsData, isLoading: bankAccountsLoading } = useQuery({
        queryKey: ['bank-accounts'],
        queryFn: fetchBankAccounts
    });

    // Create withdrawal mutation
    const createWithdrawalMutation = useMutation({
        mutationFn: createWithdrawal,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['referral-withdrawals'] });
            queryClient.invalidateQueries({ queryKey: ['referral-withdrawal-stats'] });
            setShowWithdrawalForm(false);
            setWithdrawalForm({ amount: '', bank_account_id: '', reason: '' });
        },
    });

    const handleSubmitWithdrawal = (e: React.FormEvent) => {
        e.preventDefault();
        createWithdrawalMutation.mutate({
            amount: parseFloat(withdrawalForm.amount),
            bank_account_id: parseInt(withdrawalForm.bank_account_id),
            reason: withdrawalForm.reason || undefined
        });
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'pending':
                return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'rejected':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return <AlertCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (withdrawalsLoading || statsLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-secondary-800 flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    const stats: WithdrawalStats = statsData?.data;
    const withdrawals: Withdrawal[] = withdrawalsData?.data?.withdrawals?.data || [];
    const bankAccounts: BankAccount[] = bankAccountsData?.data || [];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-secondary-800 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Referral Withdrawals</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your referral earnings withdrawals</p>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white dark:bg-secondary-900 rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <DollarSign className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Balance</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">₦{stats.total_earnings.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-secondary-900 rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Download className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Withdrawn</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">₦{stats.total_withdrawn.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-secondary-900 rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <Clock className="w-6 h-6 text-yellow-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">₦{stats.pending_withdrawals.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-secondary-900 rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-purple-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Requests</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_requests}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Withdrawal Limits Info */}
                {stats?.withdrawal_limits && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
                            <span className="text-blue-800 font-medium">Withdrawal Limits:</span>
                        </div>
                        <p className="text-blue-700 mt-1">
                            Minimum: ₦{stats.withdrawal_limits.min_withdrawal.toLocaleString()} |
                            Maximum: ₦{stats.withdrawal_limits.max_withdrawal.toLocaleString()}
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Withdrawal History</h2>
                    <button
                        onClick={() => setShowWithdrawalForm(true)}
                        disabled={!stats || stats.total_earnings < (stats.withdrawal_limits?.min_withdrawal || 5000)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Withdrawal
                    </button>
                </div>

                {/* Withdrawals Table */}
                <div className="bg-white dark:bg-secondary-900 rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 dark:bg-secondary-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Reference
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Bank Account
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-secondary-900 divide-y divide-gray-200">
                                {withdrawals.length > 0 ? (
                                    withdrawals.map((withdrawal) => (
                                        <tr key={withdrawal.id} className="hover:bg-gray-50 dark:bg-secondary-800">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                {withdrawal.withdrawal_id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                ₦{withdrawal.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                <div>
                                                    <div className="font-medium">{withdrawal.bank_account?.bank_name}</div>
                                                    <div className="text-gray-500 dark:text-gray-400">{withdrawal.bank_account?.account_number}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {getStatusIcon(withdrawal.status)}
                                                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(withdrawal.status)}`}>
                                                        {withdrawal.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {new Date(withdrawal.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            <div className="flex flex-col items-center">
                                                <CreditCard className="w-12 h-12 text-gray-300 mb-4" />
                                                <p>No withdrawal requests found</p>
                                                <p className="text-sm">Create your first withdrawal request to get started</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Withdrawal Form Modal */}
                {showWithdrawalForm && (
                    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-secondary-900 rounded-lg max-w-md w-full p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">New Withdrawal Request</h3>

                            <form onSubmit={handleSubmitWithdrawal}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Amount (₦)
                                    </label>
                                    <input
                                        type="number"
                                        value={withdrawalForm.amount}
                                        onChange={(e) => setWithdrawalForm(prev => ({ ...prev, amount: e.target.value }))}
                                        min={stats?.withdrawal_limits?.min_withdrawal || 5000}
                                        max={Math.min(stats?.withdrawal_limits?.max_withdrawal || 50000, stats?.total_earnings || 0)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                    {stats?.withdrawal_limits && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Min: ₦{stats.withdrawal_limits.min_withdrawal.toLocaleString()} |
                                            Max: ₦{Math.min(stats.withdrawal_limits.max_withdrawal, stats.total_earnings).toLocaleString()}
                                        </p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Bank Account
                                    </label>
                                    <select
                                        value={withdrawalForm.bank_account_id}
                                        onChange={(e) => setWithdrawalForm(prev => ({ ...prev, bank_account_id: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Select Bank Account</option>
                                        {bankAccounts.map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.bank_name} - {account.account_number}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reason (Optional)
                                    </label>
                                    <textarea
                                        value={withdrawalForm.reason}
                                        onChange={(e) => setWithdrawalForm(prev => ({ ...prev, reason: e.target.value }))}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Optional reason for withdrawal..."
                                    />
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowWithdrawalForm(false)}
                                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createWithdrawalMutation.isPending}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                                    >
                                        {createWithdrawalMutation.isPending ? 'Creating...' : 'Create Request'}
                                    </button>
                                </div>
                            </form>

                            {createWithdrawalMutation.error && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-700 text-sm">
                                        {createWithdrawalMutation.error.message}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReferralWithdrawalsPage; 