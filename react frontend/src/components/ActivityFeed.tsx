import React, { useState, useEffect } from 'react'
import { Activity, User, Vote, CreditCard, AlertCircle, Clock, Filter, Eye, Shield, Settings } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuditLogger } from '../hooks/useAuditLogger'

interface ActivityItem {
    id: number
    type: 'user' | 'vote' | 'payment' | 'system' | 'withdrawal' | 'authentication' | 'security' | 'admin_action' | 'frontend_error'
    title: string
    description: string
    user?: {
        name: string
        email: string
        image?: string
    }
    timestamp: string
    status: 'success' | 'warning' | 'error' | 'info'
    metadata?: Record<string, any>
    log_name?: string
    properties?: Record<string, any>
}

interface ActivityFeedProps {
    title?: string
    limit?: number
    showFilters?: boolean
    apiEndpoint?: () => Promise<{ data: ActivityItem[] }>
    context?: string
}

// Mock activity data - replace with actual API call
const mockActivities: ActivityItem[] = [
    {
        id: 1,
        type: 'vote',
        title: 'New Vote Created',
        description: 'Student Council Elections was created by admin',
        user: {
            name: 'Admin User',
            email: 'admin@example.com'
        },
        timestamp: '2024-01-15T10:30:00Z',
        status: 'success',
        metadata: { vote_id: 123, category: 'school' }
    },
    {
        id: 2,
        type: 'payment',
        title: 'Payment Processed',
        description: 'Subscription payment of ₦5,000 was successfully processed',
        user: {
            name: 'John Doe',
            email: 'john@example.com'
        },
        timestamp: '2024-01-15T10:15:00Z',
        status: 'success',
        metadata: { amount: 5000, plan: 'Premium' }
    },
    {
        id: 3,
        type: 'withdrawal',
        title: 'Withdrawal Request',
        description: 'New withdrawal request of ₦15,000 pending approval',
        user: {
            name: 'Jane Smith',
            email: 'jane@example.com'
        },
        timestamp: '2024-01-15T09:45:00Z',
        status: 'warning',
        metadata: { amount: 15000, status: 'pending' }
    },
    {
        id: 4,
        type: 'user',
        title: 'User Registration',
        description: 'New user registered with premium subscription',
        user: {
            name: 'Mike Johnson',
            email: 'mike@example.com'
        },
        timestamp: '2024-01-15T09:30:00Z',
        status: 'info',
        metadata: { subscription: 'premium' }
    },
    {
        id: 5,
        type: 'system',
        title: 'System Alert',
        description: 'High vote traffic detected on Student Elections',
        timestamp: '2024-01-15T09:00:00Z',
        status: 'warning',
        metadata: { vote_count: 1500, threshold: 1000 }
    }
]

