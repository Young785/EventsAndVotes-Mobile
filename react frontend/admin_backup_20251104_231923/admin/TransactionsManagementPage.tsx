import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
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
    BarChart3,
    Zap
} from 'lucide-react'
import { adminApi } from '../../services/api'
import { useAuditLogger } from '../../hooks/useAuditLogger'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import AdminLayout from '../../components/AdminLayout'

const TransactionsManagementPage: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [paymentGatewayFilter, setPaymentGatewayFilter] = useState('')
    const [voteFilter, setVoteFilter] = useState('')
    const [dateFromFilter, setDateFromFilter] = useState('')
    const [dateToFilter, setDateToFilter] = useState('')
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [showExportMenu, setShowExportMenu] = useState(false)
    const [showStats, setShowStats] = useState(true)

    const queryClient = useQueryClient()
    const { logUserAction, logButtonClick } = useAuditLogger({ context: 'TransactionsManagement' })
    const { user } = useAuth()

    // Check if user has access (admin or superadmin)
    const hasAccess = user?.role?.name === 'superadmin' || ['admin', 'admin_vote', 'admin_both'].includes(user?.role?.name || '')
    const isSuperAdmin = user?.role?.name === 'superadmin'

    if (!hasAccess) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                        <p className="text-gray-600">This page is only accessible to Admin and SuperAdmin users.</p>
                    </div>
                </div>
            </AdminLayout>
        )
    }

    // Fetch all transactions with pagination and filtering
    const { data: transactionsResponse, isLoading, error, refetch } = useQuery({
        queryKey: ['all-transactions', currentPage, searchQuery, statusFilter, paymentGatewayFilter, voteFilter, dateFromFilter, dateToFilter],
        queryFn: async () => {
            const params = new URLSearchParams()
            params.append('page', currentPage.toString())
            params.append('per_page', '20')
            if (searchQuery) params.append('search', searchQuery)
            if (statusFilter) params.append('status', statusFilter)
            if (paymentGatewayFilter) params.append('payment_gateway', paymentGatewayFilter)
            if (voteFilter) params.append('vote_id', voteFilter)
            if (dateFromFilter) params.append('date_from', dateFromFilter)
            if (dateToFilter) params.append('date_to', dateToFilter)

            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/transactions?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch transactions')
            }

            return response.json()
        },
        refetchInterval: 30000
    })

    // Global requery mutation
    const globalRequeryMutation = useMutation({
        mutationFn: async (voteId?: string) => {
            const params = voteId ? `?vote_id=${voteId}` : ''
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/transactions/global-requery${params}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to requery transactions')
            }

            return response.json()
        },
        onSuccess: (data) => {
            toast.success(data.message || 'Transactions requeried successfully')
            queryClient.invalidateQueries({ queryKey: ['all-transactions'] })
            logUserAction('global_requery_transactions', {
                processed: data.processed_count,
                successful: data.success_count,
                errors: data.error_count
            })
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to requery transactions')
        }
    })

    // Fetch votes for filter dropdown
    const { data: votesData } = useQuery({
        queryKey: ['admin-votes-for-filter'],
        queryFn: () => adminApi.getVotes({ per_page: 1000 })
    })

    // Delete transaction mutation (only for FAILED/PENDING)
    const deleteMutation = useMutation({
        mutationFn: async (transactionId: string) => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/transactions/${transactionId}`, {
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
            queryClient.invalidateQueries({ queryKey: ['all-transactions'] })
            toast.success('Transaction deleted successfully')
            setShowDeleteModal(false)
            setSelectedTransaction(null)
            logUserAction('transaction_deleted', { transaction_id: selectedTransaction?.transaction_id })
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete transaction')
        }
    })

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)
        refetch()
        logUserAction('transactions_search', { query: searchQuery })
    }

    const handleViewDetails = (transaction: any) => {
        setSelectedTransaction(transaction)
        setShowDetailsModal(true)
        logButtonClick('view_transaction_details', `transaction_${transaction.transaction_id}`)
    }

    const handleDeleteTransaction = (transaction: any) => {
        setSelectedTransaction(transaction)
        setShowDeleteModal(true)
        logButtonClick('delete_transaction_modal', `transaction_${transaction.transaction_id}`)
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
            if (paymentGatewayFilter) params.append('payment_gateway', paymentGatewayFilter)
            if (voteFilter) params.append('vote_id', voteFilter)
            if (dateFromFilter) params.append('date_from', dateFromFilter)
            if (dateToFilter) params.append('date_to', dateToFilter)

            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/transactions/export?${params.toString()}`, {
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
            let filename = `transactions_${new Date().toISOString().split('T')[0]}.${format}`

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
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success(`Transactions exported successfully as ${format.toUpperCase()}`)
            logUserAction('transactions_exported', { format, filters: { search: searchQuery, status: statusFilter } })
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
            FAILED: { color: 'bg-red-100 text-red-800', icon: XCircle }
        }

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.FAILED
        const Icon = config.icon

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {status}
            </span>
        )
    }

    const transactions = transactionsResponse?.data || []
    const pagination = transactionsResponse?.pagination || {
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0
    }

    return (
        <AdminLayout>
            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <nav className="text-sm text-gray-500 mb-2">
                        <Link to="/admin/dashboard" className="hover:text-gray-700">Home</Link>
                        <span className="mx-2">•</span>
                        <span className="text-gray-900">Transactions Management</span>
                    </nav>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Transactions Management</h1>
                            <p className="text-gray-600 mt-1">
                                Comprehensive transaction management and monitoring
                                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Admin Access
                                </span>
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            {isSuperAdmin && (
                                <button
                                    onClick={() => globalRequeryMutation.mutate()}
                                    disabled={globalRequeryMutation.isPending}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
                                >
                                    <Zap className="w-4 h-4" />
                                    <span>{globalRequeryMutation.isPending ? 'Requerying...' : 'Global Requery'}</span>
                                </button>
                            )}
                            <button
                                onClick={() => setShowStats(!showStats)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                            >
                                <BarChart3 className="w-4 h-4" />
                                <span>{showStats ? 'Hide Stats' : 'Show Stats'}</span>
                            </button>
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
                                                onClick={() => {
                                                    handleExport('csv')
                                                    setShowExportMenu(false)
                                                }}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <FileText className="w-4 h-4 mr-2" />
                                                Export as CSV
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleExport('excel')
                                                    setShowExportMenu(false)
                                                }}
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

                {/* Statistics Cards */}
                {showStats && (
                    <div className="space-y-6 mb-6">
                        {/* Main Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {transactionsResponse?.statistics?.total_transactions || pagination.total}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <Activity className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            ₦{(transactionsResponse?.statistics?.total_revenue || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <DollarSign className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Successful Payments</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {transactionsResponse?.statistics?.successful_transactions || 0}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {transactionsResponse?.statistics?.success_rate ?
                                                `${transactionsResponse.statistics.success_rate}% success rate` :
                                                ''
                                            }
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Failed/Pending</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            {(transactionsResponse?.statistics?.failed_transactions || 0) +
                                                (transactionsResponse?.statistics?.pending_transactions || 0)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {transactionsResponse?.statistics?.pending_transactions || 0} pending, {' '}
                                            {transactionsResponse?.statistics?.failed_transactions || 0} failed
                                        </p>
                                    </div>
                                    <div className="p-3 bg-red-100 rounded-lg">
                                        <XCircle className="w-6 h-6 text-red-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Votes Bought</p>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {(transactionsResponse?.statistics?.total_votes_purchased || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <Users className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Average Transaction</p>
                                        <p className="text-2xl font-bold text-purple-600">
                                            ₦{(transactionsResponse?.statistics?.average_transaction_value || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-purple-100 rounded-lg">
                                        <TrendingUp className="w-6 h-6 text-purple-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Gateway Fees</p>
                                        <p className="text-2xl font-bold text-orange-600">
                                            ₦{(transactionsResponse?.statistics?.total_gateway_fees || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-orange-100 rounded-lg">
                                        <CreditCard className="w-6 h-6 text-orange-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Gateway Breakdown */}
                        {transactionsResponse?.statistics?.revenue_by_gateway &&
                            transactionsResponse.statistics.revenue_by_gateway.length > 0 && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Payment Gateway</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {transactionsResponse.statistics.revenue_by_gateway.map((gateway: any, index: number) => (
                                            <div key={index} className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-600">{gateway.gateway}</p>
                                                        <p className="text-lg font-bold text-gray-900">
                                                            ₦{gateway.revenue.toLocaleString()}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{gateway.count} transactions</p>
                                                    </div>
                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                        <CreditCard className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Search className="w-4 h-4 inline mr-1" />
                                <span className="hidden sm:inline">Search</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="min-w-[120px]">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Filter className="w-4 h-4 inline mr-1" />
                                <span className="hidden sm:inline">Status</span>
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All</option>
                                <option value="PAID">Paid</option>
                                <option value="PENDING">Pending</option>
                                <option value="FAILED">Failed</option>
                            </select>
                        </div>

                        <div className="min-w-[140px]">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                <span className="hidden sm:inline">From</span>
                            </label>
                            <input
                                type="date"
                                value={dateFromFilter}
                                onChange={(e) => setDateFromFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="min-w-[140px]">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                <span className="hidden sm:inline">To</span>
                            </label>
                            <input
                                type="date"
                                value={dateToFilter}
                                onChange={(e) => setDateToFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
                            >
                                <Search className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Search</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('')
                                    setStatusFilter('')
                                    setPaymentGatewayFilter('')
                                    setVoteFilter('')
                                    setDateFromFilter('')
                                    setDateToFilter('')
                                    setCurrentPage(1)
                                }}
                                className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                            >
                                <span className="hidden sm:inline">Clear</span>
                                <span className="sm:hidden">✕</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Transactions Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            All Transactions ({pagination.total})
                        </h2>
                    </div>

                    {error ? (
                        <div className="p-8 text-center text-red-500">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                            <p>Failed to load transactions</p>
                            <button
                                onClick={() => refetch()}
                                className="mt-2 text-blue-600 hover:text-blue-800"
                            >
                                Try again
                            </button>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-gray-400 mb-4">
                                <Activity className="w-24 h-24 mx-auto" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Transactions Found</h3>
                            <p className="text-gray-600">
                                {searchQuery || statusFilter || dateFromFilter || dateToFilter
                                    ? 'No transactions match your current filters.'
                                    : 'No transactions available.'
                                }
                            </p>
                        </div>
                    ) : (
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
                                            Vote
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
                                    {transactions.map((transaction: any) => (
                                        <tr key={transaction.transaction_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {transaction.transaction_id}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Ref: {transaction.trxref || 'No reference'}
                                                    </p>
                                                    {transaction.ip_address && (
                                                        <p className="text-xs text-gray-400">
                                                            IP: {transaction.ip_address}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {transaction.user ?
                                                            `${transaction.user.first_name} ${transaction.user.last_name}` :
                                                            'N/A'
                                                        }
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {transaction.user?.email || 'No email'}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        ID: {transaction.account_id}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {transaction.vote?.name || 'N/A'}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {transaction.vote_id}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        ₦{(transaction.amount_paid || 0).toLocaleString()}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Total: ₦{(transaction.total_amount || 0).toLocaleString()}
                                                    </p>
                                                    {transaction.gateway_fee > 0 && (
                                                        <p className="text-xs text-gray-400">
                                                            Fee: ₦{transaction.gateway_fee.toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(transaction.status)}
                                                {transaction.is_verified === '1' && (
                                                    <div className="mt-1">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            <Shield className="w-3 h-3 mr-1" />
                                                            Verified
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm text-gray-900">
                                                        {transaction.payment_gateway?.name || 'N/A'}
                                                    </p>
                                                    {transaction.channel && (
                                                        <p className="text-sm text-gray-500">
                                                            {transaction.channel}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-500">
                                                    {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
                                                    <br />
                                                    {format(new Date(transaction.created_at), 'HH:mm')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleViewDetails(transaction)}
                                                        className="p-2 text-blue-600 hover:text-blue-800"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {transaction.can_be_deleted && (
                                                        <button
                                                            onClick={() => handleDeleteTransaction(transaction)}
                                                            className="p-2 text-red-600 hover:text-red-800"
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
                    )}

                    {/* Pagination */}
                    {pagination.last_page > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200">
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
                </div>

                {/* Transaction Details Modal */}
                {showDetailsModal && selectedTransaction && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
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

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                                            <p className="text-sm text-gray-900">{selectedTransaction.transaction_id}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Reference</label>
                                            <p className="text-sm text-gray-900">{selectedTransaction.trxref || 'No reference'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Status</label>
                                            <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Amount Paid</label>
                                            <p className="text-sm text-gray-900">₦{(selectedTransaction.amount_paid || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Gateway Fee</label>
                                            <p className="text-sm text-gray-900">₦{(selectedTransaction.gateway_fee || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Votes Count</label>
                                            <p className="text-sm text-gray-900">{selectedTransaction.votes_count || 0}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">IP Address</label>
                                            <p className="text-sm text-gray-900">{selectedTransaction.ip_address || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Channel</label>
                                            <p className="text-sm text-gray-900">{selectedTransaction.channel || 'N/A'}</p>
                                        </div>
                                    </div>

                                    {selectedTransaction.gateway_response && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Gateway Response</label>
                                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                                {selectedTransaction.gateway_response}
                                            </p>
                                        </div>
                                    )}

                                    {selectedTransaction.message && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Message</label>
                                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                                {selectedTransaction.message}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && selectedTransaction && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                            <div className="p-6">
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <AlertTriangle className="w-6 h-6 text-red-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Delete Transaction
                                    </h3>
                                </div>
                                <p className="text-gray-600 mb-6">
                                    Are you sure you want to delete transaction "<strong>{selectedTransaction.transaction_id}</strong>"?
                                    This action cannot be undone.
                                </p>
                                <div className="flex items-center justify-end space-x-3">
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false)
                                            setSelectedTransaction(null)
                                        }}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        disabled={deleteMutation.isPending}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {deleteMutation.isPending ? 'Deleting...' : 'Delete Transaction'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}

export default TransactionsManagementPage 