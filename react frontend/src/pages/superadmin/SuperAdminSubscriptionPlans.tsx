import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Package,
    Search,
    Plus,
    Edit,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Users,
    Calendar,
    Zap,
    Star,
    Crown,
    Shield,
    X,
    AlertTriangle,
    CheckCircle,
    Clock,
    Vote,
    UserCheck,
    QrCode,
    MapPin,
    Scan
} from 'lucide-react'
import { useAuditLogger } from '../../hooks/useAuditLogger'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

interface VoteSubscriptionPlan {
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
    created_at: string
    updated_at: string
}

interface EventSubscriptionPlan {
    id: string
    name: string
    description: string
    price: number
    duration_days: number
    max_events: number
    max_attendees_per_event: number
    max_scan_locations?: number
    max_scanners_per_location?: number
    features?: string[]
    scanner_features?: string[]
    is_active: boolean
    is_popular: boolean
    sort_order: number
    created_at: string
    updated_at: string
}

const SuperAdminSubscriptionPlans: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    const [planType, setPlanType] = useState<'votes' | 'events'>('votes')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedVotePlan, setSelectedVotePlan] = useState<VoteSubscriptionPlan | null>(null)
    const [selectedEventPlan, setSelectedEventPlan] = useState<EventSubscriptionPlan | null>(null)
    const [features, setFeatures] = useState<string[]>([''])
    const [scannerFeatures, setScannerFeatures] = useState<string[]>([''])

    const queryClient = useQueryClient()
    const { logUserAction, logButtonClick } = useAuditLogger({ context: 'SuperAdminSubscriptionPlans' })
    const { user } = useAuth()

    // Check if user has superadmin access
    const hasAccess = user?.role?.name === 'superadmin'

    if (!hasAccess) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">This page is only accessible to SuperAdmin users.</p>
                </div>
            </div>
        )
    }

    // Fetch vote subscription plans
    const { data: votePlansData, isLoading: voteLoading, error: voteError } = useQuery({
        queryKey: ['superadmin-vote-plans', currentPage, searchQuery],
        queryFn: async () => {
            const params = new URLSearchParams()
            params.append('page', currentPage.toString())
            params.append('per_page', '15')
            if (searchQuery) params.append('search', searchQuery)

            const response = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/subscription-plans?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch vote subscription plans')
            }

            return response.json()
        },
        enabled: planType === 'votes',
        refetchInterval: 30000
    })

    // Fetch event subscription plans
    const { data: eventPlansData, isLoading: eventLoading, error: eventError } = useQuery({
        queryKey: ['superadmin-event-plans', currentPage, searchQuery],
        queryFn: async () => {
            const params = new URLSearchParams()
            params.append('page', currentPage.toString())
            params.append('per_page', '15')
            if (searchQuery) params.append('search', searchQuery)

            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/events/subscription-plans?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch event subscription plans')
            }

            return response.json()
        },
        enabled: planType === 'events',
        refetchInterval: 30000
    })

    // Create mutations for both plan types
    const createVotePlanMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/subscription-plans`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to create vote plan')
            }

            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin-vote-plans'] })
            setShowCreateModal(false)
            setFeatures([''])
            toast.success('Vote plan created successfully')
        }
    })

    const createEventPlanMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/events/subscription-plans`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to create event plan')
            }

            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin-event-plans'] })
            setShowCreateModal(false)
            setFeatures([''])
            setScannerFeatures([''])
            toast.success('Event plan created successfully')
        }
    })

    // Toggle status mutations
    const toggleVotePlanStatusMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/subscription-plans/${id}/toggle-status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to toggle vote plan status')
            }

            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin-vote-plans'] })
            toast.success('Vote plan status updated successfully')
        }
    })

    const toggleEventPlanStatusMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/events/subscription-plans/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_active: null }) // Backend will toggle the status
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to toggle event plan status')
            }

            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin-event-plans'] })
            toast.success('Event plan status updated successfully')
        }
    })

    const isLoading = planType === 'votes' ? voteLoading : eventLoading
    const error = planType === 'votes' ? voteError : eventError
    const plansData = planType === 'votes' ? votePlansData : eventPlansData

    // Safely extract plans data - handle different API response structures
    const plans = Array.isArray(plansData?.data?.data)
        ? plansData.data.data
        : Array.isArray(plansData?.data)
            ? plansData.data
            : []
    const totalPages = plansData?.data?.last_page || plansData?.last_page || 1
    const totalPlans = plansData?.data?.total || plansData?.total || 0

    const handleCreatePlan = (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData(e.target as HTMLFormElement)

        if (planType === 'votes') {
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
                status: formData.get('status') || 'active'
            }
            createVotePlanMutation.mutate(data)
        } else {
            const data = {
                name: formData.get('name'),
                description: formData.get('description'),
                price: parseFloat(formData.get('price') as string),
                duration_days: parseInt(formData.get('duration_days') as string),
                max_events: parseInt(formData.get('max_events') as string),
                max_attendees_per_event: parseInt(formData.get('max_attendees_per_event') as string),
                max_scan_locations: formData.get('max_scan_locations') ? parseInt(formData.get('max_scan_locations') as string) : null,
                max_scanners_per_location: formData.get('max_scanners_per_location') ? parseInt(formData.get('max_scanners_per_location') as string) : null,
                allow_multiple_entries: formData.get('allow_multiple_entries') === 'on',
                allow_scan_override: formData.get('allow_scan_override') === 'on',
                features: features.filter(f => f.trim() !== ''),
                scanner_features: scannerFeatures.filter(f => f.trim() !== ''),
                is_active: formData.get('is_active') !== 'off',
                is_popular: formData.get('is_popular') === 'on'
            }
            createEventPlanMutation.mutate(data)
        }
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

    const addScannerFeature = () => {
        setScannerFeatures([...scannerFeatures, ''])
    }

    const removeScannerFeature = (index: number) => {
        setScannerFeatures(scannerFeatures.filter((_, i) => i !== index))
    }

    const updateScannerFeature = (index: number, value: string) => {
        const newFeatures = [...scannerFeatures]
        newFeatures[index] = value
        setScannerFeatures(newFeatures)
    }

    const handleToggleStatus = (plan: any) => {
        if (planType === 'votes') {
            toggleVotePlanStatusMutation.mutate(plan.id)
        } else {
            toggleEventPlanStatusMutation.mutate(plan.id)
        }
    }

    const getPlanIcon = (plan: any) => {
        if (planType === 'votes') {
            const iconMap: { [key: string]: React.ReactNode } = {
                basic: <Package className="w-8 h-8 text-blue-500" />,
                standard: <Star className="w-8 h-8 text-green-500" />,
                premium: <Crown className="w-8 h-8 text-purple-500" />,
                enterprise: <Zap className="w-8 h-8 text-orange-500" />
            }
            return iconMap[plan.slug?.toLowerCase()] || <Package className="w-8 h-8 text-gray-500" />
        } else {
            return plan.is_popular ? <Star className="w-8 h-8 text-yellow-500" /> : <Calendar className="w-8 h-8 text-blue-500" />
        }
    }

    const getStatusBadge = (plan: any) => {
        const status = planType === 'votes' ? plan.status : (plan.is_active ? 'active' : 'inactive')
        return status === 'active' ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
            </span>
        ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <Clock className="w-3 h-3 mr-1" />
                Inactive
            </span>
        )
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
        }).format(amount)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Plans</h2>
                    <p className="text-gray-600 mb-4">Failed to load subscription plans</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-8xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                            <Package className="w-8 h-8 mr-3 text-blue-600" />
                            Subscription Plans
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Manage vote and event subscription plans for the platform
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setFeatures([''])
                            setScannerFeatures([''])
                            setShowCreateModal(true)
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create {planType === 'votes' ? 'Vote' : 'Event'} Plan
                    </button>
                </div>

                {/* Plan Type Toggle */}
                <div className="mt-6 flex items-center space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
                    <button
                        onClick={() => setPlanType('votes')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${planType === 'votes'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Vote className="w-4 h-4 inline mr-2" />
                        Vote Plans ({votePlansData?.total || 0})
                    </button>
                    <button
                        onClick={() => setPlanType('events')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${planType === 'events'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Event Plans ({eventPlansData?.total || 0})
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6 flex items-center justify-between">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={`Search ${planType} plans...`}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className="text-sm text-gray-600">
                    Total: {totalPlans} plans
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {plans.map((plan: any) => (
                    <div key={plan.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                        <div className="p-6">
                            {/* Plan Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    {getPlanIcon(plan)}
                                    <div className="ml-3">
                                        <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                                        <p className="text-sm text-gray-500">
                                            {planType === 'votes' ? plan.slug : `${plan.max_events} events`}
                                        </p>
                                    </div>
                                </div>
                                {getStatusBadge(plan)}
                            </div>

                            {/* Price */}
                            <div className="mb-4">
                                <div className="text-3xl font-bold text-gray-900">
                                    {formatCurrency(plan.price)}
                                </div>
                                <p className="text-sm text-gray-500">
                                    for {planType === 'votes' ? plan.duration : plan.duration_days} days
                                </p>
                            </div>

                            {/* Features */}
                            <div className="space-y-2 mb-6">
                                {planType === 'votes' ? (
                                    <>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Vote className="w-4 h-4 mr-2 text-blue-500" />
                                            {plan.votes} votes
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <UserCheck className="w-4 h-4 mr-2 text-green-500" />
                                            {plan.nominees} nominees
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Calendar className="w-4 h-4 mr-2 text-purple-500" />
                                            {plan.voting_times} voting times
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                                            {plan.max_events} events
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Users className="w-4 h-4 mr-2 text-green-500" />
                                            {plan.max_attendees_per_event?.toLocaleString()} attendees
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <MapPin className="w-4 h-4 mr-2 text-purple-500" />
                                            {plan.max_scan_locations || 'Unlimited'} scan locations
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Scan className="w-4 h-4 mr-2 text-orange-500" />
                                            {plan.max_scanners_per_location || 'Unlimited'} scanners
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Description */}
                            {plan.description && (
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                    {plan.description}
                                </p>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => {
                                            if (planType === 'votes') {
                                                setSelectedVotePlan(plan)
                                            } else {
                                                setSelectedEventPlan(plan)
                                            }
                                            setShowEditModal(true)
                                        }}
                                        className="text-blue-600 hover:text-blue-900"
                                        title="Edit Plan"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (planType === 'votes') {
                                                setSelectedVotePlan(plan)
                                            } else {
                                                setSelectedEventPlan(plan)
                                            }
                                            setShowDeleteModal(true)
                                        }}
                                        className="text-red-600 hover:text-red-900"
                                        title="Delete Plan"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Status Toggle */}
                                <button
                                    onClick={() => handleToggleStatus(plan)}
                                    className={`flex items-center ${(planType === 'votes' ? plan.status === 'active' : plan.is_active)
                                        ? 'text-green-600 hover:text-green-900'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                    title={`${(planType === 'votes' ? plan.status === 'active' : plan.is_active)
                                        ? 'Deactivate' : 'Activate'
                                        } Plan`}
                                    disabled={toggleVotePlanStatusMutation.isPending || toggleEventPlanStatusMutation.isPending}
                                >
                                    {(planType === 'votes' ? plan.status === 'active' : plan.is_active) ? (
                                        <ToggleRight className="w-6 h-6" />
                                    ) : (
                                        <ToggleLeft className="w-6 h-6" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {plans.length === 0 && (
                <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No plans found</h3>
                    <p className="text-gray-500 mb-4">
                        {searchQuery
                            ? 'Try adjusting your search to see more results.'
                            : `Get started by creating your first ${planType} subscription plan.`}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => {
                                setFeatures([''])
                                setScannerFeatures([''])
                                setShowCreateModal(true)
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Create {planType === 'votes' ? 'Vote' : 'Event'} Plan
                        </button>
                    )}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Previous
                        </button>

                        <span className="px-4 py-2 text-sm text-gray-700">
                            Page {currentPage} of {totalPages}
                        </span>

                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Create Plan Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Create {planType === 'votes' ? 'Vote' : 'Event'} Subscription Plan
                                </h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleCreatePlan} className="p-6 space-y-6">
                            {planType === 'votes' ? (
                                // Vote Plan Fields
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Plan Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="e.g., Basic Plan"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Slug *
                                            </label>
                                            <input
                                                type="text"
                                                name="slug"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="e.g., basic-plan"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Price (NGN) *
                                            </label>
                                            <input
                                                type="number"
                                                name="price"
                                                required
                                                min="0"
                                                step="0.01"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Duration (Days) *
                                            </label>
                                            <input
                                                type="number"
                                                name="duration"
                                                required
                                                min="1"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="30"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Votes *
                                            </label>
                                            <input
                                                type="number"
                                                name="votes"
                                                required
                                                min="0"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="100"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nominees *
                                            </label>
                                            <input
                                                type="number"
                                                name="nominees"
                                                required
                                                min="0"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="10"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Voting Times *
                                            </label>
                                            <input
                                                type="number"
                                                name="voting_times"
                                                required
                                                min="0"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="5"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Status
                                            </label>
                                            <select
                                                name="status"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Plan description..."
                                        />
                                    </div>
                                </>
                            ) : (
                                // Event Plan Fields
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Plan Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="e.g., Professional Plan"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Price (NGN) *
                                            </label>
                                            <input
                                                type="number"
                                                name="price"
                                                required
                                                min="0"
                                                step="0.01"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Duration (Days) *
                                            </label>
                                            <input
                                                type="number"
                                                name="duration_days"
                                                required
                                                min="1"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="30"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Max Events *
                                            </label>
                                            <input
                                                type="number"
                                                name="max_events"
                                                required
                                                min="1"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="10"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Max Attendees Per Event *
                                            </label>
                                            <input
                                                type="number"
                                                name="max_attendees_per_event"
                                                required
                                                min="1"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Max Scan Locations
                                            </label>
                                            <input
                                                type="number"
                                                name="max_scan_locations"
                                                min="1"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Leave empty for unlimited"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Max Scanners Per Location
                                            </label>
                                            <input
                                                type="number"
                                                name="max_scanners_per_location"
                                                min="1"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Leave empty for unlimited"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="allow_multiple_entries"
                                                id="allow_multiple_entries"
                                                defaultChecked
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="allow_multiple_entries" className="ml-2 text-sm text-gray-700">
                                                Allow Multiple Entries
                                            </label>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="allow_scan_override"
                                                id="allow_scan_override"
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="allow_scan_override" className="ml-2 text-sm text-gray-700">
                                                Allow Scan Override
                                            </label>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="is_active"
                                                id="is_active"
                                                defaultChecked
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                                                Active
                                            </label>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="is_popular"
                                                id="is_popular"
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="is_popular" className="ml-2 text-sm text-gray-700">
                                                Popular Plan
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Plan description..."
                                        />
                                    </div>

                                    {/* Scanner Features Section for Event Plans */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Scanner Features
                                        </label>
                                        <div className="space-y-2">
                                            {scannerFeatures.map((feature, index) => (
                                                <div key={index} className="flex items-center space-x-2">
                                                    <QrCode className="w-4 h-4 text-blue-500" />
                                                    <input
                                                        type="text"
                                                        value={feature}
                                                        onChange={(e) => updateScannerFeature(index, e.target.value)}
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="Scanner feature description..."
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeScannerFeature(index)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={addScannerFeature}
                                                className="text-blue-600 hover:text-blue-900 text-sm flex items-center"
                                            >
                                                <Plus className="w-4 h-4 mr-1" />
                                                Add Scanner Feature
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* General Features Section */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    General Features
                                </label>
                                <div className="space-y-2">
                                    {features.map((feature, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                            <input
                                                type="text"
                                                value={feature}
                                                onChange={(e) => updateFeature(index, e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Feature description..."
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeFeature(index)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addFeature}
                                        className="text-blue-600 hover:text-blue-900 text-sm flex items-center"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add Feature
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createVotePlanMutation.isPending || createEventPlanMutation.isPending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {(createVotePlanMutation.isPending || createEventPlanMutation.isPending) ? 'Creating...' : 'Create Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SuperAdminSubscriptionPlans 