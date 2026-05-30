import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
    Bell,
    BellRing,
    Search,
    Filter,
    Check,
    CheckCheck,
    Trash2,
    Settings,
    AlertCircle,
    Shield,
    Activity,
    User,
    CreditCard,
    Vote,
    Calendar,
    Eye,
    MoreVertical
} from 'lucide-react'
import { adminApi } from '../../services/api'
import { Notification } from '../../types'
import AdminLayout from '../../components/AdminLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

const AdminNotifications: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
    const queryClient = useQueryClient()

    // Fetch notifications
    const { data: notificationsData, isLoading } = useQuery({
        queryKey: ['admin-notifications', currentPage, searchQuery, statusFilter],
        queryFn: () => adminApi.getNotifications({
            page: currentPage,
            per_page: 20,
            read: statusFilter === 'read' ? true : statusFilter === 'unread' ? false : undefined
        })
    })

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: (id: string) => adminApi.markNotificationAsRead(id),
        onSuccess: () => {
            toast.success('Notification marked as read')
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        },
        onError: () => toast.error('Failed to mark notification as read')
    })

    // Mark all as read mutation
    const markAllAsReadMutation = useMutation({
        mutationFn: () => adminApi.markAllNotificationsAsRead(),
        onSuccess: () => {
            toast.success('All notifications marked as read')
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        },
        onError: () => toast.error('Failed to mark all notifications as read')
    })

    // Delete notification mutation
    const deleteNotificationMutation = useMutation({
        mutationFn: (id: string) => adminApi.deleteNotification(id),
        onSuccess: () => {
            toast.success('Notification deleted')
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        },
        onError: () => toast.error('Failed to delete notification')
    })

    const notifications = notificationsData?.data || []
    const unreadCount = notificationsData?.unread_count || 0
    const pagination = notificationsData ? {
        current_page: notificationsData.current_page,
        last_page: notificationsData.last_page,
        per_page: notificationsData.per_page,
        total: notificationsData.total
    } : null

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)
    }

    const handleSelectNotification = (id: string) => {
        setSelectedNotifications(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        )
    }

    const handleSelectAll = () => {
        if (selectedNotifications.length === notifications.length) {
            setSelectedNotifications([])
        } else {
            setSelectedNotifications(notifications.map((n: Notification) => n.id))
        }
    }

    const handleBulkMarkAsRead = () => {
        selectedNotifications.forEach(id => {
            const notification = notifications.find((n: Notification) => n.id === id)
            if (notification && !notification.read_at) {
                markAsReadMutation.mutate(id)
            }
        })
        setSelectedNotifications([])
    }

    const handleBulkDelete = () => {
        if (window.confirm('Are you sure you want to delete selected notifications?')) {
            selectedNotifications.forEach(id => {
                deleteNotificationMutation.mutate(id)
            })
            setSelectedNotifications([])
        }
    }

    const getNotificationIcon = (iconType: string) => {
        switch (iconType) {
            case 'login':
                return <User className="w-5 h-5 text-blue-500" />
            case 'shield-alert':
                return <Shield className="w-5 h-5 text-red-500" />
            case 'activity':
                return <Activity className="w-5 h-5 text-green-500" />
            case 'vote':
                return <Vote className="w-5 h-5 text-purple-500" />
            case 'credit-card':
                return <CreditCard className="w-5 h-5 text-blue-500" />
            case 'dollar-sign':
                return <span className="w-5 h-5 text-green-500">$</span>
            case 'lock':
                return <Shield className="w-5 h-5 text-orange-500" />
            default:
                return <AlertCircle className="w-5 h-5 text-gray-500" />
        }
    }

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'high':
                return 'border-l-red-500 bg-red-50'
            case 'medium':
                return 'border-l-yellow-500 bg-yellow-50'
            case 'low':
                return 'border-l-green-500 bg-green-50'
            default:
                return 'border-l-gray-300 bg-white'
        }
    }



    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <nav className="text-sm text-gray-500 mb-2">
                    <Link to="/admin/dashboard" className="hover:text-gray-700">Home</Link>
                    <span className="mx-2">•</span>
                    <span className="text-gray-900">Notifications</span>
                </nav>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                        <p className="text-gray-600 mt-1">
                            Manage your notifications and preferences
                            {unreadCount > 0 && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    {unreadCount} unread
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsReadMutation.mutate()}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                                disabled={markAllAsReadMutation.isLoading}
                            >
                                <CheckCheck className="w-4 h-4" />
                                <span>Mark All Read</span>
                            </button>
                        )}
                        <Link
                            to="/admin/notifications/settings"
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
                        >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <form onSubmit={handleSearch} className="grid md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Search className="w-4 h-4 inline mr-1" />
                            Search Notifications
                        </label>
                        <input
                            type="text"
                            placeholder="Search by title, message..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Filter className="w-4 h-4 inline mr-1" />
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Notifications</option>
                            <option value="unread">Unread Only</option>
                            <option value="read">Read Only</option>
                        </select>
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

            {/* Bulk Actions */}
            {selectedNotifications.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <span className="text-blue-700 font-medium">
                            {selectedNotifications.length} notification(s) selected
                        </span>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleBulkMarkAsRead}
                                className="text-blue-600 hover:text-blue-700 px-3 py-1 rounded text-sm font-medium"
                            >
                                Mark as Read
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="text-red-600 hover:text-red-700 px-3 py-1 rounded text-sm font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notifications List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">
                            All Notifications ({pagination?.total || 0})
                        </h2>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                                onChange={handleSelectAll}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label className="text-sm text-gray-700">Select All</label>
                        </div>
                    </div>
                </div>

                {notifications.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-gray-400 mb-4">
                            <Bell className="w-24 h-24 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Notifications Found</h3>
                        <p className="text-gray-600">
                            You'll see your notifications here when they arrive.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.map((notification: Notification) => (
                            <div
                                key={notification.id}
                                className={`p-6 hover:bg-gray-50 transition-colors duration-200 border-l-4 ${notification.read_at ? 'opacity-75' : ''
                                    } ${getPriorityColor(notification.data.priority)}`}
                            >
                                <div className="flex items-start space-x-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedNotifications.includes(notification.id)}
                                        onChange={() => handleSelectNotification(notification.id)}
                                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />

                                    <div className="flex-shrink-0 mt-1">
                                        {getNotificationIcon(notification.data.icon)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <h3 className="text-sm font-medium text-gray-900">
                                                        {notification.data.title}
                                                    </h3>
                                                    {!notification.read_at && (
                                                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                                    )}
                                                    {notification.data.priority === 'high' && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                            High Priority
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    {notification.data.message}
                                                </p>
                                                <div className="flex items-center space-x-4 text-xs text-gray-400">
                                                    <span className="flex items-center">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                    </span>
                                                    {notification.data.device_info && (
                                                        <span>
                                                            {notification.data.device_info.device} • {notification.data.device_info.browser}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2 ml-4">
                                                {!notification.read_at && (
                                                    <button
                                                        onClick={() => markAsReadMutation.mutate(notification.id)}
                                                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors duration-200"
                                                        title="Mark as read"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteNotificationMutation.mutate(notification.id)}
                                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {notification.data.action_text && notification.data.action_url && (
                                            <div className="mt-3">
                                                <a
                                                    href={notification.data.action_url}
                                                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    {notification.data.action_text}
                                                    <Eye className="w-3 h-3 ml-1" />
                                                </a>
                                            </div>
                                        )}
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

export default AdminNotifications 