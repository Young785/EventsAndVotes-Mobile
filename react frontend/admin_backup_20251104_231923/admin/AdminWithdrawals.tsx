import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Search,
    Filter,
    Eye,
    Check,
    X,
    Download,
    DollarSign,
    TrendingUp,
    Clock,
    Users,
    AlertCircle,
    MoreVertical,
    Plus,
    CreditCard,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    FileText,
    Zap,
    Timer
} from 'lucide-react';
import { adminApi } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { Withdrawal } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import WithdrawalModal from '../../components/WithdrawalModal';

interface UserBank {
    id: string;
    bank: {
        name: string;
        code: string;
    };
    account_no: string;
    account_name: string;
    bank_code: string;
    is_default: boolean;
}

const AdminWithdrawals: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Withdrawal request form state
    const [withdrawalForm, setWithdrawalForm] = useState({
        amount: '',
        bank_id: '',
        type: 'VOTE',
        pace: 'NORMAL',
        note: ''
    });

    // Site settings for withdrawal configuration
    const { data: siteSettingsData } = useQuery({
        queryKey: ['site-settings'],
        queryFn: () => adminApi.getSiteSettings()
    });

    const queryClient = useQueryClient();
    const { user } = useAuth();

    // Get user role for withdrawal type handling
    const userRole = user?.role?.name;
    const isAdminBoth = userRole === 'admin_both';
    const isAdminEvent = userRole === 'admin_event';
    const isAdminVote = userRole === 'admin_vote';

    // Set default withdrawal type based on user role
    useEffect(() => {
        if (!isAdminBoth) {
            if (isAdminEvent) {
                setWithdrawalForm(prev => ({ ...prev, type: 'EVENT' }));
            } else if (isAdminVote) {
                setWithdrawalForm(prev => ({ ...prev, type: 'VOTE' }));
            }
        }
    }, [userRole, isAdminBoth, isAdminEvent, isAdminVote]);

    // Fetch withdrawals
    const { data: withdrawalsData, isLoading } = useQuery({
        queryKey: ['admin-withdrawals', searchQuery, statusFilter],
        queryFn: () => adminApi.getWithdrawals({
            search: searchQuery || undefined,
            status: statusFilter || undefined
        })
    });

    // Fetch withdrawal stats
    const { data: statsData } = useQuery({
        queryKey: ['admin-withdrawal-stats'],
        queryFn: () => adminApi.getWithdrawalStats(),
        refetchInterval: 30000 // Refetch every 30 seconds
    });

    // Fetch user banks for withdrawal request
    const { data: userBanksData } = useQuery({
        queryKey: ['user-banks'],
        queryFn: () => adminApi.getUserBanks(),
        enabled: showRequestModal
    });

    // Create withdrawal request mutation
    const createWithdrawalMutation = useMutation({
        mutationFn: adminApi.createWithdrawalRequest,
        onSuccess: () => {
            toast.success('Withdrawal request submitted successfully');
            setShowRequestModal(false);
            setWithdrawalForm({
                amount: '',
                bank_id: '',
                type: 'VOTE',
                pace: 'NORMAL',
                note: ''
            });
            queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to submit withdrawal request');
        }
    });

    // Approve withdrawal mutation
    const approveWithdrawalMutation = useMutation({
        mutationFn: adminApi.approveWithdrawalRequest,
        onSuccess: () => {
            toast.success('Withdrawal approved successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
            queryClient.invalidateQueries({ queryKey: ['admin-withdrawal-stats'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to approve withdrawal');
        }
    });

    // Reject withdrawal mutation
    const rejectWithdrawalMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: { rejection_reason: string } }) =>
            adminApi.rejectWithdrawalRequest(id, data),
        onSuccess: () => {
            toast.success('Withdrawal rejected successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
            queryClient.invalidateQueries({ queryKey: ['admin-withdrawal-stats'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to reject withdrawal');
        }
    });

    const withdrawals = withdrawalsData?.data || [];
    const userBanks = userBanksData?.data || [];
    const stats = statsData?.data || {
        total_withdrawn: 0,
        pending_withdrawals: 0,
        processing_fees: 0,
        available_balance: 0,
        pending_count: 0,
        monthly_growth: 0
    };
    const siteSettings = siteSettingsData?.data?.settings || {};
    const withdrawalSettings = {
        min_withdrawal_amount: siteSettings.min_withdrawal_amount || 1000,
        max_withdrawal_amount: siteSettings.max_withdrawal_amount || 1000000,
        withdrawal_site_charges: siteSettings.withdrawal_site_charges || 2.50,
        withdrawal_pg_charges: siteSettings.withdrawal_pg_charges || 2.50,
        normal_withdrawal_hours: siteSettings.normal_withdrawal_hours || 24,
        express_withdrawal_hours: siteSettings.express_withdrawal_hours || 2,
        express_withdrawal_fee: siteSettings.express_withdrawal_fee || 500
    };

    // Calculate charges based on site settings
    const calculateCharges = (amount: number, pace: string = 'NORMAL') => {
        const siteCharges = (amount * withdrawalSettings.withdrawal_site_charges) / 100;
        const pgCharges = (amount * withdrawalSettings.withdrawal_pg_charges) / 100;
        const expressCharges = pace === 'EXPRESS' ? withdrawalSettings.express_withdrawal_fee : 0;
        return siteCharges + pgCharges + expressCharges;
    };

    const calculateSettledAmount = (amount: number, pace: string = 'NORMAL') => {
        return amount - calculateCharges(amount, pace);
    };

    const getProcessingTime = (pace: string) => {
        return pace === 'EXPRESS' ? withdrawalSettings.express_withdrawal_hours : withdrawalSettings.normal_withdrawal_hours;
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'PENDING': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
            'APPROVED': { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Approved' },
            'PAID': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Paid' },
            'REJECTED': { color: 'bg-red-100 text-red-800', icon: X, label: 'Rejected' }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING'];
        const IconComponent = config.icon;

        return (
            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
                <IconComponent className="w-3 h-3 mr-1" />
                {config.label}
            </span>
        );
    };

    const getTypeBadge = (type: string) => {
        const typeConfig = {
            'VOTE': { color: 'bg-blue-100 text-blue-800', label: 'Vote Earnings' },
            'EVENT': { color: 'bg-purple-100 text-purple-800', label: 'Event Earnings' }
        };

        const config = typeConfig[type as keyof typeof typeConfig] || typeConfig['VOTE'];

        return (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const getPaceBadge = (pace: string) => {
        const paceConfig = {
            'NORMAL': { color: 'bg-gray-100 text-gray-800', icon: Timer, label: 'Normal (24hrs)' },
            'EXPRESS': { color: 'bg-orange-100 text-orange-800', icon: Zap, label: 'Express (2hrs)' }
        };

        const config = paceConfig[pace as keyof typeof paceConfig] || paceConfig['NORMAL'];
        const IconComponent = config.icon;

        return (
            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
                <IconComponent className="w-3 h-3 mr-1" />
                {config.label}
            </span>
        );
    };

    const handleWithdrawalSubmit = (data: any) => {
        createWithdrawalMutation.mutate(data);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6">
                <nav className="text-sm text-gray-500 mb-2">
                    <Link to="/admin/dashboard" className="hover:text-gray-700">Home</Link>
                    <span className="mx-2">•</span>
                    <span className="text-gray-900">Withdrawals</span>
                </nav>
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">Withdrawal Management</h1>
                    <button
                        onClick={() => setShowRequestModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Request Withdrawal</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">₦{stats.total_withdrawn.toLocaleString()}</h3>
                            <p className="text-green-600 font-medium">Total Withdrawn</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-green-600 font-medium">+{stats.monthly_growth.toFixed(2)}%</span>
                        <span className="text-gray-500 ml-1">from last month</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">₦{stats.pending_withdrawals.toLocaleString()}</h3>
                            <p className="text-yellow-600 font-medium">Pending Withdrawals</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-yellow-600 font-medium">{stats.pending_count} requests</span>
                        <span className="text-gray-500 ml-1">awaiting approval</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">₦{stats.processing_fees.toLocaleString()}</h3>
                            <p className="text-blue-600 font-medium">Processing Fees</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-blue-600 font-medium">5%</span>
                        <span className="text-gray-500 ml-1">standard rate</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">₦{stats.available_balance.toLocaleString()}</h3>
                            <p className="text-purple-600 font-medium">Available Balance</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-purple-600 font-medium">Ready</span>
                        <span className="text-gray-500 ml-1">for withdrawal</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card-glass p-6 mb-6 animate-fade-in-up">
                <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <label className="form-label">
                            <Search className="w-4 h-4 inline mr-1" />
                            Search Withdrawals
                        </label>
                        <input
                            type="text"
                            placeholder="Search by reference, user..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Filter className="w-4 h-4 inline mr-1" />
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="PAID">Paid</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                // Export withdrawals data
                                const csvData = withdrawals.map(withdrawal => ({
                                    Reference: withdrawal.reference,
                                    User: withdrawal.user?.name || 'N/A',
                                    Email: withdrawal.user?.email || 'N/A',
                                    Amount: withdrawal.amount,
                                    'Amount Settled': withdrawal.amount_settled || withdrawal.amount * 0.95,
                                    'Bank Name': withdrawal.bank_account?.bank_name || 'N/A',
                                    'Account Number': withdrawal.bank_account?.account_number || 'N/A',
                                    'Account Name': withdrawal.bank_account?.account_name || 'N/A',
                                    Type: withdrawal.type || 'N/A',
                                    Pace: withdrawal.pace || 'N/A',
                                    Status: withdrawal.status,
                                    'Requested At': new Date(withdrawal.requested_at).toLocaleString(),
                                    'Processed At': withdrawal.processed_at ? new Date(withdrawal.processed_at).toLocaleString() : 'N/A',
                                    Note: withdrawal.note || 'N/A',
                                    'Rejection Reason': withdrawal.rejection_reason || 'N/A'
                                }));

                                // Convert to CSV
                                const headers = Object.keys(csvData[0] || {});
                                const csvContent = [
                                    headers.join(','),
                                    ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(','))
                                ].join('\n');

                                // Download CSV
                                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                const link = document.createElement('a');
                                const url = URL.createObjectURL(blob);
                                link.setAttribute('href', url);
                                link.setAttribute('download', `withdrawals_${new Date().toISOString().split('T')[0]}.csv`);
                                link.style.visibility = 'hidden';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
                        >
                            <Download className="w-4 h-4" />
                            <span>Export Data</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Withdrawals Table */}
            <div className="card-glass overflow-hidden animate-fade-in-up">
                <div className="px-6 py-5 border-b border-gray-200 dark:border-secondary-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        Withdrawal Requests
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="table-modern">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Reference
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Bank Details
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type & Pace
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {withdrawals.length > 0 ? withdrawals.map((withdrawal) => (
                                <tr key={withdrawal.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <TrendingDown className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {withdrawal.reference}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {withdrawal.description || withdrawal.note || 'Withdrawal request'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                <Users className="w-4 h-4 text-gray-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {withdrawal.user?.name || 'N/A'}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {withdrawal.user?.email || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                ₦{withdrawal.amount.toLocaleString()}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Settled: ₦{(withdrawal.amount_settled || withdrawal.amount * 0.95).toLocaleString()}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {withdrawal.bank_account?.bank_name || 'N/A'}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {withdrawal.bank_account?.account_number || 'N/A'}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {withdrawal.bank_account?.account_name || 'N/A'}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="space-y-1">
                                            {withdrawal.type && getTypeBadge(withdrawal.type)}
                                            {withdrawal.pace && getPaceBadge(withdrawal.pace)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(withdrawal.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <p className="text-sm text-gray-900">
                                                {new Date(withdrawal.requested_at).toLocaleString()}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(withdrawal.requested_at).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedWithdrawal(withdrawal as Withdrawal);
                                                    setShowDetailsModal(true);
                                                }}
                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>

                                            {withdrawal.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => approveWithdrawalMutation.mutate(withdrawal.id)}
                                                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors duration-200"
                                                        title="Approve Withdrawal"
                                                        disabled={approveWithdrawalMutation.isPending}
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => rejectWithdrawalMutation.mutate({
                                                            id: withdrawal.id,
                                                            data: { rejection_reason: window.prompt('Please provide a reason for rejection:') || '' }
                                                        })}
                                                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                                                        title="Reject Withdrawal"
                                                        disabled={rejectWithdrawalMutation.isPending}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No withdrawals found</h3>
                                            <p className="text-gray-500">You haven't made any withdrawal requests yet.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700">Showing</span>
                            <span className="font-medium">1</span>
                            <span className="text-sm text-gray-700">to</span>
                            <span className="font-medium">2</span>
                            <span className="text-sm text-gray-700">of</span>
                            <span className="font-medium">2</span>
                            <span className="text-sm text-gray-700">results</span>
                        </div>
                        <div className="flex space-x-2">
                            <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">
                                Previous
                            </button>
                            <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Withdrawal Modal */}
            <WithdrawalModal
                isOpen={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                onSubmit={handleWithdrawalSubmit}
                isLoading={createWithdrawalMutation.isPending}
                userBanks={userBanks}
            />

            {/* Withdrawal Details Modal */}
            {showDetailsModal && selectedWithdrawal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Withdrawal Details</h3>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Reference</label>
                                    <p className="text-sm text-gray-900">{selectedWithdrawal.reference}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                    <div className="mt-1">{getStatusBadge(selectedWithdrawal.status)}</div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Amount</label>
                                    <p className="text-sm text-gray-900">₦{selectedWithdrawal.amount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Amount Settled</label>
                                    <p className="text-sm text-gray-900">₦{(selectedWithdrawal.amount_settled || selectedWithdrawal.amount * 0.95).toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Type</label>
                                    <div className="mt-1">{selectedWithdrawal.type ? getTypeBadge(selectedWithdrawal.type) : 'N/A'}</div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Processing Speed</label>
                                    <div className="mt-1">{selectedWithdrawal.pace ? getPaceBadge(selectedWithdrawal.pace) : 'N/A'}</div>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Bank Details</label>
                                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-900">{selectedWithdrawal.bank_account?.bank_name || 'N/A'}</p>
                                    <p className="text-sm text-gray-600">{selectedWithdrawal.bank_account?.account_number || 'N/A'}</p>
                                    <p className="text-sm text-gray-600">{selectedWithdrawal.bank_account?.account_name || 'N/A'}</p>
                                </div>
                            </div>

                            {selectedWithdrawal.note && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Note</label>
                                    <p className="text-sm text-gray-900 mt-1">{selectedWithdrawal.note}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Requested At</label>
                                    <p className="text-sm text-gray-900">
                                        {new Date(selectedWithdrawal.requested_at).toLocaleString()}
                                    </p>
                                </div>
                                {selectedWithdrawal.processed_at && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Processed At</label>
                                        <p className="text-sm text-gray-900">
                                            {new Date(selectedWithdrawal.processed_at).toLocaleString()}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {selectedWithdrawal.rejection_reason && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Rejection Reason</label>
                                    <p className="text-sm text-red-600 mt-1">{selectedWithdrawal.rejection_reason}</p>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminWithdrawals; 