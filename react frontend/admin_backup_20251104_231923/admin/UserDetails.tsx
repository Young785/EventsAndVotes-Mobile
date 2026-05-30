import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    CreditCard,
    Activity,
    Users,
    Vote,
    Gift,
    TrendingUp,
    DollarSign,
    Eye,
    Edit,
    ArrowLeft,
    Shield,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react'
import { superAdminApi } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const UserDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('overview')
    const [isEditingReferral, setIsEditingReferral] = useState(false)

    const { data: userDetails, isLoading, error, refetch } = useQuery({
        queryKey: ['userDetails', id],
        queryFn: () => superAdminApi.getUserDetails(id!),
        enabled: !!id,
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (error || !userDetails?.data) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">User Not Found</h2>
                    <p className="text-gray-600 mb-4">The user you're looking for doesn't exist or you don't have permission to view it.</p>
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="btn-primary"
                    >
                        Back to Users
                    </button>
                </div>
            </div>
        )
    }

    const { 
        user_info: user, 
        referral_info, 
        voting_statistics, 
        subscription_history, 
        financial_summary, 
        recent_activities,
        event_activities
    } = userDetails.data

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <User className="w-4 h-4" /> },
        { id: 'activities', label: 'Activities', icon: <Activity className="w-4 h-4" /> },
        { id: 'subscriptions', label: 'Subscriptions', icon: <CreditCard className="w-4 h-4" /> },
        { id: 'voting', label: 'Voting History', icon: <Vote className="w-4 h-4" /> },
        { id: 'referrals', label: 'Referrals', icon: <Gift className="w-4 h-4" /> },
        { id: 'financial', label: 'Financial', icon: <DollarSign className="w-4 h-4" /> },
    ]

    const handleUpdateReferral = async (data: any) => {
        try {
            await superAdminApi.updateUserReferral(user.account_id, data)
            toast.success('Referral information updated successfully')
            refetch()
            setIsEditingReferral(false)
        } catch (error) {
            toast.error('Failed to update referral information')
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
                        <p className="text-gray-600">Comprehensive user information and activities</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user?.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {user?.status || 'Unknown'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user?.email_verified_at
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {user?.email_verified_at ? 'Verified' : 'Unverified'}
                    </span>
                </div>
            </div>

            {/* User Profile Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                            {user?.first_name?.charAt(0) || ''}{user?.last_name?.charAt(0) || ''}
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">
                                    {user?.first_name || ''} {user?.last_name || ''}
                                </h2>
                                <div className="space-y-3">
                                    <div className="flex items-center text-gray-600">
                                        <Mail className="w-4 h-4 mr-2" />
                                        <span>{user?.email || 'Not provided'}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <Phone className="w-4 h-4 mr-2" />
                                        <span>{user?.phone || 'Not provided'}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        <span>Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center text-gray-600">
                                        <Shield className="w-4 h-4 mr-2" />
                                        <span>Role: {user?.role?.display_name || user?.role?.name || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <User className="w-4 h-4 mr-2" />
                                        <span>Account ID: {user?.account_id || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <Clock className="w-4 h-4 mr-2" />
                                        <span>Last Login: {user?.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <DollarSign className="w-4 h-4 mr-2" />
                                        <span>Balance: ₦{Number(user?.balance || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Users className="w-4 h-4 text-blue-600" />
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                            <p className="text-2xl font-bold text-gray-900">{referral_info?.total_referrals || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-green-600" />
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Referral Earnings</p>
                            <p className="text-2xl font-bold text-gray-900">₦{Number(referral_info?.total_earnings || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Vote className="w-4 h-4 text-purple-600" />
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Votes</p>
                            <p className="text-2xl font-bold text-gray-900">{voting_statistics?.total_votes_cast || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                <CreditCard className="w-4 h-4 text-orange-600" />
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Subscriptions</p>
                            <p className="text-2xl font-bold text-gray-900">{subscription_history?.total_subscriptions || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm">
                <div className="border-b border-gray-200">
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

                <div className="p-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Recent Activities */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
                                    <div className="space-y-3">
                                        {recent_activities?.slice(0, 5).map((activity: any, index: number) => (
                                            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-shrink-0">
                                                    <Activity className="w-4 h-4 text-gray-500 mt-1" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                                                    <p className="text-xs text-gray-500">{new Date(activity.created_at).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {(!recent_activities || recent_activities.length === 0) && (
                                            <p className="text-gray-500 text-center py-4">No recent activities</p>
                                        )}
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-600">Total Spent</span>
                                            <span className="text-sm font-bold text-gray-900">₦{Number(financial_summary?.total_spent || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-600">Referral Earnings</span>
                                            <span className="text-sm font-bold text-gray-900">₦{Number(financial_summary?.referral_earnings || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-600">Active Subscription</span>
                                            <span className="text-sm font-bold text-gray-900">{subscription_history?.active_subscription ? 'Yes' : 'No'}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-600">Events Participated</span>
                                            <span className="text-sm font-bold text-gray-900">{event_activities?.total_events_participated || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'activities' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">All Activities</h3>
                            <div className="space-y-3">
                                {recent_activities?.map((activity: any, index: number) => (
                                    <div key={index} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <Activity className="w-4 h-4 text-blue-600" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {activity.causer_name} • {new Date(activity.created_at).toLocaleString()}
                                            </p>
                                            {activity.properties && (
                                                <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                                    <pre>{JSON.stringify(activity.properties, null, 2)}</pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {(!recent_activities || recent_activities.length === 0) && (
                                    <div className="text-center py-8">
                                        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">No activities found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'subscriptions' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription History</h3>
                            <div className="grid md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-medium text-gray-900 mb-2">Total Subscriptions</h4>
                                    <p className="text-2xl font-bold">{subscription_history?.total_subscriptions || 0}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-medium text-gray-900 mb-2">Total Spent</h4>
                                    <p className="text-2xl font-bold">₦{Number(subscription_history?.total_spent || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-medium text-gray-900 mb-2">Active Subscription</h4>
                                    <p className="text-2xl font-bold">{subscription_history?.active_subscription ? 'Yes' : 'No'}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {subscription_history?.subscription_history?.map((subscription: any, index: number) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-medium text-gray-900">{subscription.plan?.name || 'Unknown Plan'}</h4>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                                subscription.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {subscription.status || 'Unknown'}
                                            </span>
                                        </div>
                                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-600">Start Date</p>
                                                <p className="font-medium">{subscription.start_date ? new Date(subscription.start_date).toLocaleDateString() : 'Unknown'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">End Date</p>
                                                <p className="font-medium">{subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'Unknown'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Amount</p>
                                                <p className="font-medium">₦{Number(subscription.total_amount || 0).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!subscription_history?.subscription_history || subscription_history.subscription_history.length === 0) && (
                                    <div className="text-center py-8">
                                        <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">No subscription history</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'voting' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Voting History</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Voting Statistics</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-600">Total Transactions</span>
                                            <span className="text-sm font-bold text-gray-900">{voting_statistics?.total_transactions || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-600">Successful Transactions</span>
                                            <span className="text-sm font-bold text-gray-900">{voting_statistics?.successful_transactions || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-600">Failed Transactions</span>
                                            <span className="text-sm font-bold text-gray-900">{voting_statistics?.failed_transactions || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-600">Total Spent on Voting</span>
                                            <span className="text-sm font-bold text-gray-900">₦{Number(voting_statistics?.total_amount_spent || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Recent Transactions</h4>
                                    <div className="space-y-2">
                                        {voting_statistics?.recent_transactions?.slice(0, 5).map((transaction: any, index: number) => (
                                            <div key={index} className="flex justify-between items-center p-2 text-sm border border-gray-200 rounded">
                                                <div>
                                                    <p className="font-medium text-gray-900">{transaction.vote_name || 'Unknown Vote'}</p>
                                                    <p className="text-xs text-gray-500">{transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : 'Unknown Date'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">₦{Number(transaction.amount_paid || 0).toLocaleString()}</p>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${transaction.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                                        transaction.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {transaction.status || 'Unknown'}
                                                    </span>
                                                </div>
                                            </div>
                                        )) || (
                                                <p className="text-gray-500 text-center py-4">No recent transactions</p>
                                            )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'referrals' && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Referral Information</h3>
                                <button
                                    onClick={() => setIsEditingReferral(!isEditingReferral)}
                                    className="btn-secondary"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Referral
                                </button>
                            </div>

                            {isEditingReferral ? (
                                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                    <h4 className="font-medium text-gray-900 mb-3">Edit Referral Information</h4>
                                    <form onSubmit={(e) => {
                                        e.preventDefault()
                                        const formData = new FormData(e.target as HTMLFormElement)
                                        handleUpdateReferral({
                                            referral_code: formData.get('referral_code'),
                                            total_referrals: Number(formData.get('total_referrals')),
                                            referral_earnings: Number(formData.get('referral_earnings'))
                                        })
                                    }} className="space-y-4">
                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Referral Code</label>
                                                <input
                                                    type="text"
                                                    name="referral_code"
                                                    defaultValue={referral_info?.referral_code || ''}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Total Referrals</label>
                                                <input
                                                    type="number"
                                                    name="total_referrals"
                                                    defaultValue={referral_info?.total_referrals || 0}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Referral Earnings</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    name="referral_earnings"
                                                    defaultValue={referral_info?.total_earnings || 0}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex space-x-3">
                                            <button type="submit" className="btn-primary">Save Changes</button>
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingReferral(false)}
                                                className="btn-secondary"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-4 gap-6 mb-6">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-gray-900 mb-2">Referral Code</h4>
                                        <p className="text-lg font-mono">{referral_info?.referral_code || 'Not generated'}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-gray-900 mb-2">Total Referrals</h4>
                                        <p className="text-lg font-bold">{referral_info?.total_referrals || 0}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-gray-900 mb-2">Total Earnings</h4>
                                        <p className="text-lg font-bold">₦{Number(referral_info?.total_earnings || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-gray-900 mb-2">Monthly Earnings</h4>
                                        <p className="text-lg font-bold">₦{Number(referral_info?.monthly_earnings || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Referral Breakdown</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <span className="text-sm text-gray-600">Registration Referrals</span>
                                            <span className="font-medium">{referral_info?.registration_referrals || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <span className="text-sm text-gray-600">Subscription Referrals</span>
                                            <span className="font-medium">{referral_info?.subscription_referrals || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <span className="text-sm text-gray-600">Vote Referrals</span>
                                            <span className="font-medium">{referral_info?.vote_referrals || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <span className="text-sm text-gray-600">Event Referrals</span>
                                            <span className="font-medium">{referral_info?.event_referrals || 0}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Commission Rates</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <span className="text-sm text-gray-600">User Registration</span>
                                            <span className="font-medium">{referral_info?.commission_rates?.user_registration || 0}%</span>
                                        </div>
                                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <span className="text-sm text-gray-600">Admin Registration</span>
                                            <span className="font-medium">{referral_info?.commission_rates?.admin_registration || 0}%</span>
                                        </div>
                                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <span className="text-sm text-gray-600">Subscription</span>
                                            <span className="font-medium">{referral_info?.commission_rates?.subscription || 0}%</span>
                                        </div>
                                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <span className="text-sm text-gray-600">Vote Purchase</span>
                                            <span className="font-medium">{referral_info?.commission_rates?.vote_purchase || 0}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h4 className="font-medium text-gray-900 mb-3">Recent Referrals</h4>
                            <div className="space-y-3">
                                {referral_info?.recent_referrals?.map((referral: any, index: number) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h5 className="font-medium text-gray-900">{referral.referred_user_name || 'Unknown User'}</h5>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${referral.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                referral.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {referral.status || 'Unknown'}
                                            </span>
                                        </div>
                                        <div className="grid md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-600">Type</p>
                                                <p className="font-medium">{referral.type || 'Unknown'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Commission</p>
                                                <p className="font-medium">₦{Number(referral.commission_amount || 0).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Rate</p>
                                                <p className="font-medium">{referral.commission_rate || 0}%</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Date</p>
                                                <p className="font-medium">{referral.created_at ? new Date(referral.created_at).toLocaleDateString() : 'Unknown'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!referral_info?.recent_referrals || referral_info.recent_referrals.length === 0) && (
                                    <div className="text-center py-8">
                                        <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">No referral history</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'financial' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Income & Expenses</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                            <span className="text-sm font-medium text-green-800">Referral Earnings</span>
                                            <span className="text-sm font-bold text-green-900">₦{Number(financial_summary?.referral_earnings || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                            <span className="text-sm font-medium text-red-800">Total Spent</span>
                                            <span className="text-sm font-bold text-red-900">₦{Number(financial_summary?.total_spent || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                            <span className="text-sm font-medium text-blue-800">Current Balance</span>
                                            <span className="text-sm font-bold text-blue-900">₦{Number(financial_summary?.current_balance || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                                            <span className="text-sm font-medium text-purple-800">Net Contribution</span>
                                            <span className="text-sm font-bold text-purple-900">₦{Number(financial_summary?.net_contribution || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Spending Breakdown</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-600">Voting Spent</span>
                                            <span className="text-sm font-bold text-gray-900">₦{Number(financial_summary?.voting_spent || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-600">Subscription Spent</span>
                                            <span className="text-sm font-bold text-gray-900">₦{Number(financial_summary?.subscription_spent || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-600">Event Spent</span>
                                            <span className="text-sm font-bold text-gray-900">₦{Number(financial_summary?.event_spent || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default UserDetails 