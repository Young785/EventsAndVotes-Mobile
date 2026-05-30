import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
    CreditCard,
    Search,
    Filter,
    Download,
    Eye,
    BarChart3,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    DollarSign,
    User,
    Vote,
    TrendingUp,
    RefreshCw,
    FileText,
    ExternalLink,
    Package,
    ArrowUp,
    ArrowDown,
    Activity,
    PieChart
} from 'lucide-react'
import { transactionsManagementApi, votesManagementApi, subscriptionsManagementApi } from '../../services/api'
import { VoteTransaction, SubscriptionTransaction, TransactionManagement } from '../../types'
import AdminLayout from '../../components/AdminLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useAuditLogger } from '../../hooks/useAuditLogger'
import toast from 'react-hot-toast'
import { format, formatDistanceToNow, subDays, startOfDay, endOfDay, startOfYear, endOfYear } from 'date-fns'
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
} from 'recharts'

const TransactionsPage: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1)
    const [activeTab, setActiveTab] = useState<'all' | 'votes' | 'subscriptions'>('all')
    const [statusFilter, setStatusFilter] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [dateFromFilter, setDateFromFilter] = useState('')
    const [dateToFilter, setDateToFilter] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [showStatsPanel, setShowStatsPanel] = useState(true)
    const [timePeriod, setTimePeriod] = useState<'today' | '7days' | '30days' | '1year' | 'all' | 'custom'>('30days')
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

    const queryClient = useQueryClient()
    const { logUserAction, logButtonClick } = useAuditLogger({ context: 'TransactionsManagement' })

    // Get date range based on time period
    const getDateRange = () => {
        const now = new Date()
        switch (timePeriod) {
            case 'today':
                return {
                    from: format(startOfDay(now), 'yyyy-MM-dd'),
                    to: format(endOfDay(now), 'yyyy-MM-dd')
                }
            case '7days':
                return {
                    from: format(subDays(now, 7), 'yyyy-MM-dd'),
                    to: format(now, 'yyyy-MM-dd')
                }
            case '30days':
                return {
                    from: format(subDays(now, 30), 'yyyy-MM-dd'),
                    to: format(now, 'yyyy-MM-dd')
                }
            case '1year':
                return {
                    from: format(startOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd'),
                    to: format(endOfYear(new Date(selectedYear, 11, 31)), 'yyyy-MM-dd')
                }
            case 'custom':
                return {
                    from: dateFromFilter,
                    to: dateToFilter
                }
            default:
                return { from: '', to: '' }
        }
    }

    const dateRange = getDateRange()

    // Fetch transaction statistics
    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['transaction-stats', activeTab, timePeriod, selectedYear, dateRange.from, dateRange.to],
        queryFn: () => transactionsManagementApi.getStats({
            type: activeTab === 'all' ? undefined : activeTab as 'vote' | 'subscription',
            date_from: dateRange.from || undefined,
            date_to: dateRange.to || undefined
        }),
        refetchInterval: 30000
    })

    // Fetch chart data
    const { data: chartData, isLoading: chartLoading } = useQuery({
        queryKey: ['transaction-chart', activeTab, timePeriod, selectedYear, dateRange.from, dateRange.to],
        queryFn: () => transactionsManagementApi.getChartData({
            type: activeTab === 'all' ? undefined : activeTab as 'vote' | 'subscription',
            date_from: dateRange.from || undefined,
            date_to: dateRange.to || undefined,
            period: timePeriod
        }),
        refetchInterval: 30000
    })

    // Fetch all transactions
    const { data: allTransactionsData, isLoading: allTransactionsLoading, error: allTransactionsError } = useQuery({
        queryKey: ['all-transactions', currentPage, statusFilter, typeFilter, dateRange.from, dateRange.to, searchQuery],
        queryFn: () => transactionsManagementApi.getAll({
            page: currentPage,
            per_page: 20,
            status: statusFilter || undefined,
            type: typeFilter as 'vote' | 'subscription' || undefined,
            date_from: dateRange.from || undefined,
            date_to: dateRange.to || undefined,
            search: searchQuery || undefined
        }),
        enabled: activeTab === 'all',
        refetchInterval: 30000
    })

    // Fetch vote transactions
    const { data: voteTransactionsData, isLoading: voteTransactionsLoading, error: voteTransactionsError } = useQuery({
        queryKey: ['vote-transactions', currentPage, statusFilter, dateRange.from, dateRange.to],
        queryFn: () => transactionsManagementApi.getVoteTransactions({
            page: currentPage,
            per_page: 20,
            status: statusFilter || undefined,
            date_from: dateRange.from || undefined,
            date_to: dateRange.to || undefined
        }),
        enabled: activeTab === 'votes',
        refetchInterval: 30000
    })

    // Fetch subscription transactions
    const { data: subscriptionTransactionsData, isLoading: subscriptionTransactionsLoading, error: subscriptionTransactionsError } = useQuery({
        queryKey: ['subscription-transactions', currentPage, statusFilter, dateRange.from, dateRange.to],
        queryFn: () => transactionsManagementApi.getSubscriptionTransactions({
            page: currentPage,
            per_page: 20,
            status: statusFilter || undefined,
            date_from: dateRange.from || undefined,
            date_to: dateRange.to || undefined
        }),
        enabled: activeTab === 'subscriptions',
        refetchInterval: 30000
    })

    // Re-query transactions mutation (for superadmin)
    const reQueryMutation = useMutation({
        mutationFn: (voteId?: string) => transactionsManagementApi.reQueryTransactions(voteId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vote-transactions'] })
            queryClient.invalidateQueries({ queryKey: ['all-transactions'] })
            queryClient.invalidateQueries({ queryKey: ['transaction-stats'] })
            queryClient.invalidateQueries({ queryKey: ['transaction-chart'] })
            toast.success('Transactions re-queried successfully')
            logUserAction('transactions_requeried', { vote_id: selectedTransaction?.vote_id })
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to re-query transactions')
        }
    })

    useEffect(() => {
        logUserAction('transactions_management_viewed', {
            tab: activeTab,
            page: currentPage,
            time_period: timePeriod,
            filters: { status: statusFilter, type: typeFilter, date_from: dateRange.from, date_to: dateRange.to, search: searchQuery }
        })
    }, [activeTab, currentPage, timePeriod, statusFilter, typeFilter, dateRange.from, dateRange.to, searchQuery, logUserAction])

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)
        logUserAction('transactions_filter_applied', {
            tab: activeTab,
            time_period: timePeriod,
            filters: { status: statusFilter, type: typeFilter, date_from: dateRange.from, date_to: dateRange.to, search: searchQuery }
        })
    }

    const handleTimePeriodChange = (period: typeof timePeriod) => {
        setTimePeriod(period)
        setCurrentPage(1)
        if (period !== 'custom') {
            setDateFromFilter('')
            setDateToFilter('')
        }
        logButtonClick('change_time_period', period)
    }

    const handleViewDetails = (transaction: any) => {
        setSelectedTransaction(transaction)
        setShowDetailsModal(true)
        logButtonClick('view_transaction_details', `transaction_${transaction.id}`)
    }

    const handleExport = async () => {
        try {
            logButtonClick('export_transactions')
            const data = await transactionsManagementApi.export({
                type: typeFilter as 'vote' | 'subscription' || undefined,
                format: 'csv',
                date_from: dateRange.from || undefined,
                date_to: dateRange.to || undefined
            })

            // Create download link
            const url = window.URL.createObjectURL(data)
            const link = document.createElement('a')
            link.href = url
            link.download = `transactions-${activeTab}-${timePeriod}-${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.success('Transactions exported successfully')
            logUserAction('transactions_exported', { tab: activeTab, time_period: timePeriod, format: 'csv' })
        } catch (error) {
            toast.error('Failed to export transactions')
        }
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            PAID: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
            HOLDING: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
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

    const getTypeBadge = (type: string) => {
        return type === 'vote' ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <Vote className="w-3 h-3 mr-1" />
                Vote
            </span>
        ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Package className="w-3 h-3 mr-1" />
                Subscription
            </span>
        )
    }

    const clearFilters = () => {
        setStatusFilter('')
        setTypeFilter('')
        setDateFromFilter('')
        setDateToFilter('')
        setSearchQuery('')
        setTimePeriod('30days')
        setCurrentPage(1)
        logButtonClick('clear_transaction_filters')
    }

    const getCurrentData = () => {
        switch (activeTab) {
            case 'votes':
                return voteTransactionsData
            case 'subscriptions':
                return subscriptionTransactionsData
            default:
                return allTransactionsData
        }
    }

    const getCurrentLoading = () => {
        switch (activeTab) {
            case 'votes':
                return voteTransactionsLoading
            case 'subscriptions':
                return subscriptionTransactionsLoading
            default:
                return allTransactionsLoading
        }
    }

    const getCurrentError = () => {
        switch (activeTab) {
            case 'votes':
                return voteTransactionsError
            case 'subscriptions':
                return subscriptionTransactionsError
            default:
                return allTransactionsError
        }
    }

    const currentData = getCurrentData()
    const currentLoading = getCurrentLoading()
    const currentError = getCurrentError()

    const transactions = currentData?.data || []
    const pagination = currentData ? {
        current_page: currentData.current_page,
        last_page: currentData.last_page,
        per_page: currentData.per_page,
        total: currentData.total
    } : null

    // Chart colors
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

    // Generate years for year filter
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

    return (
        <div className="p-6 max-w-8xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                            <CreditCard className="w-8 h-8 mr-3 text-blue-600" />
                            Transaction Management
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Monitor and manage all platform transactions with detailed analytics
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowStatsPanel(!showStatsPanel)}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center"
                        >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            {showStatsPanel ? 'Hide Stats' : 'Show Stats'}
                        </button>
                        <button
                            onClick={handleExport}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Time Period Filter */}
            <div className="card-glass border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Time Period</h3>
                    <div className="flex items-center space-x-2">
                        {timePeriod === '1year' && (
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                            >
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    {[
                        { key: 'today', label: 'Today' },
                        { key: '7days', label: 'Last 7 Days' },
                        { key: '30days', label: 'Last 30 Days' },
                        { key: '1year', label: 'Year' },
                        { key: 'all', label: 'All Time' },
                        { key: 'custom', label: 'Custom Range' }
                    ].map(period => (
                        <button
                            key={period.key}
                            onClick={() => handleTimePeriodChange(period.key as typeof timePeriod)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${timePeriod === period.key
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {period.label}
                        </button>
                    ))}
                </div>

                {timePeriod === 'custom' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Date</label>
                            <input
                                type="date"
                                value={dateFromFilter}
                                onChange={(e) => setDateFromFilter(e.target.value)}
                                className="form-input focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Date</label>
                            <input
                                type="date"
                                value={dateToFilter}
                                onChange={(e) => setDateToFilter(e.target.value)}
                                className="form-input focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Statistics Panel */}
            {showStatsPanel && statsData && (
                <div className="mb-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white dark:bg-secondary-900 p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <CreditCard className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{statsData.total_transactions?.toLocaleString()}</p>
                                    {statsData.transaction_growth && (
                                        <div className={`flex items-center text-sm ${statsData.transaction_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {statsData.transaction_growth >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                                            {Math.abs(statsData.transaction_growth)}% from last period
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-secondary-900 p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <DollarSign className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">₦{statsData.total_revenue?.toLocaleString()}</p>
                                    {statsData.revenue_growth && (
                                        <div className={`flex items-center text-sm ${statsData.revenue_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {statsData.revenue_growth >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                                            {Math.abs(statsData.revenue_growth)}% from last period
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-secondary-900 p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <Clock className="w-6 h-6 text-yellow-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Amount</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">₦{statsData.pending_amount?.toLocaleString()}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{statsData.pending_count} transactions</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-secondary-900 p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-purple-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{statsData.success_rate}%</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{statsData.successful_transactions} successful</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Revenue Chart */}
                        <div className="bg-white dark:bg-secondary-900 p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
                            {chartLoading ? (
                                <div className="h-64 flex items-center justify-center">
                                    <LoadingSpinner />
                                </div>
                            ) : chartData?.revenue_chart ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={chartData.revenue_chart}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => [`₦${value?.toLocaleString()}`, 'Revenue']} />
                                        <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                    No chart data available
                                </div>
                            )}
                        </div>

                        {/* Transaction Types */}
                        <div className="bg-white dark:bg-secondary-900 p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Types</h3>
                            {chartLoading ? (
                                <div className="h-64 flex items-center justify-center">
                                    <LoadingSpinner />
                                </div>
                            ) : chartData?.type_breakdown ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsPieChart>
                                        <Pie
                                            data={chartData.type_breakdown}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {chartData.type_breakdown.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => [value?.toLocaleString(), 'Count']} />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                    No chart data available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status Breakdown */}
                    <div className="bg-white dark:bg-secondary-900 p-6 rounded-lg shadow-sm border">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Status Breakdown</h3>
                        {chartLoading ? (
                            <div className="h-64 flex items-center justify-center">
                                <LoadingSpinner />
                            </div>
                        ) : chartData?.status_chart ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData.status_chart}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="status" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => [value?.toLocaleString(), 'Count']} />
                                    <Bar dataKey="count" fill="#3B82F6" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                No chart data available
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Rest of the existing component code continues... */}
            {/* Tabs */}
            <div className="card-glass border border-gray-200 mb-6">
                <div className="border-b border-gray-200 dark:border-secondary-700">
                    <nav className="-mb-px flex space-x-8 px-6">
                        {[
                            { key: 'all', label: 'All Transactions', icon: CreditCard },
                            { key: 'votes', label: 'Vote Transactions', icon: Vote },
                            { key: 'subscriptions', label: 'Subscription Transactions', icon: Package }
                        ].map(tab => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => {
                                        setActiveTab(tab.key as typeof activeTab)
                                        setCurrentPage(1)
                                    }}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === tab.key
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <Icon className="w-4 h-4 mr-2" />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </nav>
                </div>

                {/* Filters */}
                <div className="p-6">
                    <form onSubmit={handleFilterSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Search
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search transactions..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Status
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="form-input focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="PAID">Paid</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="HOLDING">Holding</option>
                                    <option value="FAILED">Failed</option>
                                </select>
                            </div>

                            {activeTab === 'all' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Type
                                    </label>
                                    <select
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                        className="form-input focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">All Types</option>
                                        <option value="vote">Vote</option>
                                        <option value="subscription">Subscription</option>
                                    </select>
                                </div>
                            )}

                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                                >
                                    <Filter className="w-4 h-4 mr-2" />
                                    Apply Filters
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-gray-600 hover:text-gray-800 text-sm"
                            >
                                Clear all filters
                            </button>
                            {pagination && (
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                                    {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                                    {pagination.total} transactions
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* Transactions Table */}
            {currentLoading ? (
                <div className="flex items-center justify-center py-12">
                    <LoadingSpinner />
                </div>
            ) : currentError ? (
                <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Transactions</h3>
                    <p className="text-gray-600 dark:text-gray-400">Failed to load transaction data</p>
                </div>
            ) : (
                <div className="card-glass border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-secondary-700">
                            <thead className="bg-gray-50 dark:bg-secondary-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Transaction
                                    </th>
                                    {activeTab === 'all' && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                    )}
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-secondary-900 divide-y divide-gray-200 dark:divide-secondary-700">
                                {transactions.map((transaction: any) => (
                                    <tr key={transaction.id} className="hover:bg-gray-50 dark:bg-secondary-800">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {transaction.reference}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {transaction.vote_name || transaction.subscription_plan || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        {activeTab === 'all' && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getTypeBadge(transaction.type)}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">{transaction.user_name || 'Anonymous'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                ₦{transaction.amount?.toLocaleString()}
                                            </div>
                                            {transaction.quantity && (
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    Qty: {transaction.quantity}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(transaction.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleViewDetails(transaction)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
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
                            <p className="text-gray-600 dark:text-gray-400">
                                No transactions match your current filters.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between mt-6">
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
            )}

            {/* Transaction Details Modal */}
            {showDetailsModal && selectedTransaction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-secondary-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Transaction Details
                                </h3>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reference</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{selectedTransaction.reference}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                    {getStatusBadge(selectedTransaction.status)}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                                    <p className="text-sm text-gray-900 dark:text-white">₦{selectedTransaction.amount?.toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        {format(new Date(selectedTransaction.created_at), 'MMM dd, yyyy HH:mm:ss')}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">User</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{selectedTransaction.user_name || 'Anonymous'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                                    {getTypeBadge(selectedTransaction.type)}
                                </div>
                            </div>

                            {selectedTransaction.vote_name && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vote</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{selectedTransaction.vote_name}</p>
                                </div>
                            )}

                            {selectedTransaction.subscription_plan && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subscription Plan</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{selectedTransaction.subscription_plan}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TransactionsPage 