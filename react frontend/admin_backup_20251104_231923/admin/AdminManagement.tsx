import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Plus,
    Search,
    Filter,
    Eye,
    Edit,
    Trash2,
    Users,
    Shield,
    UserCheck,
    UserX,
    Download,
    Settings,
    Activity,
    AlertTriangle,
    Vote,
    TrendingUp,
    Calendar,
    DollarSign,
    LogIn,
    MoreVertical,
    RefreshCw
} from 'lucide-react';
import { superAdminApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { User } from '../../types';
import { getNomineeImageUrl } from '../../utils/imageUtils';

const AdminManagement: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Form state for editing user
    const [userForm, setUserForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'PENDING'
    });

    // Only superadmin can access this component
    const isSuperAdmin = user?.role?.name === 'superadmin';

    // Fetch management users
    const { data: usersData, isLoading, error } = useQuery({
        queryKey: ['superadmin-management', currentPage, searchTerm],
        queryFn: () => superAdminApi.getManagements({
            page: currentPage,
            search: searchTerm || undefined
        })
    });

    const users = usersData?.data || []
    const pagination = usersData || { total: 0, last_page: 1, per_page: 20, current_page: 1 }

    // Mock user data
    const mockUsers: User[] = [
        {
            id: 1,
            account_id: 'ACC001',
            first_name: 'John',
            last_name: 'Doe',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+2348123456789',
            role: {
                id: 2,
                name: 'admin_vote',
                display_name: 'Vote Admin'
            },
            verified: true,
            status: 'ACTIVE',
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T10:30:00Z'
        },
        {
            id: 2,
            account_id: 'ACC002',
            first_name: 'Jane',
            last_name: 'Smith',
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '+2348987654321',
            role: {
                id: 3,
                name: 'admin_event',
                display_name: 'Event Admin'
            },
            verified: true,
            status: 'ACTIVE',
            created_at: '2024-01-14T15:20:00Z',
            updated_at: '2024-01-14T15:20:00Z'
        },
        {
            id: 3,
            account_id: 'ACC003',
            first_name: 'Mike',
            last_name: 'Johnson',
            name: 'Mike Johnson',
            email: 'mike@example.com',
            phone: '+2348111222333',
            role: {
                id: 4,
                name: 'admin_both',
                display_name: 'Full Admin'
            },
            verified: false,
            status: 'PENDING',
            created_at: '2024-01-13T11:45:00Z',
            updated_at: '2024-01-13T11:45:00Z'
        }
    ];

    // Update user mutation
    const updateUserMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<User> }) =>
            superAdminApi.updateManagement(id, data),
        onSuccess: () => {
            toast.success('User updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['superadmin-management'] });
            setShowEditModal(false);
            setSelectedUser(null);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update user');
        }
    });

    // Delete user mutation
    const deleteUserMutation = useMutation({
        mutationFn: superAdminApi.deleteManagement,
        onSuccess: () => {
            toast.success('User deleted successfully!');
            queryClient.invalidateQueries({ queryKey: ['superadmin-management'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    });

    // Login as user mutation
    const loginAsUserMutation = useMutation({
        mutationFn: superAdminApi.loginAsUser,
        onSuccess: (response) => {
            toast.success('Login successful! Redirecting...');
            // Handle login response and redirect
            window.location.href = '/admin/dashboard';
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to login as user');
        }
    });

    const resetForm = () => {
        setUserForm({
            first_name: '',
            last_name: '',
            email: '',
            status: 'ACTIVE'
        });
    };

    const handleSearch = () => {
        setCurrentPage(1);
        queryClient.invalidateQueries({ queryKey: ['superadmin-management'] });
    };

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setUserForm({
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            status: user.status || 'ACTIVE'
        });
        setShowEditModal(true);
    };

    const handleUpdateUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedUser) {
            updateUserMutation.mutate({ id: selectedUser.id, data: userForm });
        }
    };

    const handleDeleteUser = (id: number) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            deleteUserMutation.mutate(id);
        }
    };

    const handleLoginAsUser = (accountId: string) => {
        if (window.confirm('Are you sure you want to login as this user?')) {
            loginAsUserMutation.mutate(accountId);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusColors = {
            'ACTIVE': 'bg-green-100 text-green-800',
            'INACTIVE': 'bg-red-100 text-red-800',
            'PENDING': 'bg-yellow-100 text-yellow-800'
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    const getRoleBadge = (roleName: string) => {
        const roleColors = {
            'admin_vote': 'bg-blue-100 text-blue-800',
            'admin_event': 'bg-purple-100 text-purple-800',
            'admin_both': 'bg-green-100 text-green-800',
            'superadmin': 'bg-red-100 text-red-800'
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[roleName as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}`}>
                {roleName.replace('_', ' ')}
            </span>
        );
    };

    const displayUsers = users.length > 0 ? users : mockUsers;

    if (!isSuperAdmin) {
        return (
            <AdminLayout>
                <div className="p-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
                        <p className="text-red-600">You don't have permission to access this section. Only Super Administrators can manage users.</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner />
                </div>
            </AdminLayout>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <nav className="text-sm text-gray-500 mb-2">
                    <Link to="/admin/dashboard" className="hover:text-gray-700">Home</Link>
                    <span className="mx-2">•</span>
                    <span className="text-gray-900">Management</span>
                </nav>
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">System Management</h1>
                    <div className="flex space-x-3">
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2">
                            <Download className="w-4 h-4" />
                            <span>Export Users</span>
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2">
                            <Plus className="w-4 h-4" />
                            <span>Add User</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setCurrentPage(1)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${currentPage === 1
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Users className="w-5 h-5 inline mr-2" />
                            Users Management
                        </button>
                        <button
                            onClick={() => setCurrentPage(1)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${currentPage === 1
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Activity className="w-5 h-5 inline mr-2" />
                            Elections Management
                        </button>
                        <button
                            onClick={() => setCurrentPage(1)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${currentPage === 1
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Settings className="w-5 h-5 inline mr-2" />
                            System Settings
                        </button>
                    </nav>
                </div>
            </div>

            {/* Users Management Tab */}
            {currentPage === 1 && (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">1,247</h3>
                                    <p className="text-gray-600 font-medium">Total Users</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Users className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">1,189</h3>
                                    <p className="text-gray-600 font-medium">Active Users</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <UserCheck className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">45</h3>
                                    <p className="text-gray-600 font-medium">Suspended Users</p>
                                </div>
                                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                    <UserX className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">13</h3>
                                    <p className="text-gray-600 font-medium">Pending Verification</p>
                                </div>
                                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-yellow-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleSearch}
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                                >
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Account ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {displayUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0">
                                                        <img
                                                            className="h-10 w-10 rounded-full object-cover"
                                                            src={getNomineeImageUrl({ image: user.image }) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name + ' ' + user.last_name)}&background=6366f1&color=ffffff`}
                                                            alt={user.first_name}
                                                        />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {user.first_name} {user.last_name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {user.account_id}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getRoleBadge(user.role.name)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(user.status || 'ACTIVE')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditUser(user)}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleLoginAsUser(user.account_id!)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Login as User"
                                                    >
                                                        <LogIn className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <button className="text-gray-400 hover:text-gray-600">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.last_page > 1 && (
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(Math.min(pagination.last_page, currentPage + 1))}
                                        disabled={currentPage === pagination.last_page}
                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing{' '}
                                            <span className="font-medium">{((currentPage - 1) * pagination.per_page) + 1}</span>
                                            {' '}to{' '}
                                            <span className="font-medium">
                                                {Math.min(currentPage * pagination.per_page, pagination.total)}
                                            </span>
                                            {' '}of{' '}
                                            <span className="font-medium">{pagination.total}</span>
                                            {' '}results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                            <button
                                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Previous
                                            </button>
                                            {[...Array(Math.min(5, pagination.last_page))].map((_, i) => {
                                                const page = i + 1;
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentPage(page)}
                                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page
                                                            ? 'z-10 bg-primary border-primary text-white'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            })}
                                            <button
                                                onClick={() => setCurrentPage(Math.min(pagination.last_page, currentPage + 1))}
                                                disabled={currentPage === pagination.last_page}
                                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Next
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Edit User Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h2>
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    value={userForm.first_name}
                                    onChange={(e) => setUserForm(prev => ({ ...prev, first_name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    value={userForm.last_name}
                                    onChange={(e) => setUserForm(prev => ({ ...prev, last_name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={userForm.email}
                                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={userForm.status}
                                    onChange={(e) => setUserForm(prev => ({ ...prev, status: e.target.value as 'ACTIVE' | 'INACTIVE' | 'PENDING' }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                    <option value="PENDING">Pending</option>
                                </select>
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedUser(null);
                                        resetForm();
                                    }}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateUserMutation.isPending}
                                    className="flex-1 px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50"
                                >
                                    Update User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManagement; 