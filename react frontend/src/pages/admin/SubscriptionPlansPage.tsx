import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
    Package,
    Search,
    Plus,
    Edit,
    Trash2,
    ToggleLeft,
    ToggleRight,
    DollarSign,
    Users,
    Calendar,
    Zap,
    Star,
    Crown,
    CreditCard,
    Wallet,
    Check,
    X,
    ArrowRight
} from 'lucide-react'
import AdminLayout from '../../components/AdminLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useAuditLogger } from '../../hooks/useAuditLogger'
import { useAuth } from '../../contexts/AuthContext'
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

const SubscriptionPlansPage: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    const [activityFilter, setActivityFilter] = useState<'all' | 'voting' | 'events' | 'both'>('all')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showTopUpModal, setShowTopUpModal] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
    const [features, setFeatures] = useState<string[]>([''])

    // Payment gateway selection states
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null)
    const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    // Manual top-up states
    const [userSearch, setUserSearch] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [selectedTopUpPlan, setSelectedTopUpPlan] = useState<SubscriptionPlan | null>(null)
    const [topUpReason, setTopUpReason] = useState('')
    const [isTopUpProcessing, setIsTopUpProcessing] = useState(false)

    // URL parameters for plan pre-selection
    const [searchParams] = useSearchParams()
    const planParam = searchParams.get('plan')

    const queryClient = useQueryClient()
    const { logUserAction, logButtonClick } = useAuditLogger({ context: 'SubscriptionPlans' })
    const { user } = useAuth()
    const navigate = useNavigate()

    // Fetch subscription plans
    const { data: plansData, isLoading, error } = useQuery({
        queryKey: ['subscription-plans', currentPage, searchQuery, activityFilter],
        queryFn: () => {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                search: searchQuery
            })

            if (activityFilter !== 'all') {
                params.append('activity_type', activityFilter)
            }

            return fetch(`${import.meta.env.VITE_API_URL}/superadmin/subscription-plans?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            }).then(res => res.json())
        },
        refetchInterval: 30000
    })

    // Fetch payment gateways
    const { data: paymentGatewaysData } = useQuery({
        queryKey: ['payment-gateways'],
        queryFn: () => fetch(`${import.meta.env.VITE_API_URL}/payment-gateways`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        }).then(res => res.json())
    })

    // Create plan mutation
    const createPlanMutation = useMutation({
        mutationFn: (data: any) => fetch(`${import.meta.env.VITE_API_URL}/superadmin/subscription-plans`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(res => res.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] })
            setShowCreateModal(false)
            setFeatures([''])
            toast.success('Subscription plan created successfully')
            logUserAction('subscription_plan_created')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create subscription plan')
        }
    })

    // Update plan mutation
    const updatePlanMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => fetch(`${import.meta.env.VITE_API_URL}/superadmin/subscription-plans/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(res => res.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] })
            setShowEditModal(false)
            setSelectedPlan(null)
            setFeatures([''])
            toast.success('Subscription plan updated successfully')
            logUserAction('subscription_plan_updated')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update subscription plan')
        }
    })

    // Delete plan mutation
    const deletePlanMutation = useMutation({
        mutationFn: (id: number) => fetch(`${import.meta.env.VITE_API_URL}/superadmin/subscription-plans/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        }).then(res => res.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] })
            toast.success('Subscription plan deleted successfully')
            logUserAction('subscription_plan_deleted')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete subscription plan')
        }
    })

    // Toggle status mutation
    const toggleStatusMutation = useMutation({
        mutationFn: (id: number) => fetch(`${import.meta.env.VITE_API_URL}/superadmin/subscription-plans/${id}/toggle-status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        }).then(res => res.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] })
            toast.success('Subscription plan status updated')
            logUserAction('subscription_plan_status_toggled')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update status')
        }
    })

    // Manual top-up mutation
    const manualTopUpMutation = useMutation({
        mutationFn: (data: any) => fetch(`${import.meta.env.VITE_API_URL}/superadmin/subscription-plans/manual-topup`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(res => res.json()),
        onSuccess: (data) => {
            toast.success('User subscription topped up successfully')
            setShowTopUpModal(false)
            setSelectedUser(null)
            setSelectedTopUpPlan(null)
            setTopUpReason('')
            setUserSearch('')
            setSearchResults([])
            logUserAction('manual_subscription_topup', {
                user: data.data?.user,
                plan: data.data?.plan
            })
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to top up user subscription')
        }
    })

    // User search mutation
    const userSearchMutation = useMutation({
        mutationFn: (search: string) => fetch(`${import.meta.env.VITE_API_URL}/superadmin/subscription-plans/search-users?search=${encodeURIComponent(search)}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        }).then(res => res.json()),
        onSuccess: (data) => {
            setSearchResults(data.data || [])
        },
        onError: (error: any) => {
            toast.error('Failed to search users')
            setSearchResults([])
        }
    })

    const handleCreatePlan = (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData(e.target as HTMLFormElement)
        const data = {
            name: formData.get('name'),
            slug: formData.get('slug'),
            price: parseFloat(formData.get('price') as string),
            duration: parseInt(formData.get('duration') as string),
            votes: parseInt(formData.get('votes') as string),
            nominees: parseInt(formData.get('nominees') as string),
            voting_times: parseInt(formData.get('voting_times') as string),
            description: formData.get('description'),
            features: features.filter(f => f.trim() !== ''),
            status: formData.get('status') || 'active',
            activity_type: formData.get('activity_type') || 'voting'
        }
        createPlanMutation.mutate(data)
    }

    const handleUpdatePlan = (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedPlan) return

        const formData = new FormData(e.target as HTMLFormElement)
        const data = {
            name: formData.get('name'),
            slug: formData.get('slug'),
            price: parseFloat(formData.get('price') as string),
            duration: parseInt(formData.get('duration') as string),
            votes: parseInt(formData.get('votes') as string),
            nominees: parseInt(formData.get('nominees') as string),
            voting_times: parseInt(formData.get('voting_times') as string),
            description: formData.get('description'),
            features: features.filter(f => f.trim() !== ''),
            status: formData.get('status'),
            activity_type: formData.get('activity_type')
        }
        updatePlanMutation.mutate({ id: selectedPlan.id, data })
    }

    const handleDeletePlan = (plan: SubscriptionPlan) => {
        if (window.confirm(`Are you sure you want to delete ${plan.name}?`)) {
            deletePlanMutation.mutate(plan.id)
        }
    }

    const handleToggleStatus = (plan: SubscriptionPlan) => {
        toggleStatusMutation.mutate(plan.id)
    }

    const addFeature = () => {
        setFeatures([...features, ''])
    }

    const removeFeature = (index: number) => {
        setFeatures(features.filter((_, i) => i !== index))
    }

    const updateFeature = (index: number, value: string) => {
        const newFeatures = [...features]
        newFeatures[index] = value
        setFeatures(newFeatures)
    }

    // Manual top-up handling functions
    const handleUserSearch = (search: string) => {
        setUserSearch(search)
        if (search.length >= 2) {
            userSearchMutation.mutate(search)
        } else {
            setSearchResults([])
        }
    }

    const handleSelectUser = (user: any) => {
        setSelectedUser(user)
        setUserSearch(user.email)
        setSearchResults([])
    }

    const handleManualTopUp = () => {
        if (!selectedUser || !selectedTopUpPlan) {
            toast.error('Please select both user and plan')
            return
        }

        setIsTopUpProcessing(true)
        manualTopUpMutation.mutate({
            user_identifier: selectedUser.email,
            plan_id: selectedTopUpPlan.plan_id,
            reason: topUpReason
        })
        setIsTopUpProcessing(false)
    }

    // Payment handling functions
    const handleSelectPlan = (plan: SubscriptionPlan) => {
        setCurrentPlan(plan)
        setShowPaymentModal(true)
        logButtonClick('select_subscription_plan', `plan_${plan.plan_id}`)
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
            // Redirect to login page
            navigate(`/login?redirect=/admin/subscription-plans&plan=${currentPlan.plan_id}`)
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
                    email: user.email, // Use authenticated user's email
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
                            logUserAction('subscription_purchased', {
                                plan_id: data.plan.plan_id,
                                amount: data.amount / 100,
                                reference: response.reference
                            })
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
                return <Crown className="w-5 h-5 text-yellow-500" />
            case 'pro':
                return <Star className="w-5 h-5 text-purple-500" />
            default:
                return <Package className="w-5 h-5 text-blue-500" />
        }
    }

    const plans = plansData?.data || []
    const pagination = plansData ? {
        current_page: plansData.current_page,
        last_page: plansData.last_page,
        per_page: plansData.per_page,
        total: plansData.total
    } : null

    useEffect(() => {
        logUserAction('subscription_plans_viewed', { page: currentPage, search: searchQuery })
    }, [currentPage, searchQuery, logUserAction])

    useEffect(() => {
        if (selectedPlan && showEditModal) {
            setFeatures(selectedPlan.features || [''])
        }
    }, [selectedPlan, showEditModal])

    // Handle plan pre-selection from URL parameter
    useEffect(() => {
        if (planParam && plans.length > 0 && !showPaymentModal) {
            const preSelectedPlan = plans.find((plan: SubscriptionPlan) =>
                plan.plan_id === planParam || plan.slug === planParam
            )

            if (preSelectedPlan && preSelectedPlan.status === 'active') {
                setCurrentPlan(preSelectedPlan)
                setShowPaymentModal(true)
                logButtonClick('plan_preselected_from_url', `plan_${preSelectedPlan.plan_id}`)
            }
        }
    }, [planParam, plans, showPaymentModal, logButtonClick])

    return (
        <div>
            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
                            <p className="text-gray-600 mt-1">
                                Manage subscription plans and pricing configurations
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowTopUpModal(true)}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                            >
                                <Users className="w-4 h-4" />
                                <span>Manual Top-up</span>
                            </button>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Plan</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="card-glass border border-gray-200 p-4 mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search subscription plans..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="w-48">
                            <select
                                value={activityFilter}
                                onChange={(e) => setActivityFilter(e.target.value as 'all' | 'voting' | 'events' | 'both')}
                                className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Activities</option>
                                <option value="voting">Voting Only</option>
                                <option value="events">Events Only</option>
                                <option value="both">Both Activities</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {plans.map((plan: SubscriptionPlan) => (
                        <div key={plan.id} className="card-glass border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    {getPlanIcon(plan.slug)}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{plan.slug}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${plan.activity_type === 'voting'
                                        ? 'bg-blue-100 text-blue-800'
                                        : plan.activity_type === 'events'
                                            ? 'bg-purple-100 text-purple-800'
                                            : 'bg-indigo-100 text-indigo-800'
                                        }`}>
                                        {plan.activity_type === 'both' ? 'Voting & Events' : plan.activity_type.charAt(0).toUpperCase() + plan.activity_type.slice(1)}
                                    </span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${plan.status === 'active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {plan.status}
                                    </span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="text-3xl font-bold text-gray-900 mb-1">
                                    ₦{plan.price.toLocaleString()}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">for {plan.duration} days</p>
                            </div>

                            <div className="space-y-2 mb-6">
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                    <Zap className="w-4 h-4 mr-2 text-blue-500" />
                                    {plan.votes} votes
                                </div>
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                    <Users className="w-4 h-4 mr-2 text-green-500" />
                                    {plan.nominees} nominees
                                </div>
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                    <Calendar className="w-4 h-4 mr-2 text-purple-500" />
                                    {plan.voting_times} voting sessions
                                </div>
                            </div>

                            {plan.description && (
                                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                            )}

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handleSelectPlan(plan)}
                                    disabled={plan.status !== 'active'}
                                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center text-sm"
                                >
                                    <CreditCard className="w-4 h-4 mr-1" />
                                    Subscribe
                                </button>
                                <button
                                    onClick={() => handleToggleStatus(plan)}
                                    className={`p-2 rounded-lg transition-colors duration-200 ${plan.status === 'active'
                                        ? 'text-red-600 hover:bg-red-50'
                                        : 'text-green-600 hover:bg-green-50'
                                        }`}
                                    title={plan.status === 'active' ? 'Deactivate' : 'Activate'}
                                >
                                    {plan.status === 'active' ? (
                                        <ToggleLeft className="w-4 h-4" />
                                    ) : (
                                        <ToggleRight className="w-4 h-4" />
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedPlan(plan)
                                        setShowEditModal(true)
                                    }}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                    title="Edit"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeletePlan(plan)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {!plans?.length && !isLoading && (
                    <div className="text-center py-16">
                        <Package className="w-24 h-24 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No Subscription Plans
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Get started by creating your first subscription plan.
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                        >
                            Create Plan
                        </button>
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                            {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                            {pagination.total} results
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-secondary-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                                const page = i + Math.max(1, currentPage - 2)
                                if (page > pagination.last_page) return null
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg ${page === currentPage
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-500 bg-white dark:bg-secondary-900 border border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                )
                            })}
                            <button
                                onClick={() => setCurrentPage(Math.min(pagination.last_page, currentPage + 1))}
                                disabled={currentPage === pagination.last_page}
                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-secondary-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Create Plan Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200 dark:border-secondary-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Create Subscription Plan
                                </h3>
                            </div>
                            <form onSubmit={handleCreatePlan} className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Plan Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., Premium Plan"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Slug
                                        </label>
                                        <input
                                            type="text"
                                            name="slug"
                                            required
                                            className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., premium"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Price (₦)
                                        </label>
                                        <input
                                            type="number"
                                            name="price"
                                            required
                                            min="0"
                                            step="0.01"
                                            className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Duration (days)
                                        </label>
                                        <input
                                            type="number"
                                            name="duration"
                                            required
                                            min="1"
                                            className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="30"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Votes
                                        </label>
                                        <input
                                            type="number"
                                            name="votes"
                                            required
                                            min="0"
                                            className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="1000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Nominees
                                        </label>
                                        <input
                                            type="number"
                                            name="nominees"
                                            required
                                            min="0"
                                            className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Voting Sessions
                                        </label>
                                        <input
                                            type="number"
                                            name="voting_times"
                                            required
                                            min="0"
                                            className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="5"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        rows={3}
                                        className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Plan description..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Features
                                    </label>
                                    {features.map((feature, index) => (
                                        <div key={index} className="flex items-center space-x-2 mb-2">
                                            <input
                                                type="text"
                                                value={feature}
                                                onChange={(e) => updateFeature(index, e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Feature description"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeFeature(index)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addFeature}
                                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add Feature
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Activity Type
                                    </label>
                                    <select
                                        name="activity_type"
                                        className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="voting">Voting Only</option>
                                        <option value="events">Events Only</option>
                                        <option value="both">Both Activities</option>
                                    </select>
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateModal(false)
                                            setFeatures([''])
                                        }}
                                        className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createPlanMutation.isPending}
                                        className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                    >
                                        {createPlanMutation.isPending ? 'Creating...' : 'Create Plan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Plan Modal */}
                {showEditModal && selectedPlan && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200 dark:border-secondary-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Edit Subscription Plan
                                </h3>
                            </div>
                            <form onSubmit={handleUpdatePlan} className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Plan Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            defaultValue={selectedPlan.name}
                                            required
                                            className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Slug
                                        </label>
                                        <input
                                            type="text"
                                            name="slug"
                                            defaultValue={selectedPlan.slug}
                                            required
                                            className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Price (₦)
                                        </label>
                                        <input
                                            type="number"
                                            name="price"
                                            defaultValue={selectedPlan.price}
                                            required
                                            min="0"
                                            step="0.01"
                                            className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Duration (days)
                                        </label>
                                        <input
                                            type="number"
                                            name="duration"
                                            defaultValue={selectedPlan.duration}
                                            required
                                            min="1"
                                            className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Votes
                                        </label>
                                        <input
                                            type="number"
                                            name="votes"
                                            defaultValue={selectedPlan.votes}
                                            required
                                            min="0"
                                            className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Nominees
                                        </label>
                                        <input
                                            type="number"
                                            name="nominees"
                                            defaultValue={selectedPlan.nominees}
                                            required
                                            min="0"
                                            className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Voting Sessions
                                        </label>
                                        <input
                                            type="number"
                                            name="voting_times"
                                            defaultValue={selectedPlan.voting_times}
                                            required
                                            min="0"
                                            className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        defaultValue={selectedPlan.description}
                                        rows={3}
                                        className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Features
                                    </label>
                                    {features.map((feature, index) => (
                                        <div key={index} className="flex items-center space-x-2 mb-2">
                                            <input
                                                type="text"
                                                value={feature}
                                                onChange={(e) => updateFeature(index, e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Feature description"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeFeature(index)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addFeature}
                                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add Feature
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        defaultValue={selectedPlan.status}
                                        className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Activity Type
                                    </label>
                                    <select
                                        name="activity_type"
                                        defaultValue={selectedPlan.activity_type}
                                        className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="voting">Voting Only</option>
                                        <option value="events">Events Only</option>
                                        <option value="both">Both Activities</option>
                                    </select>
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEditModal(false)
                                            setSelectedPlan(null)
                                            setFeatures([''])
                                        }}
                                        className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updatePlanMutation.isPending}
                                        className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                    >
                                        {updatePlanMutation.isPending ? 'Updating...' : 'Update Plan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Manual Top-up Modal */}
            {showTopUpModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200 dark:border-secondary-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Manual Top-up User Subscription
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowTopUpModal(false)
                                        setSelectedUser(null)
                                        setSelectedTopUpPlan(null)
                                        setTopUpReason('')
                                        setUserSearch('')
                                        setSearchResults([])
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* User Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Search User (Email or Account ID)
                                </label>
                                <div className="relative">
                                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={userSearch}
                                        onChange={(e) => handleUserSearch(e.target.value)}
                                        placeholder="Enter email or account ID..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Search Results */}
                                {searchResults.length > 0 && (
                                    <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                                        {searchResults.map((user) => (
                                            <div
                                                key={user.id}
                                                onClick={() => handleSelectUser(user)}
                                                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                            >
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">ID: {user.account_id}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Selected User */}
                            {selectedUser && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="text-sm font-medium text-green-900">Selected User:</div>
                                    <div className="text-sm text-green-700">{selectedUser.email}</div>
                                    <div className="text-xs text-green-600">ID: {selectedUser.account_id}</div>
                                </div>
                            )}

                            {/* Plan Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Select Plan
                                </label>
                                <select
                                    value={selectedTopUpPlan?.id || ''}
                                    onChange={(e) => {
                                        const plan = plans.find((p: SubscriptionPlan) => p.id === parseInt(e.target.value))
                                        setSelectedTopUpPlan(plan || null)
                                    }}
                                    className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select a plan...</option>
                                    {plans.map((plan: SubscriptionPlan) => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name} - ₦{plan.price?.toLocaleString()} ({plan.activity_type})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Reason for Top-up
                                </label>
                                <textarea
                                    value={topUpReason}
                                    onChange={(e) => setTopUpReason(e.target.value)}
                                    placeholder="Enter reason for manual top-up..."
                                    rows={3}
                                    className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    onClick={() => {
                                        setShowTopUpModal(false)
                                        setSelectedUser(null)
                                        setSelectedTopUpPlan(null)
                                        setTopUpReason('')
                                        setUserSearch('')
                                        setSearchResults([])
                                    }}
                                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleManualTopUp}
                                    disabled={!selectedUser || !selectedTopUpPlan || isTopUpProcessing}
                                    className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                                >
                                    {isTopUpProcessing ? (
                                        <>
                                            <LoadingSpinner />
                                            <span className="ml-2">Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Users className="w-4 h-4 mr-2" />
                                            <span>Top-up User</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Gateway Selection Modal */}
            {showPaymentModal && currentPlan && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200 dark:border-secondary-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Select Payment Method
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowPaymentModal(false)
                                        setCurrentPlan(null)
                                        setSelectedGateway(null)
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">{currentPlan.name}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{currentPlan.duration} days</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-gray-900 dark:text-white">
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

export default SubscriptionPlansPage 