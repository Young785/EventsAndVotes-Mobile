import React, { useState, useEffect } from 'react'
import {
    Activity,
    Filter,
    Download,
    Search,
    Calendar,
    User,
    Shield,
    AlertTriangle,
    Eye,
    RefreshCw,
    BarChart3,
    Clock,
    Globe,
    Smartphone
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuditLogger } from '../hooks/useAuditLogger'
import { activityLogsApi } from '../services/api'

interface ActivityLogItem {
    id: number
    log_name: string
    description: string
    subject_type?: string
    subject_id?: number
    causer_type?: string
    causer_id?: number
    properties: Record<string, any>
    created_at: string
    causer?: {
        id: number
        first_name: string
        last_name: string
        email: string
        role?: {
            name: string
        }
    }
    subject?: {
        id: number
        name?: string
        title?: string
    }
}

interface ActivityStats {
    total_logs: number
    user_interactions: number
    frontend_errors: number
    api_calls: number
    authentication_events: number
    security_events: number
    admin_actions: number
    today_logs: number
    error_rate: number
    top_actions: Array<{ action: string; count: number }>
    error_breakdown: Array<{ error_type: string; count: number }>
}

const AdminActivityLogs: React.FC = () => {
    const [filter, setFilter] = useState({
        log_name: 'all',
        date_from: '',
        date_to: '',
        search: '',
        causer_id: '',
        page: 1,
        per_page: 20
    })
    const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null)
    const [showStats, setShowStats] = useState(false)

    // Initialize audit logging for this component
    const { logUserAction, logButtonClick } = useAuditLogger({
        context: 'AdminActivityLogs',
        trackClicks: true,
        trackFormSubmissions: true
    })

    // Fetch activity logs
    const {
        data: logsData,
        isLoading: logsLoading,
        error: logsError,
        refetch: refetchLogs
    } = useQuery({
        queryKey: ['admin-activity-logs', filter],
        queryFn: () => activityLogsApi.getAll(filter),
        refetchInterval: 30000
    })

    // Fetch activity statistics
    const {
        data: statsData,
        isLoading: statsLoading,
        error: statsError
    } = useQuery({
        queryKey: ['admin-activity-stats'],
        queryFn: () => activityLogsApi.getStats(),
        enabled: showStats,
        refetchInterval: 60000
    })

    // Log component mount and filter changes
    useEffect(() => {
        logUserAction('admin_activity_logs_viewed', {
            filter: filter.log_name,
            search: !!filter.search,
            dateRange: !!(filter.date_from && filter.date_to)
        })
    }, [filter, logUserAction])

    const handleFilterChange = (key: string, value: string) => {
        const newFilter = { ...filter, [key]: value, page: 1 }
        setFilter(newFilter)
        logUserAction('activity_logs_filter_changed', {
            filterType: key,
            value,
            previousValue: filter[key as keyof typeof filter]
        })
    }

    const handleSearch = (searchTerm: string) => {
        handleFilterChange('search', searchTerm)
    }

    const handleExport = async () => {
        try {
            logButtonClick('export_activity_logs')
            // Call export API
            const response = await activityLogsApi.export(filter)

            // Create download link
            const blob = new Blob([response.data], { type: 'text/csv' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            logUserAction('activity_logs_exported', {
                filter,
                timestamp: new Date().toISOString()
            })
        } catch (error) {
            logUserAction('activity_logs_export_failed', {
                error: error instanceof Error ? error.message : 'Export failed'
            })
        }
    }

    const handleLogClick = (log: ActivityLogItem) => {
        setSelectedLog(log)
        logButtonClick('view_activity_log_details', `log_${log.id}`)
    }

    const handleRefresh = () => {
        refetchLogs()
        logButtonClick('refresh_activity_logs')
    }

    const getLogIcon = (logName: string) => {
        switch (logName) {
            case 'authentication':
                return <User className="w-4 h-4" />
            case 'security':
            case 'frontend_error':
                return <Shield className="w-4 h-4" />
            case 'admin_action':
                return <AlertTriangle className="w-4 h-4" />
            case 'frontend_api':
                return <Globe className="w-4 h-4" />
            case 'user_interaction':
                return <Smartphone className="w-4 h-4" />
            default:
                return <Activity className="w-4 h-4" />
        }
    }

    const getLogColor = (logName: string) => {
        switch (logName) {
            case 'authentication':
                return 'text-blue-600 bg-blue-100'
            case 'security':
            case 'frontend_error':
                return 'text-red-600 bg-red-100'
            case 'admin_action':
                return 'text-orange-600 bg-orange-100'
            case 'frontend_api':
                return 'text-green-600 bg-green-100'
            case 'user_interaction':
                return 'text-purple-600 bg-purple-100'
            default:
                return 'text-gray-600 bg-gray-100'
        }
    }

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString()
    }

    const renderLogProperties = (properties: Record<string, any>) => {
        if (!properties || Object.keys(properties).length === 0) {
            return <span className="text-gray-500 text-sm">No additional data</span>
        }

        return (
            <div className="space-y-2">
                {Object.entries(properties).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                        <span className="font-medium text-gray-600 capitalize">
                            {key.replace(/_/g, ' ')}:
                        </span>
                        <span className="text-gray-800 max-w-xs truncate">
                            {typeof value === 'object'
                                ? JSON.stringify(value).substring(0, 100) + '...'
                                : String(value)
                            }
                        </span>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Activity className="w-8 h-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
                        <p className="text-gray-600 dark:text-gray-400">Monitor system activities and user interactions</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setShowStats(!showStats)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <BarChart3 className="w-4 h-4" />
                        <span>{showStats ? 'Hide' : 'Show'} Stats</span>
                    </button>

                    <button
                        onClick={handleRefresh}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Refresh</span>
                    </button>

                    <button
                        onClick={handleExport}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>
                </div>
            </div>

            {/* Statistics Panel */}
            {showStats && (
                <div className="card-glass p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Statistics</h3>

                    {statsLoading ? (
                        <div className="animate-pulse space-y-4">
                            <div className="grid grid-cols-4 gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="h-20 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        </div>
                    ) : statsError ? (
                        <div className="text-red-500 text-center py-4">
                            Failed to load statistics
                        </div>
                    ) : statsData?.data && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                    {(statsData.data.total_logs || 0).toLocaleString()}
                                </div>
                                <div className="text-sm text-blue-600">Total Logs</div>
                            </div>

                            <div className="bg-green-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">
                                    {(statsData.data.user_interactions || 0).toLocaleString()}
                                </div>
                                <div className="text-sm text-green-600">User Interactions</div>
                            </div>

                            <div className="bg-red-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-red-600">
                                    {(statsData.data.frontend_errors || 0).toLocaleString()}
                                </div>
                                <div className="text-sm text-red-600">Frontend Errors</div>
                            </div>

                            <div className="bg-purple-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-purple-600">
                                    {(statsData.data.api_calls || 0).toLocaleString()}
                                </div>
                                <div className="text-sm text-purple-600">API Calls</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="card-glass p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={filter.search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Log Type Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <select
                            value={filter.log_name}
                            onChange={(e) => handleFilterChange('log_name', e.target.value)}
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                        >
                            <option value="all">All Types</option>
                            <option value="authentication">Authentication</option>
                            <option value="security">Security</option>
                            <option value="admin_action">Admin Actions</option>
                            <option value="user_interaction">User Interactions</option>
                            <option value="frontend_api">API Calls</option>
                            <option value="frontend_error">Frontend Errors</option>
                            <option value="vote_management">Vote Management</option>
                            <option value="financial">Financial</option>
                        </select>
                    </div>

                    {/* Date From */}
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="date"
                            value={filter.date_from}
                            onChange={(e) => handleFilterChange('date_from', e.target.value)}
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Date To */}
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="date"
                            value={filter.date_to}
                            onChange={(e) => handleFilterChange('date_to', e.target.value)}
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Activity Logs Table */}
            <div className="card-glass">
                <div className="overflow-x-auto">
                    {logsLoading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading activity logs...</p>
                        </div>
                    ) : logsError ? (
                        <div className="p-8 text-center text-red-500">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                            <p>Failed to load activity logs</p>
                            <p className="text-sm text-gray-500 mt-2">
                                {logsError instanceof Error ? logsError.message : 'Unknown error occurred'}
                            </p>
                        </div>
                    ) : !logsData?.data?.length ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No activity logs found</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 dark:bg-secondary-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Timestamp
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-secondary-900 divide-y divide-gray-200">
                                {logsData.data.map((log: ActivityLogItem) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:bg-secondary-800">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${getLogColor(log.log_name)}`}>
                                                {getLogIcon(log.log_name)}
                                                <span className="capitalize">
                                                    {log.log_name.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-md truncate">
                                                {log.description}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.causer ? (
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                            {log.causer.first_name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {log.causer.first_name} {log.causer.last_name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {log.causer.role?.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-500 dark:text-gray-400">System</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                                                <Clock className="w-4 h-4" />
                                                <span>{formatTimestamp(log.created_at)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleLogClick(log)}
                                                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                                            >
                                                <Eye className="w-4 h-4" />
                                                <span>View</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Log Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-secondary-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Activity Log Details
                                </h3>
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                                <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${getLogColor(selectedLog.log_name)}`}>
                                    {getLogIcon(selectedLog.log_name)}
                                    <span className="capitalize">
                                        {selectedLog.log_name.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLog.description}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Timestamp</label>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatTimestamp(selectedLog.created_at)}</p>
                            </div>

                            {selectedLog.causer && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">User</label>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {selectedLog.causer.first_name} {selectedLog.causer.last_name} ({selectedLog.causer.email})
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Properties</label>
                                <div className="mt-1 p-3 bg-gray-50 dark:bg-secondary-800 rounded-lg">
                                    {renderLogProperties(selectedLog.properties)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminActivityLogs 