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
    EyeOff,
    Upload,
    Image,
    Search,
    Mail,
    Phone,
    Link,
    AlertTriangle,
    RotateCcw,
    Building2
} from 'lucide-react'
import { adminApi } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import SettingsService from '../../services/settingsService'
import toast from 'react-hot-toast'
import { extractErrorMessage, isValidationError, showErrorToast } from '../../utils/errorUtils'

interface SiteSettings {
    // Basic site information
    site_name?: string
    site_description?: string
    site_keywords?: string
    site_url?: string
    admin_email?: string
    support_email?: string
    contact_phone?: string
    site_logo?: string
    site_favicon?: string
    site_banner?: string

    // Payment settings
    payment_gateway?: string
    currency?: string
    currency_symbol?: string
    monicredit_script_url?: string

    // Admin bank details
    admin_bank_name?: string
    admin_account_number?: string
    admin_account_name?: string
    admin_payment_instructions?: string

    // Referral settings
    referral_enabled?: boolean
    referral_registration_bonus?: number
    referral_subscription_percentage?: number
    referral_vote_percentage?: number
    referral_event_percentage?: number
    referral_minimum_withdrawal?: number

    // Security settings
    two_factor_required?: boolean
    password_reset_required?: boolean
    session_timeout?: number
    max_login_attempts?: number
    account_lockout_duration?: number

    // Notification settings
    email_notifications_enabled?: boolean
    sms_notifications_enabled?: boolean
    push_notifications_enabled?: boolean

    // System settings
    maintenance_mode?: boolean
    maintenance_message?: string
    registration_enabled?: boolean
    email_verification_required?: boolean
    auto_approve_withdrawals?: boolean
    max_withdrawal_amount?: number
    min_withdrawal_amount?: number

    // Withdrawal settings
    withdrawal_site_charges?: number
    withdrawal_pg_charges?: number
    normal_withdrawal_hours?: number
    express_withdrawal_hours?: number
    express_withdrawal_fee?: number

    // Social media links
    facebook_url?: string
    twitter_url?: string
    instagram_url?: string
    linkedin_url?: string
    youtube_url?: string

    // SEO settings
    meta_title?: string
    meta_description?: string
    google_analytics_id?: string
    google_tag_manager_id?: string
}

const SiteSettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState('basic')
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const [faviconPreview, setFaviconPreview] = useState<string | null>(null)
    const [bannerPreview, setBannerPreview] = useState<string | null>(null)
    const queryClient = useQueryClient()

    const { data: settingsResponse, isLoading } = useQuery({
        queryKey: ['siteSettings'],
        queryFn: () => adminApi.getSiteSettings(),
    })

    const updateSettingsMutation = useMutation({
        mutationFn: (data: FormData) => adminApi.updateSiteSettings(data),
        onSuccess: (response) => {
            toast.success('Site settings updated successfully')
            queryClient.invalidateQueries({ queryKey: ['siteSettings'] })
            
            // Update localStorage settings for immediate frontend effect
            if (response.data?.settings) {
                const publicSettings = {
                    site_name: response.data.settings.site_name,
                    site_logo: response.data.settings.site_logo,
                    site_favicon: response.data.settings.site_favicon,
                    site_banner: response.data.settings.site_banner,
                    currency: response.data.settings.currency,
                    currency_symbol: response.data.settings.currency_symbol,
                    currency_icon: response.data.settings.currency_icon,
                    site_frontend_url: response.data.settings.site_frontend_url,
                    monicredit_script_url: response.data.settings.monicredit_script_url,
                    maintenance_mode: response.data.settings.maintenance_mode,
                    maintenance_message: response.data.settings.maintenance_message,
                    registration_enabled: response.data.settings.registration_enabled,
                    email_verification_required: response.data.settings.email_verification_required,
                    withdrawal_settings: {
                        min_withdrawal_amount: response.data.settings.min_withdrawal_amount,
                        max_withdrawal_amount: response.data.settings.max_withdrawal_amount,
                        withdrawal_site_charges: response.data.settings.withdrawal_site_charges,
                        withdrawal_pg_charges: response.data.settings.withdrawal_pg_charges,
                        normal_withdrawal_hours: response.data.settings.normal_withdrawal_hours,
                        express_withdrawal_hours: response.data.settings.express_withdrawal_hours,
                        express_withdrawal_fee: response.data.settings.express_withdrawal_fee,
                    },
                    social_media: {
                        facebook_url: response.data.settings.facebook_url,
                        twitter_url: response.data.settings.twitter_url,
                        instagram_url: response.data.settings.instagram_url,
                        linkedin_url: response.data.settings.linkedin_url,
                        youtube_url: response.data.settings.youtube_url,
                    }
                };
                SettingsService.storeSettings(publicSettings);
                console.log('Settings updated in localStorage:', publicSettings);
            }
        },
        onError: (error: any) => {
            showErrorToast(error)
        }
    })

    const resetSettingsMutation = useMutation({
        mutationFn: () => adminApi.resetSiteSettings(),
        onSuccess: () => {
            toast.success('Settings reset to default successfully')
            queryClient.invalidateQueries({ queryKey: ['siteSettings'] })
        },
        onError: (error: any) => {
            showErrorToast(error)
        }
    })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon' | 'banner') => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
                const result = event.target?.result as string
                if (type === 'logo') setLogoPreview(result)
                else if (type === 'favicon') setFaviconPreview(result)
                else if (type === 'banner') setBannerPreview(result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        
        // Convert checkbox values to proper boolean strings
        const checkboxFields = [
            'referral_enabled',
            'two_factor_required',
            'password_reset_required',
            'email_notifications_enabled',
            'sms_notifications_enabled',
            'push_notifications_enabled',
            'maintenance_mode',
            'registration_enabled',
            'email_verification_required',
            'auto_approve_withdrawals'
        ]

        checkboxFields.forEach(field => {
            const checkbox = e.currentTarget.querySelector(`[name="${field}"]`) as HTMLInputElement
            if (checkbox) {
                formData.set(field, checkbox.checked ? '1' : '0')
            }
        })

        updateSettingsMutation.mutate(formData)
    }

    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
            resetSettingsMutation.mutate()
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    const settings: SiteSettings = settingsResponse?.data?.settings || {}
    const paymentGateways = settingsResponse?.data?.payment_gateways || []

    const tabs = [
        { id: 'basic', label: 'Basic Info', icon: <Globe className="w-4 h-4" /> },
        { id: 'payment', label: 'Payment', icon: <DollarSign className="w-4 h-4" /> },
        { id: 'admin-bank', label: 'Admin Bank Details', icon: <Building2 className="w-4 h-4" /> },
        { id: 'referral', label: 'Referral', icon: <Gift className="w-4 h-4" /> },
        { id: 'withdrawal', label: 'Withdrawal', icon: <DollarSign className="w-4 h-4" /> },
        { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
        { id: 'system', label: 'System', icon: <Settings className="w-4 h-4" /> },
        { id: 'social', label: 'Social Media', icon: <Link className="w-4 h-4" /> },
        { id: 'seo', label: 'SEO', icon: <Search className="w-4 h-4" /> },
    ]

    return (
        <div className="space-y-6 p-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
                    <p className="text-gray-600">Manage your platform configuration and preferences</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={handleReset}
                        disabled={resetSettingsMutation.isPending}
                        className="btn-secondary text-red-600 hover:text-red-700"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset to Default
                    </button>
                    <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['siteSettings'] })}
                        className="btn-secondary"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Settings Form */}
            <div className="bg-white rounded-lg shadow-sm">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab.id
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
                    {activeTab === 'basic' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900">Basic Site Information</h3>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Site Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="site_name"
                                        defaultValue={settings.site_name || ''}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Site URL *
                                    </label>
                                    <input
                                        type="url"
                                        name="site_url"
                                        defaultValue={settings.site_url || ''}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Mail className="w-4 h-4 inline mr-1" />
                                        Admin Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="admin_email"
                                        defaultValue={settings.admin_email || ''}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Mail className="w-4 h-4 inline mr-1" />
                                        Support Email
                                    </label>
                                    <input
                                        type="email"
                                        name="support_email"
                                        defaultValue={settings.support_email || ''}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Phone className="w-4 h-4 inline mr-1" />
                                        Contact Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="contact_phone"
                                        defaultValue={settings.contact_phone || ''}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Site Description
                                </label>
                                <textarea
                                    name="site_description"
                                    rows={3}
                                    defaultValue={settings.site_description || ''}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Site Keywords (comma separated)
                                </label>
                                <input
                                    type="text"
                                    name="site_keywords"
                                    defaultValue={settings.site_keywords || ''}
                                    placeholder="events, voting, management, platform"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* File Uploads */}
                            <div className="grid md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Image className="w-4 h-4 inline mr-1" />
                                        Site Logo
                                    </label>
                                    <div className="space-y-2">
                                        <input
                                            type="file"
                                            name="site_logo"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'logo')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {(logoPreview || settings.site_logo) && (
                                            <img
                                                src={logoPreview || settings.site_logo}
                                                alt="Logo preview"
                                                className="w-20 h-20 object-contain border rounded"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Image className="w-4 h-4 inline mr-1" />
                                        Site Favicon
                                    </label>
                                    <div className="space-y-2">
                                        <input
                                            type="file"
                                            name="site_favicon"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'favicon')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {(faviconPreview || settings.site_favicon) && (
                                            <img
                                                src={faviconPreview || settings.site_favicon}
                                                alt="Favicon preview"
                                                className="w-8 h-8 object-contain border rounded"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Image className="w-4 h-4 inline mr-1" />
                                        Site Banner
                                    </label>
                                    <div className="space-y-2">
                                        <input
                                            type="file"
                                            name="site_banner"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'banner')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {(bannerPreview || settings.site_banner) && (
                                            <img
                                                src={bannerPreview || settings.site_banner}
                                                alt="Banner preview"
                                                className="w-full h-20 object-cover border rounded"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'payment' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900">Payment Settings</h3>

                            <div className="grid md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Default Payment Gateway
                                    </label>
                                    <select
                                        name="payment_gateway"
                                        defaultValue={settings.payment_gateway || ''}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Gateway</option>
                                        {paymentGateways.map((gateway: any) => (
                                            <option key={gateway.pg_id} value={gateway.pg_id}>
                                                {gateway.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Currency
                                    </label>
                                    <input
                                        type="text"
                                        name="currency"
                                        defaultValue={settings.currency || 'USD'}
                                        maxLength={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Currency Symbol
                                    </label>
                                    <input
                                        type="text"
                                        name="currency_symbol"
                                        defaultValue={settings.currency_symbol || '$'}
                                        maxLength={5}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Monicredit Script URL
                                </label>
                                <input
                                    type="url"
                                    name="monicredit_script_url"
                                    defaultValue={settings.monicredit_script_url || 'https://demo.monicredit.com/js/demo.js'}
                                    placeholder="https://demo.monicredit.com/js/demo.js"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    URL for the Monicredit payment gateway script. Use demo URL for testing.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'admin-bank' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900">Admin Bank Details</h3>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Bank Name
                                    </label>
                                    <input
                                        type="text"
                                        name="admin_bank_name"
                                        defaultValue={settings.admin_bank_name || ''}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Account Number
                                    </label>
                                    <input
                                        type="text"
                                        name="admin_account_number"
                                        defaultValue={settings.admin_account_number || ''}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Account Name
                                    </label>
                                    <input
                                        type="text"
                                        name="admin_account_name"
                                        defaultValue={settings.admin_account_name || ''}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Instructions
                                    </label>
                                    <textarea
                                        name="admin_payment_instructions"
                                        rows={3}
                                        defaultValue={settings.admin_payment_instructions || ''}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'referral' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900">Referral System Settings</h3>

                            <div className="space-y-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="referral_enabled"
                                        defaultChecked={settings.referral_enabled !== false}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Enable Referral System</span>
                                </label>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Registration Bonus ({SettingsService.getCurrencySymbol()})
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="referral_registration_bonus"
                                        defaultValue={settings.referral_registration_bonus || 0}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Minimum Withdrawal ({SettingsService.getCurrencySymbol()})
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="referral_minimum_withdrawal"
                                        defaultValue={settings.referral_minimum_withdrawal || 10}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Subscription Commission (%)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            name="referral_subscription_percentage"
                                            defaultValue={settings.referral_subscription_percentage || 0}
                                            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <Percent className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Vote Commission (%)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            name="referral_vote_percentage"
                                            defaultValue={settings.referral_vote_percentage || 0}
                                            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <Percent className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Event Commission (%)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            name="referral_event_percentage"
                                            defaultValue={settings.referral_event_percentage || 0}
                                            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <Percent className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'withdrawal' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900">Withdrawal Settings</h3>

                            <div className="space-y-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="withdrawal_site_charges"
                                        defaultChecked={settings.withdrawal_site_charges !== undefined}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Enable Site Charges</span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="withdrawal_pg_charges"
                                        defaultChecked={settings.withdrawal_pg_charges !== undefined}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Enable PG Charges</span>
                                </label>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Site Charges (%)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        name="withdrawal_site_charges"
                                        defaultValue={settings.withdrawal_site_charges || 2.5}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Gateway Charges (%)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        name="withdrawal_pg_charges"
                                        defaultValue={settings.withdrawal_pg_charges || 1.5}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Normal Withdrawal Hours
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="168"
                                        name="normal_withdrawal_hours"
                                        defaultValue={settings.normal_withdrawal_hours || 24}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Express Withdrawal Hours
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="24"
                                        name="express_withdrawal_hours"
                                        defaultValue={settings.express_withdrawal_hours || 2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Express Withdrawal Fee ({SettingsService.getCurrencySymbol()})
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="express_withdrawal_fee"
                                        defaultValue={settings.express_withdrawal_fee || 500}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Minimum Withdrawal Amount ({SettingsService.getCurrencySymbol()})
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="min_withdrawal_amount"
                                        defaultValue={settings.min_withdrawal_amount || 1000}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Maximum Withdrawal Amount ({SettingsService.getCurrencySymbol()})
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="max_withdrawal_amount"
                                        defaultValue={settings.max_withdrawal_amount || 500000}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>

                            <div className="space-y-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="two_factor_required"
                                        defaultChecked={settings.two_factor_required === true}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Require Two-Factor Authentication</span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="password_reset_required"
                                        defaultChecked={settings.password_reset_required === true}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Force Password Reset on Suspicious Activity</span>
                                </label>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Session Timeout (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="1440"
                                        name="session_timeout"
                                        defaultValue={settings.session_timeout || 120}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Max Login Attempts
                                    </label>
                                    <input
                                        type="number"
                                        min="3"
                                        max="10"
                                        name="max_login_attempts"
                                        defaultValue={settings.max_login_attempts || 5}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Account Lockout (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="1440"
                                        name="account_lockout_duration"
                                        defaultValue={settings.account_lockout_duration || 30}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>

                            <div className="space-y-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="email_notifications_enabled"
                                        defaultChecked={settings.email_notifications_enabled !== false}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Enable Email Notifications</span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="sms_notifications_enabled"
                                        defaultChecked={settings.sms_notifications_enabled === true}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Enable SMS Notifications</span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="push_notifications_enabled"
                                        defaultChecked={settings.push_notifications_enabled !== false}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Enable Push Notifications</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900">System Settings</h3>

                            <div className="space-y-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="maintenance_mode"
                                        defaultChecked={settings.maintenance_mode === true}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        <AlertTriangle className="w-4 h-4 inline mr-1 text-yellow-500" />
                                        Maintenance Mode
                                    </span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="registration_enabled"
                                        defaultChecked={settings.registration_enabled !== false}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Enable User Registration</span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="email_verification_required"
                                        defaultChecked={settings.email_verification_required !== false}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Require Email Verification</span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="auto_approve_withdrawals"
                                        defaultChecked={settings.auto_approve_withdrawals === true}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Auto-approve Withdrawals</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Maintenance Message
                                </label>
                                <textarea
                                    name="maintenance_message"
                                    rows={3}
                                    defaultValue={settings.maintenance_message || ''}
                                    placeholder="Message to display when site is in maintenance mode"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'social' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900">Social Media Links</h3>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Facebook URL
                                    </label>
                                    <input
                                        type="url"
                                        name="facebook_url"
                                        defaultValue={settings.facebook_url || ''}
                                        placeholder="https://facebook.com/yourpage"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Twitter URL
                                    </label>
                                    <input
                                        type="url"
                                        name="twitter_url"
                                        defaultValue={settings.twitter_url || ''}
                                        placeholder="https://twitter.com/yourhandle"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Instagram URL
                                    </label>
                                    <input
                                        type="url"
                                        name="instagram_url"
                                        defaultValue={settings.instagram_url || ''}
                                        placeholder="https://instagram.com/yourhandle"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        LinkedIn URL
                                    </label>
                                    <input
                                        type="url"
                                        name="linkedin_url"
                                        defaultValue={settings.linkedin_url || ''}
                                        placeholder="https://linkedin.com/company/yourcompany"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        YouTube URL
                                    </label>
                                    <input
                                        type="url"
                                        name="youtube_url"
                                        defaultValue={settings.youtube_url || ''}
                                        placeholder="https://youtube.com/c/yourchannel"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'seo' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900">SEO Settings</h3>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Meta Title
                                    </label>
                                    <input
                                        type="text"
                                        name="meta_title"
                                        defaultValue={settings.meta_title || ''}
                                        maxLength={255}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Google Analytics ID
                                    </label>
                                    <input
                                        type="text"
                                        name="google_analytics_id"
                                        defaultValue={settings.google_analytics_id || ''}
                                        placeholder="GA-XXXXXXXXX-X"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Google Tag Manager ID
                                    </label>
                                    <input
                                        type="text"
                                        name="google_tag_manager_id"
                                        defaultValue={settings.google_tag_manager_id || ''}
                                        placeholder="GTM-XXXXXXX"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Meta Description
                                </label>
                                <textarea
                                    name="meta_description"
                                    rows={3}
                                    defaultValue={settings.meta_description || ''}
                                    maxLength={500}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-6 border-t border-gray-200">
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

export default SiteSettings 