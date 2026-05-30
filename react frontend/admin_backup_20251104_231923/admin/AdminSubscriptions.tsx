import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Plus,
    Search,
    Filter,
    Eye,
    CreditCard,
    Calendar,
    Users,
    TrendingUp
} from 'lucide-react';
import { subscriptionsApi } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getNomineeImageUrl } from '../../utils/imageUtils';

const AdminSubscriptions: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Fetch subscriptions
    const { data: subscriptionsData, isLoading } = useQuery({
        queryKey: ['admin-subscriptions'],
        queryFn: subscriptionsApi.getSubscriptions
    });

    const subscriptions = subscriptionsData?.data || [];

    // Mock recent subscription data
    const recentSubscriptions = [
        {
            id: 1,
            user: { name: 'John Doe', email: 'john@example.com', image: null },
            plan: 'Premium',
            amount: 5000,
            status: 'PAID',
            created_at: '2024-01-15T10:30:00Z',
            expires_at: '2024-02-15T10:30:00Z'
        },
        {
            id: 2,
            user: { name: 'Jane Smith', email: 'jane@example.com', image: null },
            plan: 'Basic',
            amount: 2000,
            status: 'PENDING',
            created_at: '2024-01-15T09:15:00Z',
            expires_at: '2024-02-15T09:15:00Z'
        }
    ];

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'PAID': { color: 'bg-green-100 text-green-800', label: 'Paid' },
            'PENDING': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
            'CANCELLED': { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
            'EXPIRED': { color: 'bg-gray-100 text-gray-800', label: 'Expired' }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING'];

        return (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
                {config.label}
            </span>
        );
    };

    if (isLoading) {
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
                    <span className="text-gray-900">Subscriptions</span>
                </nav>
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">Subscriptions Management</h1>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">₦125,000</h3>
                            <p className="text-gray-600 font-medium">Total Revenue</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">57</h3>
                            <p className="text-gray-600 font-medium">Active Subscriptions</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">12</h3>
                            <p className="text-gray-600 font-medium">Pending Payments</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">350</h3>
                            <p className="text-gray-600 font-medium">Total Users</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Search className="w-4 h-4 inline mr-1" />
                            Search Subscriptions
                        </label>
                        <input
                            type="text"
                            placeholder="Search by user name, email..."
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
                            <option value="PAID">Paid</option>
                            <option value="PENDING">Pending</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="EXPIRED">Expired</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Subscriptions Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Subscriptions</h2>
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Expires
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recentSubscriptions.map((subscription) => (
                                <tr key={subscription.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <img
                                                src={getNomineeImageUrl({ image: subscription.user.image }) || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'}
                                                alt={subscription.user.name}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {subscription.user.name}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {subscription.user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {subscription.plan}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ₦{subscription.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(subscription.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(subscription.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(subscription.expires_at).toLocaleDateString()}
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
            </div>
        </div>
    );
};

export default AdminSubscriptions; 