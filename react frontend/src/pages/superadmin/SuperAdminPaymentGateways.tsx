import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
    CreditCard,
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Eye,
    EyeOff,
    Key,
    Settings,
    Shield,
    AlertTriangle,
    CheckCircle,
    XCircle,
    RefreshCw,
    Download,
    Upload,
    Globe,
    Lock,
    Unlock,
    Copy,
    Check,
    X,
    Info,
    Zap,
    Activity,
    TrendingUp,
    DollarSign,
    BarChart3,
    ExternalLink
} from 'lucide-react'
import AdminLayout from '../../components/AdminLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useAuditLogger } from '../../hooks/useAuditLogger'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface PaymentGateway {
    id: number
    name: string
    slug: string
    key: string
    secret: string
    pg_id: string
    status: 'active' | 'inactive'
    created_at: string
    updated_at: string
    stats?: {
        total_transactions: number
        total_revenue: number
        total_pending: number
        vote_transactions: {
            total_count: number
            paid_count: number
            total_amount: number
            pending_amount: number
        }
        subscription_transactions: {
            total_count: number
            paid_count: number
            total_amount: number
            pending_amount: number
        }
    }
}

const SuperAdminPaymentGateways: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null)
    const [showSecrets, setShowSecrets] = useState<{ [key: number]: boolean }>({})
    const [copiedField, setCopiedField] = useState<string | null>(null)

    const queryClient = useQueryClient()
    const { logUserAction, logButtonClick } = useAuditLogger({ context: 'SuperAdminPaymentGateways' })
    const { user } = useAuth()
    const navigate = useNavigate()

    // Check if user has superadmin access
    const hasAccess = user?.role?.name === 'superadmin'

    if (!hasAccess) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                        <p className="text-gray-600">This page is only accessible to SuperAdmin users.</p>
                    </div>
                </div>
            </AdminLayout>
        )
    }

    // Fetch payment gateways
    const { data: gatewaysData, isLoading, error, refetch } = useQuery({
        queryKey: ['superadmin-payment-gateways', currentPage, searchQuery, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams()
            params.append('page', currentPage.toString())
            params.append('per_page', '15')
            if (searchQuery) params.append('search', searchQuery)
            if (statusFilter) params.append('status', statusFilter)

            const response = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/payment-gateways?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch payment gateways')
            }

            return response.json()
        },
        refetchInterval: 30000
    })

    // Create gateway mutation
    const createGatewayMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/payment-gateways`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to create payment gateway')
            }

            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin-payment-gateways'] })
            setShowCreateModal(false)
            toast.success('Payment gateway created successfully')
            logUserAction('payment_gateway_created')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create payment gateway')
        }
    })

    // Update gateway mutation
    const updateGatewayMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number, data: any }) => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/payment-gateways/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to update payment gateway')
            }

            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin-payment-gateways'] })
            setShowEditModal(false)
            setSelectedGateway(null)
            toast.success('Payment gateway updated successfully')
            logUserAction('payment_gateway_updated')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update payment gateway')
        }
    })

    // Delete gateway mutation
    const deleteGatewayMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/payment-gateways/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to delete payment gateway')
            }

            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin-payment-gateways'] })
            setShowDeleteModal(false)
            setSelectedGateway(null)
            toast.success('Payment gateway deleted successfully')
            logUserAction('payment_gateway_deleted')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete payment gateway')
        }
    })

    // Toggle status mutation
    const toggleStatusMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/superadmin/payment-gateways/${id}/toggle-status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to update status')
            }

            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin-payment-gateways'] })
            toast.success('Payment gateway status updated')
            logUserAction('payment_gateway_status_toggled')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update status')
        }
    })

    const handleCreateGateway = (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData(e.target as HTMLFormElement)
        const data = {
            name: formData.get('name'),
            slug: formData.get('slug'),
            key: formData.get('key'),
            secret: formData.get('secret'),
            status: formData.get('status') || 'active'
        }
        createGatewayMutation.mutate(data)
    }

    const handleUpdateGateway = (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedGateway) return

        const formData = new FormData(e.target as HTMLFormElement)
        const data = {
            name: formData.get('name'),
            slug: formData.get('slug'),
            key: formData.get('key'),
            secret: formData.get('secret'),
            status: formData.get('status')
        }
        updateGatewayMutation.mutate({ id: selectedGateway.id, data })
    }

    const handleDeleteGateway = (gateway: PaymentGateway) => {
        setSelectedGateway(gateway)
        setShowDeleteModal(true)
        logButtonClick('delete_payment_gateway_modal', `gateway_${gateway.pg_id}`)
    }

    const confirmDelete = () => {
        if (selectedGateway) {
            deleteGatewayMutation.mutate(selectedGateway.id)
        }
    }

    const handleToggleStatus = (gateway: PaymentGateway) => {
        toggleStatusMutation.mutate(gateway.id)
        logButtonClick('toggle_payment_gateway_status', `gateway_${gateway.pg_id}`)
    }

    const toggleSecretVisibility = (gatewayId: number) => {
        setShowSecrets(prev => ({
            ...prev,
            [gatewayId]: !prev[gatewayId]
        }))
        logButtonClick('toggle_secret_visibility', `gateway_${gatewayId}`)
    }

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedField(field)
            toast.success(`${field} copied to clipboard`)
            setTimeout(() => setCopiedField(null), 2000)
            logButtonClick('copy_gateway_credential', field)
        } catch (error) {
            toast.error('Failed to copy to clipboard')
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)
        refetch()
        logUserAction('payment_gateways_search', { query: searchQuery })
    }

    const getStatusBadge = (status: string) => {
        return status === 'active' ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
            </span>
        ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <XCircle className="w-3 h-3 mr-1" />
                Inactive
            </span>
        )
    }

    const handleViewTransactions = (gateway: PaymentGateway) => {
        navigate(`/superadmin/payment-gateways/${gateway.id}/transactions`)
        logButtonClick('view_gateway_transactions', `gateway_${gateway.pg_id}`)
    }

    const gateways = gatewaysData?.data || []
    const totalPages = gatewaysData?.last_page || 1
    const totalGateways = gatewaysData?.total || 0

    // Calculate summary stats
    const activeGateways = gateways.filter((g: PaymentGateway) => g.status === 'active').length
    const inactiveGateways = gateways.filter((g: PaymentGateway) => g.status === 'inactive').length

    useEffect(() => {
        logUserAction('payment_gateways_viewed', { page: currentPage, search: searchQuery })
    }, [currentPage, searchQuery, logUserAction])

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Payment Gateways</h2>
                    <p className="text-gray-600 mb-4">Failed to load payment gateways</p>
                    <button
                        onClick={() => refetch()}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                        Try Again
                    </button>
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
                            <CreditCard className="w-8 h-8 mr-3 text-blue-600" />
                            Payment Gateways
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Manage payment gateway configurations and API credentials
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => refetch()}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Gateway
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <CreditCard className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Gateways</p>
                            <p className="text-2xl font-bold text-gray-900">{totalGateways}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Active Gateways</p>
                            <p className="text-2xl font-bold text-gray-900">{activeGateways}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Inactive Gateways</p>
                            <p className="text-2xl font-bold text-gray-900">{inactiveGateways}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <form onSubmit={handleSearch} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Search
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name or slug..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                Apply Filters
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('')
                                    setStatusFilter('')
                                    setCurrentPage(1)
                                    refetch()
                                }}
                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
                            >
                                Clear Filters
                            </button>
                        </div>
                        <div className="text-sm text-gray-600">
                            Showing {gateways.length} of {totalGateways} gateways
                        </div>
                    </div>
                </form>
            </div>

            {/* Gateways Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {gateways.map((gateway: PaymentGateway) => (
                    <div key={gateway.id} className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <CreditCard className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{gateway.name}</h3>
                                    <p className="text-sm text-gray-500">{gateway.slug}</p>
                                </div>
                            </div>
                            {getStatusBadge(gateway.status)}
                        </div>

                        <div className="space-y-3 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Gateway ID</label>
                                <div className="flex items-center space-x-2">
                                    <code className="text-sm bg-gray-100 px-2 py-1 rounded flex-1">{gateway.pg_id}</code>
                                    <button
                                        onClick={() => copyToClipboard(gateway.pg_id, 'Gateway ID')}
                                        className="p-1 text-gray-400 hover:text-gray-600"
                                    >
                                        {copiedField === 'Gateway ID' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">API Key</label>
                                <div className="flex items-center space-x-2">
                                    <code className="text-sm bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                                        {showSecrets[gateway.id] ? gateway.key : '••••••••••••••••'}
                                    </code>
                                    <button
                                        onClick={() => toggleSecretVisibility(gateway.id)}
                                        className="p-1 text-gray-400 hover:text-gray-600"
                                    >
                                        {showSecrets[gateway.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => copyToClipboard(gateway.key, 'API Key')}
                                        className="p-1 text-gray-400 hover:text-gray-600"
                                    >
                                        {copiedField === 'API Key' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Secret Key</label>
                                <div className="flex items-center space-x-2">
                                    <code className="text-sm bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                                        {showSecrets[gateway.id] ? gateway.secret : '••••••••••••••••'}
                                    </code>
                                    <button
                                        onClick={() => toggleSecretVisibility(gateway.id)}
                                        className="p-1 text-gray-400 hover:text-gray-600"
                                    >
                                        {showSecrets[gateway.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => copyToClipboard(gateway.secret, 'Secret Key')}
                                        className="p-1 text-gray-400 hover:text-gray-600"
                                    >
                                        {copiedField === 'Secret Key' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-gray-500 mb-4">
                            Created: {format(new Date(gateway.created_at), 'MMM dd, yyyy HH:mm')}
                        </div>

                        {/* Transaction Stats */}
                        {gateway.stats && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    Transaction Statistics
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-blue-600">
                                            {gateway.stats.total_transactions}
                                        </div>
                                        <div className="text-xs text-gray-500">Total Transactions</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-green-600">
                                            ₦{gateway.stats.total_revenue.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-gray-500">Total Revenue</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200">
                                    <div className="text-center">
                                        <div className="text-sm font-medium text-blue-600">
                                            {gateway.stats.vote_transactions.total_count}
                                        </div>
                                        <div className="text-xs text-gray-500">Voting</div>
                                        <div className="text-xs text-green-600">
                                            ₦{gateway.stats.vote_transactions.total_amount.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm font-medium text-purple-600">
                                            {gateway.stats.subscription_transactions.total_count}
                                        </div>
                                        <div className="text-xs text-gray-500">Subscriptions</div>
                                        <div className="text-xs text-green-600">
                                            ₦{gateway.stats.subscription_transactions.total_amount.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                {gateway.stats.total_pending > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-200 text-center">
                                        <div className="text-sm font-medium text-orange-600">
                                            ₦{gateway.stats.total_pending.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-gray-500">Pending Amount</div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handleViewTransactions(gateway)}
                                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center text-sm"
                                    title="View Transactions"
                                >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    Transactions
                                </button>
                                <button
                                    onClick={() => handleToggleStatus(gateway)}
                                    className={`p-2 rounded-lg transition-colors duration-200 ${gateway.status === 'active'
                                        ? 'text-red-600 hover:bg-red-50'
                                        : 'text-green-600 hover:bg-green-50'
                                        }`}
                                    title={gateway.status === 'active' ? 'Deactivate' : 'Activate'}
                                >
                                    {gateway.status === 'active' ? (
                                        <ToggleLeft className="w-4 h-4" />
                                    ) : (
                                        <ToggleRight className="w-4 h-4" />
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedGateway(gateway)
                                        setShowEditModal(true)
                                    }}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                    title="Edit"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteGateway(gateway)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <Activity className="w-3 h-3" />
                                <span>Last updated: {format(new Date(gateway.updated_at), 'MMM dd')}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {gateways.length === 0 && (
                <div className="text-center py-16">
                    <CreditCard className="w-24 h-24 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No Payment Gateways
                    </h3>
                    <p className="text-gray-600 mb-4">
                        {searchQuery || statusFilter
                            ? 'No gateways match your current filters.'
                            : 'Get started by adding your first payment gateway.'}
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                        Add Payment Gateway
                    </button>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-700">
                        <span>
                            Showing page {currentPage} of {totalPages}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            ←
                        </button>

                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`px-3 py-2 border rounded-lg ${currentPage === pageNum
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            )
                        })}

                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            →
                        </button>
                    </div>
                </div>
            )}

            {/* Create Gateway Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Add Payment Gateway
                            </h3>
                        </div>
                        <form onSubmit={handleCreateGateway} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Gateway Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Paystack"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Slug
                                </label>
                                <input
                                    type="text"
                                    name="slug"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., paystack"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    API Key
                                </label>
                                <input
                                    type="text"
                                    name="key"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Public API key"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Secret Key
                                </label>
                                <input
                                    type="password"
                                    name="secret"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Secret API key"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createGatewayMutation.isPending}
                                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    {createGatewayMutation.isPending ? 'Creating...' : 'Create Gateway'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Gateway Modal */}
            {showEditModal && selectedGateway && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Edit Payment Gateway
                            </h3>
                        </div>
                        <form onSubmit={handleUpdateGateway} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Gateway Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    defaultValue={selectedGateway.name}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Slug
                                </label>
                                <input
                                    type="text"
                                    name="slug"
                                    defaultValue={selectedGateway.slug}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    API Key
                                </label>
                                <input
                                    type="text"
                                    name="key"
                                    defaultValue={selectedGateway.key}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Secret Key
                                </label>
                                <input
                                    type="password"
                                    name="secret"
                                    defaultValue={selectedGateway.secret}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    defaultValue={selectedGateway.status}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false)
                                        setSelectedGateway(null)
                                    }}
                                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateGatewayMutation.isPending}
                                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    {updateGatewayMutation.isPending ? 'Updating...' : 'Update Gateway'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedGateway && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className="flex-shrink-0">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Delete Payment Gateway
                                    </h3>
                                </div>
                            </div>
                            <div className="mb-4">
                                <p className="text-sm text-gray-500">
                                    Are you sure you want to delete this payment gateway? This action cannot be undone and may affect existing transactions.
                                </p>
                                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-900">
                                        Gateway: {selectedGateway.name}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        ID: {selectedGateway.pg_id}
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={deleteGatewayMutation.isPending}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {deleteGatewayMutation.isPending ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SuperAdminPaymentGateways 