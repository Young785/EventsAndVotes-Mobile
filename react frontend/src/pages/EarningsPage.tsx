import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Copy,
    Share,
    QrCode,
    TrendingUp,
    CreditCard,
    History,
    DollarSign,
    Users,
    Eye,
    EyeOff,
    Plus,
    Download,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    Wallet,
    ArrowRight
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { profileApi } from '../services/api'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { useQuery, useMutation } from '@tanstack/react-query'
import WithdrawalModal from '../components/WithdrawalModal'

interface TabPanelProps {
    children?: React.ReactNode
    index: number
    value: number
}



interface BankForm {
    bank_id: string
    account_name: string
    account_number: string
    settlement_type: string
}

interface BankAccount {
    id: string
    account_name: string
    account_no: string
    bank?: {
        id: string
        name: string
        code: string
    }
}

interface Bank {
    id: string
    name: string
    code: string
    bank_id: string
}

interface Withdrawal {
    id: number;
    withdrawal_id: string;
    amount: number;
    status: string;
    withdrawal_type: string;
    pace: string;
    created_at: string;
    bank_account: {
        account_name: string;
        account_no: string;
        bank: {
            name: string;
        };
    };
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`earn-tabpanel-${index}`}
            aria-labelledby={`earn-tab-${index}`}
            {...other}
        >
            {value === index && (
                <div className="p-6">
                    {children}
                </div>
            )}
        </div>
    )
}

// Utility function to format currency
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

