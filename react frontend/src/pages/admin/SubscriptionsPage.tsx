import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
    CreditCard,
    Search,
    Filter,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    DollarSign,
    Package,
    TrendingUp,
    RefreshCw,
    Plus,
    Eye,
    ArrowUpRight,
    Star,
    Zap,
    Shield,
    Users,
    Award,
    Target,
    Timer
} from 'lucide-react'
import { subscriptionsApi, votesApi } from '../../services/api'
import AdminLayout from '../../components/AdminLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useAuditLogger } from '../../hooks/useAuditLogger'
import toast from 'react-hot-toast'
import { format, formatDistanceToNow } from 'date-fns'

// Define the subscription response type based on the provided API response
interface SubscriptionData {
    current_plan?: {
        id: number;
        account_id: string;
        sub_id: string;
        start_date: string;
        end_date: string;
        numbers_of_times: string;
        plan_id: string;
        total_amount: string;
        remaining_votes_times: string;
        remaining_votes: string;
        remaining_nominees: string;
        status: string;
        created_at: string;
        updated_at: string;
        plan: {
            id: number;
            name: string;
            slug: string;
            descriptions: string;
            price: string;
            votes: number;
            nominees: number;
            voting_times: number;
            description?: string;
            features?: string;
            status: string;
            activity_type: string;
            duration: number;
            sub_cat_id: string;
            plan_id: string;
            created_at: string;
            updated_at: string;
        };
    };
    subscriptions: Array<{
        id: number;
        account_id: string;
        sub_id: string;
        plan_id: string;
        ip_address: string;
        transaction_id: string;
        trxref: string;
        reference: string;
        gateway_response?: string;
        amount_paid: number;
        total_amount: number;
        channel?: string;
        message?: string;
        status: string;
        pg_id?: string;
        created_at: string;
        updated_at: string;
        plan: {
            id: number;
            name: string;
            slug: string;
            descriptions: string;
            price: string;
            votes: number;
            nominees: number;
            voting_times: number;
            description?: string;
            features?: string;
            status: string;
            activity_type: string;
            duration: number;
            sub_cat_id: string;
            plan_id: string;
            created_at: string;
            updated_at: string;
        };
    }>;
    subs: {
        all: string;
        paid: number;
        pending: number;
    };
    voting: {
        category: string;
        total: string;
        nominees: string;
    };
    left: {
        category: number;
        total: number;
        nominees: number;
    };
}

