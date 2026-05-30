import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import {
    Search,
    Filter,
    Download,
    Eye,
    BarChart3,
    AlertTriangle,
    ArrowLeft,
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
    X
} from 'lucide-react'
import { adminApi } from '../../services/api'
import { VoteTransaction } from '../../types'
import AdminLayout from '../../components/AdminLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useAuditLogger } from '../../hooks/useAuditLogger'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const VoteTransactionsPage: React.FC = () => {
    const { voteId } = useParams<{ voteId: string }>()
    const [currentPage, setCurrentPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [paymentGatewayFilter, setPaymentGatewayFilter] = useState('')
    const [dateFromFilter, setDateFromFilter] = useState('')
    const [dateToFilter, setDateToFilter] = useState('')
    const [vote, setVote] = useState<any>(null)
    const [isExporting, setIsExporting] = useState(false)

    const queryClient = useQueryClient()
    const { logUserAction, logButtonClick } = useAuditLogger({ context: 'VoteTransactionsManagement' })
    const { user } = useAuth()

    // Check if user is superadmin
    const isSuperAdmin = user?.role?.name === 'superadmin'

    // First, get the vote details
    const { data: votesData } = useQuery({
        queryKey: ['admin-votes'],
        queryFn: () => adminApi.getVotes({ per_page: 1000 }),
        enabled: !!voteId
    })

    // Find the vote by ID
    useEffect(() => {
        if (votesData?.data && voteId) {
            const foundVote = (votesData.data as any[]).find((v: any) => v.vote_id === voteId)
            if (foundVote) {
                setVote(foundVote)
            }
        }
    }, [votesData, voteId])

    // Fetch transactions for the specific vote with pagination
    const { data: transactionsData, isLoading, error, refetch } = useQuery({
        queryKey: ['vote-transactions', voteId, currentPage, searchQuery, statusFilter, paymentGatewayFilter, dateFromFilter, dateToFilter],
        queryFn: async () => {
            if (!voteId) throw new Error('Vote ID is required')

            const params = new URLSearchParams()
            params.append('vote_id', voteId)
            params.append('page', currentPage.toString())
            params.append('per_page', '20')
            if (searchQuery) params.append('search', searchQuery)
            if (statusFilter) params.append('status', statusFilter)
            if (paymentGatewayFilter) params.append('payment_gateway', paymentGatewayFilter)
            if (dateFromFilter) params.append('date_from', dateFromFilter)
            if (dateToFilter) params.append('date_to', dateToFilter)

            // Use the existing backend endpoint for vote transactions
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/votes/transactions?${params.toString()}`, {
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
        enabled: !!voteId,
        refetchInterval: 30000
    })



    // Requery transactions mutation (for superadmin)
    const requeryMutation = useMutation({
        mutationFn: async () => {
            return adminApi.requeryTransactions(voteId!)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vote-transactions'] })
            toast.success('Transactions requeried successfully')
            logUserAction('transactions_requeried', { vote_id: voteId })
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to requery transactions')
        }
    })

    // Export functionality
    const exportTransactions = async (format: 'csv' | 'excel') => {
        setIsExporting(true)
        try {
            const params = new URLSearchParams()
            params.append('vote_id', voteId!)
            params.append('format', format)
            if (searchQuery) params.append('search', searchQuery)
            if (statusFilter) params.append('status', statusFilter)
            if (paymentGatewayFilter) params.append('payment_gateway', paymentGatewayFilter)
            if (dateFromFilter) params.append('date_from', dateFromFilter)
            if (dateToFilter) params.append('date_to', dateToFilter)

            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/votes/transactions/export?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('Failed to export transactions')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `vote-${voteId}-transactions.${format === 'excel' ? 'xlsx' : 'csv'}`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success(`Transactions exported to ${format.toUpperCase()} successfully`)
            logUserAction('transactions_exported', { vote_id: voteId, format })
        } catch (error: any) {
            toast.error(error.message || 'Failed to export transactions')
        } finally {
            setIsExporting(false)
        }
    }

    useEffect(() => {
        logUserAction('vote_transactions_viewed', {
            vote_id: voteId,
            page: currentPage,
            search: !!searchQuery,
            filters: {
                status: statusFilter,
                payment_gateway: paymentGatewayFilter,
                date_from: dateFromFilter,
                date_to: dateToFilter
            }
        })
    }, [voteId, currentPage, searchQuery, statusFilter, paymentGatewayFilter, dateFromFilter, dateToFilter, logUserAction])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)
        refetch() // Trigger a refetch with new filters
        logUserAction('transactions_search', {
            query: searchQuery,
            vote_id: voteId,
            filters: {
                status: statusFilter,
                date_from: dateFromFilter,
                date_to: dateToFilter
            }
        })
    }

    // Auto-refetch when filters change
    useEffect(() => {
        if (currentPage === 1) {
            refetch()
        }
    }, [statusFilter, dateFromFilter, dateToFilter, refetch])

    const handleRequery = () => {
        requeryMutation.mutate()
        logButtonClick('requery_transactions', voteId)
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            PAID: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
            FAILED: { color: 'bg-red-100 text-red-800', icon: X },
            '': { color: 'bg-gray-100 text-gray-800', icon: DollarSign }
        }

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['']
        const Icon = config.icon

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {status}
            </span>
        )
    }

    const transactions = transactionsData?.data || []
    const pagination = transactionsData?.pagination || {
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0
    }

    // Use transactions directly from backend (already filtered)
    const filteredTransactions = transactions

    if (isLoading) {
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
                    <Link to="/admin/dashboard" className="hover:text-gray-700">Home</Link>
                    <span className="mx-2">•</span>
                    <Link to="/admin/votes" className="hover:text-gray-700">Votes Management</Link>
                    <span className="mx-2">•</span>
                    <span className="text-gray-900">Transactions</span>
                </nav>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/admin/votes"
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Vote Transactions</h1>
                            <p className="text-gray-600 mt-1">
                                Transaction history for {vote?.title || `Vote ${voteId}`}
                                {isSuperAdmin && (
                                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        <Shield className="w-3 h-3 mr-1" />
                                        SuperAdmin View
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        {/* Export Buttons */}
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => exportTransactions('csv')}
                                disabled={isExporting}
                                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
                            >
                                <FileText className="w-4 h-4" />
                                <span className="hidden sm:inline">CSV</span>
                            </button>
                            <button
                                onClick={() => exportTransactions('excel')}
                                disabled={isExporting}
                                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                <span className="hidden sm:inline">Excel</span>
                            </button>
                        </div>

                        {isSuperAdmin && (
                            <button
                                onClick={handleRequery}
                                disabled={requeryMutation.isPending}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${requeryMutation.isPending ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Requery</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {transactionsData?.statistics?.total_transactions || 0}
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
                            <p className="text-sm font-medium text-gray-600">Successful Payments</p>
                            <p className="text-2xl font-bold text-green-600">
                                {transactionsData?.statistics?.successful_transactions ||
                                    transactions.filter((t: any) => t.status === 'PAID').length}
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
                            <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {transactionsData?.statistics?.pending_transactions ||
                                    transactions.filter((t: any) => t.status === 'PENDING').length}
                            </p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Failed Payments</p>
                            <p className="text-2xl font-bold text-red-600">
                                {transactionsData?.statistics?.failed_transactions ||
                                    transactions.filter((t: any) => t.status === 'FAILED').length}
                            </p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Votes</p>
                            <p className="text-2xl font-bold text-primary-600">
                                {transactionsData?.statistics?.total_votes
                                    ? parseFloat(transactionsData.statistics.total_votes).toLocaleString()
                                    : '0'}
                            </p>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Voted(Not Voted)</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {transactionsData?.statistics?.total_voted_nominees
                                        ? parseFloat(transactionsData.statistics.total_voted_nominees).toLocaleString()
                                        : '0'} <span className="text-xs text-primary-500" style={{ fontSize: '1rem' }}>({transactionsData?.statistics?.total_non_voted_nominees
                                            ? parseFloat(transactionsData.statistics.total_non_voted_nominees).toLocaleString()
                                            : '0'})</span>
                                </p>
                            </div>
                        </div>
                        <div className="p-3 bg-primary-100 rounded-lg">
                            <DollarSign className="w-6 h-6 text-primary-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-green-600" style={{ fontSize: '1rem' }}>
                                ₦{transactionsData?.statistics?.total_revenue?.total
                                    ? parseFloat(transactionsData.statistics.total_revenue?.total).toLocaleString()
                                    : '0'}
                            </p>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Revenue After Charges</p>
                                <p className="text-2xl font-bold text-green-600" style={{ fontSize: '1rem' }}>
                                    ₦{transactionsData?.statistics?.total_revenue?.after_charges
                                        ? parseFloat(transactionsData.statistics.total_revenue.after_charges).toLocaleString()
                                        : '0'}
                                </p>
                            </div>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Remaining Balance</p>
                            <p className="text-2xl font-bold text-green-600" style={{ fontSize: '1rem' }}>
                                ₦{transactionsData?.statistics?.balance?.remaining_balance
                                    ? parseFloat(transactionsData.statistics.balance?.remaining_balance).toLocaleString()
                                    : '0'}
                            </p>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Withdrawals</p>
                                <p className="text-2xl font-bold text-green-600" style={{ fontSize: '1rem' }}>
                                    ₦{transactionsData?.statistics?.balance?.withdrawals
                                        ? parseFloat(transactionsData.statistics.balance.withdrawals).toLocaleString()
                                        : '0'}
                                </p>
                            </div>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters - Single Line Layout */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
                    {/* Search */}
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

                    {/* Status Filter */}
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

                    {/* Gateway Filter */}
                    <div className="min-w-[120px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <CreditCard className="w-4 h-4 inline mr-1" />
                            <span className="hidden sm:inline">Gateway</span>
                        </label>
                        <select
                            value={paymentGatewayFilter}
                            onChange={(e) => setPaymentGatewayFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All</option>
                            <option value="Paystack">Paystack</option>
                            <option value="Flutterwave">Flutterwave</option>
                        </select>
                    </div>

                    {/* From Date */}
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

                    {/* To Date */}
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

                    {/* Action Buttons */}
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
                        Transactions ({pagination.total})
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
                ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-gray-400 mb-4">
                            <Activity className="w-24 h-24 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Transactions Found</h3>
                        <p className="text-gray-600 mb-4">
                            {searchQuery || statusFilter || paymentGatewayFilter || dateFromFilter || dateToFilter
                                ? 'No transactions match your current filters.'
                                : 'No transactions have been made for this vote yet.'
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
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Votes
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Gateway
                                    </th>
                                    {isSuperAdmin && (
                                        <>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Channel
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                IP Address
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Gateway Response
                                            </th>
                                        </>
                                    )}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTransactions.map((transaction: any) => (
                                    <tr key={transaction.transaction_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {transaction.transaction_id}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {transaction.trxref || transaction.reference || 'No reference'}
                                                </p>
                                                {isSuperAdmin && transaction.pg_id && (
                                                    <p className="text-xs text-gray-400">
                                                        PG ID: {transaction.pg_id}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-900">
                                                    {transaction.user?.first_name} {transaction.user?.last_name}
                                                </div>
                                                <div className="text-gray-500">
                                                    {transaction.user?.email}
                                                </div>
                                                {isSuperAdmin && transaction.voter_id && (
                                                    <div className="text-xs text-gray-400">
                                                        Voter ID: {transaction.voter_id}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-900">
                                                    ₦{(transaction.amount_paid || 0).toLocaleString()}
                                                </div>
                                                <div className="text-gray-500">
                                                    Total: ₦{(transaction.total_amount || 0).toLocaleString()}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    Fee: ₦{(transaction.gateway_fee || 0).toLocaleString()}
                                                </div>
                                                {isSuperAdmin && transaction.amount_after_charges && (
                                                    <div className="text-xs text-green-600">
                                                        After charges: ₦{transaction.amount_after_charges.toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500">
                                                {(() => {
                                                    try {
                                                        const votes = JSON.parse(transaction.votes || transaction.paid_votes || '[]')
                                                        const totalQuantity = votes.reduce((sum: number, vote: any) => sum + (vote.quantity || 0), 0)
                                                        return totalQuantity
                                                    } catch {
                                                        return 0
                                                    }
                                                })()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {getStatusBadge(transaction.status)}
                                                {isSuperAdmin && transaction.is_verified && (
                                                    <div className="text-xs">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${transaction.is_verified === '1'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {transaction.is_verified === '1' ? 'Verified' : 'Unverified'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {transaction.payment_gateway?.name || 'N/A'}
                                            </div>
                                        </td>
                                        {isSuperAdmin && (
                                            <>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-500">
                                                        {transaction.channel || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-500 font-mono">
                                                        {transaction.ip_address || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-500">
                                                        {transaction.gateway_response || 'N/A'}
                                                        {transaction.message && transaction.message !== transaction.gateway_response && (
                                                            <div className="text-xs text-gray-400 mt-1">
                                                                {transaction.message}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500">
                                                {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
                                                <div className="text-xs">
                                                    {format(new Date(transaction.created_at), 'h:mm a')}
                                                </div>
                                                {isSuperAdmin && transaction.updated_at !== transaction.created_at && (
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        Updated: {format(new Date(transaction.updated_at), 'MMM dd, h:mm a')}
                                                    </div>
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
                {pagination && pagination.last_page > 1 && (
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
                                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Previous
                                </button>

                                {/* Page Numbers */}
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
                                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default VoteTransactionsPage 