const ActivityFeed: React.FC<ActivityFeedProps> = ({
    title = 'Recent Activity',
    limit = 10,
    showFilters = true,
    apiEndpoint,
    context = 'ActivityFeed'
}) => {
    const [filter, setFilter] = useState<'all' | 'user' | 'vote' | 'payment' | 'system' | 'authentication' | 'security'>('all')
    const [showDetails, setShowDetails] = useState<number | null>(null)

    // Initialize audit logging
    const { logUserAction, logButtonClick } = useAuditLogger({ context })

    const { data: activities, isLoading, error } = useQuery({
        queryKey: ['activity-feed', filter],
        queryFn: apiEndpoint || (() => Promise.resolve({ data: mockActivities })),
        refetchInterval: 30000 // Refetch every 30 seconds
    })

    // Log component interactions
    useEffect(() => {
        logUserAction('activity_feed_viewed', {
            filter,
            limit,
            hasApiEndpoint: !!apiEndpoint
        })
    }, [filter, logUserAction, limit, apiEndpoint])

    const filteredActivities = (activities?.data || mockActivities)
        .filter(activity => filter === 'all' || activity.type === filter || activity.log_name === filter)
        .slice(0, limit)

    const getActivityIcon = (type: ActivityItem['type'], logName?: string) => {
        // Use log_name if available for more specific icons
        if (logName) {
            switch (logName) {
                case 'authentication':
                    return <User className="w-5 h-5" />
                case 'security':
                    return <Shield className="w-5 h-5" />
                case 'admin_action':
                    return <Settings className="w-5 h-5" />
                case 'frontend_error':
                    return <AlertCircle className="w-5 h-5" />
                default:
                    break
            }
        }

        switch (type) {
            case 'user':
                return <User className="w-5 h-5" />
            case 'vote':
                return <Vote className="w-5 h-5" />
            case 'payment':
                return <CreditCard className="w-5 h-5" />
            case 'withdrawal':
                return <CreditCard className="w-5 h-5" />
            case 'system':
                return <AlertCircle className="w-5 h-5" />
            case 'authentication':
                return <User className="w-5 h-5" />
            case 'security':
                return <Shield className="w-5 h-5" />
            case 'admin_action':
                return <Settings className="w-5 h-5" />
            case 'frontend_error':
                return <AlertCircle className="w-5 h-5" />
            default:
                return <Activity className="w-5 h-5" />
        }
    }

    const getStatusColor = (status: ActivityItem['status']) => {
        switch (status) {
            case 'success':
                return 'text-green-600 bg-green-100'
            case 'warning':
                return 'text-yellow-600 bg-yellow-100'
            case 'error':
                return 'text-red-600 bg-red-100'
            default:
                return 'text-blue-600 bg-blue-100'
        }
    }

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

        if (diffInHours < 1) {
            return 'Just now'
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`
        } else {
            return `${Math.floor(diffInHours / 24)}d ago`
        }
    }

    const handleFilterChange = (newFilter: typeof filter) => {
        setFilter(newFilter)
        logUserAction('activity_feed_filter_changed', {
            from: filter,
            to: newFilter
        })
    }

    const handleDetailsToggle = (activityId: number) => {
        const newShowDetails = showDetails === activityId ? null : activityId
        setShowDetails(newShowDetails)
        logButtonClick('toggle_activity_details', `activity_${activityId}`)
    }

    const handleViewAllClick = () => {
        logButtonClick('view_all_activities')
        // Navigate to full activity logs page
    }

    if (error) {
        logUserAction('activity_feed_error', {
            error: error instanceof Error ? error.message : 'Unknown error'
        })
    }

    return (
        <div className="card-glass">
            <div className="p-6 border-b border-gray-200 dark:border-secondary-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Activity className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                    </div>
                    {showFilters && (
                        <div className="flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <select
                                value={filter}
                                onChange={(e) => handleFilterChange(e.target.value as any)}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Activities</option>
                                <option value="user">User Actions</option>
                                <option value="vote">Vote Activities</option>
                                <option value="payment">Payments</option>
                                <option value="system">System Alerts</option>
                                <option value="authentication">Authentication</option>
                                <option value="security">Security Events</option>
                            </select>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-500 dark:text-gray-400">Loading activities...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                        <p>Failed to load activities</p>
                        <p className="text-sm text-gray-500 mt-2">
                            {error instanceof Error ? error.message : 'Unknown error occurred'}
                        </p>
                    </div>
                ) : filteredActivities.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No activities found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredActivities.map((activity) => (
                            <div key={activity.id} className="p-4 hover:bg-gray-50 dark:bg-secondary-800 transition-colors">
                                <div className="flex items-start space-x-4">
                                    <div className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}>
                                        {getActivityIcon(activity.type, activity.log_name)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {activity.title}
                                                </h4>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {activity.description}
                                                </p>

                                                {activity.user && (
                                                    <div className="flex items-center space-x-2 mt-2">
                                                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                                {activity.user.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {activity.user.name}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between mt-3">
                                                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                                                        <Clock className="w-3 h-3" />
                                                        <span>{formatTime(activity.timestamp)}</span>
                                                    </div>

                                                    {((activity.metadata && Object.keys(activity.metadata).length > 0) ||
                                                        (activity.properties && Object.keys(activity.properties).length > 0)) && (
                                                            <button
                                                                onClick={() => handleDetailsToggle(activity.id)}
                                                                className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                                                            >
                                                                <Eye className="w-3 h-3" />
                                                                <span>
                                                                    {showDetails === activity.id ? 'Hide' : 'Show'} Details
                                                                </span>
                                                            </button>
                                                        )}
                                                </div>

                                                {/* Activity Details */}
                                                {showDetails === activity.id && (activity.metadata || activity.properties) && (
                                                    <div className="mt-3 p-3 bg-gray-50 dark:bg-secondary-800 rounded-lg">
                                                        <h5 className="text-xs font-medium text-gray-700 mb-2">
                                                            Additional Details:
                                                        </h5>
                                                        <div className="space-y-1">
                                                            {/* Show metadata */}
                                                            {activity.metadata && Object.entries(activity.metadata).map(([key, value]) => (
                                                                <div key={key} className="flex justify-between text-xs">
                                                                    <span className="text-gray-500 capitalize">
                                                                        {key.replace('_', ' ')}:
                                                                    </span>
                                                                    <span className="text-gray-700 dark:text-gray-300">
                                                                        {typeof value === 'number' && key.includes('amount')
                                                                            ? `₦${value.toLocaleString()}`
                                                                            : String(value)
                                                                        }
                                                                    </span>
                                                                </div>
                                                            ))}

                                                            {/* Show properties if available */}
                                                            {activity.properties && Object.entries(activity.properties).map(([key, value]) => (
                                                                <div key={key} className="flex justify-between text-xs">
                                                                    <span className="text-gray-500 capitalize">
                                                                        {key.replace('_', ' ')}:
                                                                    </span>
                                                                    <span className="text-gray-700 dark:text-gray-300">
                                                                        {typeof value === 'object'
                                                                            ? JSON.stringify(value).substring(0, 50) + '...'
                                                                            : String(value)
                                                                        }
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
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
            </div>

            {filteredActivities.length > 0 && (
                <div className="p-4 border-t border-gray-200 text-center">
                    <button
                        onClick={handleViewAllClick}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                        View All Activities
                    </button>
                </div>
            )}
        </div>
    )
}

export default ActivityFeed 