const SubscriptionsPage: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1)
    const [statusFilter, setStatusFilter] = useState('')
    const [dateFromFilter, setDateFromFilter] = useState('')
    const [dateToFilter, setDateToFilter] = useState('')
    const [showStatsPanel, setShowStatsPanel] = useState(true)
    const [showPlansModal, setShowPlansModal] = useState(false)

    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { logUserAction, logButtonClick } = useAuditLogger({ context: 'UserSubscriptions' })

    // Fetch user subscription details
    const { data: userSubscriptionData, isLoading: userSubscriptionLoading } = useQuery({
        queryKey: ['user-subscription'],
        queryFn: () => subscriptionsApi.getUserSubscription(),
        refetchInterval: 60000
    })

    // Fetch subscription plans for upgrade modal
    const { data: plansData, isLoading: plansLoading } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: () => votesApi.getPricing(),
        enabled: showPlansModal
    })

    useEffect(() => {
        logUserAction('user_subscriptions_viewed', {
            page: currentPage,
            filters: { status: statusFilter, date_from: dateFromFilter, date_to: dateToFilter }
        })
    }, [currentPage, statusFilter, dateFromFilter, dateToFilter, logUserAction])

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)
        logUserAction('subscription_filter_applied', {
            filters: { status: statusFilter, date_from: dateFromFilter, date_to: dateToFilter }
        })
    }

    const clearFilters = () => {
        setStatusFilter('')
        setDateFromFilter('')
        setDateToFilter('')
        setCurrentPage(1)
        logButtonClick('clear_subscription_filters')
    }

    const handleUpgradePlan = () => {
        setShowPlansModal(true)
        logButtonClick('view_upgrade_plans')
    }

    const handleSelectPlan = (planId: string) => {
        // Navigate to subscription checkout or handle plan selection
        navigate(`/votes/pricing?plan=${planId}`)
        logButtonClick('select_subscription_plan', planId)
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            PAID: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
            HOLDING: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
            FAILED: { color: 'bg-red-100 text-red-800', icon: XCircle },
            FREE: { color: 'bg-gray-100 text-gray-800', icon: Package },
            ACTIVE: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            INACTIVE: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
            EXPIRED: { color: 'bg-red-100 text-red-800', icon: Clock },
            CANCELLED: { color: 'bg-yellow-100 text-yellow-800', icon: XCircle }
        }

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INACTIVE
        const Icon = config.icon

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {status}
            </span>
        )
    }

    const subscriptionData = userSubscriptionData?.data as SubscriptionData | undefined
    const plans = plansData?.data?.subscriptions || []

    if (userSubscriptionLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <nav className="text-sm text-gray-500 mb-2">
                    <Link to="/admin/dashboard" className="hover:text-gray-700 dark:text-gray-300">Home</Link>
                    <span className="mx-2">•</span>
                    <span className="text-gray-900 dark:text-white">My Subscriptions</span>
                </nav>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Subscriptions</h1>
                        <p className="text-gray-600 mt-1">
                            Manage your subscription plans and view transaction history
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleUpgradePlan}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Upgrade Plan</span>
                        </button>
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

            {/* Current Subscription Overview */}
            {showStatsPanel && subscriptionData && (
                <>
                    {/* Current Plan Card */}
                    {subscriptionData.current_plan && (
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 mb-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                    <h2 className="text-2xl font-bold mb-2">Current Plan: {subscriptionData.current_plan.plan.name}</h2>
                                    <p className="text-blue-100 mb-4">{subscriptionData.current_plan.plan.descriptions}</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-white/20 rounded-lg p-3">
                                            <div className="flex items-center mb-1">
                                                <Timer className="w-4 h-4 mr-2" />
                                                <span className="text-sm">Expires</span>
                                            </div>
                                            <p className="font-semibold">{format(new Date(subscriptionData.current_plan.end_date), 'MMM dd, yyyy')}</p>
                                        </div>
                                        <div className="bg-white/20 rounded-lg p-3">
                                            <div className="flex items-center mb-1">
                                                <Target className="w-4 h-4 mr-2" />
                                                <span className="text-sm">Remaining Votes</span>
                                            </div>
                                            <p className="font-semibold">{subscriptionData.current_plan.remaining_votes}</p>
                                        </div>
                                        <div className="bg-white/20 rounded-lg p-3">
                                            <div className="flex items-center mb-1">
                                                <Users className="w-4 h-4 mr-2" />
                                                <span className="text-sm">Remaining Nominees</span>
                                            </div>
                                            <p className="font-semibold">{subscriptionData.current_plan.remaining_nominees}</p>
                                        </div>
                                        <div className="bg-white/20 rounded-lg p-3">
                                            <div className="flex items-center mb-1">
                                                <Award className="w-4 h-4 mr-2" />
                                                <span className="text-sm">Voting Times Left</span>
                                            </div>
                                            <p className="font-semibold">{subscriptionData.current_plan.remaining_votes_times}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {getStatusBadge(subscriptionData.current_plan.status)}
                                    <p className="text-3xl font-bold mt-2">₦{parseFloat(subscriptionData.current_plan.total_amount).toLocaleString()}</p>
                                    <p className="text-blue-100">Total Amount</p>
                            </div>
                            </div>
                        </div>
                    )}

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="card-glass border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">₦{parseFloat(subscriptionData.subs.all).toLocaleString()}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                        Paid: ₦{subscriptionData.subs.paid.toLocaleString()}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="card-glass border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Vote Categories</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{subscriptionData.voting.category}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                        Total Votes: {subscriptionData.voting.total}
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Target className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="card-glass border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Nominees</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{subscriptionData.voting.nominees}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Available
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                    <Users className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="card-glass border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{subscriptionData.left.total}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                        {subscriptionData.left.category} categories left
                                </p>
                            </div>
                                <div className="p-3 bg-orange-100 rounded-lg">
                                    <Clock className="w-6 h-6 text-orange-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Subscription History */}
            <div className="card-glass border border-gray-200 dark:border-secondary-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-secondary-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Subscription History ({subscriptionData?.subscriptions?.length || 0})
                        </h2>
                        <div className="flex items-center space-x-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Status</option>
                                    <option value="PAID">Paid</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="FAILED">Failed</option>
                        </select>
                    </div>
                    </div>
                </div>

                {subscriptionData?.subscriptions && subscriptionData.subscriptions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-secondary-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Plan & Transaction
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
                                        Details
                                    </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-secondary-900 divide-y divide-gray-200 dark:divide-secondary-700">
                                {subscriptionData.subscriptions
                                    .filter(sub => !statusFilter || sub.status === statusFilter)
                                    .map((subscription) => (
                                        <tr key={subscription.id} className="hover:bg-gray-50 dark:bg-secondary-800">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="flex items-center">
                                                        <Package className="w-5 h-5 text-blue-500 mr-3" />
                                                        <div>
                                                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {subscription.plan.name}
                                                            </h3>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {subscription.plan.descriptions}
                                                            </p>
                                                            <p className="text-xs text-gray-400">
                                                                ID: {subscription.transaction_id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    <p className="font-medium">₦{subscription.total_amount.toLocaleString()}</p>
                                                    {subscription.amount_paid > 0 && (
                                                        <p className="text-xs text-green-600">
                                                            Paid: ₦{subscription.amount_paid.toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(subscription.status)}
                                                {subscription.channel && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        via {subscription.channel}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                                    {format(new Date(subscription.created_at), 'MMM dd, yyyy')}
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatDistanceToNow(new Date(subscription.created_at), { addSuffix: true })}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                <div className="space-y-1">
                                                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                                        <Target className="w-3 h-3 mr-1" />
                                                        {subscription.plan.votes} votes
                                                    </div>
                                                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                                        <Users className="w-3 h-3 mr-1" />
                                                        {subscription.plan.nominees} nominees
                                                    </div>
                                                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                                        <Award className="w-3 h-3 mr-1" />
                                                        {subscription.plan.voting_times} voting times
                                                    </div>
                                                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {subscription.plan.duration} days
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <Package className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Subscriptions Found</h3>
                        <p className="text-gray-600 mb-6">
                            You haven't made any subscription purchases yet.
                        </p>
                                <button
                            onClick={handleUpgradePlan}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                        >
                            Browse Plans
                                </button>
                    </div>
                )}
            </div>

            {/* Plans Modal */}
            {showPlansModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="card-glass p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Available Plans</h3>
                                <button
                                    onClick={() => setShowPlansModal(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                                >
                                <XCircle className="w-5 h-5" />
                                </button>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {plans.map((plan: any) => (
                                <div key={plan.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                                    <div className="text-center mb-4">
                                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h4>
                                        <p className="text-gray-600 dark:text-gray-400">{plan.description}</p>
                                        <div className="mt-4">
                                            <span className="text-3xl font-bold text-blue-600">₦{parseFloat(plan.price).toLocaleString()}</span>
                                            <span className="text-gray-500 dark:text-gray-400">/{plan.duration} days</span>
                                                    </div>
                                                </div>

                                    <ul className="space-y-2 mb-6">
                                        <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                            {plan.votes} votes
                                        </li>
                                        <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                            {plan.nominees} nominees
                                        </li>
                                        <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                            {plan.voting_times} voting times
                                        </li>
                                    </ul>

                                                <button
                                                    onClick={() => handleSelectPlan(plan.plan_id)}
                                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                        Select Plan
                                                </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SubscriptionsPage 