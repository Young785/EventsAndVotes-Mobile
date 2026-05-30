import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Eye,
    Users,
    DollarSign,
    Calendar,
    TrendingUp,
    Settings,
    MoreVertical,
    X,
    Star,
    Package,
    Activity,
    CheckCircle,
    XCircle,
    Clock,
    CreditCard,
    BarChart3,
    AlertTriangle,
    ArrowUpRight
} from 'lucide-react';
import { eventsApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import SettingsService from '../../services/settingsService';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';

interface EventSubscriptionPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    duration_days: number;
    max_events: number;
    max_attendees_per_event: number;
    features: string[];
    is_active: boolean;
    is_popular: boolean;
    created_at: string;
    updated_at: string;
    subscribers_count?: number;
    revenue?: number;
}

interface EventSubscription {
    id: string;
    user_id: string;
    plan_id: string;
    status: 'active' | 'expired' | 'cancelled' | 'pending';
    start_date: string;
    end_date: string;
    auto_renew: boolean;
    created_at: string;
    plan: EventSubscriptionPlan;
    user: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
    };
}

interface ApiResponse<T> {
    data: T[];
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
}

interface AnalyticsData {
    total_plans?: number;
    active_subscriptions?: number;
    monthly_revenue?: number;
    growth_rate?: number;
}

