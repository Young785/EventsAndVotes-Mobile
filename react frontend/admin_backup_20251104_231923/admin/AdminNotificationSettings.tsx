import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
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
    Info
} from 'lucide-react'
import { adminApi } from '../../services/api'
import { NotificationSettings, NotificationSettingsGroup } from '../../types'
import AdminLayout from '../../components/AdminLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const AdminNotificationSettings: React.FC = () => {
    const [settings, setSettings] = useState<NotificationSettingsGroup>({})
    const [hasChanges, setHasChanges] = useState(false)
    const queryClient = useQueryClient()

    // Fetch notification settings
    const { data: settingsData, isLoading } = useQuery({
        queryKey: ['notification-settings'],
        queryFn: async () => {
            return await adminApi.getNotificationSettings()
        }
    })

    // Transform API data when it changes
    React.useEffect(() => {
        if (settingsData?.data) {
            const grouped: NotificationSettingsGroup = {}
            const apiData = settingsData.data

            Object.entries(apiData).forEach(([category, types]: [string, any]) => {
                grouped[category] = {}
                Object.entries(types).forEach(([type, settingObj]: [string, any]) => {
                    // Extract the enabled value from the setting object
                    grouped[category][type] = settingObj?.enabled || false
                })
            })
            setSettings(grouped)
        }
    }, [settingsData])

    // Update settings mutation
    const updateSettingsMutation = useMutation({
        mutationFn: async (updatedSettings: Array<{
            type: string
            category: string
            enabled: boolean
        }>) => {
            return await adminApi.updateNotificationSettings(updatedSettings)
        },
        onSuccess: () => {
            toast.success('Notification settings updated successfully')
            setHasChanges(false)
            queryClient.invalidateQueries({ queryKey: ['notification-settings'] })
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
                [type]: !prev[category]?.[type]
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
            Object.entries(types).forEach(([type, enabled]) => {
                flatSettings.push({ category, type, enabled })
            })
        })
        updateSettingsMutation.mutate(flatSettings)
    }

    const handleResetSettings = () => {
        if (window.confirm('Are you sure you want to reset all settings to default?')) {
            // Reset to default settings (all enabled)
            const defaultSettings: NotificationSettingsGroup = {
                login: { email: true, database: true },
                security: { email: true, database: true },
                activity: { email: false, database: true },
                system: { email: true, database: true },
                marketing: { email: false, database: false }
            }
            setSettings(defaultSettings)
            setHasChanges(true)
        }
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
                return <Settings className="w-5 h-5 text-gray-500" />
            case 'marketing':
                return <Mail className="w-5 h-5 text-purple-500" />
            default:
                return <Bell className="w-5 h-5 text-gray-500" />
        }
    }

    const getCategoryDescription = (category: string) => {
        switch (category) {
            case 'login':
                return 'Notifications about login activities and new device access'
            case 'security':
                return 'Security alerts and suspicious activity notifications'
            case 'activity':
                return 'User activity, vote management, and system activity notifications'
            case 'system':
                return 'System updates, maintenance, and important announcements'
            case 'marketing':
                return 'Promotional content, feature updates, and newsletters'
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

    return (
        <div className="p-6">
            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <LoadingSpinner />
                    <span className="ml-3 text-gray-600">Loading notification settings...</span>
                </div>
            )}

            {/* Content - only show when not loading */}
            {!isLoading && (
                <>
                    {/* Header */}
                    <div className="mb-6">
                        <nav className="text-sm text-gray-500 mb-2">
                            <Link to="/admin/dashboard" className="hover:text-gray-700">Home</Link>
                            <span className="mx-2">•</span>
                            <Link to="/admin/notifications" className="hover:text-gray-700">Notifications</Link>
                            <span className="mx-2">•</span>
                            <span className="text-gray-900">Settings</span>
                        </nav>
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
                                <p className="text-gray-600 mt-1">
                                    Customize your notification preferences by category and delivery method
                                </p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={handleResetSettings}
                                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    <span>Reset to Default</span>
                                </button>
                                <button
                                    onClick={handleSaveSettings}
                                    disabled={!hasChanges || updateSettingsMutation.isPending}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Settings Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start space-x-3">
                            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                            <div>
                                <h3 className="text-blue-800 font-medium">About Notification Settings</h3>
                                <p className="text-blue-700 text-sm mt-1">
                                    Configure how you want to receive different types of notifications. Email notifications are sent to your registered email address, while database notifications appear in your notification center.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Settings Categories */}
                    <div className="space-y-6">
                        {Object.entries(settings).map(([category, types]) => (
                            <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <div className="flex items-center space-x-3">
                                        {getCategoryIcon(category)}
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 capitalize">
                                                {category} Notifications
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {getCategoryDescription(category)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-4">
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.entries(types).map(([type, enabled]) => (
                                            <div
                                                key={type}
                                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    {getTypeIcon(type)}
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-900 capitalize">
                                                            {type}
                                                        </h4>
                                                        <p className="text-xs text-gray-500">
                                                            {type === 'email' && 'Email notifications'}
                                                            {type === 'database' && 'In-app notifications'}
                                                            {type === 'sms' && 'SMS notifications'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={enabled}
                                                        onChange={() => handleToggleSetting(category, type)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Warning */}
            {hasChanges && (
                <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
                    <div className="flex items-center space-x-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        <p className="text-yellow-800 text-sm">
                            You have unsaved changes. Don't forget to save your settings.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminNotificationSettings 