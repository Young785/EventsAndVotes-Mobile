import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Search,
    Filter,
    Eye,
    Download,
    CreditCard,
    TrendingUp,
    TrendingDown,
    Calendar,
    RefreshCw,
    BarChart3,
    PieChart,
    Activity
} from 'lucide-react';
import { adminApi } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart as RechartsPieChart,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface TransactionStats {
    total_revenue: number;
    total_transactions: number;
    pending_withdrawals: number;
    failed_transactions: number;
    success_rate: number;
    avg_transaction_amount: number;
    today: {
        revenue: number;
        transactions: number;
        success_rate: number;
    };
    past_7_days: {
        revenue: number;
        transactions: number;
        success_rate: number;
    };
    past_30_days: {
        revenue: number;
        transactions: number;
        success_rate: number;
    };
    past_year: {
        revenue: number;
        transactions: number;
        success_rate: number;
    };
    daily_data: Array<{
        date: string;
        revenue: number;
        transactions: number;
        success_rate: number;
    }>;
    type_breakdown: Array<{
        type: string;
        count: number;
        amount: number;
        percentage: number;
    }>;
    status_breakdown: Array<{
        status: string;
        count: number;
        amount: number;
        percentage: number;
    }>;
}

const AdminTransactions: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [dateRange, setDateRange] = useState('all');
    const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
    const [selectedPeriod, setSelectedPeriod] = useState('past_30_days');

    // Fetch transactions with enhanced filtering
    const { data: transactionsData, isLoading } = useQuery({
        queryKey: ['admin-transactions', searchQuery, statusFilter, typeFilter, dateRange],
        queryFn: () => adminApi.getTransactions({
            search: searchQuery || undefined,
            status: statusFilter || undefined,
            type: typeFilter || undefined,
            date_range: dateRange || undefined
        })
    });

    // Fetch transaction statistics
    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['admin-transaction-stats', dateRange],
        queryFn: () => adminApi.getTransactionStats({ date_range: dateRange || undefined })
    });

    const transactions = transactionsData?.data || [];
    const stats: TransactionStats = statsData?.data || {
        total_revenue: 0,
        total_transactions: 0,
        pending_withdrawals: 0,
        failed_transactions: 0,
        success_rate: 0,
        avg_transaction_amount: 0,
        today: { revenue: 0, transactions: 0, success_rate: 0 },
        past_7_days: { revenue: 0, transactions: 0, success_rate: 0 },
        past_30_days: { revenue: 0, transactions: 0, success_rate: 0 },
        past_year: { revenue: 0, transactions: 0, success_rate: 0 },
        daily_data: [],
        type_breakdown: [],
        status_breakdown: []
    };

    // Chart colors
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

    // Mock data for demonstration
    const mockTransactions = [
        {
            id: 'TXN001',
            user: { name: 'John Doe', email: 'john@example.com' },
            type: 'SUBSCRIPTION',
            amount: 5000,
            status: 'SUCCESS',
            reference: 'REF_001_2024',
            gateway: 'Paystack',
            created_at: '2024-01-15T10:30:00Z',
            description: 'Premium subscription payment'
        },
        {
            id: 'TXN002',
            user: { name: 'Jane Smith', email: 'jane@example.com' },
            type: 'WITHDRAWAL',
            amount: 15000,
            status: 'PENDING',
            reference: 'REF_002_2024',
            gateway: 'Bank Transfer',
            created_at: '2024-01-15T09:15:00Z',
            description: 'Event earnings withdrawal'
        },
        {
            id: 'TXN003',
            user: { name: 'Mike Johnson', email: 'mike@example.com' },
            type: 'VOTE_PAYMENT',
            amount: 1000,
            status: 'SUCCESS',
            reference: 'REF_003_2024',
            gateway: 'Paystack',
            created_at: '2024-01-14T14:20:00Z',
            description: 'Vote participation fee'
        },
        {
            id: 'TXN004',
            user: { name: 'Sarah Wilson', email: 'sarah@example.com' },
            type: 'REFUND',
            amount: 2500,
            status: 'FAILED',
            reference: 'REF_004_2024',
            gateway: 'Paystack',
            created_at: '2024-01-14T11:45:00Z',
            description: 'Subscription refund'
        }
    ];

    // Mock chart data
    const mockChartData = [
        { date: '2024-01-01', revenue: 45000, transactions: 23, success_rate: 95 },
        { date: '2024-01-02', revenue: 52000, transactions: 28, success_rate: 92 },
        { date: '2024-01-03', revenue: 48000, transactions: 25, success_rate: 96 },
        { date: '2024-01-04', revenue: 61000, transactions: 32, success_rate: 94 },
        { date: '2024-01-05', revenue: 55000, transactions: 29, success_rate: 97 },
        { date: '2024-01-06', revenue: 67000, transactions: 35, success_rate: 93 },
        { date: '2024-01-07', revenue: 59000, transactions: 31, success_rate: 95 }
    ];

    const mockTypeBreakdown = [
        { type: 'SUBSCRIPTION', count: 45, amount: 225000, percentage: 45 },
        { type: 'VOTE_PAYMENT', count: 32, amount: 96000, percentage: 32 },
        { type: 'WITHDRAWAL', count: 18, amount: 180000, percentage: 18 },
        { type: 'REFUND', count: 5, amount: 25000, percentage: 5 }
    ];

    const mockStatusBreakdown = [
        { status: 'SUCCESS', count: 85, amount: 425000, percentage: 85 },
        { status: 'PENDING', count: 10, amount: 75000, percentage: 10 },
        { status: 'FAILED', count: 5, amount: 26000, percentage: 5 }
    ];

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'SUCCESS': { color: 'bg-green-100 text-green-800', label: 'Success' },
            'PENDING': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
            'FAILED': { color: 'bg-red-100 text-red-800', label: 'Failed' },
            'CANCELLED': { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING'];

        return (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const getTypeBadge = (type: string) => {
        const typeConfig = {
            'SUBSCRIPTION': { color: 'bg-blue-100 text-blue-800', label: 'Subscription' },
            'WITHDRAWAL': { color: 'bg-purple-100 text-purple-800', label: 'Withdrawal' },
            'VOTE_PAYMENT': { color: 'bg-green-100 text-green-800', label: 'Vote Payment' },
            'REFUND': { color: 'bg-orange-100 text-orange-800', label: 'Refund' },
            'EVENT_PAYMENT': { color: 'bg-indigo-100 text-indigo-800', label: 'Event Payment' }
        };

        const config = typeConfig[type as keyof typeof typeConfig] || typeConfig['SUBSCRIPTION'];

        return (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'WITHDRAWAL':
                return <TrendingDown className="w-4 h-4 text-red-500" />;
            case 'REFUND':
                return <RefreshCw className="w-4 h-4 text-orange-500" />;
            default:
                return <TrendingUp className="w-4 h-4 text-green-500" />;
        }
    };

    const getPeriodStats = (period: string) => {
        switch (period) {
            case 'today':
                return stats.today;
            case 'past_7_days':
                return stats.past_7_days;
            case 'past_30_days':
                return stats.past_30_days;
            case 'past_year':
                return stats.past_year;
            default:
                return stats.past_30_days;
        }
    };

    const currentPeriodStats = getPeriodStats(selectedPeriod);

    if (isLoading || statsLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner />
                </div>
            </AdminLayout>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <nav className="text-sm text-gray-500 mb-2">
                    <Link to="/admin/dashboard" className="hover:text-gray-700">Home</Link>
                    <span className="mx-2">•</span>
                    <span className="text-gray-900">Transactions</span>
                </nav>
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">Transactions Management</h1>
                    <div className="flex space-x-3">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2">
                            <Download className="w-4 h-4" />
                            <span>Export Data</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Period Selector */}
            <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: 'today', label: 'Today' },
                        { key: 'past_7_days', label: 'Past 7 Days' },
                        { key: 'past_30_days', label: 'Past 30 Days' },
                        { key: 'past_year', label: 'Past Year' }
                    ].map((period) => (
                        <button
                            key={period.key}
                            onClick={() => setSelectedPeriod(period.key)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${selectedPeriod === period.key
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {period.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">₦{currentPeriodStats.revenue.toLocaleString()}</h3>
                            <p className="text-gray-600 font-medium">Revenue ({selectedPeriod.replace('_', ' ')})</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-green-600 font-medium">+12.5%</span>
                        <span className="text-gray-500 ml-1">from previous period</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">{currentPeriodStats.transactions.toLocaleString()}</h3>
                            <p className="text-gray-600 font-medium">Transactions ({selectedPeriod.replace('_', ' ')})</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-blue-600 font-medium">+8.2%</span>
                        <span className="text-gray-500 ml-1">from previous period</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">{currentPeriodStats.success_rate}%</h3>
                            <p className="text-gray-600 font-medium">Success Rate ({selectedPeriod.replace('_', ' ')})</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <Activity className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-green-600 font-medium">+2.1%</span>
                        <span className="text-gray-500 ml-1">from previous period</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">₦{stats.avg_transaction_amount.toLocaleString()}</h3>
                            <p className="text-gray-600 font-medium">Avg Transaction</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-purple-600 font-medium">+5.3%</span>
                        <span className="text-gray-500 ml-1">from previous period</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue Trend Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
                        <div className="flex space-x-2">
                            {['line', 'bar', 'area'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setChartType(type as any)}
                                    className={`px-3 py-1 text-sm rounded ${chartType === type
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        {chartType === 'line' && (
                            <LineChart data={mockChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
                            </LineChart>
                        )}
                        {chartType === 'bar' && (
                            <BarChart data={mockChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="revenue" fill="#3B82F6" />
                            </BarChart>
                        )}
                        {chartType === 'area' && (
                            <AreaChart data={mockChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                            </AreaChart>
                        )}
                    </ResponsiveContainer>
                </div>

                {/* Transaction Types Breakdown */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Types</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                            <Pie
                                data={mockTypeBreakdown}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ type, percentage }) => `${type} (${percentage}%)`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                            >
                                {mockTypeBreakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="grid md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Search className="w-4 h-4 inline mr-1" />
                            Search Transactions
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
                            <option value="SUCCESS">Success</option>
                            <option value="PENDING">Pending</option>
                            <option value="FAILED">Failed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Transaction Type
                        </label>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Types</option>
                            <option value="SUBSCRIPTION">Subscription</option>
                            <option value="WITHDRAWAL">Withdrawal</option>
                            <option value="VOTE_PAYMENT">Vote Payment</option>
                            <option value="EVENT_PAYMENT">Event Payment</option>
                            <option value="REFUND">Refund</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date Range
                        </label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="quarter">This Quarter</option>
                            <option value="year">This Year</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Year Filter
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Years</option>
                            <option value="2024">2024</option>
                            <option value="2023">2023</option>
                            <option value="2022">2022</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Transaction
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Gateway
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
                            {mockTransactions.map((transaction) => (
                                <tr key={transaction.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-3">
                                            {getTypeIcon(transaction.type)}
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {transaction.reference}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {transaction.description}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {transaction.user.name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {transaction.user.email}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getTypeBadge(transaction.type)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        ₦{transaction.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(transaction.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {transaction.gateway}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(transaction.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
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
                            <span className="font-medium">4</span>
                            <span className="text-sm text-gray-700">of</span>
                            <span className="font-medium">4</span>
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
        </div>
    );
};

export default AdminTransactions; 