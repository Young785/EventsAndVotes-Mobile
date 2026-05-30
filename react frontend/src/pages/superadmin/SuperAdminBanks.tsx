import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Eye,
    Building2,
    Users,
    CreditCard,
    ChevronLeft,
    ChevronRight,
    Filter,
    X,
    Check,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    Clock,
    Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { superAdminApi, adminBankApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AdminLayout from '../../components/AdminLayout';
import BankVerification from '../../components/BankVerification';

// Custom Searchable Select Component
interface Option {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = "Select an option",
    className = "",
    required = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = options.find(option => option.value === value);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm("");
    };

    return (
        <div className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-left flex items-center justify-between"
            >
                <span className={selectedOption ? "text-gray-900" : "text-gray-400"}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-secondary-900 border border-gray-300 dark:border-secondary-700 rounded-lg shadow-lg">
                    <div className="p-2 border-b border-gray-200 dark:border-secondary-700">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-700 rounded-md bg-white dark:bg-secondary-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">No options found</div>
                        ) : (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className="w-full px-3 py-2 text-left text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:bg-blue-50 dark:focus:bg-blue-900/20 text-sm"
                                >
                                    {option.label}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const SuperAdminBanks: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // State management
    const [currentTab, setCurrentTab] = useState<'system' | 'user'>('system');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showCreateUserBankModal, setShowCreateUserBankModal] = useState(false);
    const [showEditUserBankModal, setShowEditUserBankModal] = useState(false);
    const [showViewMoreModal, setShowViewMoreModal] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [verificationSent, setVerificationSent] = useState(false);
    const [selectedBank, setSelectedBank] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        status: 'active'
    });
    const [userBankFormData, setUserBankFormData] = useState({
        account_name: '',
        account_number: '',
        bank_id: '',
        settlement_type: 'INSTANT',
        status: 'active',
        is_default: false
    });

    // Verification states
    const [verifiedAccountName, setVerifiedAccountName] = useState('');
    const [isAccountVerified, setIsAccountVerified] = useState(false);

    // Check permissions
    const userRole = user?.role?.name || '';
    const isSuperAdmin = userRole === 'superadmin';
    const isAdminVote = ['admin_vote', 'admin_both'].includes(userRole);
    const canAccessBanks = isSuperAdmin || isAdminVote;

    // Set initial tab based on permissions
    React.useEffect(() => {
        if (isAdminVote && !isSuperAdmin) {
            setCurrentTab('user');
        }
    }, [isAdminVote, isSuperAdmin]);

    if (!canAccessBanks) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <div>
                            <p className="text-red-800 font-medium">Access Denied</p>
                            <p className="text-red-700 text-sm">You don't have permission to access this page.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Fetch system banks (only for superadmin)
    const { data: systemBanksData, isLoading: systemBanksLoading } = useQuery({
        queryKey: ['superadmin-system-banks', currentPage, searchTerm, statusFilter],
        queryFn: () => superAdminApi.getBanks({
            page: currentPage,
            search: searchTerm ? `${searchTerm}${statusFilter ? ` status:${statusFilter}` : ''}` : statusFilter ? `status:${statusFilter}` : undefined
        }),
        enabled: currentTab === 'system' && isSuperAdmin
    });

    // Fetch all banks for dropdown
    const { data: allBanksData } = useQuery({
        queryKey: ['all-banks'],
        queryFn: async () => {
            if (isSuperAdmin) {
                const response = await superAdminApi.getBanks({ search: 'all' });
                return response;
            } else {
                const response = await adminBankApi.getAllBanks();
                // Transform the response to match expected format
                return { data: response.data };
            }
        },
        enabled: currentTab === 'user' || showCreateUserBankModal || showEditUserBankModal
    });

    // Fetch user banks
    const { data: userBanksData, isLoading: userBanksLoading } = useQuery({
        queryKey: ['user-banks', currentPage, searchTerm],
        queryFn: async () => {
            if (isSuperAdmin) {
                // For superadmin, use the backend search and pagination
                return await superAdminApi.getUserBanks({ page: currentPage, search: searchTerm });
            } else {
                return await adminBankApi.getUserBanks({ page: currentPage, search: searchTerm });
            }
        },
        enabled: currentTab === 'user'
    });

    // Create system bank mutation (superadmin only)
    const createBankMutation = useMutation({
        mutationFn: superAdminApi.createBank,
        onSuccess: () => {
            toast.success('Bank created successfully');
            queryClient.invalidateQueries({ queryKey: ['superadmin-system-banks'] });
            queryClient.invalidateQueries({ queryKey: ['all-banks'] });
            setShowCreateModal(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create bank');
        }
    });

    // Update system bank mutation (superadmin only)
    const updateBankMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) =>
            superAdminApi.updateBank(id, data),
        onSuccess: () => {
            toast.success('Bank updated successfully');
            queryClient.invalidateQueries({ queryKey: ['superadmin-system-banks'] });
            queryClient.invalidateQueries({ queryKey: ['all-banks'] });
            setShowEditModal(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update bank');
        }
    });

    // Delete system bank mutation (superadmin only)
    const deleteBankMutation = useMutation({
        mutationFn: superAdminApi.deleteBank,
        onSuccess: () => {
            toast.success('Bank deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['superadmin-system-banks'] });
            queryClient.invalidateQueries({ queryKey: ['all-banks'] });
            setShowDeleteModal(false);
            setSelectedBank(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete bank');
        }
    });

    // Create user bank mutation
    const createUserBankMutation = useMutation({
        mutationFn: (data: any) => isSuperAdmin ? superAdminApi.createUserBank(data) : adminBankApi.createUserBank(data),
        onSuccess: () => {
            toast.success('User bank account created successfully');
            queryClient.invalidateQueries({ queryKey: ['user-banks'] });
            console.log('createUserBankMutation');
            setShowCreateUserBankModal(false);
            resetUserBankForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create user bank account');
        }
    });

    // Send verification code mutation
    const sendVerificationMutation = useMutation({
        mutationFn: adminBankApi.sendVerificationCode,
        onSuccess: () => {
            toast.success('Verification code sent to your email');
            setVerificationSent(true);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to send verification code');
        }
    });

    // Update user bank with verification mutation
    const updateUserBankWithVerificationMutation = useMutation({
        mutationFn: ({ bank_id, data }: { bank_id: number; data: any }) =>
            adminBankApi.updateUserBankWithVerification(bank_id, { ...data, verification_code: verificationCode }),
        onSuccess: () => {
            toast.success('User bank account updated successfully');
            queryClient.invalidateQueries({ queryKey: ['user-banks'] });
            setShowVerificationModal(false);
            setShowEditUserBankModal(false);
            resetUserBankForm();
            setVerificationCode('');
            setVerificationSent(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update user bank account');
        }
    });

    // Update user bank mutation (modified to handle verification)
    const updateUserBankMutation = useMutation({
        mutationFn: async ({ bank_id, data }: { bank_id: number; data: any }) => {
            if (isSuperAdmin) {
                return await superAdminApi.updateUserBank(bank_id, data);
            } else {
                // For non-superadmin, show verification modal and return a mock response
                setShowVerificationModal(true);
                return { status: 'success', message: 'Verification required', data: null };
            }
        },
        onSuccess: (response) => {
            if (isSuperAdmin && response.data) {
                toast.success('User bank account updated successfully');
                queryClient.invalidateQueries({ queryKey: ['user-banks'] });
                setShowEditUserBankModal(false);
                resetUserBankForm();
            }
        },
        onError: (error: any) => {
            if (isSuperAdmin) {
                toast.error(error.response?.data?.message || 'Failed to update user bank account');
            }
        }
    });

    // Delete user bank mutation
    const deleteUserBankMutation = useMutation({
        mutationFn: (bank_id: number) => isSuperAdmin ? superAdminApi.deleteUserBank(bank_id) : adminBankApi.deleteUserBank(bank_id),
        onSuccess: () => {
            toast.success('User bank account deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['user-banks'] });
            setShowDeleteModal(false);
            setSelectedBank(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete user bank account');
        }
    });

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            status: 'active'
        });
        setSelectedBank(null);
    };

    const resetUserBankForm = () => {
        setUserBankFormData({
            account_name: '',
            account_number: '',
            bank_id: '',
            settlement_type: 'INSTANT',
            status: 'active',
            is_default: false
        });
        setSelectedBank(null);
        setVerifiedAccountName('');
        setIsAccountVerified(false);
    };

    const handleCreateBank = (e: React.FormEvent) => {
        e.preventDefault();
        const bankData = {
            name: formData.name,
            code: formData.code,
            sort_code: '',  // Add an empty sort_code if needed by the API
            status: formData.status // This will be handled on the backend or through search
        };
        createBankMutation.mutate(bankData);
    };

    const handleUpdateBank = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedBank) {
            updateBankMutation.mutate({
                id: selectedBank.id,
                data: formData
            });
        }
    };

    const handleCreateUserBank = (e: React.FormEvent) => {
        e.preventDefault();
        const userBankData = {
            account_name: userBankFormData.account_name,
            account_number: userBankFormData.account_number,
            bank_id: userBankFormData.bank_id,
            settlement_type: userBankFormData.settlement_type,
            status: userBankFormData.status,
            is_default: userBankFormData.is_default
        };
        createUserBankMutation.mutate(userBankData);
    };

    const handleUpdateUserBank = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedBank) {
            const userBankData = {
                account_name: userBankFormData.account_name,
                account_number: userBankFormData.account_number,
                bank_id: userBankFormData.bank_id,
                settlement_type: userBankFormData.settlement_type,
                status: userBankFormData.status,
                is_default: userBankFormData.is_default
            };
            updateUserBankMutation.mutate({
                bank_id: selectedBank.user_bank_id,
                data: userBankData
            });
        }
    };

    const handleDeleteBank = () => {
        if (selectedBank) {
            if (currentTab === 'system') {
                deleteBankMutation.mutate(selectedBank.id);
            } else {
                deleteUserBankMutation.mutate(selectedBank.user_bank_id);
            }
        }
    };

    const openEditModal = (bank: any) => {
        setSelectedBank(bank);
        setFormData({
            name: bank.name,
            code: bank.code,
            status: bank.status || 'active'
        });
        setShowEditModal(true);
    };

    const openEditUserBankModal = (userBank: any) => {
        setSelectedBank(userBank);
        setUserBankFormData({
            account_name: userBank.account_name || '',
            account_number: userBank.account_no || userBank.account_number || '',
            bank_id: userBank.bank_id || '',
            settlement_type: userBank.settlement_type || 'INSTANT',
            status: userBank.status || 'active',
            is_default: userBank.is_default || false
        });
        // Set verification state for existing account
        if (userBank.account_name) {
            setVerifiedAccountName(userBank.account_name);
            setIsAccountVerified(true);
        } else {
            setVerifiedAccountName('');
            setIsAccountVerified(false);
        }
        setShowEditUserBankModal(true);
    };

    const openDeleteModal = (bank: any) => {
        setSelectedBank(bank);
        setShowDeleteModal(true);
    };

    const currentData = currentTab === 'system' ? systemBanksData : userBanksData;
    const isLoading = currentTab === 'system' ? systemBanksLoading : userBanksLoading;

    const handleVerificationSuccess = (accountName: string) => {
        setVerifiedAccountName(accountName);
        setIsAccountVerified(true);
        setUserBankFormData({ ...userBankFormData, account_name: accountName });
    };

    const handleVerificationError = (error: string) => {
        setVerifiedAccountName('');
        setIsAccountVerified(false);
        setUserBankFormData({ ...userBankFormData, account_name: '' });
    };

    // Get selected bank code for verification
    const getSelectedBankCode = () => {
        const selectedBank = allBanksData?.data?.find((bank: any) => bank.bank_id?.toString() === userBankFormData.bank_id);
        return selectedBank?.code || '';
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Banks Management</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage system banks and user bank accounts</p>
                    </div>
                    <div className="flex space-x-2">
                        {currentTab === 'system' && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Bank</span>
                            </button>
                        )}
                        {currentTab === 'user' && (
                            <button
                                onClick={() => setShowCreateUserBankModal(true)}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add User Bank</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        {isSuperAdmin && (
                            <button
                                onClick={() => {
                                    setCurrentTab('system');
                                    setCurrentPage(1);
                                    setSearchTerm('');
                                    setStatusFilter('');
                                }}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${currentTab === 'system'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <Building2 className="w-4 h-4" />
                                    <span>System Banks</span>
                                </div>
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setCurrentTab('user');
                                setCurrentPage(1);
                                setSearchTerm('');
                                setStatusFilter('');
                            }}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${currentTab === 'user'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center space-x-2">
                                <CreditCard className="w-4 h-4" />
                                <span>User Banks</span>
                            </div>
                        </button>
                    </nav>
                </div>
            </div>

            {/* Filters */}
            <div className="card-glass border border-gray-200 dark:border-secondary-700 p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex flex-col md:flex-row gap-4 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder={`Search ${currentTab === 'system' ? 'banks' : 'user bank accounts'}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                            />
                        </div>
                        {currentTab === 'system' && (
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Total: {currentTab === 'system'
                            ? (systemBanksData?.total || 0)
                            : (userBanksData?.total || userBanksData?.data?.length || 0)} {currentTab === 'system' ? 'banks' : 'accounts'}
                    </div>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner />
                </div>
            ) : (
                <>
                    {/* System Banks Table */}
                    {currentTab === 'system' && (
                        <div className="card-glass border border-gray-200 dark:border-secondary-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-secondary-700">
                                    <thead className="bg-gray-50 dark:bg-secondary-800">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Bank Details
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Code
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Users
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Created
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-secondary-900 divide-y divide-gray-200 dark:divide-secondary-700">
                                        {systemBanksData?.data.map((bank: any) => (
                                            <tr key={`system-bank-${bank.id}`} className="hover:bg-gray-50 dark:hover:bg-secondary-800">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                            <Building2 className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {bank.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                ID: {bank.id}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                                        {bank.code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${bank.status === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {bank.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-gray-900">
                                                        <Users className="w-4 h-4 text-gray-400 mr-1" />
                                                        {bank.users_count}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(bank.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={() => openEditModal(bank)}
                                                            className="text-blue-600 hover:text-blue-900 p-1"
                                                            title="Edit Bank"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => openDeleteModal(bank)}
                                                            className="text-red-600 hover:text-red-900 p-1"
                                                            title="Delete Bank"
                                                            disabled={bank.users_count > 0}
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
                    )}

                    {/* User Banks Table */}
                    {currentTab === 'user' && (
                        <div className="card-glass border border-gray-200 dark:border-secondary-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-secondary-700">
                                    <thead className="bg-gray-50 dark:bg-secondary-800">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Account Details
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Bank Info
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Account ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Settlement
                                            </th>
                                            {isSuperAdmin && (
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    User Details
                                                </th>
                                            )}
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Created
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-secondary-900 divide-y divide-gray-200 dark:divide-secondary-700">
                                        {userBanksData?.data?.map((userBank: any) => (
                                            <tr key={`user-bank-${userBank.id || userBank.user_bank_id}`} className="hover:bg-gray-50 dark:hover:bg-secondary-800">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                            <CreditCard className="w-5 h-5 text-green-600" />
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {userBank.account_name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {userBank.account_number}
                                                            </div>
                                                            <div className="text-xs text-gray-400">
                                                                ID: {userBank.user_bank_id}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {userBank.bank?.name || 'N/A'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Code: {userBank.bank?.code || userBank.bank_id || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                                        {userBank.account_id}
                                                    </div>
                                                    {userBank.subaccount_code && (
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Sub: {userBank.subaccount_code}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${userBank.settlement_type === 'INSTANT'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {userBank.settlement_type || 'STANDARD'}
                                                    </span>
                                                </td>
                                                {isSuperAdmin && (
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {userBank.user?.name || 'N/A'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {userBank.user?.email || 'N/A'}
                                                        </div>
                                                        {userBank.user?.account_id && (
                                                            <div className="text-xs text-gray-400">
                                                                User ID: {userBank.user.account_id}
                                                            </div>
                                                        )}
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-2">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${userBank.status === 'active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {userBank.status || 'active'}
                                                        </span>
                                                        {userBank.is_default && (
                                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(userBank.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedBank(userBank);
                                                                setShowViewMoreModal(true);
                                                            }}
                                                            className="text-green-600 hover:text-green-900 p-1"
                                                            title="View More"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        {isSuperAdmin && (
                                                            <button
                                                                onClick={() => openEditUserBankModal(userBank)}
                                                                className="text-blue-600 hover:text-blue-900 p-1"
                                                                title="Edit Account"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {!isSuperAdmin && (
                                                            <button
                                                                onClick={() => openEditUserBankModal(userBank)}
                                                                className="text-blue-600 hover:text-blue-900 p-1"
                                                                title="Edit Account (Requires Verification)"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => openDeleteModal(userBank)}
                                                            className="text-red-600 hover:text-red-900 p-1"
                                                            title="Delete Account"
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
                    )}

                    {/* Pagination */}
                    {currentTab === 'system' && systemBanksData && systemBanksData.last_page > 1 && (
                        <div className="mt-6 flex items-center justify-between">
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                Showing {((systemBanksData.current_page - 1) * systemBanksData.per_page) + 1} to{' '}
                                {Math.min(systemBanksData.current_page * systemBanksData.per_page, systemBanksData.total)} of{' '}
                                {systemBanksData.total} results
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm text-gray-700">
                                    Page {currentPage} of {systemBanksData.last_page}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === systemBanksData.last_page}
                                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* User Banks Pagination */}
                    {currentTab === 'user' && userBanksData && userBanksData.last_page > 1 && (
                        <div className="mt-6 flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Showing {((userBanksData.current_page - 1) * userBanksData.per_page) + 1} to{' '}
                                {Math.min(userBanksData.current_page * userBanksData.per_page, userBanksData.total)} of{' '}
                                {userBanksData.total} results
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm text-gray-700">
                                    Page {currentPage} of {userBanksData.last_page}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === userBanksData.last_page}
                                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Create Bank Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="card-glass p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Bank</h3>
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
                        <form onSubmit={handleCreateBank}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Bank Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Bank Code
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
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
                                    </select>
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
                                    disabled={createBankMutation.isPending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {createBankMutation.isPending ? 'Creating...' : 'Create Bank'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Bank Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="card-glass p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Bank</h3>
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
                        <form onSubmit={handleUpdateBank}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Bank Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Bank Code
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
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
                                    </select>
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
                                    disabled={updateBankMutation.isPending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {updateBankMutation.isPending ? 'Updating...' : 'Update Bank'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create User Bank Modal */}
            {showCreateUserBankModal && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="card-glass p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create User Bank Account</h3>
                            <button
                                onClick={() => {
                                    setShowCreateUserBankModal(false);
                                    resetUserBankForm();
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateUserBank}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Account Number
                                    </label>
                                    <input
                                        type="text"
                                        value={userBankFormData.account_number}
                                        onChange={(e) => {
                                            setUserBankFormData({ ...userBankFormData, account_number: e.target.value });
                                            // Reset verification when account number changes
                                            setIsAccountVerified(false);
                                            setVerifiedAccountName('');
                                            setUserBankFormData(prev => ({ ...prev, account_name: '' }));
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter 10-digit account number"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Bank
                                    </label>
                                    <SearchableSelect
                                        options={allBanksData?.data?.map((bank: any) => ({
                                            value: bank.bank_id?.toString() || '',
                                            label: `${bank.name || 'Unknown'} (${bank.code || 'N/A'})`
                                        })) || []}
                                        value={userBankFormData.bank_id}
                                        onChange={(value) => {
                                            setUserBankFormData({ ...userBankFormData, bank_id: value });
                                            // Reset verification when bank changes
                                            setIsAccountVerified(false);
                                            setVerifiedAccountName('');
                                            setUserBankFormData(prev => ({ ...prev, account_name: '' }));
                                        }}
                                        required
                                    />
                                </div>

                                {/* Bank Verification */}
                                {userBankFormData.bank_id && userBankFormData.account_number && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Verify Account
                                        </label>
                                        <BankVerification
                                            bankCode={getSelectedBankCode()}
                                            accountNumber={userBankFormData.account_number}
                                            onVerificationSuccess={handleVerificationSuccess}
                                            onVerificationError={handleVerificationError}
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Account Name
                                    </label>
                                    <input
                                        type="text"
                                        value={userBankFormData.account_name}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                                        placeholder={isAccountVerified ? "Account name will appear after verification" : "Verify account to get account name"}
                                        disabled
                                        readOnly
                                    />
                                    {!isAccountVerified && userBankFormData.bank_id && userBankFormData.account_number && (
                                        <p className="text-sm text-amber-600 mt-1">
                                            Please verify the account to get the account name
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Settlement Type
                                    </label>
                                    <select
                                        value={userBankFormData.settlement_type}
                                        onChange={(e) => setUserBankFormData({ ...userBankFormData, settlement_type: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="INSTANT">Instant Settlement</option>
                                        <option value="WITHDRAWAL">Withdrawal</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={userBankFormData.status}
                                        onChange={(e) => setUserBankFormData({ ...userBankFormData, status: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="is_default"
                                        checked={userBankFormData.is_default}
                                        onChange={(e) => setUserBankFormData({ ...userBankFormData, is_default: e.target.checked })}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">
                                        Set as default account
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateUserBankModal(false);
                                        resetUserBankForm();
                                    }}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createUserBankMutation.isPending}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    {createUserBankMutation.isPending ? 'Creating...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Bank Modal */}
            {showEditUserBankModal && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="card-glass p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit User Bank Account</h3>
                            <button
                                onClick={() => {
                                    setShowEditUserBankModal(false);
                                    resetUserBankForm();
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateUserBank}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Account Number
                                    </label>
                                    <input
                                        type="text"
                                        value={userBankFormData.account_number}
                                        onChange={(e) => {
                                            setUserBankFormData({ ...userBankFormData, account_number: e.target.value });
                                            // Reset verification when account number changes
                                            setIsAccountVerified(false);
                                            setVerifiedAccountName('');
                                            setUserBankFormData(prev => ({ ...prev, account_name: '' }));
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter 10-digit account number"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Bank
                                    </label>
                                    <SearchableSelect
                                        options={allBanksData?.data?.map((bank: any) => ({
                                            value: bank.bank_id?.toString() || '',
                                            label: `${bank.name || 'Unknown'} (${bank.code || 'N/A'})`
                                        })) || []}
                                        value={userBankFormData.bank_id}
                                        onChange={(value) => {
                                            setUserBankFormData({ ...userBankFormData, bank_id: value });
                                            // Reset verification when bank changes
                                            setIsAccountVerified(false);
                                            setVerifiedAccountName('');
                                            setUserBankFormData(prev => ({ ...prev, account_name: '' }));
                                        }}
                                        required
                                    />
                                </div>

                                {/* Bank Verification */}
                                {userBankFormData.bank_id && userBankFormData.account_number && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Verify Account
                                        </label>
                                        <BankVerification
                                            bankCode={getSelectedBankCode()}
                                            accountNumber={userBankFormData.account_number}
                                            onVerificationSuccess={handleVerificationSuccess}
                                            onVerificationError={handleVerificationError}
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Account Name
                                    </label>
                                    <input
                                        type="text"
                                        value={userBankFormData.account_name}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                                        placeholder={isAccountVerified ? "Account name will appear after verification" : "Verify account to get account name"}
                                        disabled
                                        readOnly
                                    />
                                    {!isAccountVerified && userBankFormData.bank_id && userBankFormData.account_number && (
                                        <p className="text-sm text-amber-600 mt-1">
                                            Please verify the account to get the account name
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Settlement Type
                                    </label>
                                    <select
                                        value={userBankFormData.settlement_type}
                                        onChange={(e) => setUserBankFormData({ ...userBankFormData, settlement_type: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="INSTANT">Instant Settlement</option>
                                        <option value="WITHDRAWAL">Withdrawal</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={userBankFormData.status}
                                        onChange={(e) => setUserBankFormData({ ...userBankFormData, status: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="edit_is_default"
                                        checked={userBankFormData.is_default}
                                        onChange={(e) => setUserBankFormData({ ...userBankFormData, is_default: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <label htmlFor="edit_is_default" className="text-sm font-medium text-gray-700">
                                        Set as Default
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditUserBankModal(false);
                                        resetUserBankForm();
                                    }}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateUserBankMutation.isPending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {updateUserBankMutation.isPending ? 'Updating...' : 'Update User Bank Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="card-glass p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm Delete</h3>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-600 dark:text-gray-400">
                                Are you sure you want to delete {currentTab === 'system' ? 'this bank' : 'this user bank account'}?
                                This action cannot be undone.
                            </p>
                            {selectedBank && currentTab === 'system' && selectedBank.users_count > 0 && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-800 text-sm">
                                        Warning: This bank has {selectedBank.users_count} user accounts.
                                        You cannot delete it while users are still using it.
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
                                onClick={handleDeleteBank}
                                disabled={
                                    (currentTab === 'system' ? deleteBankMutation.isPending : deleteUserBankMutation.isPending) ||
                                    (currentTab === 'system' && selectedBank?.users_count > 0)
                                }
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {(currentTab === 'system' ? deleteBankMutation.isPending : deleteUserBankMutation.isPending)
                                    ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View More Modal */}
            {showViewMoreModal && selectedBank && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="card-glass p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bank Account Details</h3>
                            <button
                                onClick={() => setShowViewMoreModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Account Name</label>
                                        <p className="text-gray-900">{selectedBank.account_name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Account Number</label>
                                        <p className="text-gray-900 font-mono">{selectedBank.account_no}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Account ID</label>
                                        <p className="text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">{selectedBank.account_id}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">User Bank ID</label>
                                        <p className="text-gray-900 font-mono">{selectedBank.user_bank_id}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Bank Name</label>
                                        <p className="text-gray-900">{selectedBank.bank?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Bank Code</label>
                                        <p className="text-gray-900">{selectedBank.bank?.code || selectedBank.bank_id || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Settlement Type</label>
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedBank.settlement_type === 'INSTANT'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {selectedBank.settlement_type || 'STANDARD'}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Status</label>
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedBank.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {selectedBank.status || 'active'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {selectedBank.subaccount_code && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Subaccount Code</label>
                                    <p className="text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">{selectedBank.subaccount_code}</p>
                                </div>
                            )}

                            {isSuperAdmin && selectedBank.user && (
                                <div className="border-t pt-4">
                                    <h4 className="font-medium text-gray-900 mb-3">User Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">User Name</label>
                                            <p className="text-gray-900">{selectedBank.user.name}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Email</label>
                                            <p className="text-gray-900">{selectedBank.user.email}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">User Account ID</label>
                                            <p className="text-gray-900 font-mono">{selectedBank.user.account_id}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="border-t pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Created At</label>
                                        <p className="text-gray-900">{new Date(selectedBank.created_at).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Updated At</label>
                                        <p className="text-gray-900">{new Date(selectedBank.updated_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {selectedBank.is_default && (
                                <div className="border-t pt-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <div className="flex items-center">
                                            <Check className="w-5 h-5 text-blue-600 mr-2" />
                                            <span className="text-blue-800 font-medium">This is the default bank account</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setShowViewMoreModal(false)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Verification Modal */}
            {showVerificationModal && selectedBank && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="card-glass p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Verify Bank Update</h3>
                            <button
                                onClick={() => {
                                    setShowVerificationModal(false);
                                    setVerificationCode('');
                                    setVerificationSent(false);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {!verificationSent ? (
                            <div>
                                <p className="text-gray-600 mb-4">
                                    Click the send code button and we will send a verification code to your email.
                                </p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <div className="flex">
                                            <input
                                                type="text"
                                                value={user?.email || ''}
                                                disabled
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50"
                                            />
                                            <button
                                                onClick={() => sendVerificationMutation.mutate(selectedBank.user_bank_id)}
                                                disabled={sendVerificationMutation.isPending}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {sendVerificationMutation.isPending ? 'Sending...' : 'Send Code'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-gray-600 mb-4">
                                    Enter the verification code sent to your email to proceed with the update.
                                </p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Verification Code
                                        </label>
                                        <input
                                            type="text"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            placeholder="Enter 6-digit code"
                                            maxLength={6}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="flex justify-end space-x-3">
                                        <button
                                            onClick={() => {
                                                setVerificationSent(false);
                                                setVerificationCode('');
                                            }}
                                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={() => {
                                                const userBankData = {
                                                    account_name: userBankFormData.account_name,
                                                    account_number: userBankFormData.account_number,
                                                    bank_id: userBankFormData.bank_id,
                                                    settlement_type: userBankFormData.settlement_type,
                                                    status: userBankFormData.status,
                                                    is_default: userBankFormData.is_default
                                                };
                                                updateUserBankWithVerificationMutation.mutate({
                                                    bank_id: selectedBank.user_bank_id,
                                                    data: userBankData
                                                });
                                            }}
                                            disabled={updateUserBankWithVerificationMutation.isPending || verificationCode.length !== 6}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {updateUserBankWithVerificationMutation.isPending ? 'Updating...' : 'Update Account'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminBanks; 