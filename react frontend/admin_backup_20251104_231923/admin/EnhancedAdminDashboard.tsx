import React from 'react';
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
    BarChart3
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi, superAdminApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AdminLayout from '../../components/AdminLayout';
import AnalyticsChart from '../../components/AnalyticsChart';
import ActivityFeed from '../../components/ActivityFeed';
import QuickActions from '../../components/QuickActions';

const EnhancedAdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const userRole = user?.role?.name || '';
    const isSuperAdmin = userRole === 'superadmin';
    const isAdmin = ['admin', 'admin_vote', 'admin_both'].includes(userRole);
    const hasEventRole = ['admin_event', 'admin_both'].includes(userRole);

    // Fetch dashboard stats
    const { data: dashboardStats, isLoading: statsLoading } = useQuery({
        queryKey: ['admin-dashboard-stats'],
        queryFn: isSuperAdmin ? superAdminApi.getDashboardStats : adminApi.getDashboardStats,
        enabled: isAdmin || isSuperAdmin
    });

    // Mock subscription data (replace with actual API call)
    const subscriptionData = {
        total_amount: 125000,
        paid: { count: 45, amount: 98000 },
        pending: { count: 12, amount: 27000 }
    };

    // Mock recent data
    const recentSubscriptions = [
        {
            id: 1,
            user: { name: 'John Doe', email: 'john@example.com', image: null },
            plan: 'Premium',
            amount: 5000,
            status: 'PAID',
            created_at: '2024-01-15T10:30:00Z'
        },
        {
            id: 2,
            user: { name: 'Jane Smith', email: 'jane@example.com', image: null },
            plan: 'Basic',
            amount: 2000,
            status: 'PENDING',
            created_at: '2024-01-15T09:15:00Z'
        }
    ];

    if (statsLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner />
                </div>
            </AdminLayout>
        );
    }

    const stats = dashboardStats?.data || {};

    return (
        <div className="space-y-6">
            {/* Subscription Expiration Warning */}
            {user?.subscription && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            <div>
                                <p className="text-yellow-800 font-medium">
                                    Subscription Notice
                                </p>
                                <p className="text-yellow-700 text-sm">
                                    Your subscription is active. Manage your subscription to avoid interruption.
                                </p>
                            </div>
                        </div>
                        <Link
                            to="/admin/subscriptions"
                            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors duration-200"
                        >
                            Manage Subscription
                        </Link>
                    </div>
                </div>
            )}

            {/* Breadcrumb */}
            <div>
                <nav className="text-sm text-gray-500 mb-2">
                    <Link to="/admin/dashboard" className="hover:text-gray-700">Home</Link>
                    <span className="mx-2">•</span>
                    <span className="text-gray-900">Enhanced Dashboard</span>
                </nav>
                <h1 className="text-3xl font-bold text-gray-900">Enhanced Dashboard</h1>
                <p className="text-gray-600 mt-2">
                    Advanced analytics and insights for your platform
                </p>
            </div>

            {/* Quick Actions */}
            <QuickActions showFeatured={true} maxActions={4} />

            {/* Stats Cards Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Organisers Card (Super Admin Only) */}
                {isSuperAdmin && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">350</h3>
                                    <p className="text-blue-600 font-medium">Organisers</p>
                                    <p className="text-sm text-gray-500 mt-1">Total organisers on the platform.</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Users className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-blue-600 text-white px-6 py-3">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-lg font-semibold">10</p>
                                    <p className="text-xs text-blue-100">Active</p>
                                </div>
                                <div className="border-l border-blue-500 pl-4">
                                    <p className="text-lg font-semibold">5</p>
                                    <p className="text-xs text-blue-100">Inactive</p>
                                </div>
                                <div className="border-l border-blue-500 pl-4">
                                    <p className="text-lg font-semibold">3</p>
                                    <p className="text-xs text-blue-100">Pending</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Subscriptions Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    ₦{subscriptionData.total_amount.toLocaleString()}
                                </h3>
                                <p className="text-purple-600 font-medium">Subscriptions</p>
                                <p className="text-sm text-gray-500 mt-1">Total amount of subscriptions.</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-purple-600 text-white px-6 py-3">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <p className="text-lg font-semibold">{subscriptionData.paid.count}</p>
                                <p className="text-xs text-purple-100">
                                    ₦{subscriptionData.paid.amount.toLocaleString()}
                                </p>
                                <p className="text-xs text-purple-100">Paid</p>
                            </div>
                            <div className="border-l border-purple-500 pl-4">
                                <p className="text-lg font-semibold">{subscriptionData.pending.count}</p>
                                <p className="text-xs text-purple-100">
                                    ₦{subscriptionData.pending.amount.toLocaleString()}
                                </p>
                                <p className="text-xs text-purple-100">Pending</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Events Card (Event Role Only) */}
                {hasEventRole && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">800</h3>
                                    <p className="text-green-600 font-medium">Events</p>
                                    <p className="text-sm text-gray-500 mt-1">Total number of events.</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-green-600 text-white px-6 py-3">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-lg font-semibold">150</p>
                                    <p className="text-xs text-green-100">Upcoming</p>
                                </div>
                                <div className="border-l border-green-500 pl-4">
                                    <p className="text-lg font-semibold">50</p>
                                    <p className="text-xs text-green-100">Live</p>
                                </div>
                                <div className="border-l border-green-500 pl-4">
                                    <p className="text-lg font-semibold">600</p>
                                    <p className="text-xs text-green-100">Completed</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Analytics Chart and Activity Feed Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <AnalyticsChart
                    title="Revenue & Vote Analytics"
                    period="monthly"
                    showDownload={true}
                />
                <ActivityFeed
                    title="Recent Activities"
                    limit={8}
                    showFilters={true}
                />
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">1,234</h3>
                            <p className="text-orange-600 font-medium">Total Events</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-green-500 font-medium">+12.5%</span>
                        <span className="text-gray-500 ml-1">from last month</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">89</h3>
                            <p className="text-teal-600 font-medium">Schools</p>
                        </div>
                        <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-teal-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-green-500 font-medium">+8.2%</span>
                        <span className="text-gray-500 ml-1">from last month</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">456</h3>
                            <p className="text-pink-600 font-medium">Faculties</p>
                        </div>
                        <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                            <Vote className="w-6 h-6 text-pink-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-green-500 font-medium">+15.3%</span>
                        <span className="text-gray-500 ml-1">from last month</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">1,890</h3>
                            <p className="text-indigo-600 font-medium">Departments</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Activity className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-green-500 font-medium">+22.1%</span>
                        <span className="text-gray-500 ml-1">from last month</span>
                    </div>
                </div>
            </div>

            {/* Recent Subscriptions Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Subscriptions</h3>
                        <Link
                            to="/admin/subscriptions"
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            View All
                        </Link>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Plan
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recentSubscriptions.map((subscription) => (
                                <tr key={subscription.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-medium text-gray-600">
                                                    {subscription.user.name.charAt(0)}
                                                </span>
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {subscription.user.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {subscription.user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {subscription.plan}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ₦{subscription.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${subscription.status === 'PAID'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {subscription.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(subscription.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EnhancedAdminDashboard; 