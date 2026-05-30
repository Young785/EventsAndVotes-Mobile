import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Search,
    Filter,
    Download,
    Eye,
    Trash2,
    AlertTriangle,
    DollarSign,
    Calendar,
    CreditCard,
    TrendingUp,
    Users,
    Activity,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    Shield,
    FileText,
    FileSpreadsheet,
    ChevronLeft,
    ChevronRight,
    Info,
    MapPin,
    Smartphone,
    Globe,
    Database,
    X,
    Package
} from 'lucide-react'
import { useAuditLogger } from '../../hooks/useAuditLogger'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface SubscriptionTransaction {
    id: number
    transaction_id: string
    account_id: string
    sub_id: string
    plan_id: string
    reference: string
    trxref?: string
    total_amount: number
    amount_paid: number
    gateway_response?: string
    channel?: string
    message?: string
    status: 'PAID' | 'PENDING' | 'HOLDING' | 'FAILED'
    ip_address: string
    plan: {
        id: number
        name: string
        slug: string
        price: number
        duration: number
        votes: number
        nominees: number
        voting_times: number
    }
    user?: {
        id: number
        first_name: string
        last_name: string
        email: string
        account_id: string
    }
    subscription?: any
    created_at: string
    updated_at: string
}

const SuperAdminSubscriptionTransactions: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [planFilter, setPlanFilter] = useState('')
    const [dateFromFilter, setDateFromFilter] = useState('')
    const [dateToFilter, setDateToFilter] = useState('')
    const [selectedTransaction, setSelectedTransaction] = useState<SubscriptionTransaction | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [showExportMenu, setShowExportMenu] = useState(false)

    const queryClient = useQueryClient()
    const { logUserAction, logButtonClick } = useAuditLogger({ context: 'SuperAdminSubscriptionTransactions' })
    const { user } = useAuth()

    // Check if user has superadmin access
    const hasAccess = user?.role?.name === 'superadmin'

    if (!hasAccess) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">This page is only accessible to SuperAdmin users.</p>
                </div>
            </div>
        )
    }

    // Fetch subscription transactions with pagination and filtering
    const { data: transactionsData, isLoading, error, refetch } = useQuery({
        queryKey: ['superadmin-subscription-transactions', currentPage, searchQuery, statusFilter, planFilter, dateFromFilter, dateToFilter],
        queryFn: async () => {
            const params = new URLSearchParams()
            params.append('page', currentPage.toString())
            params.append('per_page', '20')
            if (searchQuery) params.append('search', searchQuery)
            if (statusFilter) params.append('status', statusFilter)
            if (planFilter) params.append('plan', planFilter)
            if (dateFromFilter) params.append('date_from', dateFromFilter)
            if (dateToFilter) params.append('date_to', dateToFilter)

            const response = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/subscription-transactions?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch subscription transactions')
            }

            return response.json()
        },
        refetchInterval: 30000
    })

    // Fetch subscription plans for filter dropdown
    const { data: plansData } = useQuery({
        queryKey: ['subscription-plans-for-filter'],
        queryFn: async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/subscription-plans?per_page=1000`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            })
            if (!response.ok) throw new Error('Failed to fetch plans')
            return response.json()
        }
    })

    // Delete transaction mutation (only for FAILED/PENDING)
    const deleteMutation = useMutation({
        mutationFn: async (transactionId: string) => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/subscription-transactions/${transactionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to delete transaction')
            }

            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin-subscription-transactions'] })
            toast.success('Transaction deleted successfully')
            setShowDeleteModal(false)
            setSelectedTransaction(null)
            logUserAction('subscription_transaction_deleted', { transaction_id: selectedTransaction?.transaction_id })
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete transaction')
        }
    })

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)
        refetch()
        logUserAction('subscription_transactions_search', { query: searchQuery })
    }

    const handleViewDetails = (transaction: SubscriptionTransaction) => {
        setSelectedTransaction(transaction)
        setShowDetailsModal(true)
        logButtonClick('view_subscription_transaction_details', `transaction_${transaction.transaction_id}`)
    }

    const handleDeleteTransaction = (transaction: SubscriptionTransaction) => {
        setSelectedTransaction(transaction)
        setShowDeleteModal(true)
        logButtonClick('delete_subscription_transaction_modal', `transaction_${transaction.transaction_id}`)
    }

    const confirmDelete = () => {
        if (selectedTransaction) {
            deleteMutation.mutate(selectedTransaction.transaction_id)
        }
    }

    const handleExport = async (format: 'csv' | 'excel') => {
        try {
            setIsExporting(true)

            const params = new URLSearchParams()
            params.append('format', format)
            if (searchQuery) params.append('search', searchQuery)
            if (statusFilter) params.append('status', statusFilter)
            if (planFilter) params.append('plan', planFilter)
            if (dateFromFilter) params.append('date_from', dateFromFilter)
            if (dateToFilter) params.append('date_to', dateToFilter)

            const response = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/subscription-transactions/export?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('Failed to export transactions')
            }

            // Get the filename from the response headers or create a default one
            const contentDisposition = response.headers.get('Content-Disposition')
            let filename = `subscription_transactions_${new Date().toISOString().split('T')[0]}.${format}`

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/)
                if (filenameMatch) {
                    filename = filenameMatch[1]
                }
            }

            // Create blob and download
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.style.display = 'none'
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success(`Transactions exported as ${format.toUpperCase()}`)
            setShowExportMenu(false)
            logUserAction('subscription_transactions_exported', { format })
        } catch (error: any) {
            toast.error(error.message || 'Failed to export transactions')
        } finally {
            setIsExporting(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            PAID: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
            HOLDING: { color: 'bg-blue-100 text-blue-800', icon: Clock },
            FAILED: { color: 'bg-red-100 text-red-800', icon: XCircle }
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

    const formatCurrency = (amount: number | string) => {
        // Ensure amount is a valid number
        const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
        
        // Check if the parsed amount is a valid number
        if (isNaN(numericAmount)) {
            return '₦0.00'
        }

        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numericAmount)
    }

    const transactions = transactionsData?.data || []
    const totalPages = transactionsData?.last_page || 1
    const totalTransactions = transactionsData?.total || 0

    // Calculate summary stats with proper number handling
    const totalAmount = transactions.reduce((sum: number, t: SubscriptionTransaction) => {
        const amount = typeof t.total_amount === 'string' ? parseFloat(t.total_amount) : t.total_amount
        return sum + (isNaN(amount) ? 0 : amount)
    }, 0)
    
    const paidAmount = transactions
        .filter((t: SubscriptionTransaction) => t.status === 'PAID')
        .reduce((sum: number, t: SubscriptionTransaction) => {
            const amount = typeof t.amount_paid === 'string' ? parseFloat(t.amount_paid) : t.amount_paid
            return sum + (isNaN(amount) ? 0 : amount)
        }, 0)
    
    const pendingAmount = transactions
        .filter((t: SubscriptionTransaction) => t.status === 'PENDING')
        .reduce((sum: number, t: SubscriptionTransaction) => {
            const amount = typeof t.total_amount === 'string' ? parseFloat(t.total_amount) : t.total_amount
            return sum + (isNaN(amount) ? 0 : amount)
        }, 0)
    
    const failedCount = transactions.filter((t: SubscriptionTransaction) => t.status === 'FAILED').length

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Transactions</h2>
                    <p className="text-gray-600 mb-4">Failed to load subscription transactions</p>
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
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                            <Package className="w-8 h-8 mr-3 text-blue-600" />
                            Subscription Transactions
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Manage and monitor all subscription transactions across the platform
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => refetch()}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                                disabled={isExporting}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                {isExporting ? 'Exporting...' : 'Export'}
                            </button>
                            {showExportMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
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
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <DollarSign className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Amount</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Paid Amount</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(paidAmount)}</p>
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
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(pendingAmount)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Failed Transactions</p>
                            <p className="text-2xl font-bold text-gray-900">{failedCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <form onSubmit={handleSearch} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Search
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by transaction ID, reference, or user..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
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
                                <option value="HOLDING">Holding</option>
                                <option value="FAILED">Failed</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Plan
                            </label>
                            <select
                                value={planFilter}
                                onChange={(e) => setPlanFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Plans</option>
                                {plansData?.data?.map((plan: any) => (
                                    <option key={plan.plan_id} value={plan.plan_id}>
                                        {plan.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                From Date
                            </label>
                            <input
                                type="date"
                                value={dateFromFilter}
                                onChange={(e) => setDateFromFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                To Date
                            </label>
                            <input
                                type="date"
                                value={dateToFilter}
                                onChange={(e) => setDateToFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

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
                                    setStatusFilter('')
                                    setPlanFilter('')
                                    setDateFromFilter('')
                                    setDateToFilter('')
                                    setCurrentPage(1)
                                    refetch()
                                }}
                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
                            >
                                Clear Filters
                            </button>
                        </div>
                        <div className="text-sm text-gray-600">
                            Showing {transactions.length} of {totalTransactions} transactions
                        </div>
                    </div>
                </form>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Transaction
                                </th>
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
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {transactions.map((transaction: SubscriptionTransaction) => (
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
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {transaction.user ? `${transaction.user.first_name} ${transaction.user.last_name}` : 'N/A'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {transaction.user?.email || transaction.account_id}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {transaction.plan.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {transaction.plan.duration} days
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {formatCurrency(transaction.total_amount)}
                                            </div>
                                            {transaction.amount_paid > 0 && (
                                                <div className="text-sm text-green-600">
                                                    Paid: {formatCurrency(transaction.amount_paid)}
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleViewDetails(transaction)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {(transaction.status === 'FAILED' || transaction.status === 'PENDING') && (
                                                <button
                                                    onClick={() => handleDeleteTransaction(transaction)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete Transaction"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {transactions.length === 0 && (
                    <div className="text-center py-12">
                        <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                        <p className="text-gray-500">
                            {searchQuery || statusFilter || planFilter || dateFromFilter || dateToFilter
                                ? 'Try adjusting your filters to see more results.'
                                : 'No subscription transactions have been made yet.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-700">
                        <span>
                            Showing page {currentPage} of {totalPages}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`px-3 py-2 border rounded-lg ${currentPage === pageNum
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            )
                        })}

                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Transaction Details Modal */}
            {showDetailsModal && selectedTransaction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Transaction Details
                                </h3>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Transaction Info */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Transaction Information</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Transaction ID:</span>
                                        <p className="font-medium">{selectedTransaction.transaction_id}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Reference:</span>
                                        <p className="font-medium">{selectedTransaction.reference}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Status:</span>
                                        <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Amount:</span>
                                        <p className="font-medium">{formatCurrency(selectedTransaction.total_amount)}</p>
                                    </div>
                                    {selectedTransaction.amount_paid > 0 && (
                                        <div>
                                            <span className="text-gray-500">Amount Paid:</span>
                                            <p className="font-medium text-green-600">{formatCurrency(selectedTransaction.amount_paid)}</p>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-gray-500">Date:</span>
                                        <p className="font-medium">{format(new Date(selectedTransaction.created_at), 'MMM dd, yyyy HH:mm:ss')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* User Info */}
                            {selectedTransaction.user && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">User Information</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Name:</span>
                                            <p className="font-medium">{selectedTransaction.user.first_name} {selectedTransaction.user.last_name}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Email:</span>
                                            <p className="font-medium">{selectedTransaction.user.email}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Account ID:</span>
                                            <p className="font-medium">{selectedTransaction.user.account_id}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Plan Info */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Subscription Plan</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Plan Name:</span>
                                        <p className="font-medium">{selectedTransaction.plan.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Duration:</span>
                                        <p className="font-medium">{selectedTransaction.plan.duration} days</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Votes:</span>
                                        <p className="font-medium">{selectedTransaction.plan.votes}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Nominees:</span>
                                        <p className="font-medium">{selectedTransaction.plan.nominees}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Voting Times:</span>
                                        <p className="font-medium">{selectedTransaction.plan.voting_times}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Technical Info */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Technical Information</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">IP Address:</span>
                                        <p className="font-medium">{selectedTransaction.ip_address}</p>
                                    </div>
                                    {selectedTransaction.channel && (
                                        <div>
                                            <span className="text-gray-500">Channel:</span>
                                            <p className="font-medium">{selectedTransaction.channel}</p>
                                        </div>
                                    )}
                                    {selectedTransaction.trxref && (
                                        <div>
                                            <span className="text-gray-500">Gateway Reference:</span>
                                            <p className="font-medium">{selectedTransaction.trxref}</p>
                                        </div>
                                    )}
                                    {selectedTransaction.message && (
                                        <div className="col-span-2">
                                            <span className="text-gray-500">Message:</span>
                                            <p className="font-medium">{selectedTransaction.message}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200">
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedTransaction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className="flex-shrink-0">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Delete Transaction
                                    </h3>
                                </div>
                            </div>
                            <div className="mb-4">
                                <p className="text-sm text-gray-500">
                                    Are you sure you want to delete this transaction? This action cannot be undone.
                                </p>
                                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-900">
                                        Transaction ID: {selectedTransaction.transaction_id}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Status: {selectedTransaction.status}
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={deleteMutation.isPending}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SuperAdminSubscriptionTransactions 