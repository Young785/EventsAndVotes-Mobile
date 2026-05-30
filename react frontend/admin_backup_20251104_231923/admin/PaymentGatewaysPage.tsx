import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
    Settings
} from 'lucide-react'
import AdminLayout from '../../components/AdminLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useAuditLogger } from '../../hooks/useAuditLogger'
import toast from 'react-hot-toast'

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
}

const PaymentGatewaysPage: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null)
    const [showSecrets, setShowSecrets] = useState<{ [key: number]: boolean }>({})

    const queryClient = useQueryClient()
    const { logUserAction, logButtonClick } = useAuditLogger({ context: 'PaymentGateways' })

    // Fetch payment gateways
    const { data: gatewaysData, isLoading, error } = useQuery({
        queryKey: ['payment-gateways', currentPage, searchQuery],
        queryFn: () => fetch(`/api/superadmin/payment-gateways?page=${currentPage}&search=${searchQuery}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        }).then(res => res.json()),
        refetchInterval: 30000
    })

    // Create gateway mutation
    const createGatewayMutation = useMutation({
        mutationFn: (data: any) => fetch('/api/superadmin/payment-gateways', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(res => res.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-gateways'] })
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
        mutationFn: ({ id, data }: { id: number, data: any }) => fetch(`/api/superadmin/payment-gateways/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(res => res.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-gateways'] })
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
        mutationFn: (id: number) => fetch(`/api/superadmin/payment-gateways/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        }).then(res => res.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-gateways'] })
            toast.success('Payment gateway deleted successfully')
            logUserAction('payment_gateway_deleted')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete payment gateway')
        }
    })

    // Toggle status mutation
    const toggleStatusMutation = useMutation({
        mutationFn: (id: number) => fetch(`/api/superadmin/payment-gateways/${id}/toggle-status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        }).then(res => res.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-gateways'] })
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
        if (window.confirm(`Are you sure you want to delete ${gateway.name}?`)) {
            deleteGatewayMutation.mutate(gateway.id)
        }
    }

    const handleToggleStatus = (gateway: PaymentGateway) => {
        toggleStatusMutation.mutate(gateway.id)
    }

    const toggleSecretVisibility = (gatewayId: number) => {
        setShowSecrets(prev => ({
            ...prev,
            [gatewayId]: !prev[gatewayId]
        }))
    }

    const gateways = gatewaysData?.data || []
    const pagination = gatewaysData ? {
        current_page: gatewaysData.current_page,
        last_page: gatewaysData.last_page,
        per_page: gatewaysData.per_page,
        total: gatewaysData.total
    } : null

    useEffect(() => {
        logUserAction('payment_gateways_viewed', { page: currentPage, search: searchQuery })
    }, [currentPage, searchQuery, logUserAction])

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <LoadingSpinner />
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Payment Gateways</h1>
                            <p className="text-gray-600 mt-1">
                                Manage payment gateway configurations and settings
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Gateway</span>
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search payment gateways..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Gateways Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Payment Gateways ({pagination?.total || 0})
                        </h2>
                    </div>

                    {error ? (
                        <div className="p-8 text-center text-red-500">
                            <CreditCard className="w-12 h-12 mx-auto mb-4" />
                            <p>Failed to load payment gateways</p>
                        </div>
                    ) : !gateways?.length ? (
                        <div className="text-center py-16">
                            <CreditCard className="w-24 h-24 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                No Payment Gateways
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Get started by adding your first payment gateway.
                            </p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                            >
                                Add Gateway
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Gateway Details
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Configuration
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {gateways.map((gateway: PaymentGateway) => (
                                        <tr key={gateway.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                            <CreditCard className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {gateway.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {gateway.slug} • {gateway.pg_id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center space-x-2">
                                                        <Key className="w-4 h-4 text-gray-400" />
                                                        <span className="text-xs text-gray-500">Key:</span>
                                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                            {gateway.key.substring(0, 20)}...
                                                        </code>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Key className="w-4 h-4 text-gray-400" />
                                                        <span className="text-xs text-gray-500">Secret:</span>
                                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                            {showSecrets[gateway.id]
                                                                ? gateway.secret
                                                                : '••••••••••••••••••••'
                                                            }
                                                        </code>
                                                        <button
                                                            onClick={() => toggleSecretVisibility(gateway.id)}
                                                            className="text-gray-400 hover:text-gray-600"
                                                        >
                                                            {showSecrets[gateway.id] ? (
                                                                <EyeOff className="w-4 h-4" />
                                                            ) : (
                                                                <Eye className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${gateway.status === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {gateway.status === 'active' ? (
                                                        <ToggleRight className="w-3 h-3 mr-1" />
                                                    ) : (
                                                        <ToggleLeft className="w-3 h-3 mr-1" />
                                                    )}
                                                    {gateway.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
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
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.last_page > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                                    {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                                    {pagination.total} results
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    })}
                                    <button
                                        onClick={() => setCurrentPage(Math.min(pagination.last_page, currentPage + 1))}
                                        disabled={currentPage === pagination.last_page}
                                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

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
                                        Public Key
                                    </label>
                                    <input
                                        type="text"
                                        name="key"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Public key"
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
                                        placeholder="Secret key"
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
                                        Public Key
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
            </div>
        </AdminLayout>
    )
}

export default PaymentGatewaysPage 