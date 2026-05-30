import React, { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
    Package,
    Check,
    X,
    ArrowRight,
    CreditCard,
    Wallet,
    Crown,
    Star,
    Zap,
    Users,
    Calendar,
    DollarSign
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

interface SubscriptionPlan {
    id: number
    name: string
    slug: string
    plan_id: string
    price: number
    duration: number
    votes: number
    nominees: number
    voting_times: number
    description?: string
    features?: string[]
    status: 'active' | 'inactive'
    activity_type: 'voting' | 'events' | 'both'
    created_at: string
    updated_at: string
}

interface PaymentGateway {
    id: string
    name: string
    slug: string
    key: string
    pg_id: string
    logo?: string
    status: 'active' | 'inactive'
}

const PricingPage: React.FC = () => {
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null)
    const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    // URL parameters for plan pre-selection
    const [searchParams] = useSearchParams()
    const planParam = searchParams.get('plan')
    const navigate = useNavigate()

    const { user } = useAuth()

    // Fetch subscription plans
    const { data: plansData, isLoading } = useQuery({
        queryKey: ['public-subscription-plans'],
        queryFn: () => fetch(`${import.meta.env.VITE_API_URL}/subscriptions`, {
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => res.json())
    })

    // Fetch payment gateways
    const { data: paymentGatewaysData } = useQuery({
        queryKey: ['payment-gateways'],
        queryFn: () => fetch(`${import.meta.env.VITE_API_URL}/payment-gateways`, {
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => res.json())
    })

    const plans = plansData?.data || []

    // Handle plan pre-selection from URL parameter
    useEffect(() => {
        if (planParam && plans.length > 0 && !showPaymentModal) {
            const preSelectedPlan = plans.find((plan: SubscriptionPlan) =>
                plan.plan_id === planParam || plan.slug === planParam
            )

            if (preSelectedPlan && preSelectedPlan.status === 'active') {
                setCurrentPlan(preSelectedPlan)
                setShowPaymentModal(true)
            }
        }
    }, [planParam, plans, showPaymentModal])

    const handleSelectPlan = (plan: SubscriptionPlan) => {
        if (!user) {
            // Redirect to login with plan parameter
            navigate(`/login?redirect=/pricing&plan=${plan.plan_id}`)
            return
        }

        setCurrentPlan(plan)
        setShowPaymentModal(true)
    }

    const handlePaymentGatewaySelect = (gateway: PaymentGateway) => {
        setSelectedGateway(gateway)
    }

    const handleProceedToPayment = async () => {
        if (!currentPlan || !selectedGateway) {
            toast.error('Please select a payment method')
            return
        }

        // Check if user is authenticated
        if (!user) {
            toast.error('Please login to continue')
            navigate(`/login?redirect=/pricing&plan=${currentPlan.plan_id}`)
            return
        }

        setIsProcessing(true)

        try {
            const reference = `SUB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

            // Create subscription transaction
            const checkoutResponse = await fetch(`${import.meta.env.VITE_API_URL}/subscriptions/${currentPlan.plan_id}/subscribe`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: user.email,
                    amount: currentPlan.price,
                    pg_id: selectedGateway.pg_id,
                    plan_id: currentPlan.plan_id,
                    reference: reference
                })
            })

            const checkoutData = await checkoutResponse.json()

            if (checkoutData.status === 'success') {
                // Initialize payment based on gateway
                if (selectedGateway.slug === 'paystack') {
                    await initializePaystackPayment({
                        email: user.email,
                        amount: currentPlan.price * 100, // Paystack expects amount in kobo
                        reference: reference,
                        plan: currentPlan
                    })
                } else {
                    toast.error('Payment gateway not supported yet')
                }
            } else {
                throw new Error(checkoutData.message || 'Failed to initialize payment')
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to process payment')
        } finally {
            setIsProcessing(false)
        }
    }

    const initializePaystackPayment = async (data: any) => {
        return new Promise((resolve, reject) => {
            const handler = (window as any).PaystackPop.setup({
                key: selectedGateway?.key,
                email: data.email,
                amount: data.amount,
                ref: data.reference,
                currency: 'NGN',
                callback: async (response: any) => {
                    try {
                        // Verify payment
                        const verifyResponse = await fetch(`${import.meta.env.VITE_API_URL}/subscriptions/callback`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                reference: response.reference
                            })
                        })

                        const verifyData = await verifyResponse.json()

                        if (verifyData.status === 'success') {
                            toast.success('Subscription activated successfully!')
                            setShowPaymentModal(false)
                            setCurrentPlan(null)
                            setSelectedGateway(null)
                            // Redirect to dashboard or success page
                            navigate('/admin/dashboard')
                            resolve(response)
                        } else {
                            throw new Error(verifyData.message || 'Payment verification failed')
                        }
                    } catch (error: any) {
                        toast.error(error.message || 'Payment verification failed')
                        reject(error)
                    }
                },
                onClose: () => {
                    toast.error('Payment cancelled')
                    reject(new Error('Payment cancelled'))
                }
            })

            handler.openIframe()
        })
    }

    const getPlanIcon = (slug: string) => {
        switch (slug) {
            case 'premium':
                return <Crown className="w-8 h-8 text-yellow-500" />
            case 'pro':
                return <Star className="w-8 h-8 text-purple-500" />
            default:
                return <Package className="w-8 h-8 text-blue-500" />
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900">Choose Your Plan</h1>
                        <p className="mt-4 text-xl text-gray-600">
                            Select the perfect subscription plan for your voting needs
                        </p>
                    </div>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {plans.map((plan: SubscriptionPlan) => (
                        <div key={plan.id} className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${plan.slug === 'premium' ? 'border-yellow-400 relative' : 'border-gray-200'}`}>
                            {plan.slug === 'premium' && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-semibold">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="p-8">
                                <div className="text-center mb-8">
                                    <div className="flex justify-center mb-4">
                                        {getPlanIcon(plan.slug)}
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                                    <div className="mt-4">
                                        <span className="text-4xl font-bold text-gray-900">₦{plan.price.toLocaleString()}</span>
                                        <span className="text-gray-500 ml-2">/{plan.duration} days</span>
                                    </div>
                                    {plan.description && (
                                        <p className="mt-4 text-gray-600">{plan.description}</p>
                                    )}
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center">
                                        <Check className="w-5 h-5 text-green-500 mr-3" />
                                        <span className="text-gray-700">{plan.votes.toLocaleString()} votes</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Check className="w-5 h-5 text-green-500 mr-3" />
                                        <span className="text-gray-700">{plan.nominees.toLocaleString()} nominees</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Check className="w-5 h-5 text-green-500 mr-3" />
                                        <span className="text-gray-700">{plan.voting_times} voting sessions</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Check className="w-5 h-5 text-green-500 mr-3" />
                                        <span className="text-gray-700">
                                            {plan.activity_type === 'both' ? 'Voting & Events' :
                                                plan.activity_type.charAt(0).toUpperCase() + plan.activity_type.slice(1)}
                                        </span>
                                    </div>
                                    {plan.features?.map((feature, index) => (
                                        <div key={index} className="flex items-center">
                                            <Check className="w-5 h-5 text-green-500 mr-3" />
                                            <span className="text-gray-700">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleSelectPlan(plan)}
                                    disabled={plan.status !== 'active'}
                                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${plan.slug === 'premium'
                                        ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {user ? 'Choose Plan' : 'Login to Subscribe'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Features Section */}
            <div className="bg-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900">Why Choose Our Platform?</h2>
                        <p className="mt-4 text-xl text-gray-600">
                            Powerful features to make your voting experience seamless
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Zap className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Results</h3>
                            <p className="text-gray-600">Get instant voting results and analytics</p>
                        </div>

                        <div className="text-center">
                            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
                            <p className="text-gray-600">Comprehensive user and nominee management</p>
                        </div>

                        <div className="text-center">
                            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Event Scheduling</h3>
                            <p className="text-gray-600">Schedule and manage voting events easily</p>
                        </div>

                        <div className="text-center">
                            <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <DollarSign className="w-8 h-8 text-yellow-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Payments</h3>
                            <p className="text-gray-600">Safe and secure payment processing</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Gateway Selection Modal */}
            {showPaymentModal && currentPlan && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Select Payment Method
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowPaymentModal(false)
                                        setCurrentPlan(null)
                                        setSelectedGateway(null)
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-900">{currentPlan.name}</h4>
                                        <p className="text-sm text-gray-600">{currentPlan.duration} days</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-gray-900">
                                            ₦{currentPlan.price?.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="space-y-3">
                                {paymentGatewaysData?.data?.map((gateway: PaymentGateway) => (
                                    <div
                                        key={gateway.id}
                                        onClick={() => handlePaymentGatewaySelect(gateway)}
                                        className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${selectedGateway?.id === gateway.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <Wallet className="w-6 h-6 text-gray-600" />
                                            </div>
                                            <div className="ml-3 flex-1">
                                                <h4 className="text-sm font-medium text-gray-900">
                                                    {gateway.name}
                                                </h4>
                                                <p className="text-xs text-gray-500">
                                                    Secure payment processing
                                                </p>
                                            </div>
                                            {selectedGateway?.id === gateway.id && (
                                                <Check className="w-5 h-5 text-blue-500" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowPaymentModal(false)
                                        setCurrentPlan(null)
                                        setSelectedGateway(null)
                                    }}
                                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleProceedToPayment}
                                    disabled={!selectedGateway || isProcessing}
                                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                                >
                                    {isProcessing ? (
                                        <>
                                            <LoadingSpinner />
                                            <span className="ml-2">Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Proceed to Payment</span>
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PricingPage 