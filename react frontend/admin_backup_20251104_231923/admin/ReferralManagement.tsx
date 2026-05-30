import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Users, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, Search, Filter,
    Download, Eye, Edit, UserPlus, Calendar, AlertTriangle, Settings, Plus,
    Minus, Award, Gift, RefreshCw, CreditCard, PiggyBank, Target, User,
    BarChart3, PieChart, Activity, FileText, FileSpreadsheet, Wallet
} from 'lucide-react';
import { adminApi } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

interface ReferralData {
    id: number;
    referrer_name: string;
    referrer_email: string;
    referee_name: string;
    referee_email: string;
    commission_amount: number;
    commission_type: string;
    status: string;
    created_at: string;
    balance?: number;
}

interface Analytics {
    overview: {
        total_users?: number;
        total_referrals: number;
        total_referrers?: number;
        total_earnings: number;
        pending_earnings: number;
        total_withdrawals: number;
        available_balance: number;
    };
    monthly_trends: Array<{
        month: number;
        month_name: string;
        referrals: number;
        earnings: number;
    }>;
    top_referrers?: Array<{
        id: number;
        name: string;
        email: string;
        referral_count: number;
        total_earnings: number;
    }>;
    recent_activities: Array<{
        id: number;
        commission_amount: number;
        commission_type: string;
        created_at: string;
        referee: { name: string; email: string };
        referrer?: { name: string; email: string };
    }>;
}

const ReferralManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCommissionType, setFilterCommissionType] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [showCommissionModal, setShowCommissionModal] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [topUpType, setTopUpType] = useState('bonus');
    const [topUpReason, setTopUpReason] = useState('');
    const [adjustAmount, setAdjustAmount] = useState('');
    const [adjustType, setAdjustType] = useState('deduction');
    const [adjustReason, setAdjustReason] = useState('');
    const [commissionRates, setCommissionRates] = useState([]);
    const [isExporting, setIsExporting] = useState(false);

    const { user } = useAuth();
    const isSuperAdmin = user?.role?.name === 'superadmin';

    // Fetch analytics dashboard data
    const { data: analyticsData, isLoading: analyticsLoading } = useQuery<Analytics>({
        queryKey: ['referral-analytics'],
        queryFn: async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/referrals/analytics`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to fetch analytics');
            const data = await response.json();
            return data.data;
        }
    });

    // Fetch my referrals
    const { data: myReferralsData, isLoading: myReferralsLoading } = useQuery({
        queryKey: ['my-referrals', searchQuery, filterStatus, filterCommissionType, dateFrom, dateTo],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (filterStatus) params.append('status', filterStatus);
            if (filterCommissionType) params.append('commission_type', filterCommissionType);
            if (dateFrom) params.append('date_from', dateFrom);
            if (dateTo) params.append('date_to', dateTo);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/referrals/my-referrals?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to fetch my referrals');
            return response.json();
        },
        enabled: activeTab === 'my-referrals'
    });

    // Fetch all referrals (SuperAdmin only)
    const { data: allReferralsData, isLoading: allReferralsLoading } = useQuery({
        queryKey: ['all-referrals', searchQuery, filterStatus, filterCommissionType, dateFrom, dateTo],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (filterStatus) params.append('status', filterStatus);
            if (filterCommissionType) params.append('commission_type', filterCommissionType);
            if (dateFrom) params.append('date_from', dateFrom);
            if (dateTo) params.append('date_to', dateTo);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/referrals/all-referrals?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to fetch all referrals');
            return response.json();
        },
        enabled: activeTab === 'all-referrals' && isSuperAdmin
    });

    // Fetch commission rates
    const { data: commissionRatesData } = useQuery({
        queryKey: ['commission-rates'],
        queryFn: async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/referrals/commission-rates-list`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to fetch commission rates');
            const data = await response.json();
            setCommissionRates(data.data);
            return data.data;
        }
    });

    // Fetch rewards history
    const { data: rewardsHistoryData, isLoading: rewardsHistoryLoading } = useQuery({
        queryKey: ['rewards-history'],
        queryFn: async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/referrals/rewards-history`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to fetch rewards history');
            return response.json();
        },
        enabled: activeTab === 'rewards-history'
    });

    // Top up balance mutation
    const topUpMutation = useMutation({
        mutationFn: (data: { user_account_id: string; amount: number; reason: string; type: string }) =>
            adminApi.post('/admin/referrals/top-up-balance', data),
        onSuccess: () => {
            toast.success('Balance topped up successfully');
            queryClient.invalidateQueries({ queryKey: ['all-referrals'] });
            setShowTopUpModal(false);
            setSelectedUser(null);
            setTopUpAmount('');
            setTopUpReason('');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to top up balance');
        }
    });

    // Adjust balance mutation
    const adjustMutation = useMutation({
        mutationFn: (data: { user_account_id: string; adjustment_amount: number; reason: string; type: string }) =>
            adminApi.post('/admin/referrals/adjust-balance', data),
        onSuccess: () => {
            toast.success('Balance adjusted successfully');
            queryClient.invalidateQueries({ queryKey: ['all-referrals'] });
            setShowAdjustModal(false);
            setSelectedUser(null);
            setAdjustAmount('');
            setAdjustReason('');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to adjust balance');
        }
    });

    // Update commission rates mutation
    const updateCommissionMutation = useMutation({
        mutationFn: (data: any) => adminApi.put('/admin/referrals/commission-rates', data),
        onSuccess: () => {
            toast.success('Commission rates updated successfully');
            setShowCommissionModal(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update commission rates');
        }
    });

    const handleTopUpBalance = () => {
        if (!selectedUser || !topUpAmount || !topUpReason) {
            toast.error('Please fill in all required fields');
            return;
        }

        topUpMutation.mutate({
            user_account_id: selectedUser.account_id,
            amount: parseFloat(topUpAmount),
            reason: topUpReason,
            type: topUpType
        });
    };

    const handleAdjustBalance = () => {
        if (!selectedUser || !adjustAmount || !adjustReason) {
            toast.error('Please fill in all required fields');
            return;
        }

        const adjustmentAmount = adjustType === 'deduction' ? -Math.abs(parseFloat(adjustAmount)) : parseFloat(adjustAmount);
        adjustMutation.mutate({
            user_account_id: selectedUser.account_id,
            adjustment_amount: adjustmentAmount,
            reason: adjustReason,
            type: adjustType
        });
    };

    const handleUpdateCommissionRates = () => {
        updateCommissionMutation.mutate(commissionRates);
    };

    const handleExport = async (format: 'csv' | 'excel') => {
        try {
            setIsExporting(true);
            const params = new URLSearchParams();
            params.append('format', format);
            if (searchQuery) params.append('search', searchQuery);
            if (filterStatus) params.append('status', filterStatus);
            if (filterCommissionType) params.append('commission_type', filterCommissionType);
            if (dateFrom) params.append('date_from', dateFrom);
            if (dateTo) params.append('date_to', dateTo);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/referrals/export?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to export data');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const filename = `referrals_${new Date().toISOString().split('T')[0]}.${format}`;

            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(`Data exported successfully as ${format.toUpperCase()}`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to export data');
        } finally {
            setIsExporting(false);
            setShowExportMenu(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const colors = {
            completed: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            cancelled: 'bg-red-100 text-red-800',
            failed: 'bg-red-100 text-red-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${(colors as any)[status] || 'bg-gray-100 text-gray-800'}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
        }).format(amount);
    };

    if (analyticsLoading) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <nav className="text-sm text-gray-500 mb-2">
                    <Link to="/admin/dashboard" className="hover:text-gray-700">Dashboard</Link>
                    <span className="mx-2">•</span>
                    <span className="text-gray-900">Referral Management</span>
                </nav>
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">Referral Management</h1>
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                disabled={isExporting}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
                            >
                                <Download className="w-4 h-4" />
                                <span>{isExporting ? 'Exporting...' : 'Export'}</span>
                            </button>
                            {showExportMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                    <div className="py-1">
                                        <button
                                            onClick={() => handleExport('csv')}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <FileText className="w-4 h-4 mr-2" />
                                            Export as CSV
                                        </button>
                                        <button
                                            onClick={() => handleExport('excel')}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                                            Export as Excel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        {isSuperAdmin && (
                            <button
                                onClick={() => setShowCommissionModal(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                            >
                                <Settings className="w-4 h-4" />
                                <span>Commission Rates</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6">
                <nav className="flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'dashboard'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <BarChart3 className="w-4 h-4 inline mr-1" />
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('my-referrals')}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'my-referrals'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Users className="w-4 h-4 inline mr-1" />
                        My Referrals
                    </button>
                    {isSuperAdmin && (
                        <button
                            onClick={() => setActiveTab('all-referrals')}
                            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'all-referrals'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Target className="w-4 h-4 inline mr-1" />
                            All Referrals
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('rewards-history')}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'rewards-history'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Award className="w-4 h-4 inline mr-1" />
                        Rewards History
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'dashboard' && (
                    <DashboardTab
                        analyticsData={analyticsData}
                        isLoading={analyticsLoading}
                        formatCurrency={formatCurrency}
                        isSuperAdmin={isSuperAdmin}
                    />
                )}

                {activeTab === 'rewards-history' && (
                    <RewardsHistoryTab
                        data={rewardsHistoryData?.data}
                        isLoading={rewardsHistoryLoading}
                        formatCurrency={formatCurrency}
                        getStatusBadge={getStatusBadge}
                    />
                )}

                {(activeTab === 'my-referrals' || activeTab === 'all-referrals') && (
                    <>
                        {/* Filters */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search referrals..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">All Status</option>
                                        <option value="completed">Completed</option>
                                        <option value="pending">Pending</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Commission Type</label>
                                    <select
                                        value={filterCommissionType}
                                        onChange={(e) => setFilterCommissionType(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">All Types</option>
                                        <option value="registration">Registration</option>
                                        <option value="vote_purchase">Vote Purchase</option>
                                        <option value="subscription">Subscription</option>
                                        <option value="manual_topup">Manual Top-up</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                                <button
                                    onClick={() => {
                                        setSearchQuery('')
                                        setFilterStatus('')
                                        setFilterCommissionType('')
                                        setDateFrom('')
                                        setDateTo('')
                                    }}
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                                >
                                    Clear Filters
                                </button>

                                <button
                                    onClick={() => queryClient.invalidateQueries({ queryKey: [activeTab] })}
                                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    <span>Refresh</span>
                                </button>
                            </div>
                        </div>

                        {/* Referrals Table */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {activeTab === 'my-referrals' ? 'My Referrals' : 'All Referrals'}
                                    {(myReferralsData?.pagination?.total || allReferralsData?.pagination?.total) &&
                                        ` (${activeTab === 'my-referrals' ? myReferralsData.pagination.total : allReferralsData.pagination.total})`
                                    }
                                </h2>
                            </div>

                            <div className="overflow-x-auto">
                                {activeTab === 'my-referrals' || activeTab === 'all-referrals' ? (
                                    myReferralsLoading || allReferralsLoading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    ) : (
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    {activeTab === 'all-referrals' && (
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Referrer
                                                        </th>
                                                    )}
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Referred User
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Commission
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Type
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Date
                                                    </th>
                                                    {isSuperAdmin && activeTab === 'all-referrals' && (
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {(activeTab === 'my-referrals' ? myReferralsData?.data?.referrals : allReferralsData?.data?.referrals)?.map((referral: any) => (
                                                    <tr key={referral.id} className="hover:bg-gray-50">
                                                        {activeTab === 'all-referrals' && (
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900">
                                                                            {referral.referrer?.first_name} {referral.referrer?.last_name}
                                                                        </p>
                                                                        <p className="text-sm text-gray-500">{referral.referrer?.email}</p>
                                                                        <p className="text-xs text-blue-600">{formatCurrency(referral.referrer?.referral_earnings || 0)}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        )}
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {referral.referred_user?.first_name} {referral.referred_user?.last_name}
                                                                </p>
                                                                <p className="text-sm text-gray-500">{referral.referred_user?.email}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {formatCurrency(Number(referral.commission_amount || 0))}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                                                {referral.commission_type?.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {getStatusBadge(referral.status)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {format(new Date(referral.created_at), 'MMM dd, yyyy')}
                                                        </td>
                                                        {isSuperAdmin && activeTab === 'all-referrals' && (
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                <div className="flex items-center space-x-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedUser(referral.referrer);
                                                                            setShowTopUpModal(true);
                                                                        }}
                                                                        className="text-green-600 hover:text-green-900"
                                                                        title="Top Up Balance"
                                                                    >
                                                                        <Plus className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedUser(referral.referrer);
                                                                            setShowAdjustModal(true);
                                                                        }}
                                                                        className="text-orange-600 hover:text-orange-900"
                                                                        title="Adjust Balance"
                                                                    >
                                                                        <Minus className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                                {(!myReferralsData?.data?.referrals && !allReferralsData?.data?.referrals) && (
                                                    <tr>
                                                        <td colSpan={activeTab === 'all-referrals' ? 7 : 6} className="px-6 py-4 text-center text-sm text-gray-500">
                                                            No referrals found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    )
                                ) : null}
                            </div>

                            {/* Pagination */}
                            {myReferralsData?.pagination && (
                                <div className="px-6 py-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-500">
                                            Showing {((myReferralsData.pagination.current_page - 1) * myReferralsData.pagination.per_page) + 1} to{' '}
                                            {Math.min(myReferralsData.pagination.current_page * myReferralsData.pagination.per_page, myReferralsData.pagination.total)} of{' '}
                                            {myReferralsData.pagination.total} results
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                            >
                                                Previous
                                            </button>
                                            <span className="px-3 py-1 text-sm text-gray-500">
                                                Page {myReferralsData.pagination.current_page} of {myReferralsData.pagination.last_page}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(Math.min(myReferralsData.pagination.last_page, currentPage + 1))}
                                                disabled={currentPage === myReferralsData.pagination.last_page}
                                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Modals */}
            <TopUpModal
                isOpen={showTopUpModal}
                onClose={() => setShowTopUpModal(false)}
                user={selectedUser}
                onSubmit={handleTopUpBalance}
                isLoading={topUpMutation.isPending}
                amount={topUpAmount}
                setAmount={setTopUpAmount}
                type={topUpType}
                setType={setTopUpType}
                reason={topUpReason}
                setReason={setTopUpReason}
            />

            <AdjustModal
                isOpen={showAdjustModal}
                onClose={() => setShowAdjustModal(false)}
                user={selectedUser}
                onSubmit={handleAdjustBalance}
                isLoading={adjustMutation.isPending}
                amount={adjustAmount}
                setAmount={setAdjustAmount}
                type={adjustType}
                setType={setAdjustType}
                reason={adjustReason}
                setReason={setAdjustReason}
            />

            <CommissionRatesModal
                isOpen={showCommissionModal}
                onClose={() => setShowCommissionModal(false)}
                currentRates={commissionRatesData}
                onSubmit={handleUpdateCommissionRates}
                isLoading={updateCommissionMutation.isPending}
            />
        </div>
    );
};

// Modal Components
const TopUpModal: React.FC<any> = ({ isOpen, onClose, user, onSubmit, isLoading, amount, setAmount, type, setType, reason, setReason }) => {
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !amount || !reason) return;

        onSubmit({
            user_account_id: user.account_id,
            amount: parseFloat(amount),
            reason,
            type
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h3 className="text-lg font-semibold mb-4">Top Up Balance</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium">{user?.first_name} {user?.last_name}</p>
                            <p className="text-sm text-gray-600">{user?.email}</p>
                            <p className="text-sm text-blue-600">Current Balance: {formatCurrency(user?.referral_earnings || 0)}</p>
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₦)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                            min="0.01"
                            step="0.01"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="bonus">Bonus</option>
                            <option value="correction">Correction</option>
                            <option value="reward">Reward</option>
                            <option value="manual">Manual</option>
                        </select>
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {isLoading ? 'Processing...' : 'Top Up'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdjustModal: React.FC<any> = ({ isOpen, onClose, user, onSubmit, isLoading, amount, setAmount, type, setType, reason, setReason }) => {
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !amount || !reason) return;

        const adjustmentAmount = type === 'deduction' ? -Math.abs(parseFloat(amount)) : parseFloat(amount);
        onSubmit({
            user_account_id: user.account_id,
            adjustment_amount: adjustmentAmount,
            reason,
            type
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h3 className="text-lg font-semibold mb-4">Adjust Balance</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium">{user?.first_name} {user?.last_name}</p>
                            <p className="text-sm text-gray-600">{user?.email}</p>
                            <p className="text-sm text-blue-600">Current Balance: {formatCurrency(user?.referral_earnings || 0)}</p>
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="deduction">Deduction</option>
                            <option value="correction">Correction</option>
                            <option value="penalty">Penalty</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₦)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                            min="0.01"
                            step="0.01"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                        >
                            {isLoading ? 'Processing...' : 'Adjust'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CommissionRatesModal: React.FC<any> = ({ isOpen, onClose, currentRates, onSubmit, isLoading }) => {
    const [rates, setRates] = useState(currentRates || {});

    React.useEffect(() => {
        if (currentRates) {
            setRates(currentRates);
        }
    }, [currentRates]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(rates);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">Manage Commission Rates</h3>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {Object.entries(rates).map(([key, value]) => (
                            <div key={key}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </label>
                                <input
                                    type="number"
                                    value={value as number}
                                    onChange={(e) => setRates({ ...rates, [key]: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isLoading ? 'Updating...' : 'Update Rates'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Tab Components
const DashboardTab: React.FC<any> = ({ analyticsData, isLoading, formatCurrency, isSuperAdmin }) => {
    if (isLoading) {
        return (
            <div className="animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {analyticsData?.overview?.total_referrals || 0}
                            </h3>
                            <p className="text-blue-600 font-medium">Total Referrals</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">
                                ₦{(analyticsData?.overview?.total_earnings || 0).toLocaleString()}
                            </h3>
                            <p className="text-green-600 font-medium">Total Earnings</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">
                                ₦{(analyticsData?.overview?.pending_earnings || 0).toLocaleString()}
                            </h3>
                            <p className="text-yellow-600 font-medium">Pending Earnings</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">
                                ₦{(analyticsData?.overview?.available_balance || 0).toLocaleString()}
                            </h3>
                            <p className="text-purple-600 font-medium">Available Balance</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Wallet className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Trends Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
                    <div className="space-y-4">
                        {analyticsData?.monthly_trends?.map((trend: any) => (
                            <div key={trend.month} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{trend.month_name}</span>
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-blue-600">{trend.referrals} referrals</span>
                                    <span className="text-sm text-green-600">₦{trend.earnings.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
                    <div className="space-y-4">
                        {analyticsData?.recent_activities?.slice(0, 5).map((activity: any) => (
                            <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {activity.referee?.name}
                                    </p>
                                    <p className="text-xs text-gray-500">{activity.commission_type}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-green-600">
                                        ₦{activity.commission_amount.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {format(new Date(activity.created_at), 'MMM dd')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Referrers (SuperAdmin only) */}
            {isSuperAdmin && analyticsData?.top_referrers && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Referrers</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referrer</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referrals</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Earnings</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {analyticsData.top_referrers.map((referrer: any, index: number) => (
                                    <tr key={referrer.id}>
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{referrer.name}</p>
                                                <p className="text-sm text-gray-500">{referrer.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{referrer.referral_count}</td>
                                        <td className="px-4 py-3 text-sm text-green-600">₦{referrer.total_earnings.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

const RewardsHistoryTab: React.FC<any> = ({ data, isLoading, formatCurrency, getStatusBadge }) => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Rewards History</h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {data?.map((reward: any) => (
                            <tr key={reward.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${reward.type === 'earning' ? 'bg-green-100 text-green-800' :
                                        reward.type === 'withdrawal' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {reward.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={reward.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        ₦{Math.abs(reward.amount).toLocaleString()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">{reward.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(reward.status)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {format(new Date(reward.created_at), 'MMM dd, yyyy HH:mm')}
                                </td>
                            </tr>
                        ))}
                        {(!data || data.length === 0) && (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No rewards history found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ReferralsTable Component
const ReferralsTable: React.FC<any> = ({ data, isLoading, formatCurrency, getStatusBadge, isSuperAdmin, onTopUp, onAdjust }) => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                    Referrals
                    {data?.pagination?.total && ` (${data.pagination.total})`}
                </h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referrer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            {isSuperAdmin && (
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {data?.data?.map((referral: any) => (
                            <tr key={referral.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{referral.referrer_name}</p>
                                        <p className="text-sm text-gray-500">{referral.referrer_email}</p>
                                        {referral.balance !== undefined && (
                                            <p className="text-xs text-green-600">Balance: ₦{referral.balance.toLocaleString()}</p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{referral.referee_name}</p>
                                        <p className="text-sm text-gray-500">{referral.referee_email}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ₦{referral.commission_amount.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                        {referral.commission_type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(referral.status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {format(new Date(referral.created_at), 'MMM dd, yyyy HH:mm')}
                                </td>
                                {isSuperAdmin && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => onTopUp(referral)}
                                                className="text-green-600 hover:text-green-900"
                                                title="Top Up Balance"
                                            >
                                                <UserPlus className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onAdjust(referral)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="Adjust Balance"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {(!data?.data || data.data.length === 0) && (
                            <tr>
                                <td colSpan={isSuperAdmin ? 7 : 6} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No referrals found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {data?.pagination && data.pagination.last_page > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Showing {data.pagination.from} to {data.pagination.to} of {data.pagination.total} results
                        </div>
                        <div className="flex items-center space-x-1">
                            {Array.from({ length: data.pagination.last_page }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    className={`px-3 py-1 rounded text-sm ${page === data.pagination.current_page
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ReferralManagement; 