const EarningsPage: React.FC = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState(0)
    const [loading, setLoading] = useState(true)
    const [referralStats, setReferralStats] = useState<any>(null)
    const [withdrawalStats, setWithdrawalStats] = useState<any>(null)
    const [referralCode, setReferralCode] = useState('')
    const [referralLink, setReferralLink] = useState('')
    const [isGeneratingCode, setIsGeneratingCode] = useState(false)
    const [showQR, setShowQR] = useState(false)
    const [qrCode, setQrCode] = useState('')
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
    const [showBankModal, setShowBankModal] = useState(false)

    const [bankForm, setBankForm] = useState<BankForm>({
        bank_id: '',
        account_name: '',
        account_number: '',
        settlement_type: 'INSTANT'
    })
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
    const [availableBanks, setAvailableBanks] = useState<Bank[]>([])
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
    const [error, setError] = useState('')







    const createWithdrawalMutation = useMutation({
        mutationFn: (data: any) => api.post('/withdrawals', data),
        onSuccess: () => {
            toast.success('Withdrawal request submitted successfully');
            setShowWithdrawalModal(false);
            // Refresh withdrawals list
            refetchWithdrawals();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to submit withdrawal request');
        }
    });

    const { data: withdrawalsData, refetch: refetchWithdrawals } = useQuery({
        queryKey: ['withdrawals'],
        queryFn: () => api.get<Withdrawal[]>('/withdrawals')
    });

    useEffect(() => {
        // Redirect unauthenticated users to earn page
        if (!user) {
            navigate('/earn')
            return
        }

        fetchData()
    }, [user, navigate])

    useEffect(() => {
        if (withdrawalsData?.data) {
            setWithdrawals(withdrawalsData.data);
        }
    }, [withdrawalsData]);

    const fetchData = async () => {
        try {
            setLoading(true)
            const [referralResponse, withdrawalResponse, bankResponse, withdrawalsResponse, banksResponse] = await Promise.all([
                profileApi.getReferralDashboard(),
                api.get('/referral-withdrawals/stats'),
                api.get('/admin/banks/user-banks'),
                api.get('/referral-withdrawals'),
                api.get('/admin/banks/all')
            ])

            setReferralStats(referralResponse.data)
            setWithdrawalStats(withdrawalResponse.data.data)
            setBankAccounts(bankResponse.data.data || [])
            setWithdrawals(withdrawalsResponse.data.data?.withdrawals?.data || [])
            setAvailableBanks(banksResponse.data.data || [])

            // Set referral code and link from response
            if (referralResponse.data?.referral_code) {
                setReferralCode(referralResponse.data.referral_code)
                setReferralLink(referralResponse.data.referral_link + `&admin=true` || `${window.location.origin}/register?ref=${referralResponse.data.referral_code}&admin=true`)
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch data')
            toast.error('Failed to load earnings data')
        } finally {
            setLoading(false)
        }
    }

    const handleTabChange = (newValue: number) => {
        setActiveTab(newValue)
    }

    const handleGenerateReferralCode = async () => {
        try {
            setIsGeneratingCode(true)
            const response = await profileApi.generateReferralCode()

            if (response.status === 'success' && response.data) {
                const newCode = response.data.referral_code
                setReferralCode(newCode)
                setReferralLink(response.data.referral_link || `${window.location.origin}/register?ref=${newCode}`)

                toast.success('Referral code generated successfully!')
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to generate referral code')
        } finally {
            setIsGeneratingCode(false)
        }
    }

    const handleCopyReferralCode = () => {
        navigator.clipboard.writeText(referralCode)
        toast.success('Referral code copied to clipboard!')
    }

    const handleCopyReferralLink = () => {
        navigator.clipboard.writeText(referralLink)
        toast.success('Referral link copied to clipboard!')
    }

    const handleShareReferralLink = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join me on EventsAndVotes',
                    text: 'Use my referral code to join EventsAndVotes and earn rewards!',
                    url: referralLink
                })
            } catch (err) {
                console.error('Error sharing:', err)
            }
        } else {
            handleCopyReferralLink()
        }
    }



    const handleBankSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await api.post('/admin/banks/user-banks', bankForm)
            if (response.data.status === 'success') {
                toast.success('Bank account added successfully!')
                setShowBankModal(false)
                setBankForm({
                    bank_id: '',
                    account_name: '',
                    account_number: '',
                    settlement_type: 'INSTANT'
                })
                fetchData() // Refresh data to get new bank account
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to add bank account')
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved':
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-500" />
            case 'pending':
                return <Clock className="w-5 h-5 text-yellow-500" />
            case 'rejected':
            case 'failed':
                return <XCircle className="w-5 h-5 text-red-500" />
            default:
                return <AlertCircle className="w-5 h-5 text-gray-500" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved':
            case 'completed':
                return 'bg-green-100 text-green-800'
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            case 'rejected':
            case 'failed':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const handleWithdrawalSubmit = (data: any) => {
        createWithdrawalMutation.mutate(data);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Earnings Dashboard</h1>
                    <p className="text-gray-600">Track your referrals, earnings, and manage withdrawals</p>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        {['Referral Dashboard', 'Withdrawals', 'History'].map((tab, index) => (
                            <button
                                key={tab}
                                onClick={() => handleTabChange(index)}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === index
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                <TabPanel value={activeTab} index={0}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Stats Cards */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center mb-4">
                                <TrendingUp className="w-8 h-8 text-blue-500 mr-3" />
                                <h3 className="text-lg font-semibold text-gray-900">Total Earnings</h3>
                            </div>
                            <p className="text-3xl font-bold text-blue-600">
                                {formatCurrency(referralStats?.statistics?.total_earnings || 0)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">Lifetime earnings from referrals</p>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center mb-4">
                                <Users className="w-8 h-8 text-green-500 mr-3" />
                                <h3 className="text-lg font-semibold text-gray-900">Total Referrals</h3>
                            </div>
                            <p className="text-3xl font-bold text-green-600">
                                {referralStats?.statistics?.total_referrals || 0}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">Successful referrals made</p>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center mb-4">
                                <Wallet className="w-8 h-8 text-purple-500 mr-3" />
                                <h3 className="text-lg font-semibold text-gray-900">Available Balance</h3>
                            </div>
                            <p className="text-3xl font-bold text-purple-600">
                                {formatCurrency(withdrawalStats?.current_balances?.referral_earnings || 0)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">Ready for withdrawal</p>
                        </div>
                    </div>

                    {/* Referral Code Section */}
                    <div className="bg-white rounded-lg shadow p-6 mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Code</h3>

                        {referralCode ? (
                            <>
                                <div className="flex items-center space-x-2 mb-4">
                                    <input
                                        type="text"
                                        value={referralCode}
                                        readOnly
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                                    />
                                    <button
                                        onClick={handleCopyReferralCode}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                                    >
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy
                                    </button>
                                </div>

                                <h4 className="text-md font-medium text-gray-900 mb-2">Your Referral Link</h4>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={referralLink}
                                        readOnly
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                                    />
                                    <button
                                        onClick={handleCopyReferralLink}
                                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center"
                                    >
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy
                                    </button>
                                    <button
                                        onClick={handleShareReferralLink}
                                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
                                    >
                                        <Share className="w-4 h-4 mr-2" />
                                        Share
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500 mb-4">
                                    {isGeneratingCode ? 'Generating referral code...' : 'You don\'t have a referral code yet'}
                                </p>
                                <button
                                    onClick={handleGenerateReferralCode}
                                    disabled={isGeneratingCode}
                                    className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center mx-auto"
                                >
                                    {isGeneratingCode ? (
                                        <LoadingSpinner />
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Generate Referral Code
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Recent Referrals */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Referrals</h3>
                        {referralStats?.statistics?.recent_referrals?.length > 0 ? (
                            <div className="space-y-4">
                                {referralStats.statistics.recent_referrals.map((referral: any) => (
                                    <div key={referral.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                        <div className="flex items-center">
                                            <Users className="w-8 h-8 text-gray-400 mr-3" />
                                            <div>
                                                <p className="font-medium text-gray-900">{referral.referred_user_name}</p>
                                                <p className="text-sm text-gray-500">{referral.commission_type}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">{formatCurrency(referral.commission_amount)}</p>
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${referral.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {referral.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No referrals yet. Start sharing your referral link!</p>
                        )}
                    </div>
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Withdrawal Form */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Request Withdrawal</h3>
                                <button
                                    onClick={() => setShowWithdrawalModal(true)}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Request
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <h4 className="font-medium text-blue-900 mb-2">Available Balances</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Referral Earnings:</span>
                                            <span className="font-semibold text-blue-900">
                                                {formatCurrency(withdrawalStats?.current_balances?.referral_earnings || 0)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Vote Earnings:</span>
                                            <span className="font-semibold text-blue-900">
                                                {formatCurrency(withdrawalStats?.current_balances?.vote_earnings || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-medium text-gray-900 mb-2">Withdrawal Limits</h4>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <p>Minimum: {formatCurrency(withdrawalStats?.withdrawal_limits?.min_withdrawal || 5000)}</p>
                                        <p>Maximum: {formatCurrency(withdrawalStats?.withdrawal_limits?.max_withdrawal || 50000)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Withdrawal Stats */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdrawal Statistics</h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <h4 className="font-medium text-green-900">Total Withdrawn</h4>
                                    <p className="text-2xl font-bold text-green-600">
                                        {formatCurrency(withdrawalStats?.total_withdrawn?.total || 0)}
                                    </p>
                                </div>

                                <div className="p-4 bg-yellow-50 rounded-lg">
                                    <h4 className="font-medium text-yellow-900">Pending Withdrawals</h4>
                                    <p className="text-2xl font-bold text-yellow-600">
                                        {formatCurrency(withdrawalStats?.pending_withdrawals?.total || 0)}
                                    </p>
                                </div>

                                <div className="p-4 bg-purple-50 rounded-lg">
                                    <h4 className="font-medium text-purple-900">Total Requests</h4>
                                    <p className="text-2xl font-bold text-purple-600">
                                        {withdrawalStats?.total_requests?.total || 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabPanel>

                <TabPanel value={activeTab} index={2}>
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Withdrawal History</h3>
                        </div>
                        <div className="p-6">
                            {withdrawals.length > 0 ? (
                                <div className="space-y-4">
                                    {withdrawals.map((withdrawal) => (
                                        <div key={withdrawal.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                            <div className="flex items-center">
                                                <CreditCard className="w-8 h-8 text-gray-400 mr-3" />
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {withdrawal.withdrawal_type.replace('_', ' ').toUpperCase()} - {formatCurrency(withdrawal.amount)}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(withdrawal.created_at).toLocaleDateString()} • {withdrawal.withdrawal_id}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                {getStatusIcon(withdrawal.status)}
                                                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(withdrawal.status)}`}>
                                                    {withdrawal.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">No withdrawal history yet.</p>
                            )}
                        </div>
                    </div>
                </TabPanel>

                {/* Withdrawal Modal */}
                <WithdrawalModal
                    isOpen={showWithdrawalModal}
                    onClose={() => setShowWithdrawalModal(false)}
                    onSubmit={handleWithdrawalSubmit}
                    isLoading={createWithdrawalMutation.isPending}
                    userBanks={bankAccounts}
                />

                {/* Bank Account Modal */}
                {showBankModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Bank Account</h3>
                            <form onSubmit={handleBankSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
                                    <select
                                        value={bankForm.bank_id}
                                        onChange={(e) => setBankForm({ ...bankForm, bank_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select Bank</option>
                                        {availableBanks.map((bank) => (
                                            <option key={bank.id} value={bank.bank_id}>
                                                {bank.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                                    <input
                                        type="text"
                                        value={bankForm.account_number}
                                        onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter 10-digit account number"
                                        maxLength={10}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                                    <input
                                        type="text"
                                        value={bankForm.account_name}
                                        onChange={(e) => setBankForm({ ...bankForm, account_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Account holder name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Settlement Type</label>
                                    <select
                                        value={bankForm.settlement_type}
                                        onChange={(e) => setBankForm({ ...bankForm, settlement_type: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="INSTANT">Instant Settlement</option>
                                        <option value="WITHDRAWAL">Manual Withdrawal</option>
                                    </select>
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowBankModal(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!bankForm.bank_id || !bankForm.account_number || !bankForm.account_name}
                                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Add Bank Account
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
                        {error}
                    </div>
                )}
            </div>
        </div>
    )
}

export default EarningsPage 