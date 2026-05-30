import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
    Users,
    Search,
    Filter,
    Eye,
    Edit,
    Trash2,
    Plus,
    Download,
    RefreshCw,
    UserCheck,
    UserX,
    Shield,
    Mail,
    Phone,
    Calendar,
    MoreVertical
} from 'lucide-react'
import { superAdminApi } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { formatNaira, formatDate } from '../../utils/format'

interface ManagementUser {
    id: number
    account_id?: string
    first_name: string
    last_name: string
    email: string
    phone?: string
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | string
    balance: number
    created_at: string
    role: {
        id: number
        name: string
        display_name: string
    }
    subscription?: {
        plan: string
        status: string
        expires_at: string
    }
    bank_account?: {
        account_name: string
        account_number: string
        bank_name: string
    }
    last_login?: string
}

interface UsersResponse {
    data: ManagementUser[]
    current_page: number
    last_page: number
    per_page: number
    total: number
}

interface Role {
    id: number
    name: string
    display_name: string
}

const UsersManagement: React.FC = () => {
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedRole, setSelectedRole] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [showFilters, setShowFilters] = useState(false)
    const [isActionLoading, setIsActionLoading] = useState(false)

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingUser, setEditingUser] = useState<ManagementUser | null>(null)
    const [editForm, setEditForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role_id: '',
        status: ''
    })

    const { data: usersData, isLoading, refetch } = useQuery<UsersResponse>({
        queryKey: ['users', currentPage, searchTerm, selectedRole, selectedStatus],
        queryFn: () => superAdminApi.getUsers({
            page: currentPage,
            search: searchTerm,
            role: selectedRole,
            status: selectedStatus,
            per_page: 20
        }),
        keepPreviousData: true,
    })

    const { data: rolesData } = useQuery<{ data: Role[] }>({
        queryKey: ['roles'],
        queryFn: superAdminApi.getRoles,
    })

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)
        refetch()
    }

    const handleViewUser = (accountId: string) => {
        navigate(`/admin/users/${accountId}`)
    }

    const handleEditUser = (user: ManagementUser) => {
        setEditingUser(user)
        setEditForm({
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone: user.phone || '',
            role_id: user.role.id.toString(),
            status: user.status
        })
        setShowEditModal(true)
    }

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingUser) return

        try {
            setIsActionLoading(true)
            await superAdminApi.updateUser(editingUser.id, editForm)
            toast.success('User updated successfully')
            setShowEditModal(false)
            setEditingUser(null)
            refetch()
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update user')
        } finally {
            setIsActionLoading(false)
        }
    }

    const handleDeleteUser = async (userId: number) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                setIsActionLoading(true)
                await superAdminApi.deleteUser(userId)
                toast.success('User deleted successfully')
                refetch()
            } catch (error) {
                toast.error('Failed to delete user')
            } finally {
                setIsActionLoading(false)
            }
        }
    }

    const handleLoginAsUser = async (accountId: string) => {
        try {
            setIsActionLoading(true)
            const response = await superAdminApi.loginAsUser(accountId)

            if (response.status === 'success' && response.data) {
                // Clear current auth and set new token
                localStorage.removeItem('token')
                localStorage.removeItem('user')

                // Set new token and user
                if ('token' in response.data) {
                    localStorage.setItem('token', response.data.token as string)
                }
                localStorage.setItem('user', JSON.stringify(response.data.user))

                toast.success('Successfully logged in as user')

                // Redirect after a short delay
                setTimeout(() => {
                    window.location.href = response.data?.redirect_url || '/dashboard'
                }, 1000)
            }
        } catch (error: any) {
            console.error('Login as user error:', error)
            toast.error(error.response?.data?.message || 'Failed to login as user')
        } finally {
            setIsActionLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', icon: UserCheck },
            INACTIVE: { bg: 'bg-red-100', text: 'text-red-800', icon: UserX },
            PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: UserX },
        }

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
        const Icon = config.icon

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                <Icon className="w-3 h-3 mr-1" />
                {status}
            </span>
        )
    }

    const getRoleBadge = (role: ManagementUser['role']) => {
        const roleColors = {
            superadmin: 'bg-purple-100 text-purple-800',
            admin: 'bg-blue-100 text-blue-800',
            admin_vote: 'bg-green-100 text-green-800',
            admin_event: 'bg-orange-100 text-orange-800',
            admin_both: 'bg-indigo-100 text-indigo-800',
            user: 'bg-gray-100 text-gray-800',
        }

        const colorClass = roleColors[role?.name as keyof typeof roleColors] || roleColors.user

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                <Shield className="w-3 h-3 mr-1" />
                {role?.display_name || role?.name || 'User'}
            </span>
        )
    }

    return (
        <div className="space-y-6 p-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users Management</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage users and their permissions across all accounts</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => refetch()}
                        className="btn-secondary"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                    <button className="btn-secondary">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                    <button className="btn-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Add User
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="card-glass p-6">
                <form onSubmit={handleSearch} className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search users by name, email, or account ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className="btn-secondary"
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Filters
                        </button>
                        <button type="submit" className="btn-primary">
                            Search
                        </button>
                    </div>

                    {showFilters && (
                        <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-secondary-700">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Roles</option>
                                    {rolesData?.data?.map((role: Role) => (
                                        <option key={role.id} value={role.name}>
                                            {role.display_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                    <option value="PENDING">Pending</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedRole('')
                                        setSelectedStatus('')
                                        setSearchTerm('')
                                        setCurrentPage(1)
                                    }}
                                    className="btn-secondary w-full"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* Users Table */}
            <div className="card-glass overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-secondary-700">
                                <thead className="bg-gray-50 dark:bg-secondary-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Contact
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Balance
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Joined
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-secondary-900 divide-y divide-gray-200 dark:divide-secondary-700">
                                    {usersData?.data?.map((user: ManagementUser) => (
                                        <tr key={user.id} className="hover:bg-gray-50 dark:bg-secondary-800">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                                                            {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {user.first_name} {user.last_name}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            ID: {user.account_id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    <div className="flex items-center">
                                                        <Mail className="w-3 h-3 mr-1 text-gray-400" />
                                                        {user.email}
                                                    </div>
                                                    {user.phone && (
                                                        <div className="flex items-center mt-1">
                                                            <Phone className="w-3 h-3 mr-1 text-gray-400" />
                                                            {user.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getRoleBadge(user.role)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(user.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                ₦{Number(user.balance || 0).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleViewUser(user.account_id || '')}
                                                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditUser(user)}
                                                        className="text-gray-600 hover:text-gray-900 p-1 rounded"
                                                        title="Edit User"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleLoginAsUser(user.account_id || '')}
                                                        className="text-green-600 hover:text-green-900 p-1 rounded"
                                                        title="Login as User"
                                                    >
                                                        <Users className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="text-red-600 hover:text-red-900 p-1 rounded"
                                                        title="Delete User"
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

                        {/* Pagination */}
                        {usersData && usersData.last_page > 1 && (
                            <div className="bg-white dark:bg-secondary-900 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white dark:bg-secondary-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(Math.min(usersData.last_page, currentPage + 1))}
                                        disabled={currentPage === usersData.last_page}
                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white dark:bg-secondary-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            Showing{' '}
                                            <span className="font-medium">
                                                {(currentPage - 1) * usersData.per_page + 1}
                                            </span>{' '}
                                            to{' '}
                                            <span className="font-medium">
                                                {Math.min(currentPage * usersData.per_page, usersData.total)}
                                            </span>{' '}
                                            of{' '}
                                            <span className="font-medium">{usersData.total}</span>{' '}
                                            results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            <button
                                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white dark:bg-secondary-900 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>
                                            {Array.from({ length: Math.min(5, usersData.last_page) }, (_, i) => {
                                                const page = i + 1
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentPage(page)}
                                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page
                                                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                            : 'bg-white dark:bg-secondary-900 border-gray-300 text-gray-500 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {page}
                                                    </button>
                                                )
                                            })}
                                            <button
                                                onClick={() => setCurrentPage(Math.min(usersData.last_page, currentPage + 1))}
                                                disabled={currentPage === usersData.last_page}
                                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white dark:bg-secondary-900 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Next
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {usersData?.data?.length === 0 && (
                            <div className="text-center py-12">
                                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                                <p className="text-gray-500 mb-4">
                                    {searchTerm || selectedRole || selectedStatus
                                        ? 'Try adjusting your search criteria'
                                        : 'No users have been created yet'}
                                </p>
                                {!searchTerm && !selectedRole && !selectedStatus && (
                                    <button className="btn-primary">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add First User
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Edit User: {editingUser.first_name} {editingUser.last_name}
                            </h3>

                            <form onSubmit={handleUpdateUser} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.first_name}
                                            onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                            className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.last_name}
                                            onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                            className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Role
                                        </label>
                                        <select
                                            value={editForm.role_id}
                                            onChange={(e) => setEditForm({ ...editForm, role_id: e.target.value })}
                                            className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Role</option>
                                            {rolesData?.data?.map((role: Role) => (
                                                <option key={role.id} value={role.id.toString()}>
                                                    {role.display_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={editForm.status}
                                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                            className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Status</option>
                                            <option value="ACTIVE">Active</option>
                                            <option value="INACTIVE">Inactive</option>
                                            <option value="PENDING">Pending</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEditModal(false)
                                            setEditingUser(null)
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isActionLoading}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        {isActionLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default UsersManagement 