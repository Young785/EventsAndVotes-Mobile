import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Users,
    Vote,
    DollarSign,
    Calendar,
    TrendingUp,
    Eye,
    Clock,
    CheckCircle,
    AlertTriangle,
    CreditCard,
    Activity,
    BarChart3,
    PieChart,
    UserPlus,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi, superAdminApi, referralApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

// Define interfaces for the dashboard data
interface DashboardStats {
    total_users?: number;
    active_users?: number;
    total_admins?: number;
    subscription_revenue?: number;
    total_subscriptions?: number;
    total_revenue?: number;
    total_events?: number;
    active_events?: number;
    total_transactions?: number;
    total_votes_cast?: number;
    total_schools?: number;
    total_faculties?: number;
    total_departments?: number;
    total_votes?: number;
    recent_subscriptions?: any[];
    recent_transactions?: any[];
    recent_withdrawals?: any[];
    today?: {
        revenue: number;
        transactions: number;
        users: number;
        votes: number;
    };
    past_7_days?: {
        revenue: number;
        transactions: number;
        users: number;
        votes: number;
    };
    past_30_days?: {
        revenue: number;
        transactions: number;
        users: number;
        votes: number;
    };
    past_year?: {
        revenue: number;
        transactions: number;
        users: number;
        votes: number;
    };
    daily_data?: Array<{
        date: string;
        revenue: number;
        transactions: number;
        users: number;
        votes: number;
    }>;
    revenue_breakdown?: Array<{
        source: string;
        amount: number;
        percentage: number;
    }>;
}

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const userRole = user?.role?.name || '';
    const isSuperAdmin = userRole === 'superadmin';
    const isAdmin = ['admin', 'admin_vote', 'admin_both'].includes(userRole);
    const hasEventRole = ['admin_event', 'admin_both'].includes(userRole);

    const [selectedPeriod, setSelectedPeriod] = useState('past_30_days');
    const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');

    // Fetch dashboard stats
    const { data: dashboardStats, isLoading: statsLoading } = useQuery({
        queryKey: ['admin-dashboard-stats', selectedPeriod],
        queryFn: () => isSuperAdmin
            ? superAdminApi.getDashboardStats()
            : adminApi.getDashboardStats(),
        enabled: isAdmin || isSuperAdmin
    });

    // Fetch chart data
    const { data: chartData, isLoading: chartLoading } = useQuery({
        queryKey: ['admin-chart-data'],
        queryFn: () => isSuperAdmin
            ? superAdminApi.getChartData()
            : adminApi.getChartData(),
        enabled: isAdmin || isSuperAdmin
    });

    // Fetch referral stats
    const { data: referralStats, isLoading: referralLoading } = useQuery({
        queryKey: ['admin-referral-stats', selectedPeriod],
        queryFn: () => referralApi.getStats({
            period: selectedPeriod === 'past_7_days' ? 'week' :
                selectedPeriod === 'past_30_days' ? 'month' :
                    selectedPeriod === 'past_year' ? 'year' :
                        selectedPeriod === 'today' ? 'today' : 'all'
        }),
        enabled: false, // Temporarily disabled until backend endpoint is implemented
        retry: false, // Don't retry on failure
        refetchOnWindowFocus: false
    });

    // Chart colors
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

    // Mock chart data for demonstration
    const mockChartData = [
        { date: '2024-01-01', revenue: 45000, transactions: 23, users: 12, votes: 156 },
        { date: '2024-01-02', revenue: 52000, transactions: 28, users: 15, votes: 189 },
        { date: '2024-01-03', revenue: 48000, transactions: 25, users: 18, votes: 167 },
        { date: '2024-01-04', revenue: 61000, transactions: 32, users: 22, votes: 203 },
        { date: '2024-01-05', revenue: 55000, transactions: 29, users: 19, votes: 178 },
        { date: '2024-01-06', revenue: 67000, transactions: 35, users: 25, votes: 234 },
        { date: '2024-01-07', revenue: 59000, transactions: 31, users: 21, votes: 198 }
    ];

    const mockRevenueBreakdown = [
        { source: 'Subscriptions', amount: 245000, percentage: 60 },
        { source: 'Vote Payments', amount: 98000, percentage: 24 },
        { source: 'Event Fees', amount: 49000, percentage: 12 },
        { source: 'Other', amount: 16000, percentage: 4 }
    ];

    if (statsLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    const stats: DashboardStats = dashboardStats?.data || {};

    // Format recent subscriptions from API data
    const recentSubscriptions = stats.recent_subscriptions || [];
    const recentTransactions = stats.recent_transactions || [];
    const recentWithdrawals = stats.recent_withdrawals || [];

    const getPeriodStats = (period: string) => {
        switch (period) {
            case 'today':
                return stats.today || { revenue: 0, transactions: 0, users: 0, votes: 0 };
            case 'past_7_days':
                return stats.past_7_days || { revenue: 0, transactions: 0, users: 0, votes: 0 };
            case 'past_30_days':
                return stats.past_30_days || { revenue: 0, transactions: 0, users: 0, votes: 0 };
            case 'past_year':
                return stats.past_year || { revenue: 0, transactions: 0, users: 0, votes: 0 };
            default:
                return stats.past_30_days || { revenue: 0, transactions: 0, users: 0, votes: 0 };
        }
    };

    const currentPeriodStats = getPeriodStats(selectedPeriod);

    return (
        <div className="space-y-6">
            {/* Subscription Expiration Warning */}
            {user?.subscription && (
                <div className="animate-fade-in-up">
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-5 shadow-sm backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/40 rounded-xl flex items-center justify-center shadow-md">
                                    <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-yellow-800 dark:text-yellow-300 font-semibold text-lg">
                                        Subscription Notice
                                    </p>
                                    <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">
                                        Your subscription is active. Manage your subscription to avoid interruption.
                                    </p>
                                </div>
                            </div>
                            <Link
                                to="/admin/subscriptions"
                                className="bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 whitespace-nowrap"
                            >
                                Manage Subscription
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Breadcrumb */}
            <div className="animate-fade-in">
                <nav className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center space-x-2">
                    <Link to="/admin/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                        Home
                    </Link>
                    <span className="text-gray-300 dark:text-gray-600 dark:text-gray-400">•</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">Dashboard</span>
                </nav>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Dashboard
                </h1>
            </div>

            {/* Period Selector */}
            <div className="animate-fade-in-up">
                <div className="flex flex-wrap gap-3">
                    {[
                        { key: 'today', label: 'Today' },
                        { key: 'past_7_days', label: 'Past 7 Days' },
                        { key: 'past_30_days', label: 'Past 30 Days' },
                        { key: 'past_year', label: 'Past Year' }
                    ].map((period) => (
                        <button
                            key={period.key}
                            onClick={() => setSelectedPeriod(period.key)}
                            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 active:scale-95 ${selectedPeriod === period.key
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl'
                                : 'bg-white dark:bg-secondary-900 dark:bg-secondary-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-secondary-700 hover:bg-gray-50 dark:hover:bg-secondary-700 hover:border-blue-500 dark:hover:border-blue-500'
                                }`}
                        >
                            {period.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Enhanced Stats Cards Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 stagger-animation">
                {/* Revenue Card */}
                <div className="group card-glass p-6 hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">₦{currentPeriodStats.revenue.toLocaleString()}</h3>
                            <p className="text-green-600 dark:text-green-400 font-medium text-sm mt-1">Revenue</p>
                        </div>
                        <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <DollarSign className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <div className="flex items-center text-sm pt-3 border-t border-gray-200 dark:border-secondary-700">
                        <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mr-1" />
                        <span className="text-green-600 dark:text-green-400 font-semibold">+12.5%</span>
                        <span className="text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
                    </div>
                </div>

                {/* Transactions Card */}
                <div className="group card-glass p-6 hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{currentPeriodStats.transactions.toLocaleString()}</h3>
                            <p className="text-blue-600 dark:text-blue-400 font-medium text-sm mt-1">Transactions</p>
                        </div>
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <CreditCard className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <div className="flex items-center text-sm pt-3 border-t border-gray-200 dark:border-secondary-700">
                        <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-1" />
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">+8.2%</span>
                        <span className="text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
                    </div>
                </div>

                {/* Users Card */}
                <div className="group card-glass p-6 hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{currentPeriodStats.users.toLocaleString()}</h3>
                            <p className="text-purple-600 dark:text-purple-400 font-medium text-sm mt-1">New Users</p>
                        </div>
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Users className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <div className="flex items-center text-sm pt-3 border-t border-gray-200 dark:border-secondary-700">
                        <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400 mr-1" />
                        <span className="text-purple-600 dark:text-purple-400 font-semibold">+15.3%</span>
                        <span className="text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
                    </div>
                </div>

                {/* Votes Card */}
                <div className="group card-glass p-6 hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{currentPeriodStats.votes.toLocaleString()}</h3>
                            <p className="text-orange-600 dark:text-orange-400 font-medium text-sm mt-1">Votes Cast</p>
                        </div>
                        <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Vote className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <div className="flex items-center text-sm pt-3 border-t border-gray-200 dark:border-secondary-700">
                        <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-1" />
                        <span className="text-orange-600 dark:text-orange-400 font-semibold">+22.1%</span>
                        <span className="text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
                    </div>
                </div>

                {/* Referral Earnings Card */}
                <div className="group card-glass p-6 hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                                ₦{referralStats?.data?.overview?.period_earnings?.toLocaleString() || '0'}
                            </h3>
                            <p className="text-indigo-600 dark:text-indigo-400 font-medium text-sm mt-1">Referrals</p>
                        </div>
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <UserPlus className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <div className="flex items-center text-sm pt-3 border-t border-gray-200 dark:border-secondary-700">
                        <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-1" />
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                            {referralStats?.data?.overview?.period_referrals || 0}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 ml-1">this period</span>
                    </div>
                </div>
            </div>

            {/* Performance Overview */}
            <div className="card-glass animate-fade-in-up">
                <div className="px-6 py-5 border-b border-gray-200 dark:border-secondary-700">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                                <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            Performance Overview
                        </h2>
                        <div className="flex items-center space-x-3">
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="px-4 py-2 border border-gray-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 dark:bg-secondary-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            >
                                <option value="today">Today</option>
                                <option value="past_7_days">Last 7 Days</option>
                                <option value="past_30_days">Last 30 Days</option>
                                <option value="past_year">Last Year</option>
                            </select>
                            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-secondary-800 p-1 rounded-xl">
                                <button
                                    onClick={() => setChartType('line')}
                                    className={`p-2 rounded-lg transition-all duration-200 ${chartType === 'line' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'}`}
                                >
                                    <Activity className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setChartType('bar')}
                                    className={`p-2 rounded-lg transition-all duration-200 ${chartType === 'bar' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'}`}
                                >
                                    <BarChart3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setChartType('area')}
                                    className={`p-2 rounded-lg transition-all duration-200 ${chartType === 'area' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'}`}
                                >
                                    <PieChart className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {chartLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <div className="p-6">
                        {/* Period Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Revenue</p>
                                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                            ₦{currentPeriodStats.revenue?.toLocaleString() || '0'}
                                        </p>
                                    </div>
                                    <DollarSign className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-100 dark:border-green-800/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Transactions</p>
                                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                            {currentPeriodStats.transactions?.toLocaleString() || '0'}
                                        </p>
                                    </div>
                                    <CreditCard className="w-8 h-8 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">New Users</p>
                                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                            {currentPeriodStats.users?.toLocaleString() || '0'}
                                        </p>
                                    </div>
                                    <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-100 dark:border-orange-800/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Votes Cast</p>
                                        <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                                            {currentPeriodStats.votes?.toLocaleString() || '0'}
                                        </p>
                                    </div>
                                    <Vote className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                                </div>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Revenue Chart */}
                            <div className="bg-gray-50 dark:bg-secondary-800/50 rounded-xl p-6 border border-gray-200 dark:border-secondary-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Trend</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    {chartType === 'line' ? (
                                        <LineChart data={chartData?.data?.daily_data || mockChartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
                                        </LineChart>
                                    ) : chartType === 'bar' ? (
                                        <BarChart data={chartData?.data?.daily_data || mockChartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="revenue" fill="#3B82F6" />
                                        </BarChart>
                                    ) : (
                                        <AreaChart data={chartData?.data?.daily_data || mockChartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                                        </AreaChart>
                                    )}
                                </ResponsiveContainer>
                            </div>

                            {/* Revenue Breakdown Pie Chart */}
                            <div className="bg-gray-50 dark:bg-secondary-800/50 rounded-xl p-6 border border-gray-200 dark:border-secondary-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Sources</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsPieChart>
                                        <Pie
                                            data={chartData?.data?.revenue_breakdown || mockRevenueBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percentage }) => `${name} ${percentage}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="amount"
                                        >
                                            {(chartData?.data?.revenue_breakdown || mockRevenueBreakdown).map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Referral Earnings Overview */}
            <div className="card-glass border border-gray-200 mb-8">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-secondary-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                            <UserPlus className="w-5 h-5 mr-2" />
                            Referral Earnings Overview
                        </h2>
                        <Link
                            to="/admin/referrals"
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                            Manage Referrals
                        </Link>
                    </div>
                </div>

                {referralLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <div className="p-6">
                        {/* Referral Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Total Earnings</p>
                                        <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                                            ₦{referralStats?.data?.overview?.total_earnings?.toLocaleString() || '0'}
                                        </p>
                                    </div>
                                    <DollarSign className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                                </div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-100 dark:border-green-800/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Referrals</p>
                                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                            {referralStats?.data?.overview?.total_referrals?.toLocaleString() || '0'}
                                        </p>
                                    </div>
                                    <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-100 dark:border-yellow-800/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pending Referrals</p>
                                        <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                                            {referralStats?.data?.overview?.pending_referrals?.toLocaleString() || '0'}
                                        </p>
                                    </div>
                                    <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                                </div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Conversion Rate</p>
                                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                            {referralStats?.data?.overview?.conversion_rate || 0}%
                                        </p>
                                    </div>
                                    <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>

                        {/* Referral Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Referral Trends Chart */}
                            <div className="bg-gray-50 dark:bg-secondary-800/50 rounded-xl p-6 border border-gray-200 dark:border-secondary-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Referral Trends (Last 30 Days)</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={referralStats?.data?.trends || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="referrals" stroke="#8B5CF6" strokeWidth={2} name="Referrals" />
                                        <Line type="monotone" dataKey="earnings" stroke="#10B981" strokeWidth={2} name="Earnings (₦)" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Commission Breakdown */}
                            <div className="bg-gray-50 dark:bg-secondary-800/50 rounded-xl p-6 border border-gray-200 dark:border-secondary-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Commission Breakdown</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsPieChart>
                                        <Pie
                                            data={referralStats?.data?.commission_breakdown || []}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ commission_type, total_amount }) => `${commission_type}: ₦${Number(total_amount).toLocaleString()}`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="total_amount"
                                        >
                                            {(referralStats?.data?.commission_breakdown || []).map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Referrers Table */}
                        <div className="bg-gray-50 dark:bg-secondary-800/50 rounded-xl p-6 border border-gray-200 dark:border-secondary-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Referrers</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100 dark:bg-secondary-800">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Referrals
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total Earnings
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Referral Code
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-secondary-900 dark:bg-secondary-900 divide-y divide-gray-200 dark:divide-secondary-700">
                                        {(referralStats?.data?.top_referrers || []).slice(0, 5).map((referrer: any) => (
                                            <tr key={referrer.id} className="hover:bg-gray-50 dark:hover:bg-secondary-800/50">
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                {referrer.first_name} {referrer.last_name}
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {referrer.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                    {referrer.referral_count}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                    ₦{Number(referrer.total_earnings || 0).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {referrer.referral_code}
                                                </td>
                                            </tr>
                                        ))}
                                        {(!referralStats?.data?.top_referrers || referralStats.data.top_referrers.length === 0) && (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-2 text-center text-sm text-gray-500 dark:text-gray-400">
                                                    No referrers found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Withdrawal Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Available for Withdrawal</p>
                                        <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                                            ₦{referralStats?.data?.withdrawals?.available_for_withdrawal?.toLocaleString() || '0'}
                                        </p>
                                    </div>
                                    <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-100 dark:border-yellow-800/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pending Withdrawals</p>
                                        <p className="text-xl font-bold text-yellow-900 dark:text-yellow-100">
                                            ₦{referralStats?.data?.withdrawals?.pending_withdrawal_amount?.toLocaleString() || '0'}
                                        </p>
                                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                            {referralStats?.data?.withdrawals?.pending_withdrawals || 0} requests
                                        </p>
                                    </div>
                                    <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-100 dark:border-green-800/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Withdrawn</p>
                                        <p className="text-xl font-bold text-green-900 dark:text-green-100">
                                            ₦{referralStats?.data?.withdrawals?.total_withdrawn_amount?.toLocaleString() || '0'}
                                        </p>
                                        <p className="text-xs text-green-600 dark:text-green-400">
                                            {referralStats?.data?.withdrawals?.total_withdrawals || 0} withdrawals
                                        </p>
                                    </div>
                                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Original Stats Cards Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Organisers Card (Super Admin Only) */}
                {isSuperAdmin && (
                    <div className="card-glass overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_users || 0}</h3>
                                    <p className="text-blue-600 dark:text-blue-400 font-medium">Organisers</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total organisers on the platform.</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-3">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-lg font-semibold">{stats.active_users || 0}</p>
                                    <p className="text-xs text-blue-100">Active</p>
                                </div>
                                <div className="border-l border-blue-500 pl-4">
                                    <p className="text-lg font-semibold">{stats.total_admins || 0}</p>
                                    <p className="text-xs text-blue-100">Admins</p>
                                </div>
                                <div className="border-l border-blue-500 pl-4">
                                    <p className="text-lg font-semibold">{(stats.total_users || 0) - (stats.active_users || 0)}</p>
                                    <p className="text-xs text-blue-100">Inactive</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Subscriptions Card */}
                <div className="card-glass overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    ₦{Number(stats.subscription_revenue || 0).toLocaleString()}
                                </h3>
                                <p className="text-purple-600 dark:text-purple-400 font-medium">Subscriptions</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total amount of subscriptions.</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-purple-600 dark:bg-purple-700 text-white px-6 py-3">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <p className="text-lg font-semibold">{stats.total_subscriptions || 0}</p>
                                <p className="text-xs text-purple-100">
                                    Total Subscriptions
                                </p>
                            </div>
                            <div className="border-l border-purple-500 pl-4">
                                <p className="text-lg font-semibold">{stats.total_revenue ? `₦${Number(stats.total_revenue).toLocaleString()}` : '₦0'}</p>
                                <p className="text-xs text-purple-100">
                                    Total Revenue
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Events Card (Event Role Only) */}
                {hasEventRole && (
                    <div className="card-glass overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_events || 0}</h3>
                                    <p className="text-green-600 dark:text-green-400 font-medium">Events</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total number of events.</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-green-600 dark:bg-green-700 text-white px-6 py-3">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-lg font-semibold">{stats.active_events || 0}</p>
                                    <p className="text-xs text-green-100">Active</p>
                                </div>
                                <div className="border-l border-green-500 pl-4">
                                    <p className="text-lg font-semibold">{(stats.total_events || 0) - (stats.active_events || 0)}</p>
                                    <p className="text-xs text-green-100">Completed</p>
                                </div>
                                <div className="border-l border-green-500 pl-4">
                                    <p className="text-lg font-semibold">0</p>
                                    <p className="text-xs text-green-100">Cancelled</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Subscriptions Table */}
            <div className="card-glass animate-fade-in-up overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 dark:border-secondary-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                                <CreditCard className="w-5 h-5 text-white" />
                            </div>
                            Recent Subscriptions
                        </h2>
                        <Link
                            to="/admin/subscriptions"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-semibold flex items-center space-x-1 group"
                        >
                            <span>View All</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                        </Link>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="table-modern">
                        <thead>
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Reference
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Plan
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Date
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-secondary-700">
                            {recentSubscriptions.map((subscription) => (
                                <tr key={subscription.id} className="group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                                                {subscription.reference}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {subscription.account_id}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {subscription.plan?.name || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                            ₦{subscription.amount_paid.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full transition-all duration-200 ${subscription.status === 'PAID'
                                            ? 'badge-success'
                                            : 'badge-warning'
                                            }`}>
                                            {subscription.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(subscription.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {recentSubscriptions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No recent subscriptions found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Transactions Table */}
            <div className="card-glass mb-8 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-secondary-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
                        <Link
                            to="/admin/transactions"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                        >
                            View All
                        </Link>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="table-modern">
                        <thead>
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Reference
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Channel
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-secondary-700">
                            {recentTransactions.map((transaction) => (
                                <tr key={transaction.id} className="group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                                                    {transaction.reference}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {transaction.voter_id}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100">
                                        ₦{transaction.amount_paid.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                        {transaction.channel}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`${transaction.status === 'PAID'
                                            ? 'badge-success'
                                            : 'badge-warning'
                                            }`}>
                                            {transaction.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(transaction.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {recentTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No recent transactions found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Withdrawals Table */}
            <div className="card-glass mb-8 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-secondary-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Withdrawals</h2>
                        <Link
                            to="/admin/withdrawals"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                        >
                            View All
                        </Link>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="table-modern">
                        <thead>
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Settlement
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-secondary-700">
                            {recentWithdrawals.map((withdrawal) => (
                                <tr key={withdrawal.id} className="group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                                                    {withdrawal.user?.first_name} {withdrawal.user?.last_name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {withdrawal.account_id}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100">
                                        ₦{Number(withdrawal.amount).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100">
                                        ₦{Number(withdrawal.amount_to_settle).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`${withdrawal.status === 'COMPLETED'
                                            ? 'badge-success'
                                            : withdrawal.status === 'PENDING'
                                                ? 'badge-warning'
                                                : 'badge-danger'
                                            }`}>
                                            {withdrawal.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(withdrawal.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {recentWithdrawals.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No recent withdrawals found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Referral Stats Section */}
            {!referralLoading && referralStats?.data && (
                <>
                    {/* Referral Earnings Overview */}
                    <div className="card-glass mb-8">
                        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-secondary-700">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-0">Referral Earnings Overview</h2>
                                <Link
                                    to="/admin/referrals"
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                                >
                                    View All Referrals
                                </Link>
                            </div>
                        </div>
                        <div className="p-4 sm:p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-100 dark:border-green-800/30">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Earnings</p>
                                            <p className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">
                                                ₦{referralStats.data.overview.total_earnings.toLocaleString()}
                                            </p>
                                        </div>
                                        <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800/30">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Referrals</p>
                                            <p className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100">
                                                {referralStats.data.overview.total_referrals.toLocaleString()}
                                            </p>
                                        </div>
                                        <UserPlus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4 border border-yellow-100 dark:border-yellow-800/30">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Conversion Rate</p>
                                            <p className="text-xl sm:text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                                                {referralStats.data.overview.conversion_rate}%
                                            </p>
                                        </div>
                                        <TrendingUp className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                </div>
                                <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800/30">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Available Balance</p>
                                            <p className="text-xl sm:text-2xl font-bold text-purple-900 dark:text-purple-100">
                                                ₦{referralStats.data.withdrawals.available_for_withdrawal.toLocaleString()}
                                            </p>
                                        </div>
                                        <Activity className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Referrers - Only for Superadmins */}
                    {isSuperAdmin && referralStats.data.top_referrers && referralStats.data.top_referrers.length > 0 && (
                        <div className="card-glass mb-8 overflow-hidden">
                            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-secondary-700">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Referrers</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Users with the highest referral earnings</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="table-modern">
                                    <thead>
                                        <tr>
                                            <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Referrer
                                            </th>
                                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Referrals
                                            </th>
                                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total Earnings
                                            </th>
                                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Avg. per Referral
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-secondary-700">
                                        {referralStats.data.top_referrers.map((referrer, index) => (
                                            <tr key={referrer.id} className="group">
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mr-3">
                                                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                                {index + 1}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                {referrer.first_name} {referrer.last_name}
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {referrer.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                    {referrer.referral_count}
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                                                    ₦{Number(referrer.total_earnings).toLocaleString()}
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                    ₦{(Number(referrer.total_earnings) / referrer.referral_count).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Recent Referrals */}
                    {referralStats.data.recent_referrals && referralStats.data.recent_referrals.length > 0 && (
                        <div className="card-glass mb-8 overflow-hidden">
                            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-secondary-700">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Referrals</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Latest referral activities</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="table-modern">
                                    <thead>
                                        <tr>
                                            <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Referrer
                                            </th>
                                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Referred User
                                            </th>
                                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Commission
                                            </th>
                                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-secondary-700">
                                        {referralStats.data.recent_referrals.slice(0, 10).map((referral) => (
                                            <tr key={referral.id} className="group">
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {referral.referrer_name}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {referral.referrer_email}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {referral.referred_name}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {referral.referred_email}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                                            ₦{Number(referral.commission_amount).toLocaleString()}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {referral.commission_type}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <span className={`${referral.status === 'completed'
                                                            ? 'badge-success'
                                                            : referral.status === 'pending'
                                                                ? 'badge-warning'
                                                                : 'badge-danger'
                                                        }`}>
                                                        {referral.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(referral.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminDashboard;