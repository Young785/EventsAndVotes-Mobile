import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Settings,
    Save,
    RefreshCw,
    DollarSign,
    Users,
    Gift,
    Percent,
    Shield,
    Bell,
    Globe,
    Lock,
    Eye,
    EyeOff
} from 'lucide-react'
import { adminApi } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const AdminSettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState('general')
    const [showApiKeys, setShowApiKeys] = useState(false)
    const queryClient = useQueryClient()

    const { data: settings, isLoading } = useQuery({
        queryKey: ['adminSettings'],
        queryFn: () => adminApi.getSettings(),
    })

    const updateSettingsMutation = useMutation({
        mutationFn: (data: any) => adminApi.updateSettings(data),
        onSuccess: () => {
            toast.success('Settings updated successfully')
            queryClient.invalidateQueries({ queryKey: ['adminSettings'] })
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update settings')
        }
    })

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const rawData = Object.fromEntries(formData.entries())

        // Convert to proper data object
        const data: Record<string, any> = {}

        // Convert numeric fields
        const numericFields = [
            'user_registration_commission_rate',
            'admin_registration_commission_rate',
            'subscription_commission_rate',
            'vote_purchase_commission_rate',
            'event_purchase_commission_rate',
            'user_subscription_commission_rate',
            'admin_subscription_commission_rate',
            'user_vote_commission_rate',
            'admin_vote_commission_rate',
            'user_event_commission_rate',
            'admin_event_commission_rate',
            'referral_code_length',
            'withdrawal_site_charges',
            'withdrawal_pg_charges'
        ]

        numericFields.forEach(field => {
            if (rawData[field]) {
                data[field] = parseFloat(rawData[field] as string)
            }
        })

        // Convert boolean fields
        const booleanFields = ['referral_system_enabled', 'maintenance_mode', 'user_registration_enabled']
        booleanFields.forEach(field => {
            data[field] = rawData[field] === 'on' || rawData[field] === 'true'
        })

        // Copy string fields
        const stringFields = [
            'site_name', 'site_url', 'contact_email', 'support_phone', 'site_description',
            'referral_code_prefix', 'referral_terms'
        ]
        stringFields.forEach(field => {
            if (rawData[field]) {
                data[field] = rawData[field] as string
            }
        })

        updateSettingsMutation.mutate(data)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    const settingsData = settings?.data || {}

    const tabs = [
        { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
        { id: 'referrals', label: 'Referral System', icon: <Gift className="w-4 h-4" /> },
        { id: 'payments', label: 'Payment Settings', icon: <DollarSign className="w-4 h-4" /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
        { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage your platform configuration and preferences</p>
                </div>
                <button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['adminSettings'] })}
                    className="btn-secondary"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </button>
            </div>

            {/* Settings Form */}
            <div className="card-glass">
                <div className="border-b border-gray-200 dark:border-secondary-700">
                    <nav className="flex space-x-8 px-6">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">General Settings</h3>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Site Name
                                    </label>
                                    <input
                                        type="text"
                                        name="site_name"
                                        defaultValue={settingsData.site_name || 'EventsAndVotes'}
                                        className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Site URL
                                    </label>
                                    <input
                                        type="url"
                                        name="site_url"
                                        defaultValue={settingsData.site_url || window.location.origin}
                                        className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Contact Email
                                    </label>
                                    <input
                                        type="email"
                                        name="contact_email"
                                        defaultValue={settingsData.contact_email || ''}
                                        className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Support Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="support_phone"
                                        defaultValue={settingsData.support_phone || ''}
                                        className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Site Description
                                </label>
                                <textarea
                                    name="site_description"
                                    rows={3}
                                    defaultValue={settingsData.site_description || ''}
                                    className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex items-center space-x-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="user_registration_enabled"
                                        defaultChecked={settingsData.user_registration_enabled !== false}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable User Registration</span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="maintenance_mode"
                                        defaultChecked={settingsData.maintenance_mode === true}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Maintenance Mode</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'referrals' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Referral System Settings</h3>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="referral_system_enabled"
                                        defaultChecked={settingsData.referral_system_enabled !== false}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable Referral System</span>
                                </label>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Referral Code Prefix
                                    </label>
                                    <input
                                        type="text"
                                        name="referral_code_prefix"
                                        defaultValue={settingsData.referral_code_prefix || 'REF_'}
                                        className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Code Length
                                    </label>
                                    <input
                                        type="number"
                                        name="referral_code_length"
                                        min="4"
                                        max="20"
                                        defaultValue={settingsData.referral_code_length || 8}
                                        className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-900 mb-4">Registration Commission Rates (%)</h4>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            User Registration
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                name="user_registration_commission_rate"
                                                defaultValue={settingsData.user_registration_commission_rate || 0}
                                                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <Percent className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Admin Registration
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                name="admin_registration_commission_rate"
                                                defaultValue={settingsData.admin_registration_commission_rate || 0}
                                                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <Percent className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-900 mb-4">Subscription Commission Rates (%)</h4>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            User Subscription
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                name="user_subscription_commission_rate"
                                                defaultValue={settingsData.user_subscription_commission_rate || 5}
                                                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <Percent className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Admin Subscription
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                name="admin_subscription_commission_rate"
                                                defaultValue={settingsData.admin_subscription_commission_rate || 10}
                                                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <Percent className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-900 mb-4">Vote Purchase Commission Rates (%)</h4>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            User Vote Purchase
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                name="user_vote_commission_rate"
                                                defaultValue={settingsData.user_vote_commission_rate || 3}
                                                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <Percent className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Admin Vote Purchase
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                name="admin_vote_commission_rate"
                                                defaultValue={settingsData.admin_vote_commission_rate || 5}
                                                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <Percent className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-900 mb-4">Event Purchase Commission Rates (%)</h4>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            User Event Purchase
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                name="user_event_commission_rate"
                                                defaultValue={settingsData.user_event_commission_rate || 5}
                                                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <Percent className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Admin Event Purchase
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                name="admin_event_commission_rate"
                                                defaultValue={settingsData.admin_event_commission_rate || 8}
                                                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <Percent className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Referral Terms & Conditions
                                </label>
                                <textarea
                                    name="referral_terms"
                                    rows={4}
                                    defaultValue={settingsData.referral_terms || ''}
                                    placeholder="Enter terms and conditions for the referral program..."
                                    className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Settings</h3>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Site Withdrawal Charges (%)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            name="withdrawal_site_charges"
                                            defaultValue={settingsData.withdrawal_site_charges || 0}
                                            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <Percent className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Payment Gateway Charges (%)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            name="withdrawal_pg_charges"
                                            defaultValue={settingsData.withdrawal_pg_charges || 0}
                                            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <Percent className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Settings</h3>
                            <p className="text-gray-600 dark:text-gray-400">Configure system-wide notification preferences</p>

                            <div className="space-y-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="email_notifications_enabled"
                                        defaultChecked={settingsData.email_notifications_enabled !== false}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable Email Notifications</span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="sms_notifications_enabled"
                                        defaultChecked={settingsData.sms_notifications_enabled === true}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable SMS Notifications</span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="push_notifications_enabled"
                                        defaultChecked={settingsData.push_notifications_enabled !== false}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable Push Notifications</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Settings</h3>

                            <div className="space-y-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="two_factor_required"
                                        defaultChecked={settingsData.two_factor_required === true}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Require Two-Factor Authentication</span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="password_reset_required"
                                        defaultChecked={settingsData.password_reset_required === true}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Force Password Reset on Suspicious Activity</span>
                                </label>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Session Timeout (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="1440"
                                        name="session_timeout"
                                        defaultValue={settingsData.session_timeout || 120}
                                        className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Max Login Attempts
                                    </label>
                                    <input
                                        type="number"
                                        min="3"
                                        max="10"
                                        name="max_login_attempts"
                                        defaultValue={settingsData.max_login_attempts || 5}
                                        className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-secondary-700">
                        <button
                            type="submit"
                            disabled={updateSettingsMutation.isPending}
                            className="btn-primary"
                        >
                            {updateSettingsMutation.isPending ? (
                                <LoadingSpinner size="sm" />
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Settings
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AdminSettings 