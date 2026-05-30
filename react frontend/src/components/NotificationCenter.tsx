import React, { useState, useEffect, useRef } from 'react'
import { Bell, BellRing, Check, X, Settings, AlertCircle, Shield, Activity, User, CreditCard, Vote } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../services/api'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
    id: string
    type: string
    data: {
        title: string
        message: string
        type: string
        icon: string
        priority?: string
        action_url?: string
        action_text?: string
        time: string
        [key: string]: any
    }
    read_at: string | null
    created_at: string
}

const NotificationCenter: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const queryClient = useQueryClient()

    // Fetch unread count
    const { data: unreadCountData } = useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: () => adminApi.getUnreadNotificationsCount(),
        refetchInterval: 30000 // Refresh every 30 seconds
    })

    // Fetch recent notifications
    const { data: notificationsData, isLoading } = useQuery({
        queryKey: ['notifications', 'recent'],
        queryFn: () => adminApi.getRecentNotifications({ limit: 10 }),
        enabled: isOpen
    })

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: (id: string) => adminApi.markNotificationAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        },
    })

    // Mark all as read mutation
    const markAllAsReadMutation = useMutation({
        mutationFn: () => adminApi.markAllNotificationsAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        },
    })

    // Delete notification mutation
    const deleteNotificationMutation = useMutation({
        mutationFn: (id: string) => adminApi.deleteNotification(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        },
    })

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const unreadCount = unreadCountData?.data?.unread_count || 0
    const notifications = notificationsData?.data || []

    const getNotificationIcon = (iconType: string) => {
        switch (iconType) {
            case 'login':
                return <User className="w-4 h-4 text-blue-500" />
            case 'shield-alert':
                return <Shield className="w-4 h-4 text-red-500" />
            case 'activity':
                return <Activity className="w-4 h-4 text-green-500" />
            case 'vote':
                return <Vote className="w-4 h-4 text-purple-500" />
            case 'credit-card':
                return <CreditCard className="w-4 h-4 text-blue-500" />
            case 'dollar-sign':
                return <span className="w-4 h-4 text-green-500">$</span>
            case 'lock':
                return <Shield className="w-4 h-4 text-orange-500" />
            default:
                return <AlertCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        }
    }

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'high':
                return 'border-l-red-500'
            case 'medium':
                return 'border-l-yellow-500'
            case 'low':
                return 'border-l-green-500'
            default:
                return 'border-l-gray-300'
        }
    }

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read_at) {
            markAsReadMutation.mutate(notification.id)
        }

        if (notification.data.action_url) {
            window.location.href = notification.data.action_url
        }
    }

    const handleMarkAsRead = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        markAsReadMutation.mutate(id)
    }

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        deleteNotificationMutation.mutate(id)
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Bell */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
                {unreadCount > 0 ? (
                    <BellRing className="w-5 h-5" />
                ) : (
                    <Bell className="w-5 h-5" />
                )}

                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-secondary-900 rounded-lg shadow-lg border border-gray-200 z-50 max-w-[calc(100vw-2rem)] mx-2 sm:mx-0">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-secondary-700">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllAsReadMutation.mutate()}
                                    className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded"
                                    disabled={markAllAsReadMutation.isLoading}
                                >
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 text-gray-400 hover:text-gray-500 rounded"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-8">
                                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification: Notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200 border-l-4 ${notification.read_at ? 'opacity-75' : ''
                                            } ${getPriorityColor(notification.data.priority)}`}
                                    >
                                        <div className="flex items-start space-x-2 sm:space-x-3">
                                            <div className="flex-shrink-0 mt-1">
                                                {getNotificationIcon(notification.data.icon)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 pr-2">
                                                        <p className="text-sm font-medium text-gray-900 leading-tight">
                                                            {notification.data.title}
                                                        </p>
                                                        <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-tight">
                                                            {notification.data.message}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1 sm:mt-2">
                                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center space-x-1 flex-shrink-0">
                                                        {!notification.read_at && (
                                                            <button
                                                                onClick={(e) => handleMarkAsRead(e, notification.id)}
                                                                className="p-1 text-gray-400 hover:text-green-600 rounded"
                                                                title="Mark as read"
                                                            >
                                                                <Check className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => handleDelete(e, notification.id)}
                                                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                                                            title="Delete"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {notification.data.action_text && notification.data.action_url && (
                                                    <button className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium">
                                                        {notification.data.action_text}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-2 sm:p-3 border-t border-gray-200 bg-gray-50 dark:bg-secondary-800">
                            <div className="flex items-center justify-between">
                                <a
                                    href="/admin/notifications"
                                    className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    onClick={() => setIsOpen(false)}
                                >
                                    View all notifications
                                </a>
                                <a
                                    href="/admin/notifications/settings"
                                    className="p-1 text-gray-400 hover:text-gray-500 rounded"
                                    title="Notification settings"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Settings className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default NotificationCenter 