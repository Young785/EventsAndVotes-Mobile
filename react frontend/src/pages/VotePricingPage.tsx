import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Select from 'react-select'
import {
    CreditCard,
    Check,
    Star,
    Zap,
    Shield,
    Users,
    ArrowRight,
    Crown,
    Sparkles,
    X,
    Wallet,
    Upload,
    Building2
} from 'lucide-react'
import { votesApi } from '../services/api'
import api from '../services/api' // default export of axios instance
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

interface PaymentGateway {
    id: string
    name: string
    slug: string
    key: string
    pg_id: string
    logo?: string
}

interface Bank {
    id: string
    bank_id: string
    name: string
    code: string
    sort_code?: string
}

// Add type declaration for MonicreditPop at the top of the file, after other declarations
declare global {
    interface Window {
        PaystackPop: any
        MonicreditPop: any
        PayDirect: {
            invoice: (config: any) => {
                openIframe: () => void;
            };
        };
    }
}

const VotePricingPage: React.FC = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [selectedPlan, setSelectedPlan] = useState<string | null>(searchParams.get('plan'))
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [showManualPaymentModal, setShowManualPaymentModal] = useState(false)
    const [showBankDetailsModal, setShowBankDetailsModal] = useState(false)
    const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [currentPlan, setCurrentPlan] = useState<any>(null)
    const { isAuthenticated } = useAuth()
    const [manualPaymentData, setManualPaymentData] = useState({
        bank_id: '',
        depositor_name: '',
        amount: '',
        receipt: null as File | null,
        notes: ''
    })

    const { data: pricingData, isLoading, error } = useQuery({
        queryKey: ['vote-pricing'],
        queryFn: () => votesApi.getPricing()
    })

    // Fetch payment gateways
    const { data: gatewaysData, isLoading: gatewaysLoading } = useQuery({
        queryKey: ['payment-gateways'],
        queryFn: () => fetch(`${import.meta.env.VITE_API_URL}/payment-gateways`, {
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => res.json()),
        enabled: showPaymentModal
    })

    // Fetch payment gateway configuration (including script URLs)
    const { data: paymentConfigData } = useQuery({
        queryKey: ['payment-config'],
        queryFn: () => fetch(`${import.meta.env.VITE_API_URL}/public/settings`, {
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => res.json()),
        enabled: showPaymentModal
    })

    // Fetch banks for manual payment
    const { data: banksData } = useQuery({
        queryKey: ['banks'],
        queryFn: () => fetch(`${import.meta.env.VITE_API_URL}/admin/banks/all`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        }).then(res => res.json()),
        enabled: showManualPaymentModal
    })

    // Fetch admin bank details for manual payment
    const { data: adminBankDetailsData } = useQuery({
        queryKey: ['admin-bank-details'],
        queryFn: () => fetch(`${import.meta.env.VITE_API_URL}/admin-bank-details`, {
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => res.json()),
        enabled: showBankDetailsModal
    })

    const plans = pricingData?.data?.subscriptions || []
    const currencyIcon = pricingData?.data?.currency_icon || '₦'
    const paymentGateways: PaymentGateway[] = gatewaysData?.data || []
    const banks: Bank[] = banksData?.data || []
    const adminBankDetails = adminBankDetailsData?.data || null
    const { user } = useAuth()

    // Add manual payment option to payment gateways
    const allPaymentOptions = [
        ...paymentGateways,
        {
            id: 'manual_payment',
            name: 'Bank Transfer (Admin Payment)',
            slug: 'manual_payment',
            key: 'manual',
            pg_id: 'manual_payment',
            logo: ''
        }
    ]

    const handleSelectPlan = (plan: any) => {
        if (!user) {
            // Redirect to login with plan parameter
            navigate(`/login?redirect=/vote-pricing&plan=${plan.plan_id}`)
            return
        }
        setSelectedPlan(plan.plan_id)
        setCurrentPlan(plan)
        setShowPaymentModal(true)
        // Set default amount for manual payment
        setManualPaymentData(prev => ({
            ...prev,
            amount: plan.price?.toString() || ''
        }))
    }

    const handlePaymentGatewaySelect = (gateway: PaymentGateway | any) => {
        if (gateway.slug === 'manual_payment') {
            setShowPaymentModal(false)
            setShowBankDetailsModal(true)
        } else {
            setSelectedGateway(gateway)
        }
    }

    const handleManualPaymentSubmit = async () => {
        if (!manualPaymentData.bank_id || !manualPaymentData.depositor_name || !manualPaymentData.amount || !manualPaymentData.receipt) {
            toast.error('Please fill in all required fields and upload receipt')
            return
        }

        setIsProcessing(true)

        try {
            const storedUser = localStorage.getItem('user')
            const userEmail = storedUser ? JSON.parse(storedUser).email : null

            if (!userEmail) {
                toast.error('Please login to continue')
                navigate(`/login?redirect=/vote-pricing&plan=${currentPlan.plan_id}`)
                setIsProcessing(false)
                return
            }

            const formData = new FormData()
            formData.append('plan_id', currentPlan.plan_id)
            formData.append('user_email', userEmail)
            formData.append('bank_id', manualPaymentData.bank_id)
            formData.append('depositor_name', manualPaymentData.depositor_name)
            formData.append('amount', manualPaymentData.amount)
            formData.append('receipt', manualPaymentData.receipt)
            formData.append('notes', manualPaymentData.notes)
            formData.append('payment_type', 'manual_bank_transfer')

            console.log('Submitting manual payment request:', {
                plan_id: currentPlan.plan_id,
                user_email: userEmail,
                bank_id: manualPaymentData.bank_id,
                depositor_name: manualPaymentData.depositor_name,
                amount: manualPaymentData.amount
            })

            const response = await api.post('/subscription-requests', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            if ((response as any).status === 'success') {
                toast.success('Payment request submitted successfully! Please wait for admin approval.')
                setShowManualPaymentModal(false)
                setManualPaymentData({
                    bank_id: '',
                    depositor_name: '',
                    amount: '',
                    receipt: null,
                    notes: ''
                })
                // Redirect to a success page or dashboard
                setTimeout(() => {
                    if (user?.role?.name !== 'admin') {
                        navigate('/dashboard')
                    } else {
                        navigate('/admin/dashboard')
                    }
                }, 2000)
            } else {
                toast.error((response as any).message || 'Failed to submit payment request')
            }
        } catch (error: any) {
            console.error('Manual payment submission error:', error)
            toast.error(error.response?.data?.message || 'Failed to submit payment request')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleProceedToPayment = async () => {
        if (!selectedGateway || !currentPlan) {
            toast.error('Please select a payment gateway')
            return
        }

        setIsProcessing(true)

        try {
            const reference = 'TRX' + Math.floor((Math.random() * 100000) + 1)

            // Prepare checkout payload
            const storedUser = localStorage.getItem('user')
            const userEmail = storedUser ? JSON.parse(storedUser).email : null

            if (!userEmail) {
                toast.error('Please login to continue')
                navigate(`/login?redirect=/vote-pricing&plan=${currentPlan.plan_id}`)
                setIsProcessing(false)
                return
            }

            const checkoutData = {
                email: userEmail,
                amount: currentPlan.price,
                pg_id: selectedGateway.pg_id,
                reference: reference
            }

            console.log('Sending checkout request:', checkoutData)

            // Make checkout request using axios instance with proper authentication
            const response = await api.post(`/subscriptions/${currentPlan.plan_id}/subscribe`, checkoutData)

            console.log('Checkout response:', response)

            if ((response as any).status === 'success' && (response as any).data) {
                const responseData = (response as any).data
                const { payment_gateway } = responseData

                console.log('Payment gateway data:', payment_gateway)
                console.log('Payment gateway slug:', payment_gateway.slug)

                // Process payment based on gateway type
                if (payment_gateway.slug === 'paystack') {
                    console.log('Processing Paystack payment...')
                    console.log('Paystack data:', responseData.paystack_data)

                    // Load Paystack script if not available
                    if (typeof window.PaystackPop === 'undefined') {
                        const script = document.createElement('script')
                        script.src = 'https://js.paystack.co/v1/inline.js'
                        script.async = true
                        script.onload = () => {
                            console.log('Paystack script loaded, initializing payment...')
                            initializePaystackPayment(responseData, userEmail)
                        }
                        script.onerror = () => {
                            console.error('Failed to load Paystack script')
                            toast.error('Failed to load payment gateway')
                            setIsProcessing(false)
                        }
                        document.head.appendChild(script)
                    } else {
                        initializePaystackPayment(responseData, userEmail)
                    }
                } else if (payment_gateway.slug === 'monicredit') {
                    // Handle Monicredit payment
                    if (responseData.monicredit_data) {
                        console.log('Processing Monicredit payment...')

                        // Get Monicredit script URL from backend configuration
                        const monicreditScriptUrl = paymentConfigData?.data?.monicredit_script_url || 'https://demo.monicredit.com/js/demo.js'

                        // Load Monicredit script if not available
                        if (typeof window.PayDirect === 'undefined') {
                            const script = document.createElement('script')
                            script.src = monicreditScriptUrl
                            script.async = true
                            script.onload = () => {
                                console.log('Monicredit script loaded, initializing payment...')
                                initializeMonicreditPayment(responseData)
                            }
                            script.onerror = () => {
                                console.error('Failed to load Monicredit script')
                                toast.error('Failed to load payment gateway')
                                setIsProcessing(false)
                            }
                            document.head.appendChild(script)
                        } else {
                            initializeMonicreditPayment(responseData)
                        }
                    } else {
                        console.error('Missing Monicredit payment data')
                        toast.error('Payment initialization failed. Missing payment data.')
                        setIsProcessing(false)
                    }
                } else {
                    console.error('Unsupported payment gateway:', payment_gateway.slug)
                    toast.error(`Unsupported payment gateway: ${payment_gateway.slug}`)
                    setIsProcessing(false)
                }
            } else {
                console.error('API response error:', response)
                toast.error((response as any).data?.message || 'Failed to initiate payment')
                setIsProcessing(false)
            }
        } catch (error: any) {
            console.error('Checkout error:', error)
            toast.error(error.response?.data?.message || error.message || 'An error occurred during checkout')
            setIsProcessing(false)
        }
    }

    // Helper function to initialize Paystack payment
    const initializePaystackPayment = (responseData: any, userEmail: string) => {
        try {
            const handler = window.PaystackPop.setup({
                key: responseData.paystack_data.public_key,
                email: userEmail,
                amount: currentPlan?.price ? currentPlan.price * 100 : 0, // Convert to kobo
                currency: 'NGN',
                ref: responseData.paystack_data.reference,
                callback: function (response: any) {
                    handlePaystackCallback(response)
                },
                onClose: function () {
                    handlePaymentClose()
                }
            })
            handler.openIframe()
        } catch (error) {
            console.error('Paystack initialization error:', error)
            toast.error('Failed to initialize payment')
            setIsProcessing(false)
        }
    }

    // Helper function to initialize Monicredit payment
    const initializeMonicreditPayment = (responseData: any) => {
        try {
            const handler = window.PayDirect.invoice({
                public_key: responseData.monicredit_data.public_key,
                order_id: responseData.monicredit_data.order_id,
                customer: responseData.monicredit_data.customer,
                fee_bearer: responseData.monicredit_data.fee_bearer,
                items: responseData.monicredit_data.items,
                currency: responseData.monicredit_data.currency,
                paytype: responseData.monicredit_data.paytype,
                callback: function (response: any) {
                    handleMonicreditCallback(response, responseData)
                },
                onClose: function () {
                    handlePaymentClose()
                }
            })
            handler.openIframe()
        } catch (error) {
            console.error('Monicredit initialization error:', error)
            toast.error('Failed to initialize payment')
            setIsProcessing(false)
        }
    }

    // Helper function to handle Paystack callback
    const handlePaystackCallback = async (response: any) => {
        try {
            console.log('Paystack callback:', response)
            const verifyResponse = await api.post('/subscriptions/callback', {
                reference: response.reference
            })

            if ((verifyResponse as any).status === 'success') {
                toast.success('Payment successful! Your subscription has been activated.')
                setTimeout(() => {
                    window.location.href = '/admin/dashboard'
                }, 2000)
            } else {
                toast.error((verifyResponse as any).message || 'Payment verification failed')
            }
        } catch (error: any) {
            console.error('Payment verification error:', error)
            toast.error('Payment verification failed')
        }
        setIsProcessing(false)
        setShowPaymentModal(false)
    }

    // Helper function to handle Monicredit callback
    const handleMonicreditCallback = async (response: any, responseData: any) => {
        try {
            console.log('Monicredit callback:', response)
            const verifyResponse = await api.post('/subscriptions/callback', {
                reference: response.reference_code || responseData.monicredit_data.order_id
            })

            if (verifyResponse.data.status === 'success') {
                toast.success('Payment successful! Your subscription has been activated.')
                setTimeout(() => {
                    window.location.href = '/dashboard'
                }, 2000)
            } else {
                toast.error(verifyResponse.data.message || 'Payment verification failed')
            }
        } catch (error: any) {
            console.error('Payment verification error:', error)
            toast.error('Payment verification failed')
        }
        setIsProcessing(false)
        setShowPaymentModal(false)
    }

    // Helper function to handle payment close
    const handlePaymentClose = () => {
        console.log('Payment window closed')
        setIsProcessing(false)
        toast.error('Payment window closed. Please try again.')
    }

    const getPlanFeatures = (plan: any) => {
        return [
            `${plan.votes} votes included`,
            `${plan.nominees} nominees allowed`,
            `${plan.voting_times} voting sessions`,
            `${plan.duration} days validity`,
            'Email support',
            'Analytics dashboard'
        ]
    }

    const getPlanIcon = (slug: string) => {
        switch (slug) {
            case 'premium':
                return <Crown className="w-8 h-8 text-yellow-500" />
            case 'pro':
                return <Sparkles className="w-8 h-8 text-purple-500" />
            default:
                return <CreditCard className="w-8 h-8 text-blue-500" />
        }
    }

    // Transform banks data for react-select
    const bankOptions = banks.map((bank) => ({
        value: bank.bank_id,
        label: `${bank.name} (${bank.code})`
    }))

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        )
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Plans</h1>
                <p className="text-gray-600 dark:text-gray-400">Please try again later.</p>
            </div>
        )
    }

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
            <div className="container mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Choose Your Plan
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Select the perfect subscription plan for your voting needs.
                        Upgrade anytime and unlock powerful features.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {plans.map((plan: any, index: number) => {
                        const isPopular = plan.slug === 'premium'
                        const isSelected = selectedPlan === plan.plan_id

                        return (
                            <div
                                key={plan.plan_id}
                                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${isPopular
                                    ? 'border-blue-500 scale-105'
                                    : isSelected
                                        ? 'border-green-500'
                                        : 'border-gray-200 hover:border-blue-300'
                                    }`}
                            >
                                {/* Popular Badge */}
                                {isPopular && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                                            <Star className="w-4 h-4 mr-1" />
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <div className="p-8">
                                    {/* Plan Header */}
                                    <div className="text-center mb-8">
                                        <div className="flex justify-center mb-4">
                                            {getPlanIcon(plan.slug)}
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                            {isAuthenticated && plan.slug === 'premium' ? plan.name + ' (Current)' : plan.name}
                                        </h3>
                                        <div className="text-4xl font-bold text-gray-900 mb-1">
                                            {currencyIcon}{plan.price?.toLocaleString()}
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            for {plan.duration} days
                                        </p>
                                    </div>

                                    {/* Features */}
                                    <div className="space-y-4 mb-8">
                                        {getPlanFeatures(plan).map((feature, featureIndex) => (
                                            <div key={featureIndex} className="flex items-center">
                                                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                                <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* CTA Button */}
                                    {plan.slug !== 'free' && (
                                        <button
                                            onClick={() => handleSelectPlan(plan)}
                                            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center ${isPopular
                                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                                : 'bg-gray-900 text-white hover:bg-gray-800'
                                                }`}
                                        >
                                            <span>Choose {plan.name}</span>
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                    {/* Unlimited plan card go to contact us page */}
                    <div className="relative bg-white dark:bg-secondary-900 rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl border-gray-200 hover:border-blue-300">
                        <div className="p-8">
                            <div className="text-center mb-8">
                                <div className="flex justify-center mb-4">
                                    <CreditCard className="w-8 h-8 text-blue-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Unlimited</h3>
                                <div className="text-4xl font-bold text-gray-900 mb-1">Contact Us</div>
                                <p className="text-gray-500 dark:text-gray-400">for 30 days</p>
                            </div>
                            <div className="space-y-4 mb-8">
                                <div className="flex items-center">
                                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300">Unlimited votes included</span>
                                </div>
                                <div className="flex items-center">
                                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300">Unlimited nominees allowed</span>
                                </div>
                                <div className="flex items-center">
                                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300">Unlimited voting sessions</span>
                                </div>
                                <div className="flex items-center">
                                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300">Unlimited validity</span>
                                </div>
                                <div className="flex items-center">
                                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300">Unlimited support</span>
                                </div>
                                <div className="flex items-center">
                                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300">Unlimited analytics dashboard</span>
                                </div>
                            </div>
                            <button onClick={() => navigate('/contact')} className="w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center bg-gray-900 text-white hover:bg-gray-800">
                                <span>Contact Us</span>
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Features Comparison */}
                <div className="mt-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Why Choose Our Platform?
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Get access to powerful voting tools and analytics to make your elections successful.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="text-center">
                            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Zap className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast & Reliable</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Lightning-fast voting system with 99.9% uptime guarantee.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Private</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Bank-level security with end-to-end encryption for all votes.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy to Use</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Intuitive interface that makes voting simple for everyone.
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAQ or Support */}
                <div className="mt-16 text-center">
                    <p className="text-gray-600 mb-4">
                        Need help choosing the right plan?
                    </p>
                    <button
                        onClick={() => navigate('/contact')}
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                        Contact our support team
                    </button>
                </div>
            </div>

            {/* Payment Gateway Selection Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200 dark:border-secondary-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Select Payment Method
                                </h3>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            {currentPlan && (
                                <div className="mt-4 p-4 bg-gray-50 dark:bg-secondary-800 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">{currentPlan.name}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{currentPlan.duration} days</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                {currencyIcon}{currentPlan.price?.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6">
                            {gatewaysLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <LoadingSpinner />
                                    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading payment methods...</span>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {allPaymentOptions.map((gateway) => (
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
                                                    <Wallet className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                                </div>
                                                <div className="ml-3 flex-1">
                                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {gateway.name}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
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
                            )}

                            <div className="mt-6 flex space-x-3">
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:bg-secondary-800 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleProceedToPayment}
                                    disabled={!selectedGateway || isProcessing || gatewaysLoading}
                                    style={{ padding: 0, height: 42 }}
                                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                                >
                                    {isProcessing ? (
                                        <>
                                            <LoadingSpinner />
                                            <span className="ml-2">Processing...</span>
                                        </>
                                    ) : (
                                        'Proceed to Payment'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bank Details Modal */}
            {showBankDetailsModal && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200 dark:border-secondary-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Payment Instructions
                                </h3>
                                <button
                                    onClick={() => setShowBankDetailsModal(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            {currentPlan && (
                                <div className="mt-4 p-4 bg-gray-50 dark:bg-secondary-800 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">{currentPlan.name}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{currentPlan.duration} days</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                {currencyIcon}{currentPlan.price?.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6">
                            {adminBankDetails ? (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-blue-900 mb-3">Transfer to:</h4>
                                        <div className="space-y-2 text-sm">
                                            <div>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Bank Name:</span>
                                                <span className="ml-2 text-gray-900 dark:text-white">{adminBankDetails.bank_name}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Account Number:</span>
                                                <span className="ml-2 text-gray-900 font-mono">{adminBankDetails.account_number}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Account Name:</span>
                                                <span className="ml-2 text-gray-900 dark:text-white">{adminBankDetails.account_name}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Amount:</span>
                                                <span className="ml-2 text-gray-900 font-semibold">{currencyIcon}{currentPlan?.price?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {adminBankDetails.payment_instructions && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <h5 className="font-medium text-yellow-800 mb-2">Important Instructions:</h5>
                                            <p className="text-sm text-yellow-700">
                                                {adminBankDetails.payment_instructions}
                                            </p>
                                        </div>
                                    )}

                                    <div className="bg-gray-50 dark:bg-secondary-800 border border-gray-200 rounded-lg p-4">
                                        <h5 className="font-medium text-gray-800 mb-2">Next Steps:</h5>
                                        <ol className="text-sm text-gray-600 space-y-1">
                                            <li>1. Transfer the exact amount to the account above</li>
                                            <li>2. Take a screenshot or photo of your transfer receipt</li>
                                            <li>3. Click "Proceed to Submit Payment" below</li>
                                            <li>4. Upload your receipt and fill the required details</li>
                                            <li>5. Wait for admin approval (usually within 24 hours)</li>
                                        </ol>
                                    </div>

                                    <div className="flex space-x-3 mt-6">
                                        <button
                                            onClick={() => setShowBankDetailsModal(false)}
                                            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:bg-secondary-800 transition-colors duration-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowBankDetailsModal(false)
                                                setShowManualPaymentModal(true)
                                            }}
                                            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                                        >
                                            <Building2 className="w-4 h-4 mr-2" />
                                            Proceed to Submit Payment
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 mb-4">
                                        <Building2 className="w-12 h-12 mx-auto" />
                                    </div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-2">Bank Details Not Available</h4>
                                    <p className="text-gray-600 mb-4">
                                        Admin bank details have not been configured yet. Please contact support.
                                    </p>
                                    <button
                                        onClick={() => setShowBankDetailsModal(false)}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Payment Modal */}
            {showManualPaymentModal && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200 dark:border-secondary-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Submit Payment Proof
                                </h3>
                                <button
                                    onClick={() => setShowManualPaymentModal(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            {currentPlan && (
                                <div className="mt-4 p-4 bg-gray-50 dark:bg-secondary-800 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">{currentPlan.name}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{currentPlan.duration} days</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                {currencyIcon}{currentPlan.price?.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="bank_id" className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Bank *
                                    </label>
                                    <Select
                                        options={bankOptions}
                                        value={bankOptions.find(option => option.value === manualPaymentData.bank_id) || null}
                                        onChange={(selectedOption) => {
                                            console
                                            setManualPaymentData(prev => ({
                                                ...prev,
                                                bank_id: selectedOption?.value || ''
                                            }))
                                        }}
                                        placeholder="Choose a bank..."
                                        isSearchable
                                        className="react-select-container"
                                        classNamePrefix="react-select"
                                        styles={{
                                            control: (provided, state) => ({
                                                ...provided,
                                                borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                                                boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
                                                '&:hover': {
                                                    borderColor: '#9ca3af'
                                                }
                                            }),
                                            option: (provided, state) => ({
                                                ...provided,
                                                backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
                                                color: state.isSelected ? 'white' : '#374151'
                                            })
                                        }}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="depositor_name" className="block text-sm font-medium text-gray-700 mb-2">
                                        Depositor Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="depositor_name"
                                        value={manualPaymentData.depositor_name}
                                        onChange={(e) => setManualPaymentData(prev => ({
                                            ...prev,
                                            depositor_name: e.target.value
                                        }))}
                                        placeholder="Enter the name on the bank account"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                                        Amount Paid *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                            {currencyIcon}
                                        </span>
                                        <input
                                            type="number"
                                            id="amount"
                                            value={manualPaymentData.amount}
                                            onChange={(e) => setManualPaymentData(prev => ({
                                                ...prev,
                                                amount: e.target.value
                                            }))}
                                            placeholder="0.00"
                                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="receipt" className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Receipt *
                                    </label>
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors duration-200">
                                        <div className="space-y-1 text-center">
                                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                            <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                                <label
                                                    htmlFor="receipt"
                                                    className="relative cursor-pointer bg-white dark:bg-secondary-900 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                                >
                                                    <span>Upload a file</span>
                                                    <input
                                                        id="receipt"
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        onChange={(e) => {
                                                            const files = e.target.files
                                                            if (files && files.length > 0) {
                                                                setManualPaymentData(prev => ({
                                                                    ...prev,
                                                                    receipt: files[0]
                                                                }))
                                                            }
                                                        }}
                                                        className="sr-only"
                                                        required
                                                    />
                                                </label>
                                                <p className="pl-1">or drag and drop</p>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, PDF up to 10MB</p>
                                            {manualPaymentData.receipt && (
                                                <p className="text-sm text-green-600 font-medium">
                                                    ✓ {manualPaymentData.receipt.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                                        Additional Notes (Optional)
                                    </label>
                                    <textarea
                                        id="notes"
                                        value={manualPaymentData.notes}
                                        onChange={(e) => setManualPaymentData(prev => ({
                                            ...prev,
                                            notes: e.target.value
                                        }))}
                                        placeholder="Any additional information about the payment"
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowManualPaymentModal(false)
                                        setShowBankDetailsModal(true)
                                    }}
                                    className="py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:bg-secondary-800 transition-colors duration-200"
                                >
                                    ← Back to Bank Details
                                </button>
                                <button
                                    onClick={() => setShowManualPaymentModal(false)}
                                    className="py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:bg-secondary-800 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleManualPaymentSubmit}
                                    disabled={isProcessing || !manualPaymentData.bank_id || !manualPaymentData.depositor_name || !manualPaymentData.amount || !manualPaymentData.receipt}
                                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                                >
                                    {isProcessing ? (
                                        <>
                                            <LoadingSpinner />
                                            <span className="ml-2">Submitting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Building2 className="w-4 h-4 mr-2" />
                                            Submit Payment Request
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

export default VotePricingPage 