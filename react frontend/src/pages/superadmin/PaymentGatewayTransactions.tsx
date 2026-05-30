import React, { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    Search,
    Filter,
    Download,
    Calendar,
    CreditCard,
    User,
    DollarSign,
    TrendingUp,
    BarChart3,
    CheckCircle,
    Clock,
    XCircle,
    AlertTriangle,
    ExternalLink,
    Eye,
    RefreshCw
} from 'lucide-react'
import AdminLayout from '../../components/AdminLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useAuditLogger } from '../../hooks/useAuditLogger'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface Transaction {
    id: number
    transaction_id: string
    reference: string
    type: 'voting' | 'subscription'
    type_details: {
        vote_name?: string
        vote_id?: string
        votes_count?: number
        plan_name?: string
        plan_id?: string
        duration?: number
    }
    user: {
        name: string
        email: string | null
        account_id: string
    }
    amount_paid: number
    total_amount: number
    gateway_fee: number
    status: 'PAID' | 'PENDING' | 'FAILED' | 'HOLDING'
    channel: string
    created_at: string
    updated_at: string
}

interface PaymentGateway {
    id: number
    name: string
    slug: string
    pg_id: string
    status: string
}

interface TransactionStats {
    total_count: number
    paid_count: number
    pending_count: number
    failed_count: number
    total_revenue: number
    pending_amount: number
    by_type: {
        voting: { count: number; amount: number }
        subscriptions: { count: number; amount: number }
    }
}

const PaymentGatewayTransactions: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [currentPage, setCurrentPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState<'all' | 'voting' | 'subscriptions'>('all')
    const [statusFilter, setStatusFilter] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [showFilters, setShowFilters] = useState(false)

    const { logUserAction, logButtonClick } = useAuditLogger({ context: 'PaymentGatewayTransactions' })
    const { user } = useAuth()

    // Check if user has superadmin access
    const hasAccess = user?.role?.name === 'superadmin'

    if (!hasAccess) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                        <p className="text-gray-600">This page is only accessible to SuperAdmin users.</p>
                    </div>
                </div>
            </AdminLayout>
        )
    }

    // Fetch gateway transactions
    const { data: transactionsData, isLoading, error, refetch } = useQuery({
        queryKey: ['gateway-transactions', id, currentPage, searchQuery, typeFilter, statusFilter, dateFrom, dateTo],
        queryFn: async () => {
            const params = new URLSearchParams()
            params.append('page', currentPage.toString())
            params.append('per_page', '20')
            if (searchQuery) params.append('search', searchQuery)
            if (typeFilter !== 'all') params.append('type', typeFilter)
            if (statusFilter) params.append('status', statusFilter)
            if (dateFrom) params.append('date_from', dateFrom)
            if (dateTo) params.append('date_to', dateTo)

            const response = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/payment-gateways/${id}/transactions?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch gateway transactions')
            }

            return response.json()
        },
        refetchInterval: 30000,
        enabled: !!id
    })

    // Export transactions mutation
    const exportTransactionsMutation = useMutation({
        mutationFn: async (format: string) => {
            const params = new URLSearchParams()
            if (searchQuery) params.append('search', searchQuery)
            if (typeFilter !== 'all') params.append('type', typeFilter)
            if (statusFilter) params.append('status', statusFilter)
            if (dateFrom) params.append('date_from', dateFrom)
            if (dateTo) params.append('date_to', dateTo)
            params.append('format', format)

            const response = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/payment-gateways/${id}/transactions/export?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('Failed to export transactions')
            }

            // Handle file download
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `gateway_${transactionsData?.gateway?.slug}_transactions.${format}`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        },
        onSuccess: () => {
            toast.success('Transactions exported successfully')
            logUserAction('gateway_transactions_exported')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to export transactions')
        }
    })

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)
        refetch()
        logUserAction('gateway_transactions_search', { query: searchQuery })
    }

    const handleExport = (format: string) => {
        exportTransactionsMutation.mutate(format)
        logButtonClick('export_gateway_transactions', format)
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            PAID: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
            FAILED: { color: 'bg-red-100 text-red-800', icon: XCircle },
            HOLDING: { color: 'bg-blue-100 text-blue-800', icon: Clock }
        }

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
        const Icon = config.icon

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {status}
            </span>
        )
    }

    const getTypeBadge = (type: string) => {
        return type === 'voting' ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Voting
            </span>
        ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Subscription
            </span>
        )
    }

    const transactions = transactionsData?.data || []
    const gateway = transactionsData?.gateway
    const stats = transactionsData?.stats as TransactionStats
    const pagination = transactionsData ? {
        current_page: transactionsData.current_page,
        last_page: transactionsData.last_page,
        per_page: transactionsData.per_page,
        total: transactionsData.total
    } : null

    useEffect(() => {
        if (id) {
            logUserAction('gateway_transactions_viewed', { gateway_id: id, page: currentPage })
        }
    }, [id, currentPage, logUserAction])

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Transactions</h2>
                    <p className="text-gray-600 mb-4">Failed to load gateway transactions</p>
                    <button
                        onClick={() => refetch()}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-8xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate('/superadmin/payment-gateways')}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                                <CreditCard className="w-8 h-8 mr-3 text-blue-600" />
                                {gateway?.name} Transactions
                            </h1>
                            <p className="text-gray-600 mt-2">
                                View and manage all transactions processed through {gateway?.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => refetch()}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </button>
                        <button
                            onClick={() => handleExport('csv')}
                            disabled={exportTransactionsMutation.isPending}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Gateway Info */}
            {gateway && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <CreditCard className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{gateway.name}</h3>
                                <p className="text-sm text-gray-500">Gateway ID: {gateway.pg_id}</p>
                            </div>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${gateway.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {gateway.status}
                        </span>
                    </div>
                </div>
            )}

            {/* Statistics */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <BarChart3 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total_count}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">₦{stats.total_revenue.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                                <p className="text-2xl font-bold text-gray-900">₦{stats.pending_amount.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats.total_count > 0 ? Math.round((stats.paid_count / stats.total_count) * 100) : 0}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Type Breakdown */}
            {stats && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Breakdown by Type</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{stats.by_type.voting.count}</div>
                            <div className="text-sm text-gray-600">Voting Transactions</div>
                            <div className="text-lg font-semibold text-green-600 mt-1">
                                ₦{stats.by_type.voting.amount.toLocaleString()}
                            </div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">{stats.by_type.subscriptions.count}</div>
                            <div className="text-sm text-gray-600">Subscription Transactions</div>
                            <div className="text-lg font-semibold text-green-600 mt-1">
                                ₦{stats.by_type.subscriptions.amount.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                    >
                        <Filter className="w-4 h-4 mr-1" />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>
                </div>

                <form onSubmit={handleSearch} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Search
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by transaction ID, reference, user..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type
                            </label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as 'all' | 'voting' | 'subscriptions')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Types</option>
                                <option value="voting">Voting</option>
                                <option value="subscriptions">Subscriptions</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Statuses</option>
                                <option value="PAID">Paid</option>
                                <option value="PENDING">Pending</option>
                                <option value="FAILED">Failed</option>
                                <option value="HOLDING">Holding</option>
                            </select>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date From
                                </label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date To
                                </label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                Apply Filters
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('')
                                    setTypeFilter('all')
                                    setStatusFilter('')
                                    setDateFrom('')
                                    setDateTo('')
                                    setCurrentPage(1)
                                    refetch()
                                }}
                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
                            >
                                Clear Filters
                            </button>
                        </div>
                        {pagination && (
                            <div className="text-sm text-gray-600">
                                Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                                {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                                {pagination.total} transactions
                            </div>
                        )}
                    </div>
                </form>
            </div>

            {/* Transactions Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <LoadingSpinner />
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Transaction
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
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
                                {transactions.map((transaction: Transaction) => (
                                    <tr key={transaction.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {transaction.transaction_id}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {transaction.reference}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-1">
                                                {getTypeBadge(transaction.type)}
                                                <div className="text-xs text-gray-500">
                                                    {transaction.type === 'voting'
                                                        ? transaction.type_details.vote_name
                                                        : transaction.type_details.plan_name}
                                                </div>
                                                {transaction.type === 'voting' && transaction.type_details.votes_count && (
                                                    <div className="text-xs text-blue-600">
                                                        {transaction.type_details.votes_count} votes
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {transaction.user.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {transaction.user.email || 'No email'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    ₦{transaction.amount_paid.toLocaleString()}
                                                </div>
                                                {transaction.gateway_fee > 0 && (
                                                    <div className="text-xs text-gray-500">
                                                        Fee: ₦{transaction.gateway_fee.toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(transaction.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Empty State */}
                    {transactions.length === 0 && (
                        <div className="text-center py-12">
                            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h3>
                            <p className="text-gray-600">
                                No transactions match your current filters.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between mt-6">
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
            )}
        </div>
    )
}

export default PaymentGatewayTransactions 