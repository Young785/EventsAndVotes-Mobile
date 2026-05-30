import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Building,
    CreditCard,
    Check,
    X,
    MoreVertical
} from 'lucide-react';
import { superAdminApi } from '../../services/api';
import { BankAccount } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

interface Bank {
    id: number;
    name: string;
    code: string;
    logo?: string;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
}

const AdminBanks: React.FC = () => {
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedBank, setSelectedBank] = useState<Bank | null>(null);

    // Form state
    const [bankForm, setBankForm] = useState({
        bank_name: '',
        bank_code: '',
        verified: true
    });

    // Fetch banks
    const { data: banksData, isLoading, error } = useQuery({
        queryKey: ['superadmin-banks', currentPage, searchTerm, statusFilter],
        queryFn: () => superAdminApi.getBanks({
            page: currentPage,
            search: searchTerm || undefined
        })
    });

    const banks = banksData?.data || []
    const pagination = banksData || { total: 0, last_page: 1, per_page: 20, current_page: 1 }

    // Mock bank data
    const mockBanks: Bank[] = [
        {
            id: 1,
            name: 'First Bank of Nigeria',
            code: '011',
            status: 'active',
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T10:30:00Z'
        },
        {
            id: 2,
            name: 'Guaranty Trust Bank',
            code: '058',
            status: 'active',
            created_at: '2024-01-14T15:20:00Z',
            updated_at: '2024-01-14T15:20:00Z'
        },
        {
            id: 3,
            name: 'Access Bank',
            code: '044',
            status: 'active',
            created_at: '2024-01-13T11:45:00Z',
            updated_at: '2024-01-13T11:45:00Z'
        },
        {
            id: 4,
            name: 'United Bank for Africa',
            code: '033',
            status: 'inactive',
            created_at: '2024-01-12T09:15:00Z',
            updated_at: '2024-01-12T09:15:00Z'
        }
    ];

    // Create bank mutation
    const createBankMutation = useMutation({
        mutationFn: (data: Partial<BankAccount>) =>
            superAdminApi.createBank(data),
        onSuccess: () => {
            toast.success('Bank created successfully!');
            queryClient.invalidateQueries({ queryKey: ['superadmin-banks'] });
            setShowCreateModal(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create bank');
        }
    });

    // Update bank mutation
    const updateBankMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<BankAccount> }) =>
            superAdminApi.updateBank(id, data),
        onSuccess: () => {
            toast.success('Bank updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['superadmin-banks'] });
            setShowEditModal(false);
            setSelectedBank(null);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update bank');
        }
    });

    // Delete bank mutation
    const deleteBankMutation = useMutation({
        mutationFn: superAdminApi.deleteBank,
        onSuccess: () => {
            toast.success('Bank deleted successfully!');
            queryClient.invalidateQueries({ queryKey: ['superadmin-banks'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete bank');
        }
    });

    const resetForm = () => {
        setBankForm({
            bank_name: '',
            bank_code: '',
            verified: true
        });
    };

    const handleSearch = () => {
        setCurrentPage(1);
        queryClient.invalidateQueries({ queryKey: ['superadmin-banks'] });
    };

    const handleStatusChange = (newStatus: string) => {
        setStatusFilter(newStatus);
        setCurrentPage(1);
        queryClient.invalidateQueries({ queryKey: ['superadmin-banks'] });
    };

    const handleCreateBank = (e: React.FormEvent) => {
        e.preventDefault();
        createBankMutation.mutate(bankForm);
    };

    const handleEditBank = (bank: Bank) => {
        setSelectedBank(bank);
        setBankForm({
            bank_name: bank.name,
            bank_code: bank.code,
            verified: true
        });
        setShowEditModal(true);
    };

    const handleUpdateBank = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedBank) {
            updateBankMutation.mutate({ id: selectedBank.id, data: bankForm });
        }
    };

    const handleDeleteBank = (id: number) => {
        if (window.confirm('Are you sure you want to delete this bank?')) {
            deleteBankMutation.mutate(id);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusColors = {
            'active': 'bg-green-100 text-green-800',
            'inactive': 'bg-red-100 text-red-800'
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    const displayBanks = banks.length > 0 ? banks as unknown as Bank[] : mockBanks;
    const filteredBanks = statusFilter
        ? displayBanks.filter(bank => bank.status === statusFilter)
        : displayBanks;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Banks Management</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage system banks and user bank accounts</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary-dark"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Bank
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card-glass p-6">
                    <div className="flex items-center">
                        <Building className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Banks</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {filteredBanks.length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="card-glass p-6">
                    <div className="flex items-center">
                        <Check className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Banks</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {filteredBanks.filter(b => b.status === 'active').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="card-glass p-6">
                    <div className="flex items-center">
                        <X className="h-8 w-8 text-red-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive Banks</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {filteredBanks.filter(b => b.status === 'inactive').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="card-glass p-6">
                    <div className="flex items-center">
                        <CreditCard className="h-8 w-8 text-purple-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bank Codes</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {filteredBanks.filter(b => b.code).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card-glass p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search banks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <button
                            onClick={handleSearch}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                        >
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Banks Table */}
            <div className="card-glass overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-secondary-700">
                        <thead className="bg-gray-50 dark:bg-secondary-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Bank
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Code
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
                        <tbody className="bg-white dark:bg-secondary-900 divide-y divide-gray-200 dark:divide-secondary-700">
                            {filteredBanks.map((bank) => (
                                <tr key={bank.id} className="hover:bg-gray-50 dark:hover:bg-secondary-800">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0">
                                                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                                                    <Building className="w-5 h-5 text-white" />
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {bank.name}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {bank.code}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(bank.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        {new Date(bank.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleEditBank(bank)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteBank(bank.id)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <button className="text-gray-400 hover:text-gray-600 dark:text-gray-400">
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
                    <div className="bg-white dark:bg-secondary-900 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-secondary-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-secondary-900 hover:bg-gray-50 dark:hover:bg-secondary-800 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(Math.min(pagination.last_page, currentPage + 1))}
                                disabled={currentPage === pagination.last_page}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-secondary-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-secondary-900 hover:bg-gray-50 dark:hover:bg-secondary-800 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
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
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-secondary-800 disabled:opacity-50"
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
                                                    : 'bg-white dark:bg-secondary-900 border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => setCurrentPage(Math.min(pagination.last_page, currentPage + 1))}
                                        disabled={currentPage === pagination.last_page}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-secondary-800 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Bank Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="card-glass p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Bank</h2>
                        <form onSubmit={handleCreateBank} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Bank Name
                                </label>
                                <input
                                    type="text"
                                    value={bankForm.bank_name}
                                    onChange={(e) => setBankForm(prev => ({ ...prev, bank_name: e.target.value }))}
                                    className="form-input focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Bank Code
                                </label>
                                <input
                                    type="text"
                                    value={bankForm.bank_code}
                                    onChange={(e) => setBankForm(prev => ({ ...prev, bank_code: e.target.value }))}
                                    className="form-input focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Status
                                </label>
                                <select
                                    value={bankForm.verified ? 'true' : 'false'}
                                    onChange={(e) => setBankForm(prev => ({ ...prev, verified: e.target.value === 'true' }))}
                                    className="form-input focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-secondary-900 border border-gray-300 dark:border-secondary-700 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createBankMutation.isPending}
                                    className="flex-1 px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50"
                                >
                                    Create Bank
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Bank Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="card-glass p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Bank</h2>
                        <form onSubmit={handleUpdateBank} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Bank Name
                                </label>
                                <input
                                    type="text"
                                    value={bankForm.bank_name}
                                    onChange={(e) => setBankForm(prev => ({ ...prev, bank_name: e.target.value }))}
                                    className="form-input focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Bank Code
                                </label>
                                <input
                                    type="text"
                                    value={bankForm.bank_code}
                                    onChange={(e) => setBankForm(prev => ({ ...prev, bank_code: e.target.value }))}
                                    className="form-input focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Status
                                </label>
                                <select
                                    value={bankForm.verified ? 'true' : 'false'}
                                    onChange={(e) => setBankForm(prev => ({ ...prev, verified: e.target.value === 'true' }))}
                                    className="form-input focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedBank(null);
                                        resetForm();
                                    }}
                                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-secondary-900 border border-gray-300 dark:border-secondary-700 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateBankMutation.isPending}
                                    className="flex-1 px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50"
                                >
                                    Update Bank
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBanks; 