import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Settings,
    Save,
    RotateCcw,
    Bell,
    Mail,
    Smartphone,
    Shield,
    Activity,
    User,
    DollarSign,
    AlertTriangle,
    Info,
    TestTube2,
    CheckCircle,
    XCircle,
    BarChart3,
    Eye,
    EyeOff
} from 'lucide-react'
import { profileApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

interface NotificationSettings {
    [category: string]: {
        [type: string]: {
            id: number
            user_id: number
            type: string
            category: string
            enabled: boolean
            created_at: string
            updated_at: string
        }
    }
}

interface NotificationStats {
    total_notifications: number
    unread_notifications: number
    read_notifications: number
    notifications_by_type: { [key: string]: number }
    notifications_by_day: { [key: string]: number }
    recent_notifications: Array<{
        id: string
        type: string
        data: any
        read_at: string | null
        created_at: string
    }>
}

const NotificationSettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<NotificationSettings>({})
    const [hasChanges, setHasChanges] = useState(false)
    const [showStats, setShowStats] = useState(false)
    const { user } = useAuth()
    const queryClient = useQueryClient()

    // Fetch notification settings
    const { data: settingsData, isLoading: settingsLoading } = useQuery({
        queryKey: ['user-notification-settings'],
        queryFn: async () => {
            return await profileApi.getNotificationSettings()
        }
    })

    // Fetch notification statistics
    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['user-notification-stats'],
        queryFn: async () => {
            return await profileApi.getNotificationStats()
        },
        enabled: showStats
    })

    // Transform API data when it changes
    useEffect(() => {
        if (settingsData?.data) {
            setSettings(settingsData.data)
        }
    }, [settingsData])

    // Update settings mutation
    const updateSettingsMutation = useMutation({
        mutationFn: async (updatedSettings: Array<{
            type: string
            category: string
            enabled: boolean
        }>) => {
            return await profileApi.updateNotificationSettings(updatedSettings)
        },
        onSuccess: () => {
            toast.success('Notification settings updated successfully')
            setHasChanges(false)
            queryClient.invalidateQueries({ queryKey: ['user-notification-settings'] })
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update notification settings')
        }
    })

    // Reset settings mutation
    const resetSettingsMutation = useMutation({
        mutationFn: async () => {
            return await profileApi.resetNotificationSettings()
        },
        onSuccess: () => {
            toast.success('Notification settings reset to defaults')
            setHasChanges(false)
            queryClient.invalidateQueries({ queryKey: ['user-notification-settings'] })
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to reset notification settings')
        }
    })

    // Test notification mutation
    const testNotificationMutation = useMutation({
        mutationFn: async (data: { notification_type: string; message?: string }) => {
            return await profileApi.testNotification(data)
        },
        onSuccess: () => {
            toast.success('Test notification sent successfully')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to send test notification')
        }
    })

    // Bulk update mutation
    const bulkUpdateMutation = useMutation({
        mutationFn: async (data: { enable_all?: boolean; disable_all?: boolean; categories?: string[] }) => {
            return await profileApi.bulkUpdateNotificationSettings(data)
        },
        onSuccess: () => {
            toast.success('Notification settings updated successfully')
            setHasChanges(false)
            queryClient.invalidateQueries({ queryKey: ['user-notification-settings'] })
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update notification settings')
        }
    })

    const handleToggleSetting = (category: string, type: string) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [type]: {
                    ...prev[category]?.[type],
                    enabled: !prev[category]?.[type]?.enabled
                }
            }
        }))
        setHasChanges(true)
    }

    const handleSaveSettings = () => {
        const flatSettings: Array<{
            type: string
            category: string
            enabled: boolean
        }> = []
        Object.entries(settings).forEach(([category, types]) => {
            Object.entries(types).forEach(([type, settingObj]) => {
                flatSettings.push({ category, type, enabled: settingObj.enabled })
            })
        })
        updateSettingsMutation.mutate(flatSettings)
    }

    const handleResetSettings = () => {
        if (window.confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
            resetSettingsMutation.mutate()
        }
    }

    const handleBulkAction = (action: 'enable_all' | 'disable_all') => {
        const confirmMessage = action === 'enable_all'
            ? 'Enable all notification types? You will receive notifications for all activities.'
            : 'Disable all notification types? You will stop receiving all notifications.'

        if (window.confirm(confirmMessage)) {
            bulkUpdateMutation.mutate({ [action]: true })
        }
    }

    const handleTestNotification = (type: string) => {
        testNotificationMutation.mutate({
            notification_type: type,
            message: `This is a test ${type} notification sent at ${new Date().toLocaleString()}`
        })
    }

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'login':
                return <User className="w-5 h-5 text-blue-500" />
            case 'security':
                return <Shield className="w-5 h-5 text-red-500" />
            case 'activity':
                return <Activity className="w-5 h-5 text-green-500" />
            case 'system':
                return <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            case 'marketing':
                return <Mail className="w-5 h-5 text-purple-500" />
            default:
                return <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        }
    }

    const getCategoryDescription = (category: string) => {
        switch (category) {
            case 'login':
                return 'Login activities, new device access, and authentication events'
            case 'security':
                return 'Security alerts, suspicious activities, and account protection'
            case 'activity':
                return 'Votes, subscriptions, referrals, and platform activities'
            case 'system':
                return 'System updates, maintenance notices, and announcements'
            case 'marketing':
                return 'Promotional content, newsletters, and feature updates'
            default:
                return 'General notifications'
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'email':
                return <Mail className="w-4 h-4" />
            case 'database':
                return <Bell className="w-4 h-4" />
            case 'sms':
                return <Smartphone className="w-4 h-4" />
            default:
                return <Bell className="w-4 h-4" />
        }
    }

    const getTypeDescription = (type: string) => {
        switch (type) {
            case 'email':
                return 'Receive notifications via email'
            case 'database':
                return 'Show notifications in your notification center'
            case 'sms':
                return 'Receive notifications via SMS (when available)'
            default:
                return 'Notification delivery method'
        }
    }

    if (settingsLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-secondary-800 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner />
                        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading notification settings...</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-secondary-800 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <div className="card-glass p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                                    <Bell className="w-8 h-8 text-blue-500 mr-3" />
                                    Notification Settings
                                </h1>
                                <p className="text-gray-600 mt-2">
                                    Customize how you receive notifications about your account activity
                                </p>
                                <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    <User className="w-4 h-4 mr-1" />
                                    <span>{user?.first_name} {user?.last_name}</span>
                                    <span className="mx-2">•</span>
                                    <Mail className="w-4 h-4 mr-1" />
                                    <span>{user?.email}</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => setShowStats(!showStats)}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-2"
                                >
                                    {showStats ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    <span>{showStats ? 'Hide Stats' : 'Show Stats'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                {showStats && (
                    <div className="mb-8">
                        <div className="card-glass p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                <BarChart3 className="w-5 h-5 mr-2" />
                                Notification Statistics
                            </h2>
                            {statsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <LoadingSpinner />
                                    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading statistics...</span>
                                </div>
                            ) : statsData?.data ? (
                                <div className="grid md:grid-cols-4 gap-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-blue-600 text-sm font-medium">Total</p>
                                                <p className="text-2xl font-bold text-blue-900">
                                                    {statsData.data.total_notifications || 0}
                                                </p>
                                            </div>
                                            <Bell className="w-8 h-8 text-blue-500" />
                                        </div>
                                    </div>
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-green-600 text-sm font-medium">Read</p>
                                                <p className="text-2xl font-bold text-green-900">
                                                    {statsData.data.read_notifications || 0}
                                                </p>
                                            </div>
                                            <CheckCircle className="w-8 h-8 text-green-500" />
                                        </div>
                                    </div>
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-yellow-600 text-sm font-medium">Unread</p>
                                                <p className="text-2xl font-bold text-yellow-900">
                                                    {statsData.data.unread_notifications || 0}
                                                </p>
                                            </div>
                                            <XCircle className="w-8 h-8 text-yellow-500" />
                                        </div>
                                    </div>
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-purple-600 text-sm font-medium">This Week</p>
                                                <p className="text-2xl font-bold text-purple-900">
                                                    {Object.values(statsData.data.notifications_by_day || {}).reduce((a: number, b: number) => a + b, 0)}
                                                </p>
                                            </div>
                                            <Activity className="w-8 h-8 text-purple-500" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400">No statistics available</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="mb-8">
                    <div className="card-glass p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => handleBulkAction('enable_all')}
                                disabled={bulkUpdateMutation.isPending}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
                            >
                                <CheckCircle className="w-4 h-4" />
                                <span>Enable All</span>
                            </button>
                            <button
                                onClick={() => handleBulkAction('disable_all')}
                                disabled={bulkUpdateMutation.isPending}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
                            >
                                <XCircle className="w-4 h-4" />
                                <span>Disable All</span>
                            </button>
                            <button
                                onClick={handleResetSettings}
                                disabled={resetSettingsMutation.isPending}
                                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Reset to Default</span>
                            </button>
                            <button
                                onClick={() => handleTestNotification('email')}
                                disabled={testNotificationMutation.isPending}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
                            >
                                <TestTube2 className="w-4 h-4" />
                                <span>Test Email</span>
                            </button>
                            <button
                                onClick={() => handleTestNotification('database')}
                                disabled={testNotificationMutation.isPending}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
                            >
                                <TestTube2 className="w-4 h-4" />
                                <span>Test In-App</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Settings Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                    <div className="flex items-start space-x-3">
                        <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div>
                            <h3 className="text-blue-800 font-medium">About Your Notification Settings</h3>
                            <p className="text-blue-700 text-sm mt-1">
                                Configure how you want to receive different types of notifications. Email notifications are sent to <strong>{user?.email}</strong>,
                                while in-app notifications appear in your notification center. Your settings are automatically saved.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Settings Categories */}
                <div className="space-y-6">
                    {Object.entries(settings).map(([category, types]) => (
                        <div key={category} className="card-glass">
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-secondary-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        {getCategoryIcon(category)}
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 capitalize">
                                                {category} Notifications
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {getCategoryDescription(category)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {Object.values(types).filter(setting => setting.enabled).length} / {Object.keys(types).length} enabled
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4">
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(types).map(([type, settingObj]) => (
                                        <div
                                            key={type}
                                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-secondary-800 transition-colors duration-200"
                                        >
                                            <div className="flex items-center space-x-3">
                                                {getTypeIcon(type)}
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-900 capitalize">
                                                        {type}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {getTypeDescription(type)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={settingObj.enabled}
                                                        onChange={() => handleToggleSetting(category, type)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-secondary-900 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Save Button */}
                {hasChanges && (
                    <div className="fixed bottom-6 right-6 bg-white dark:bg-secondary-900 rounded-lg shadow-lg border border-gray-200 p-4">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 text-yellow-600">
                                <AlertTriangle className="w-5 h-5" />
                                <span className="text-sm font-medium">You have unsaved changes</span>
                            </div>
                            <button
                                onClick={handleSaveSettings}
                                disabled={updateSettingsMutation.isPending}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                <span>{updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default NotificationSettingsPage 