import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    Users,
    DollarSign,
    TrendingUp,
    Gift,
    Star,
    CheckCircle,
    ArrowRight,
    HelpCircle,
    Plus,
    Minus,
    Share,
    UserPlus,
    CreditCard,
    Calendar,
    Award,
    Target,
    Zap
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getPublicSettings } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { useQuery } from '@tanstack/react-query'

interface CommissionRates {
    user_registration_commission_rate: number
    admin_registration_commission_rate: number
    subscription_commission_rate: number
    vote_purchase_commission_rate: number
    event_purchase_commission_rate: number
}

interface FAQ {
    question: string
    answer: string
}

const EarnPage: React.FC = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [commissionRates, setCommissionRates] = useState<CommissionRates | null>(null)
    const [openFAQ, setOpenFAQ] = useState<number | null>(null)

    // Site settings for withdrawal configuration
    const { data: siteSettingsData } = useQuery({
        queryKey: ['site-settings'],
        queryFn: () => fetch(`${import.meta.env.VITE_API_URL}/api/settings/public`, {
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => res.json())
    });

    const siteSettings = siteSettingsData?.data?.settings || {};
    const withdrawalSettings = {
        min_withdrawal_amount: siteSettings.min_withdrawal_amount || 1000,
        max_withdrawal_amount: siteSettings.max_withdrawal_amount || 1000000,
        withdrawal_site_charges: siteSettings.withdrawal_site_charges || 2.50,
        withdrawal_pg_charges: siteSettings.withdrawal_pg_charges || 2.50,
        normal_withdrawal_hours: siteSettings.normal_withdrawal_hours || 24,
        express_withdrawal_hours: siteSettings.express_withdrawal_hours || 2,
        express_withdrawal_fee: siteSettings.express_withdrawal_fee || 500
    };

    useEffect(() => {
        // Redirect authenticated users to earnings page
        if (user) {
            navigate('/earnings')
            return
        }

        fetchCommissionRates()
    }, [user, navigate])

    const fetchCommissionRates = async () => {
        try {
            setLoading(true)
            const response = await getPublicSettings()
            if (response.data?.commission_rates) {
                setCommissionRates({
                    user_registration_commission_rate: response.data.commission_rates.user_registration || 500,
                    admin_registration_commission_rate: response.data.commission_rates.admin_registration || 1000,
                    subscription_commission_rate: response.data.commission_rates.subscription || 10,
                    vote_purchase_commission_rate: response.data.commission_rates.vote_purchase || 5,
                    event_purchase_commission_rate: response.data.commission_rates.event_purchase || 8
                })
            } else {
                // Set default values if API fails
                setCommissionRates({
                    user_registration_commission_rate: 500,
                    admin_registration_commission_rate: 1000,
                    subscription_commission_rate: 10,
                    vote_purchase_commission_rate: 5,
                    event_purchase_commission_rate: 8
                })
            }
        } catch (error) {
            console.error('Failed to fetch commission rates:', error)
            // Set default values if API fails
            setCommissionRates({
                user_registration_commission_rate: 500,
                admin_registration_commission_rate: 1000,
                subscription_commission_rate: 10,
                vote_purchase_commission_rate: 5,
                event_purchase_commission_rate: 8
            })
        } finally {
            setLoading(false)
        }
    }

    const faqs: FAQ[] = [
        {
            question: "How does the referral program work?",
            answer: "Share your unique referral link with friends. When they sign up and make purchases, you earn commissions based on their activity. It's that simple!"
        },
        {
            question: "When do I get paid?",
            answer: "Registration bonuses are credited immediately upon successful signup. Purchase commissions are credited after the transaction is completed and verified."
        },
        {
            question: "What's the minimum withdrawal amount?",
            answer: "The minimum withdrawal amount is ₦5,000. You can withdraw your earnings once you reach this threshold."
        },
        {
            question: "How long does it take to receive my earnings?",
            answer: "Withdrawal requests are typically processed within 24-48 hours during business days. Bank transfers usually complete within 1-3 business days."
        },
        {
            question: "Can I refer unlimited people?",
            answer: "Yes! There's no limit to how many people you can refer. The more you refer, the more you can earn."
        },
        {
            question: "Do my referrals need to make purchases immediately?",
            answer: "No, your referrals can make purchases anytime after signing up with your code. You'll earn commissions on all their future qualifying activities."
        },
        {
            question: "What happens if my referral gets a refund?",
            answer: "If a referral receives a refund, the corresponding commission may be deducted from your earnings balance."
        },
        {
            question: "Can I track my referral performance?",
            answer: "Yes! Once you sign up, you'll have access to a comprehensive dashboard showing all your referrals, earnings, and performance metrics."
        }
    ]

    const features = [
        {
            icon: <UserPlus className="w-8 h-8 text-blue-500" />,
            title: "Easy Registration",
            description: "Simple one-click registration process for your referrals"
        },
        {
            icon: <DollarSign className="w-8 h-8 text-green-500" />,
            title: "Instant Earnings",
            description: "Get paid immediately when your referrals sign up"
        },
        {
            icon: <TrendingUp className="w-8 h-8 text-purple-500" />,
            title: "Growing Commissions",
            description: "Earn more as your referrals become more active"
        },
        {
            icon: <Award className="w-8 h-8 text-yellow-500" />,
            title: "Performance Bonuses",
            description: "Special rewards for top-performing referrers"
        },
        {
            icon: <Target className="w-8 h-8 text-red-500" />,
            title: "Real-time Tracking",
            description: "Monitor your referrals and earnings in real-time"
        },
        {
            icon: <Zap className="w-8 h-8 text-indigo-500" />,
            title: "Fast Payouts",
            description: "Quick and reliable withdrawal processing"
        }
    ]

    const steps = [
        {
            number: 1,
            title: "Sign Up",
            description: "Create your free account and get your unique referral code"
        },
        {
            number: 2,
            title: "Share",
            description: "Share your referral link with friends, family, and social networks"
        },
        {
            number: 3,
            title: "Earn",
            description: "Get paid when your referrals sign up and make purchases"
        },
        {
            number: 4,
            title: "Withdraw",
            description: "Request withdrawals anytime you reach the minimum threshold"
        }
    ]

    const toggleFAQ = (index: number) => {
        setOpenFAQ(openFAQ === index ? null : index)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
                <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">
                            Earn Money by
                            <span className="block text-yellow-300">Referring Friends</span>
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
                            Join our referral program and start earning commissions for every friend you bring to EventsAndVotes
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/register"
                                className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-colors duration-300 flex items-center justify-center"
                            >
                                Start Earning Now
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Link>
                            <Link
                                to="/login"
                                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-gray-900 transition-colors duration-300"
                            >
                                Already have an account?
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Commission Rates Section */}
            <div className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Generous Commission Rates
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Earn competitive commissions on every referral activity
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                            <div className="text-center">
                                <UserPlus className="w-12 h-12 text-green-600 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Registration Bonus</h3>
                                <div className="text-3xl font-bold text-green-600 mb-2">
                                    ₦{commissionRates?.user_registration_commission_rate?.toLocaleString() || '500'}
                                </div>
                                <p className="text-sm text-gray-600">Per successful signup</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                            <div className="text-center">
                                <CreditCard className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Subscription Plans</h3>
                                <div className="text-3xl font-bold text-blue-600 mb-2">
                                    {commissionRates?.subscription_commission_rate || 10}%
                                </div>
                                <p className="text-sm text-gray-600">Of subscription value</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                            <div className="text-center">
                                <Star className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Vote Purchases</h3>
                                <div className="text-3xl font-bold text-purple-600 mb-2">
                                    {commissionRates?.vote_purchase_commission_rate || 5}%
                                </div>
                                <p className="text-sm text-gray-600">Of vote amount</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                            <div className="text-center">
                                <Calendar className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Event Tickets</h3>
                                <div className="text-3xl font-bold text-orange-600 mb-2">
                                    {commissionRates?.event_purchase_commission_rate || 8}%
                                </div>
                                <p className="text-sm text-gray-600">Of ticket value</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* How It Works Section */}
            <div className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            How It Works
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Start earning in just 4 simple steps
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, index) => (
                            <div key={step.number} className="text-center">
                                <div className="relative mb-6">
                                    <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                                        {step.number}
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-blue-200 -translate-y-0.5"></div>
                                    )}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                                <p className="text-gray-600">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Why Choose Our Referral Program?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            We've designed our program to be simple, rewarding, and transparent
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="text-center p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                                <div className="mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="py-16 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-xl text-gray-600">
                            Everything you need to know about our referral program
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <button
                                    onClick={() => toggleFAQ(index)}
                                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                                >
                                    <span className="font-semibold text-gray-900">{faq.question}</span>
                                    {openFAQ === index ? (
                                        <Minus className="w-5 h-5 text-gray-500" />
                                    ) : (
                                        <Plus className="w-5 h-5 text-gray-500" />
                                    )}
                                </button>
                                {openFAQ === index && (
                                    <div className="px-6 pb-4">
                                        <p className="text-gray-600">{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Withdrawal Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Withdrawal Information</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Withdrawal Limits</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Minimum Amount:</span>
                                    <span>₦{withdrawalSettings.min_withdrawal_amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Maximum Amount:</span>
                                    <span>₦{withdrawalSettings.max_withdrawal_amount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Processing Times</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Normal Processing:</span>
                                    <span>{withdrawalSettings.normal_withdrawal_hours} hours</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Express Processing:</span>
                                    <span>{withdrawalSettings.express_withdrawal_hours} hours</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Charges</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Site Charges:</span>
                                <span>{withdrawalSettings.withdrawal_site_charges}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Payment Gateway Charges:</span>
                                <span>{withdrawalSettings.withdrawal_pg_charges}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Express Processing Fee:</span>
                                <span>₦{withdrawalSettings.express_withdrawal_fee.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Ready to Start Earning?
                    </h2>
                    <p className="text-xl mb-8 text-blue-100">
                        Join thousands of users who are already earning with our referral program
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/register"
                            className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-colors duration-300 flex items-center justify-center"
                        >
                            Get Started Today
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Link>
                        <Link
                            to="/votes"
                            className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-gray-900 transition-colors duration-300"
                        >
                            Explore Platform
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EarnPage 