import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Eye,
    UserCheck,
    Users,
    Crown,
    Shield,
    ChevronLeft,
    ChevronRight,
    Filter,
    X,
    Check,
    AlertTriangle,
    LogIn,
    ArrowLeftRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi, superAdminApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AdminLayout from '../../components/AdminLayout';
import { extractErrorMessage, showErrorToast } from '../../utils/errorUtils';
import { getNomineeImageUrl } from '../../utils/imageUtils';

const AdminUserManagement: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // State management
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        role_id: 1,
        status: 'active'
    });

    // Check permissions
    const userRole = user?.role?.name || '';
    const isSuperAdmin = userRole === 'superadmin';
    const isAdmin = ['admin', 'admin_vote', 'admin_both'].includes(userRole);
    const canManageUsers = isSuperAdmin || isAdmin;

    if (!canManageUsers) {
        return (
            <AdminLayout>
                <div className="p-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <div>
                                <p className="text-red-800 font-medium">Access Denied</p>
                                <p className="text-red-700 text-sm">You don't have permission to manage users.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    // Fetch users
    const { data: usersData, isLoading: usersLoading } = useQuery({
        queryKey: ['admin-users', currentPage, searchTerm, roleFilter, statusFilter],
        queryFn: () => {
            const api = isSuperAdmin ? superAdminApi : adminApi;
            return api.getUsers({
                page: currentPage,
                search: searchTerm || undefined,
                role: roleFilter || undefined,
                status: statusFilter || undefined,
                per_page: 20
            });
        },
        enabled: canManageUsers
    });

    // Fetch roles
    const { data: rolesData } = useQuery({
        queryKey: ['admin-roles'],
        queryFn: () => {
            const api = isSuperAdmin ? superAdminApi : adminApi;
            return api.getRoles();
        },
        enabled: canManageUsers
    });

    // Create user mutation
    const createUserMutation = useMutation({
        mutationFn: (data: any) => {
            const api = isSuperAdmin ? superAdminApi : adminApi;
            return api.createUser(data);
        },
        onSuccess: () => {
            toast.success('User created successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            setShowCreateModal(false);
            resetForm();
        },
        onError: (error: any) => {
            showErrorToast(error);
        }
    });

    // Update user mutation
    const updateUserMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => {
            const api = isSuperAdmin ? superAdminApi : adminApi;
            return api.updateUser(id, data);
        },
        onSuccess: () => {
            toast.success('User updated successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            setShowEditModal(false);
            resetForm();
        },
        onError: (error: any) => {
            showErrorToast(error);
        }
    });

    // Delete user mutation
    const deleteUserMutation = useMutation({
        mutationFn: (id: number) => {
            const api = isSuperAdmin ? superAdminApi : adminApi;
            return api.deleteUser(id);
        },
        onSuccess: () => {
            toast.success('User deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            setShowDeleteModal(false);
            setSelectedUser(null);
        },
        onError: (error: any) => {
            showErrorToast(error);
        }
    });

    // Login as user mutation (SuperAdmin only)
    const loginAsUserMutation = useMutation({
        mutationFn: (accountId: string) => {
            const api = isSuperAdmin ? superAdminApi : adminApi;
            return api.loginAsUser(accountId);
        },
        onSuccess: (data) => {
            if (data?.data?.user) {
                toast.success(`Successfully logged in as ${data.data.user.first_name} ${data.data.user.last_name}`);
                // Redirect to user dashboard
                window.location.href = data.data.redirect_url;
            }
        },
        onError: (error: any) => {
            showErrorToast(error);
        }
    });

    const resetForm = () => {
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            password: '',
            password_confirmation: '',
            role_id: 1,
            status: 'active'
        });
        setSelectedUser(null);
    };

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        createUserMutation.mutate(formData);
    };

    const handleUpdateUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedUser) {
            const updateData: any = { ...formData };
            if (!updateData.password) {
                delete updateData.password;
                delete updateData.password_confirmation;
            }
            updateUserMutation.mutate({
                id: selectedUser.id,
                data: updateData
            });
        }
    };

    const handleDeleteUser = () => {
        if (selectedUser) {
            deleteUserMutation.mutate(selectedUser.id);
        }
    };

    const openEditModal = (editUser: any) => {
        setSelectedUser(editUser);
        setFormData({
            first_name: editUser.first_name,
            last_name: editUser.last_name,
            email: editUser.email,
            phone: editUser.phone || '',
            password: '',
            password_confirmation: '',
            role_id: editUser.role.id,
            status: editUser.status || 'active'
        });
        setShowEditModal(true);
    };

    const openDeleteModal = (deleteUser: any) => {
        setSelectedUser(deleteUser);
        setShowDeleteModal(true);
    };

    const handleLoginAsUser = (userToLogin: any) => {
        if (isSuperAdmin && userToLogin.account_id) {
            loginAsUserMutation.mutate(userToLogin.account_id);
        }
    };

    const getRoleIcon = (roleName: string) => {
        switch (roleName) {
            case 'superadmin':
                return <Crown className="w-4 h-4 text-yellow-600" />;
            case 'admin':
            case 'admin_vote':
            case 'admin_event':
            case 'admin_both':
                return <Shield className="w-4 h-4 text-blue-600" />;
            default:
                return <Users className="w-4 h-4 text-gray-600" />;
        }
    };

    const getRoleColor = (roleName: string) => {
        switch (roleName) {
            case 'superadmin':
                return 'bg-yellow-100 text-yellow-800';
            case 'admin':
            case 'admin_vote':
            case 'admin_event':
            case 'admin_both':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                        <p className="text-gray-600 mt-1">
                            Manage users and their permissions
                            {isSuperAdmin ? ' across all accounts' : ' in your organization'}
                        </p>
                    </div>
                    {(isSuperAdmin || isAdmin) && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add User</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex flex-col md:flex-row gap-4 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                            />
                        </div>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Roles</option>
                            {rolesData?.data?.map((role: any) => (
                                <option key={role.id} value={role.name}>
                                    {role.display_name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                    <div className="text-sm text-gray-600">
                        Total: {usersData?.total || 0} users
                    </div>
                </div>
            </div>

            {/* Content */}
            {usersLoading ? (
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner />
                </div>
            ) : (
                <>
                    {/* Users Table - Desktop */}
                    <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Last Login
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {usersData?.data.map((userData: any) => (
                                        <tr key={userData.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                                        {userData.image ? (
                                                            <img
                                                                src={getNomineeImageUrl({ image: userData.image }) || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.first_name + ' ' + userData.last_name)}&background=6366f1&color=ffffff`}
                                                                alt={`${userData.first_name} ${userData.last_name}`}
                                                                className="w-10 h-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-gray-600 font-medium">
                                                                {userData.first_name[0]}{userData.last_name[0]}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {userData.first_name} {userData.last_name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {userData.email}
                                                        </div>
                                                        {userData.phone && (
                                                            <div className="text-sm text-gray-500">
                                                                {userData.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    {getRoleIcon(userData.role.name)}
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(userData.role.name)}`}>
                                                        {userData.role.display_name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${userData.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : userData.status === 'suspended'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {userData.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {userData.last_login ?
                                                    new Date(userData.last_login).toLocaleDateString() :
                                                    'Never'
                                                }
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(userData.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-2">
                                                    {isSuperAdmin && userData.role.name !== 'superadmin' && (
                                                        <button
                                                            onClick={() => handleLoginAsUser(userData)}
                                                            className="text-green-600 hover:text-green-900 p-1"
                                                            title="Login as User"
                                                            disabled={loginAsUserMutation.isPending}
                                                        >
                                                            <LogIn className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => openEditModal(userData)}
                                                        className="text-blue-600 hover:text-blue-900 p-1"
                                                        title="Edit User"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteModal(userData)}
                                                        className="text-red-600 hover:text-red-900 p-1"
                                                        title="Delete User"
                                                        disabled={userData.id === user?.id}
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
                    </div>

                    {/* Users Cards - Mobile */}
                    <div className="lg:hidden space-y-4">
                        {usersData?.data.map((userData: any) => (
                            <div key={userData.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                <div className="flex items-start space-x-3">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        {userData.image ? (
                                            <img
                                                src={getNomineeImageUrl({ image: userData.image }) || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.first_name + ' ' + userData.last_name)}&background=6366f1&color=ffffff`}
                                                alt={`${userData.first_name} ${userData.last_name}`}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-gray-600 font-medium text-sm">
                                                {userData.first_name[0]}{userData.last_name[0]}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                                    {userData.first_name} {userData.last_name}
                                                </h3>
                                                <p className="text-sm text-gray-500 truncate">{userData.email}</p>
                                                {userData.phone && (
                                                    <p className="text-sm text-gray-500 truncate">{userData.phone}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-1 ml-2">
                                                {isSuperAdmin && userData.role.name !== 'superadmin' && (
                                                    <button
                                                        onClick={() => handleLoginAsUser(userData)}
                                                        className="text-green-600 hover:text-green-900 p-1.5 rounded-lg hover:bg-green-50"
                                                        title="Login as User"
                                                        disabled={loginAsUserMutation.isPending}
                                                    >
                                                        <LogIn className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openEditModal(userData)}
                                                    className="text-blue-600 hover:text-blue-900 p-1.5 rounded-lg hover:bg-blue-50"
                                                    title="Edit User"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(userData)}
                                                    className="text-red-600 hover:text-red-900 p-1.5 rounded-lg hover:bg-red-50"
                                                    title="Delete User"
                                                    disabled={userData.id === user?.id}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <div className="flex items-center space-x-1">
                                                {getRoleIcon(userData.role.name)}
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(userData.role.name)}`}>
                                                    {userData.role.display_name}
                                                </span>
                                            </div>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${userData.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : userData.status === 'suspended'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {userData.status}
                                            </span>
                                        </div>

                                        <div className="mt-2 text-xs text-gray-500 space-y-1">
                                            <div>
                                                Last login: {userData.last_login ? new Date(userData.last_login).toLocaleDateString() : 'Never'}
                                            </div>
                                            <div>
                                                Created: {new Date(userData.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {usersData && usersData.last_page > 1 && (
                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                            <div className="text-sm text-gray-700">
                                Showing {((usersData.current_page - 1) * usersData.per_page) + 1} to{' '}
                                {Math.min(usersData.current_page * usersData.per_page, usersData.total)} of{' '}
                                {usersData.total} results
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm text-gray-700 px-2">
                                    Page {currentPage} of {usersData.last_page}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === usersData.last_page}
                                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Create New User</h3>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    resetForm();
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser}>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone (Optional)
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                            minLength={8}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Confirm Password
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.password_confirmation}
                                            onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                            minLength={8}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Role
                                        </label>
                                        <select
                                            value={formData.role_id}
                                            onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            {rolesData?.data?.map((role: any) => (
                                                <option key={role.id} value={role.id}>
                                                    {role.display_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="suspended">Suspended</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createUserMutation.isPending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Edit User</h3>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    resetForm();
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateUser}>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone (Optional)
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            New Password (Optional)
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            minLength={8}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Confirm Password
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.password_confirmation}
                                            onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            minLength={8}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Role
                                        </label>
                                        <select
                                            value={formData.role_id}
                                            onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            {rolesData?.data?.map((role: any) => (
                                                <option key={role.id} value={role.id}>
                                                    {role.display_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="suspended">Suspended</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateUserMutation.isPending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Confirm Deletion</h3>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-600">
                                Are you sure you want to delete this user? This action cannot be undone.
                            </p>
                            {selectedUser && selectedUser.id === user?.id && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-800 text-sm">
                                        Warning: You cannot delete your own account.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                disabled={deleteUserMutation.isPending || selectedUser?.id === user?.id}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUserManagement; 