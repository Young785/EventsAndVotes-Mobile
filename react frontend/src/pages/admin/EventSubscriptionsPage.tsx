import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
    Calendar,
    Search,
    Filter,
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
    Users,
    QrCode,
    Scan,
    MapPin,
    Clock,
    Shield,
    Crown,
    Zap,
    X,
    Check
} from 'lucide-react'
import { eventSubscriptionsApi } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useAuditLogger } from '../../hooks/useAuditLogger'
import toast from 'react-hot-toast'
import { format, formatDistanceToNow } from 'date-fns'

// Define the event subscription response type
interface EventSubscriptionResponse {
    current_plan?: {
        name: string
        end_date?: string
        max_events: number
        max_attendees_per_event: number
        max_scan_locations?: number
        max_scanners_per_location?: number
    }
    subscription?: {
        events_used: number
        remaining_events: number
        total_spent: number
    }
    analytics?: {
        total_events_created: number
        total_tickets_sold: number
        total_revenue: number
        total_scans: number
    }
}

const EventSubscriptionsPage: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1)
    const [statusFilter, setStatusFilter] = useState('')
    const [dateFromFilter, setDateFromFilter] = useState('')
    const [dateToFilter, setDateToFilter] = useState('')
    const [showStatsPanel, setShowStatsPanel] = useState(true)
    const [showPlansModal, setShowPlansModal] = useState(false)

    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { logUserAction, logButtonClick } = useAuditLogger({ context: 'EventSubscriptions' })

    // Fetch user event subscription details
    const { data: eventSubscriptionData, isLoading: eventSubscriptionLoading } = useQuery({
        queryKey: ['event-subscription'],
        queryFn: () => eventSubscriptionsApi.getUserSubscription(),
        refetchInterval: 60000
    })

    // Fetch event subscription plans for upgrade modal
    const { data: plansData, isLoading: plansLoading } = useQuery({
        queryKey: ['event-subscription-plans'],
        queryFn: () => eventSubscriptionsApi.getPlans(),
        enabled: showPlansModal
    })

    // Fetch user's event subscription transactions
    const { data: subscriptionTransactionsData, isLoading: transactionsLoading, error: transactionsError } = useQuery({
        queryKey: ['event-subscription-transactions', currentPage, statusFilter, dateFromFilter, dateToFilter],
        queryFn: () => eventSubscriptionsApi.getSubscriptions({
            page: currentPage,
            per_page: 10,
            status: statusFilter || undefined,
            date_from: dateFromFilter || undefined,
            date_to: dateToFilter || undefined
        }),
        refetchInterval: 30000
    })

    useEffect(() => {
        logUserAction('event_subscriptions_viewed', {
            page: currentPage,
            filters: { status: statusFilter, date_from: dateFromFilter, date_to: dateToFilter }
        })
    }, [currentPage, statusFilter, dateFromFilter, dateToFilter, logUserAction])

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)
        logUserAction('event_subscription_filter_applied', {
            filters: { status: statusFilter, date_from: dateFromFilter, date_to: dateToFilter }
        })
    }

    const clearFilters = () => {
        setStatusFilter('')
        setDateFromFilter('')
        setDateToFilter('')
        setCurrentPage(1)
        logButtonClick('clear_event_subscription_filters')
    }

    const handleUpgradePlan = () => {
        setShowPlansModal(true)
        logButtonClick('view_event_upgrade_plans')
    }

    const handleSelectPlan = (planId: string) => {
        navigate(`/events/pricing?plan=${planId}`)
        logButtonClick('select_event_subscription_plan', planId)
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            pending: { color: 'bg-yellow-100 text-yellow-800', icon: RefreshCw },
            expired: { color: 'bg-red-100 text-red-800', icon: XCircle },
            cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
            failed: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
        }

        const config = statusConfig[status.toLowerCase() as keyof typeof statusConfig] || statusConfig.cancelled
        const Icon = config.icon

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {status.toUpperCase()}
            </span>
        )
    }

    const eventSubscription = eventSubscriptionData?.data as EventSubscriptionResponse
    const subscriptionTransactions = subscriptionTransactionsData?.data?.data || []
    const plans = plansData?.data?.data || []

    const pagination = subscriptionTransactionsData?.data ? {
        current_page: subscriptionTransactionsData.data.current_page,
        last_page: subscriptionTransactionsData.data.last_page,
        per_page: subscriptionTransactionsData.data.per_page,
        total: subscriptionTransactionsData.data.total
    } : null

    if (eventSubscriptionLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-secondary-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <nav className="text-sm text-gray-500 mb-4">
                        <Link to="/admin/dashboard" className="hover:text-gray-700 dark:text-gray-300">Dashboard</Link>
                        <span className="mx-2">•</span>
                        <span className="text-gray-900 dark:text-white">Event Subscriptions</span>
                    </nav>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Event Subscriptions</h1>
                            <p className="text-gray-600 mt-1">
                                Manage your event subscription and view usage analytics
                            </p>
                        </div>
                        {eventSubscription?.current_plan && (
                            <button
                                onClick={handleUpgradePlan}
                                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
                            >
                                <Crown className="w-5 h-5" />
                                <span>Upgrade Plan</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Current Plan Card */}
                {eventSubscription?.current_plan && (
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center space-x-3 mb-2">
                                    <Crown className="w-8 h-8" />
                                    <h2 className="text-2xl font-bold">Current Plan</h2>
                                </div>
                                <h3 className="text-3xl font-bold mb-2">{eventSubscription.current_plan.name}</h3>
                                <p className="text-blue-100 mb-4">
                                    {eventSubscription.current_plan.end_date &&
                                        `Valid until ${format(new Date(eventSubscription.current_plan.end_date), 'MMM dd, yyyy')}`
                                    }
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-blue-100 mb-1">Events Remaining</div>
                                <div className="text-3xl font-bold">
                                    {eventSubscription.subscription?.remaining_events || 0}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
                            <div className="bg-white/10 rounded-xl p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Calendar className="w-5 h-5" />
                                    <span className="text-sm">Max Events</span>
                                </div>
                                <div className="text-2xl font-bold">
                                    {eventSubscription.current_plan.max_events}
                                </div>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Users className="w-5 h-5" />
                                    <span className="text-sm">Max Attendees</span>
                                </div>
                                <div className="text-2xl font-bold">
                                    {eventSubscription.current_plan.max_attendees_per_event?.toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                    <MapPin className="w-5 h-5" />
                                    <span className="text-sm">Scan Locations</span>
                                </div>
                                <div className="text-2xl font-bold">
                                    {eventSubscription.current_plan.max_scan_locations || 'Unlimited'}
                                </div>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                    <QrCode className="w-5 h-5" />
                                    <span className="text-sm">Scanners</span>
                                </div>
                                <div className="text-2xl font-bold">
                                    {eventSubscription.current_plan.max_scanners_per_location || 'Unlimited'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Analytics Dashboard */}
                {eventSubscription?.analytics && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="card-glass p-6 shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Events Created</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {eventSubscription.analytics.total_events_created}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="card-glass p-6 shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tickets Sold</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {eventSubscription.analytics.total_tickets_sold.toLocaleString()}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                                    <Users className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="card-glass p-6 shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                        ${eventSubscription.analytics.total_revenue.toLocaleString()}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </div>

                        <div className="card-glass p-6 shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">QR Scans</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {eventSubscription.analytics.total_scans.toLocaleString()}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                                    <QrCode className="w-6 h-6 text-orange-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Transaction History */}
                <div className="card-glass border overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-secondary-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Subscription History</h2>
                        <p className="text-gray-600 text-sm mt-1">Your event subscription transactions and upgrades</p>
                    </div>

                    {/* Filters */}
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 dark:border-secondary-700">
                        <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-4">
                            <div className="flex-1 min-w-64">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="pending">Pending</option>
                                        <option value="expired">Expired</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <input
                                    type="date"
                                    value={dateFromFilter}
                                    onChange={(e) => setDateFromFilter(e.target.value)}
                                    placeholder="From Date"
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <input
                                    type="date"
                                    value={dateToFilter}
                                    onChange={(e) => setDateToFilter(e.target.value)}
                                    placeholder="To Date"
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                            >
                                <Filter className="w-4 h-4" />
                                <span>Filter</span>
                            </button>
                            {(statusFilter || dateFromFilter || dateToFilter) && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                                >
                                    Clear
                                </button>
                            )}
                        </form>
                    </div>
                    <p className="text-blue-100 mb-4">Get started with an event subscription plan</p>
                    <button
                        onClick={handleUpgradePlan}
                        className="bg-white dark:bg-secondary-900 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                    >
                        Choose Plan
                    </button>
                </div>
                            )}
            </div>

            {/* Analytics Card */}
            <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-lg p-6 border">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <TrendingUp className="w-8 h-8 mr-3 text-green-500" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics</h3>
                            <p className="text-gray-500 text-sm">Your event performance</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {eventSubscription.analytics?.total_events_created || 0}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Events Created</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Users className="w-6 h-6 mx-auto mb-2 text-green-500" />
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {eventSubscription.analytics?.total_tickets_sold || 0}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Tickets Sold</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <DollarSign className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            ₦{eventSubscription.analytics?.total_revenue?.toLocaleString() || 0}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <QrCode className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {eventSubscription.analytics?.total_scans || 0}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">QR Scans</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

{/* Filters */ }
<div className="card-glass border p-6 mb-6">
    <form onSubmit={handleFilterSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filter Transactions
            </h3>
            {(statusFilter || dateFromFilter || dateToFilter) && (
                <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-900"
                >
                    Clear Filters
                </button>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Date</label>
                <input
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Date</label>
                <input
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            <div className="flex items-end">
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                >
                    <Search className="w-4 h-4 mr-2" />
                    Filter
                </button>
            </div>
        </div>
    </form>
</div>

{/* Transaction Table */ }
{
    transactionsLoading ? (
        <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
        </div>
    ) : transactionsError ? (
        <div className="p-6 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Transactions</h3>
            <p className="text-gray-500 dark:text-gray-400">Failed to load subscription transactions. Please try again.</p>
        </div>
    ) : subscriptionTransactions.length === 0 ? (
        <div className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Transactions Yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {statusFilter || dateFromFilter || dateToFilter
                    ? 'No transactions found with the current filters. Try adjusting your search criteria.'
                    : 'You haven\'t made any subscription payments yet. Get started with your first event subscription!'}
            </p>
            {!statusFilter && !dateFromFilter && !dateToFilter && (
                <button
                    onClick={handleUpgradePlan}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2 mx-auto"
                >
                    <Crown className="w-5 h-5" />
                    <span>Choose Your Plan</span>
                </button>
            )}
        </div>
    ) : (
        <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead>
                    <tr className="border-b border-gray-100">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Transaction</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Plan Details</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Amount</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {subscriptionTransactions.map((transaction: any) => (
                        <tr key={transaction.id} className="hover:bg-gray-25 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <DollarSign className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            {transaction.payment_reference || `Payment #${transaction.id}`}
                                        </div>
                                        {transaction.payment_reference && (
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                ID: {transaction.id}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                        {transaction.plan?.name || 'Unknown Plan'}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        Event Subscription
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="font-semibold text-gray-900 dark:text-white">
                                    ${transaction.amount_paid?.toLocaleString() || '0'}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 dark:text-white">
                                    {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {format(new Date(transaction.created_at), 'HH:mm')}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                {getStatusBadge(transaction.status)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

{/* Pagination */ }
{
    pagination && pagination.last_page > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-secondary-700">
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                    {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                    {pagination.total} results
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-secondary-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    : 'text-gray-500 bg-white dark:bg-secondary-900 border border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {page}
                            </button>
                        )
                    })}
                    <button
                        onClick={() => setCurrentPage(Math.min(pagination.last_page, currentPage + 1))}
                        disabled={currentPage === pagination.last_page}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-secondary-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    )
}
</div >

    {/* Beautiful Upgrade Plans Modal */ }
{
    showPlansModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">Choose Your Event Plan</h2>
                            <p className="text-blue-100 mt-1">Unlock powerful event management features</p>
                        </div>
                        <button
                            onClick={() => setShowPlansModal(false)}
                            className="text-white hover:text-gray-200 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="p-8 overflow-y-auto max-h-[calc(95vh-120px)]">
                    {plansLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {plans.map((plan: any) => (
                                <div
                                    key={plan.id}
                                    className={`relative bg-white dark:bg-secondary-900 rounded-2xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl ${plan.is_popular
                                            ? 'border-purple-500 shadow-lg'
                                            : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                >
                                    {plan.is_popular && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center shadow-lg">
                                                <Crown className="w-4 h-4 mr-1" />
                                                Most Popular
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-8">
                                        {/* Plan Header */}
                                        <div className="text-center mb-8">
                                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                            <div className="text-4xl font-bold text-gray-900 mb-2">
                                                ${plan.price?.toLocaleString()}
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400">for {plan.duration_days} days</p>
                                        </div>

                                        {/* Plan Features */}
                                        <div className="space-y-4 mb-8">
                                            <div className="flex items-center text-gray-700 dark:text-gray-300">
                                                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                                    <Check className="w-3 h-3 text-blue-600" />
                                                </div>
                                                <span className="font-medium">{plan.max_events} Events</span>
                                            </div>
                                            <div className="flex items-center text-gray-700 dark:text-gray-300">
                                                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                                    <Check className="w-3 h-3 text-green-600" />
                                                </div>
                                                <span>{plan.max_attendees_per_event?.toLocaleString()} Max Attendees</span>
                                            </div>
                                            <div className="flex items-center text-gray-700 dark:text-gray-300">
                                                <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                                                    <Check className="w-3 h-3 text-purple-600" />
                                                </div>
                                                <span>{plan.max_scan_locations || 'Unlimited'} Scan Locations</span>
                                            </div>
                                            <div className="flex items-center text-gray-700 dark:text-gray-300">
                                                <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                                                    <Check className="w-3 h-3 text-orange-600" />
                                                </div>
                                                <span>{plan.max_scanners_per_location || 'Unlimited'} Scanners per Location</span>
                                            </div>

                                            {/* Scanner Features */}
                                            {plan.scanner_features && plan.scanner_features.length > 0 && (
                                                <div className="mt-6 pt-6 border-t border-gray-100">
                                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                        <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                                                        Scanner Features
                                                    </h4>
                                                    {plan.scanner_features.slice(0, 3).map((feature: string, index: number) => (
                                                        <div key={index} className="flex items-center text-sm text-gray-600 mb-2">
                                                            <div className="w-4 h-4 bg-yellow-100 rounded-full flex items-center justify-center mr-2">
                                                                <Check className="w-2 h-2 text-yellow-600" />
                                                            </div>
                                                            <span>{feature}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* CTA Button */}
                                        <button
                                            onClick={() => handleSelectPlan(plan.id)}
                                            className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${plan.is_popular
                                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg'
                                                    : 'bg-gray-900 text-white hover:bg-gray-800'
                                                }`}
                                        >
                                            <span>Select {plan.name}</span>
                                            <ArrowUpRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-12 text-center">
                        <p className="text-gray-600 mb-4">
                            ✨ All plans include unlimited ticket types, real-time analytics, and 24/7 support
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Need a custom plan? <span className="text-blue-600 hover:text-blue-700 cursor-pointer">Contact our sales team</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
            </div >
        </div >
    )
}

export default EventSubscriptionsPage 