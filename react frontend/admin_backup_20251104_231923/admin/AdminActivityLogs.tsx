import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
    Activity,
    Search,
    Filter,
    Download,
    Calendar,
    Eye,
    User,
    Shield,
    Vote,
    CreditCard,
    Settings,
    BarChart3,
    TrendingUp,
    Clock,
    Users,
    AlertTriangle
} from 'lucide-react'
import { adminApi } from '../../services/api'
import { ActivityLog, ActivityLogStats } from '../../types'
import AdminLayout from '../../components/AdminLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { formatDistanceToNow, format } from 'date-fns'
import { getNomineeImageUrl } from '../../utils/imageUtils'

const AdminActivityLogs: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('')
    const [logNameFilter, setLogNameFilter] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [showStats, setShowStats] = useState(true)

    // Fetch activity logs
    const { data: logsData, isLoading } = useQuery({
        queryKey: ['activity-logs', currentPage, searchQuery, logNameFilter, startDate, endDate],
        queryFn: () => adminApi.getActivityLogs({
            page: currentPage,
            per_page: 20,
            log_name: logNameFilter,
            start_date: startDate,
            end_date: endDate
        })
    })

    // Fetch activity statistics
    const { data: statsData } = useQuery({
        queryKey: ['activity-stats'],
        queryFn: () => adminApi.getActivityStats({ days: 30 }),
        enabled: showStats
    })

    // Export logs mutation
    const exportLogsMutation = useMutation({
        mutationFn: (format: 'json' | 'csv') => adminApi.exportActivityLogs({
            format,
            log_name: logNameFilter,
            start_date: startDate,
            end_date: endDate
        }),
        onSuccess: (data, format) => {
            if (format === 'csv') {
                // Handle CSV download
                const blob = data as Blob
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `activity-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
                toast.success('Activity logs exported successfully')
            } else {
                toast.success('Activity logs exported successfully')
            }
        },
        onError: () => {
            toast.error('Failed to export activity logs')
        }
    })

    const logs = logsData?.data || []
    const stats = statsData?.data
    const pagination = logsData ? {
        current_page: logsData.current_page,
        last_page: logsData.last_page,
        per_page: logsData.per_page,
        total: logsData.total
    } : null

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)
    }

    const handleExport = (format: 'json' | 'csv') => {
        exportLogsMutation.mutate(format)
    }

    const getLogIcon = (logName: string) => {
        switch (logName) {
            case 'authentication':
                return <User className="w-5 h-5 text-blue-500" />
            case 'security':
                return <Shield className="w-5 h-5 text-red-500" />
            case 'user_management':
                return <Users className="w-5 h-5 text-green-500" />
            case 'vote_management':
                return <Vote className="w-5 h-5 text-purple-500" />
            case 'financial':
                return <CreditCard className="w-5 h-5 text-blue-500" />
            case 'admin_actions':
                return <Settings className="w-5 h-5 text-gray-500" />
            default:
                return <Activity className="w-5 h-5 text-gray-500" />
        }
    }

    const getLogColor = (logName: string) => {
        switch (logName) {
            case 'authentication':
                return 'bg-blue-100 text-blue-800'
            case 'security':
                return 'bg-red-100 text-red-800'
            case 'user_management':
                return 'bg-green-100 text-green-800'
            case 'vote_management':
                return 'bg-purple-100 text-purple-800'
            case 'financial':
                return 'bg-blue-100 text-blue-800'
            case 'admin_actions':
                return 'bg-gray-100 text-gray-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }



    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <nav className="text-sm text-gray-500 mb-2">
                    <Link to="/admin/dashboard" className="hover:text-gray-700">Home</Link>
                    <span className="mx-2">•</span>
                    <span className="text-gray-900">Activity Logs</span>
                </nav>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
                        <p className="text-gray-600 mt-1">
                            Monitor and audit system activity and user actions
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowStats(!showStats)}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
                        >
                            <BarChart3 className="w-4 h-4" />
                            <span>{showStats ? 'Hide' : 'Show'} Stats</span>
                        </button>
                        <div className="relative">
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 group">
                                <Download className="w-4 h-4" />
                                <span>Export</span>
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                <button
                                    onClick={() => handleExport('csv')}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                                >
                                    Export as CSV
                                </button>
                                <button
                                    onClick={() => handleExport('json')}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
                                >
                                    Export as JSON
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            {showStats && stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Activities</p>
                                <p className="text-2xl font-bold text-gray-900">{(stats.total_activities || 0).toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Activity className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Login Activities</p>
                                <p className="text-2xl font-bold text-gray-900">{(stats.login_activities || 0).toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <User className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Security Events</p>
                                <p className="text-2xl font-bold text-gray-900">{(stats.security_activities || 0).toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-lg">
                                <Shield className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Admin Actions</p>
                                <p className="text-2xl font-bold text-gray-900">{(stats.admin_activities || 0).toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Settings className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <form onSubmit={handleSearch} className="grid md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Search className="w-4 h-4 inline mr-1" />
                            Search
                        </label>
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Filter className="w-4 h-4 inline mr-1" />
                            Log Type
                        </label>
                        <select
                            value={logNameFilter}
                            onChange={(e) => setLogNameFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Types</option>
                            <option value="authentication">Authentication</option>
                            <option value="security">Security</option>
                            <option value="user_management">User Management</option>
                            <option value="vote_management">Vote Management</option>
                            <option value="financial">Financial</option>
                            <option value="admin_actions">Admin Actions</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            Search
                        </button>
                    </div>
                </form>
            </div>

            {/* Activity Logs Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Activity Timeline ({pagination?.total || 0})
                    </h2>
                </div>

                {logs.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-gray-400 mb-4">
                            <Activity className="w-24 h-24 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Activity Logs Found</h3>
                        <p className="text-gray-600">
                            No activities match your current filters.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {logs.map((log: ActivityLog) => (
                            <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 mt-1">
                                        {getLogIcon(log.log_name)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <h3 className="text-sm font-medium text-gray-900">
                                                        {log.description}
                                                    </h3>
                                                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${getLogColor(log.log_name)}`}>
                                                        {log.log_name.replace('_', ' ')}
                                                    </span>
                                                </div>

                                                {log.causer && (
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <img
                                                            src={getNomineeImageUrl({ image: log.causer.image }) || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'}
                                                            alt={log.causer.first_name}
                                                            className="w-6 h-6 rounded-full object-cover"
                                                        />
                                                        <span className="text-sm text-gray-600">
                                                            {log.causer.first_name} {log.causer.last_name}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            ({log.causer.email})
                                                        </span>
                                                        {log.causer.role && (
                                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                                {log.causer.role.display_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex items-center space-x-4 text-xs text-gray-400">
                                                    <span className="flex items-center">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                                    </span>
                                                    <span>
                                                        {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                                                    </span>
                                                    {log.batch_uuid && (
                                                        <span>
                                                            Batch: {log.batch_uuid.substring(0, 8)}...
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Properties */}
                                                {Object.keys(log.properties).length > 0 && (
                                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                        <details className="text-xs">
                                                            <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                                                                View Details
                                                            </summary>
                                                            <pre className="mt-2 text-gray-600 whitespace-pre-wrap">
                                                                {JSON.stringify(log.properties, null, 2)}
                                                            </pre>
                                                        </details>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                                    const page = i + 1
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
        </div>
    )
}

export default AdminActivityLogs 