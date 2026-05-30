import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
    Users,
    Gift,
    DollarSign,
    TrendingUp,
    Copy,
    Share2,
    Eye,
    Calendar,
    Award,
    Target,
    CheckCircle,
    Clock,
    AlertCircle
} from 'lucide-react'
import { profileApi } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const UserDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState('overview')

    const { data: profileData, isLoading } = useQuery({
        queryKey: ['userProfile'],
        queryFn: () => profileApi.getUserProfile(),
    })

    const { data: referralData, isLoading: referralLoading } = useQuery({
        queryKey: ['userReferrals'],
        queryFn: () => profileApi.getReferralDashboard(),
    })

    const copyReferralLink = () => {
        if (profileData?.data?.referral_code) {
            const referralLink = `${window.location.origin}/register?ref=${profileData.data.referral_code}&admin=true`
            navigator.clipboard.writeText(referralLink)
            toast.success('Referral link copied to clipboard!')
        }
    }

    const shareReferralLink = () => {
        if (profileData?.data?.referral_code) {
            const referralLink = `${window.location.origin}/register?ref=${profileData.data.referral_code}&admin=true`
            const text = `Join me on EventsAndVotes! Use my referral link: ${referralLink}`

            if (navigator.share) {
                navigator.share({
                    title: 'Join EventsAndVotes',
                    text: text,
                    url: referralLink
                })
            } else {
                // Fallback for browsers that don't support Web Share API
                copyReferralLink()
            }
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    const user = profileData?.data
    const referralStats = referralData?.data

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <Target className="w-4 h-4" /> },
        { id: 'referrals', label: 'My Referrals', icon: <Gift className="w-4 h-4" /> },
        { id: 'earnings', label: 'Earnings', icon: <DollarSign className="w-4 h-4" /> },
        { id: 'activities', label: 'Activities', icon: <Calendar className="w-4 h-4" /> },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Welcome back, {user?.first_name}!</h1>
                        <p className="text-blue-100 mt-1">
                            Manage your referrals and track your earnings
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-blue-100">Total Earnings</p>
                        <p className="text-3xl font-bold">₦{Number(user?.referral_earnings || 0).toLocaleString()}</p>
                        <button className="btn-primary">
                            <Link to="/earnings" className='text-white'>
                                View Earnings
                            </Link>
                        </button>
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
                            <p className="text-2xl font-bold text-gray-900">{referralStats?.total_referrals || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Active Referrals</p>
                            <p className="text-2xl font-bold text-gray-900">{referralStats?.active_referrals || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <Clock className="w-4 h-4 text-yellow-600" />
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Pending Earnings</p>
                            <p className="text-2xl font-bold text-gray-900">₦{Number(referralStats?.pending_earnings || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-purple-600" />
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">This Month</p>
                            <p className="text-2xl font-bold text-gray-900">₦{Number(referralStats?.monthly_earnings || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Referral Link Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Link</h3>
                <div className="flex items-center space-x-4">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                            <Gift className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-600">
                                {user?.referral_code ?
                                    `${window.location.origin}/register?ref=${user.referral_code}&admin=true` :
                                    'Generating referral code...'
                                }
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={copyReferralLink}
                        className="btn-secondary"
                        disabled={!user?.referral_code}
                    >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                    </button>
                    <button
                        onClick={shareReferralLink}
                        className="btn-primary"
                        disabled={!user?.referral_code}
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                    </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                    Share this link with friends and earn commissions when they register and make purchases!
                </p>
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
                                {/* Commission Rates */}
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-4">Commission Rates</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-600">User Registration</span>
                                            <span className="text-sm font-bold text-gray-900">{referralStats?.commission_rates?.registration || 0}%</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-600">Admin Registration</span>
                                            <span className="text-sm font-bold text-gray-900">{referralStats?.commission_rates?.admin_registration || 0}%</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-600">Subscription Purchase</span>
                                            <span className="text-sm font-bold text-gray-900">{referralStats?.commission_rates?.subscription || 10}%</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-600">Vote Purchase</span>
                                            <span className="text-sm font-bold text-gray-900">{referralStats?.commission_rates?.vote_purchase || 5}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-4">Recent Referral Activity</h4>
                                    <div className="space-y-3">
                                        {referralStats?.recent_activities?.slice(0, 5).map((activity: any, index: number) => (
                                            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-shrink-0">
                                                    <Award className="w-4 h-4 text-green-500 mt-1" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                                                    <p className="text-xs text-gray-500">{new Date(activity.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        )) || (
                                                <p className="text-gray-500 text-center py-4">No recent activity</p>
                                            )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'referrals' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Referrals</h3>
                            <div className="space-y-4">
                                {referralStats?.referrals?.map((referral: any, index: number) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-medium text-gray-900">{referral.referred_user_name}</h4>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${referral.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                referral.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {referral.status}
                                            </span>
                                        </div>
                                        <div className="grid md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-600">Type</p>
                                                <p className="font-medium">{referral.commission_type}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Commission</p>
                                                <p className="font-medium">₦{Number(referral.commission_amount || 0).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Rate</p>
                                                <p className="font-medium">{referral.commission_rate}%</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Date</p>
                                                <p className="font-medium">{new Date(referral.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                )) || (
                                        <div className="text-center py-8">
                                            <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500">No referrals yet</p>
                                            <p className="text-sm text-gray-400 mt-1">Start sharing your referral link to earn commissions!</p>
                                        </div>
                                    )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'earnings' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings History</h3>
                            <div className="space-y-4">
                                {referralStats?.earnings_history?.map((earning: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${earning.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'
                                                }`}>
                                                {earning.status === 'completed' ? (
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <Clock className="w-4 h-4 text-yellow-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{earning.description}</p>
                                                <p className="text-sm text-gray-500">{new Date(earning.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900">₦{Number(earning.amount).toLocaleString()}</p>
                                            <p className="text-xs text-gray-500">{earning.commission_type}</p>
                                        </div>
                                    </div>
                                )) || (
                                        <div className="text-center py-8">
                                            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500">No earnings yet</p>
                                        </div>
                                    )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'activities' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">All Activities</h3>
                            <div className="space-y-3">
                                {referralStats?.all_activities?.map((activity: any, index: number) => (
                                    <div key={index} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
                                        <div className="flex-shrink-0">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activity.type === 'referral' ? 'bg-blue-100' :
                                                activity.type === 'earning' ? 'bg-green-100' :
                                                    'bg-gray-100'
                                                }`}>
                                                {activity.type === 'referral' ? (
                                                    <Users className="w-4 h-4 text-blue-600" />
                                                ) : activity.type === 'earning' ? (
                                                    <DollarSign className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <Calendar className="w-4 h-4 text-gray-600" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {activity.type} • {new Date(activity.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                )) || (
                                        <div className="text-center py-8">
                                            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500">No activities found</p>
                                        </div>
                                    )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default UserDashboard 