const EventsSubscription: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions' | 'analytics'>('plans');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
    const [showEditPlanModal, setShowEditPlanModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<EventSubscriptionPlan | null>(null);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [showStatsPanel, setShowStatsPanel] = useState(true);

    const queryClient = useQueryClient();
    const { user } = useAuth();

    // Check if user is superadmin - only superadmin can access this page
    const isSuperAdmin = user?.role?.name === 'superadmin';

    // Redirect non-superadmin users
    if (!isSuperAdmin) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    // Fetch subscription plans - only for superadmin
    const { data: plansData, isLoading: plansLoading, error: plansError } = useQuery({
        queryKey: ['event-subscription-plans', currentPage, searchQuery, statusFilter],
        queryFn: () => eventsApi.getEventSubscriptionPlans({
            page: currentPage,
            search: searchQuery,
            status: statusFilter
        }),
        enabled: activeTab === 'plans' && isSuperAdmin
    });

    // Fetch subscriptions - only for superadmin
    const { data: subscriptionsData, isLoading: subscriptionsLoading, error: subscriptionsError } = useQuery({
        queryKey: ['event-subscriptions', currentPage, searchQuery, statusFilter],
        queryFn: () => eventsApi.getEventSubscriptions({
            page: currentPage,
            search: searchQuery,
            status: statusFilter
        }),
        enabled: activeTab === 'subscriptions' && isSuperAdmin
    });

    // Fetch analytics - only for superadmin
    const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
        queryKey: ['event-subscription-analytics'],
        queryFn: () => eventsApi.getEventSubscriptionAnalytics(),
        enabled: activeTab === 'analytics' && isSuperAdmin
    });

    // Delete plan mutation
    const deletePlanMutation = useMutation({
        mutationFn: eventsApi.deleteEventSubscriptionPlan,
        onSuccess: () => {
            toast.success('Plan deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['event-subscription-plans'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete plan');
        }
    });

    // Toggle plan status mutation
    const togglePlanStatusMutation = useMutation({
        mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
            eventsApi.updateEventSubscriptionPlan(id, { is_active }),
        onSuccess: () => {
            toast.success('Plan status updated successfully');
            queryClient.invalidateQueries({ queryKey: ['event-subscription-plans'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update plan status');
        }
    });

    const formatCurrency = (amount: number) => {
        const currencySymbol = SettingsService.getCurrencySymbol();
        return `${currencySymbol}${amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'active': { bg: 'bg-green-100', text: 'text-green-800', label: 'Active', icon: CheckCircle },
            'expired': { bg: 'bg-red-100', text: 'text-red-800', label: 'Expired', icon: XCircle },
            'cancelled': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled', icon: XCircle },
            'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending', icon: Clock },
            'inactive': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive', icon: XCircle }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        const IconComponent = config.icon;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                <IconComponent className="w-3 h-3 mr-1" />
                {config.label}
            </span>
        );
    };

    const handleDeletePlan = (id: string) => {
        if (window.confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
            deletePlanMutation.mutate(id);
        }
    };

    const handleTogglePlanStatus = (id: string, currentStatus: boolean) => {
        togglePlanStatusMutation.mutate({ id, is_active: !currentStatus });
    };

    const handleEditPlan = (plan: EventSubscriptionPlan) => {
        setSelectedPlan(plan);
        setShowEditPlanModal(true);
    };

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
        setCurrentPage(1);
    };

    // Safely extract data with proper typing
    const plans = (plansData as ApiResponse<EventSubscriptionPlan>)?.data || [];
    const subscriptions = (subscriptionsData as ApiResponse<EventSubscription>)?.data || [];
    const analytics = (analyticsData as { data: AnalyticsData })?.data || {};

    // Get pagination data based on active tab
    const pagination = (() => {
        if (activeTab === 'plans' && plansData) {
            return {
                current_page: (plansData as any).current_page,
                last_page: (plansData as any).last_page,
                per_page: (plansData as any).per_page,
                total: (plansData as any).total
            };
        } else if (activeTab === 'subscriptions' && subscriptionsData) {
            return {
                current_page: (subscriptionsData as any).current_page,
                last_page: (subscriptionsData as any).last_page,
                per_page: (subscriptionsData as any).per_page,
                total: (subscriptionsData as any).total
            };
        }
        return null;
    })();

    if (plansLoading || subscriptionsLoading || analyticsLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <nav className="text-sm text-gray-500 mb-2">
                    <Link to="/admin/dashboard" className="hover:text-gray-700">Home</Link>
                    <span className="mx-2">•</span>
                    <span className="text-gray-900">Events Subscription</span>
                </nav>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center space-x-3">
                            <h1 className="text-3xl font-bold text-gray-900">Events Subscription</h1>
                            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                Super Admin Only
                            </span>
                        </div>
                        <p className="text-gray-600 mt-1">
                            Manage subscription plans and track subscriptions
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        {activeTab === 'plans' && isSuperAdmin && (
                            <button
                                onClick={() => setShowCreatePlanModal(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Create Plan</span>
                            </button>
                        )}
                        <button
                            onClick={() => setShowStatsPanel(!showStatsPanel)}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
                        >
                            <Eye className="w-4 h-4" />
                            <span>{showStatsPanel ? 'Hide' : 'Show'} Stats</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('plans')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'plans'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Package className="w-4 h-4 inline mr-2" />
                        Plans
                    </button>
                    <button
                        onClick={() => setActiveTab('subscriptions')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'subscriptions'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Users className="w-4 h-4 inline mr-2" />
                        Subscriptions
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'analytics'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <BarChart3 className="w-4 h-4 inline mr-2" />
                        Analytics
                    </button>
                </nav>
            </div>

            {/* Analytics Stats Panel */}
            {showStatsPanel && activeTab === 'analytics' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Plans</p>
                                <p className="text-2xl font-bold text-gray-900">{analytics.total_plans || 0}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Package className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                                <p className="text-2xl font-bold text-gray-900">{analytics.active_subscriptions || 0}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Users className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(analytics.monthly_revenue || 0)}
                                </p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <DollarSign className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {analytics.growth_rate || 0}%
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            {(activeTab === 'plans' || activeTab === 'subscriptions') && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <form onSubmit={handleFilterSubmit} className="grid md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Search className="w-4 h-4 inline mr-1" />
                                Search
                            </label>
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}...`}
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
                                {activeTab === 'plans' ? (
                                    <>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="active">Active</option>
                                        <option value="expired">Expired</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="pending">Pending</option>
                                    </>
                                )}
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                            >
                                <Search className="w-4 h-4 mr-2" />
                                Filter
                            </button>
                        </div>

                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                            >
                                Clear
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Plans Tab */}
            {activeTab === 'plans' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Subscription Plans ({plans.length})
                        </h2>
                    </div>

                    {plansError ? (
                        <div className="p-8 text-center text-red-500">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                            <p>Failed to load subscription plans</p>
                        </div>
                    ) : !plans.length ? (
                        <div className="text-center py-16">
                            <div className="text-gray-400 mb-4">
                                <Package className="w-24 h-24 mx-auto" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                No Plans Available
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Create your first subscription plan to get started.
                            </p>
                            {isSuperAdmin && (
                                <button
                                    onClick={() => setShowCreatePlanModal(true)}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Create Plan</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {plans.map((plan: EventSubscriptionPlan) => (
                                    <div key={plan.id} className={`bg-white rounded-lg shadow border-2 transition-all duration-200 hover:shadow-lg ${plan.is_popular ? 'border-blue-500' : 'border-gray-200'}`}>
                                        {plan.is_popular && (
                                            <div className="bg-blue-500 text-white text-center py-2 text-sm font-medium rounded-t-lg">
                                                <Star className="w-4 h-4 inline mr-1" />
                                                Most Popular
                                            </div>
                                        )}

                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                                    <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
                                                </div>

                                                <div className="relative dropdown-container">
                                                    <button
                                                        onClick={() => setOpenDropdown(openDropdown === plan.id ? null : plan.id)}
                                                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>

                                                    {openDropdown === plan.id && (
                                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                                            <div className="py-1">
                                                                <button
                                                                    onClick={() => {
                                                                        handleEditPlan(plan);
                                                                        setOpenDropdown(null);
                                                                    }}
                                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                                                >
                                                                    <Edit className="w-4 h-4 mr-2" />
                                                                    Edit Plan
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        handleTogglePlanStatus(plan.id, plan.is_active);
                                                                        setOpenDropdown(null);
                                                                    }}
                                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                                                >
                                                                    {plan.is_active ? (
                                                                        <>
                                                                            <XCircle className="w-4 h-4 mr-2" />
                                                                            Deactivate
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <CheckCircle className="w-4 h-4 mr-2" />
                                                                            Activate
                                                                        </>
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        handleDeletePlan(plan.id);
                                                                        setOpenDropdown(null);
                                                                    }}
                                                                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                                    Delete Plan
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <div className="text-3xl font-bold text-gray-900">
                                                    {formatCurrency(plan.price)}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    per {plan.duration_days} days
                                                </div>
                                            </div>

                                            <div className="space-y-2 mb-6">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Calendar className="w-4 h-4 mr-2" />
                                                    <span>Up to {plan.max_events} events</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Users className="w-4 h-4 mr-2" />
                                                    <span>{plan.max_attendees_per_event} attendees per event</span>
                                                </div>
                                                {plan.features && plan.features.length > 0 && (
                                                    <div className="mt-3">
                                                        <div className="text-sm font-medium text-gray-900 mb-2">Features:</div>
                                                        <ul className="text-xs text-gray-600 space-y-1">
                                                            {plan.features.map((feature, index) => (
                                                                <li key={index} className="flex items-center">
                                                                    <CheckCircle className="w-3 h-3 mr-2 text-green-500" />
                                                                    {feature}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between">
                                                {getStatusBadge(plan.is_active ? 'active' : 'inactive')}
                                                <div className="text-sm text-gray-500">
                                                    {plan.subscribers_count || 0} subscribers
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Subscriptions Tab */}
            {activeTab === 'subscriptions' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Active Subscriptions ({subscriptions.length})
                        </h2>
                    </div>

                    {subscriptionsError ? (
                        <div className="p-8 text-center text-red-500">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                            <p>Failed to load subscriptions</p>
                        </div>
                    ) : !subscriptions.length ? (
                        <div className="text-center py-16">
                            <div className="text-gray-400 mb-4">
                                <Users className="w-24 h-24 mx-auto" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                No Subscriptions Found
                            </h3>
                            <p className="text-gray-600">
                                No subscriptions match your current filters.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User Details
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Plan & Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Duration
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Auto Renew
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {subscriptions.map((subscription: EventSubscription) => (
                                        <tr key={subscription.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                            <Users className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {subscription.user.first_name} {subscription.user.last_name}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {subscription.user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-2">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {subscription.plan.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {formatCurrency(subscription.plan.price)}
                                                    </div>
                                                    {getStatusBadge(subscription.status)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-gray-500">
                                                    <div>Start: {format(new Date(subscription.start_date), 'MMM dd, yyyy')}</div>
                                                    <div>End: {format(new Date(subscription.end_date), 'MMM dd, yyyy')}</div>
                                                    <div className="text-gray-400 mt-1">
                                                        {formatDistanceToNow(new Date(subscription.end_date), { addSuffix: true })}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(subscription.auto_renew ? 'active' : 'inactive')}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <button className="text-blue-600 hover:text-blue-900">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button className="text-red-600 hover:text-red-900">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
                <div className="space-y-6">
                    {/* Stats are shown in the stats panel above when showStatsPanel is true */}
                    {!showStatsPanel && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Plans</p>
                                        <p className="text-2xl font-bold text-gray-900">{analytics.total_plans || 0}</p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <Package className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                                        <p className="text-2xl font-bold text-gray-900">{analytics.active_subscriptions || 0}</p>
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <Users className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {formatCurrency(analytics.monthly_revenue || 0)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-yellow-100 rounded-lg">
                                        <DollarSign className="w-6 h-6 text-yellow-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {analytics.growth_rate || 0}%
                                        </p>
                                    </div>
                                    <div className="p-3 bg-purple-100 rounded-lg">
                                        <TrendingUp className="w-6 h-6 text-purple-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Analytics Dashboard
                        </h3>
                        <p className="text-gray-600">
                            Detailed analytics and reporting features will be available here.
                        </p>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
                <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                            {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                            {pagination.total} results
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                                const page = i + Math.max(1, currentPage - 2)
                                if (page > pagination.last_page) return null
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg ${page === currentPage
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                )
                            })}
                            <button
                                onClick={() => setCurrentPage(Math.min(pagination.last_page, currentPage + 1))}
                                disabled={currentPage === pagination.last_page}
                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Plan Modal */}
            {showCreatePlanModal && (
                <CreatePlanModal
                    onClose={() => setShowCreatePlanModal(false)}
                    onSuccess={() => {
                        setShowCreatePlanModal(false);
                        queryClient.invalidateQueries({ queryKey: ['event-subscription-plans'] });
                    }}
                />
            )}

            {/* Edit Plan Modal */}
            {showEditPlanModal && selectedPlan && (
                <EditPlanModal
                    plan={selectedPlan}
                    onClose={() => {
                        setShowEditPlanModal(false);
                        setSelectedPlan(null);
                    }}
                    onSuccess={() => {
                        setShowEditPlanModal(false);
                        setSelectedPlan(null);
                        queryClient.invalidateQueries({ queryKey: ['event-subscription-plans'] });
                    }}
                />
            )}
        </div>
    );
};

// Create Plan Modal Component
const CreatePlanModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        duration_days: '',
        max_events: '',
        max_attendees_per_event: '',
        features: '',
        is_active: true,
        is_popular: false
    });

    const createPlanMutation = useMutation({
        mutationFn: eventsApi.createEventSubscriptionPlan,
        onSuccess: () => {
            toast.success('Plan created successfully');
            onSuccess();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create plan');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const planData = {
            ...formData,
            price: parseFloat(formData.price),
            duration_days: parseInt(formData.duration_days),
            max_events: parseInt(formData.max_events),
            max_attendees_per_event: parseInt(formData.max_attendees_per_event),
            features: formData.features.split('\n').filter(f => f.trim())
        };

        createPlanMutation.mutate(planData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Create Subscription Plan</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Plan Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Price ({SettingsService.getCurrencySymbol()})</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Days)</label>
                            <input
                                type="number"
                                required
                                value={formData.duration_days}
                                onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Max Events</label>
                            <input
                                type="number"
                                required
                                value={formData.max_events}
                                onChange={(e) => setFormData({ ...formData, max_events: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Max Attendees per Event</label>
                            <input
                                type="number"
                                required
                                value={formData.max_attendees_per_event}
                                onChange={(e) => setFormData({ ...formData, max_attendees_per_event: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                            required
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Features (one per line)</label>
                        <textarea
                            rows={4}
                            value={formData.features}
                            onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                            placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Active Plan</span>
                        </label>

                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.is_popular}
                                onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Popular Plan</span>
                        </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createPlanMutation.isPending}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {createPlanMutation.isPending ? 'Creating...' : 'Create Plan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Edit Plan Modal Component
const EditPlanModal: React.FC<{
    plan: EventSubscriptionPlan;
    onClose: () => void;
    onSuccess: () => void
}> = ({ plan, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: plan.name,
        description: plan.description,
        price: plan.price.toString(),
        duration_days: plan.duration_days.toString(),
        max_events: plan.max_events.toString(),
        max_attendees_per_event: plan.max_attendees_per_event.toString(),
        features: plan.features ? plan.features.join('\n') : '',
        is_active: plan.is_active,
        is_popular: plan.is_popular
    });

    const updatePlanMutation = useMutation({
        mutationFn: (data: any) => eventsApi.updateEventSubscriptionPlan(plan.id, data),
        onSuccess: () => {
            toast.success('Plan updated successfully');
            onSuccess();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update plan');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const planData = {
            ...formData,
            price: parseFloat(formData.price),
            duration_days: parseInt(formData.duration_days),
            max_events: parseInt(formData.max_events),
            max_attendees_per_event: parseInt(formData.max_attendees_per_event),
            features: formData.features.split('\n').filter(f => f.trim())
        };

        updatePlanMutation.mutate(planData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Edit Subscription Plan</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Plan Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Price ({SettingsService.getCurrencySymbol()})</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Days)</label>
                            <input
                                type="number"
                                required
                                value={formData.duration_days}
                                onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Max Events</label>
                            <input
                                type="number"
                                required
                                value={formData.max_events}
                                onChange={(e) => setFormData({ ...formData, max_events: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Max Attendees per Event</label>
                            <input
                                type="number"
                                required
                                value={formData.max_attendees_per_event}
                                onChange={(e) => setFormData({ ...formData, max_attendees_per_event: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                            required
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Features (one per line)</label>
                        <textarea
                            rows={4}
                            value={formData.features}
                            onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                            placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Active Plan</span>
                        </label>

                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.is_popular}
                                onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Popular Plan</span>
                        </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={updatePlanMutation.isPending}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {updatePlanMutation.isPending ? 'Updating...' : 'Update Plan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventsSubscription; 