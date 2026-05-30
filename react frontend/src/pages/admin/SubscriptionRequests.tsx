import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search,
    Filter,
    Check,
    X,
    Eye,
    FileText,
    Building2,
    Calendar,
    DollarSign,
    User,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Download
} from 'lucide-react';
import { adminApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

interface SubscriptionRequest {
    id: string;
    user_email: string;
    user_name: string;
    plan_id: string;
    plan_name: string;
    plan_price: number;
    bank_id: string;
    bank_name: string;
    depositor_name: string;
    amount: string;
    receipt_url: string;
    notes: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    processed_by?: string;
    rejection_reason?: string;
}

const SubscriptionRequests: React.FC = () => {
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<SubscriptionRequest | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    // Fetch subscription requests
    const { data: requestsData, isLoading } = useQuery({
        queryKey: ['subscription-requests', currentPage, searchTerm, statusFilter],
        queryFn: () => {
            const params = new URLSearchParams();
            params.append('page', currentPage.toString());
            params.append('per_page', '20');

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            if (statusFilter) {
                params.append('status', statusFilter);
            }

            return fetch(`${import.meta.env.VITE_API_URL}/admin/subscription-requests?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            }).then(async res => {
                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.message || 'Failed to fetch subscription requests');
                }
                return res.json();
            });
        }
    });

    // Approve request mutation
    const approveRequestMutation = useMutation({
        mutationFn: (requestId: string) =>
            fetch(`${import.meta.env.VITE_API_URL}/admin/subscription-requests/${requestId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            }).then(async res => {
                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.message || 'Failed to approve request');
                }
                return res.json();
            }),
        onSuccess: (data) => {
            toast.success(data.message || 'Request approved successfully');
            queryClient.invalidateQueries({ queryKey: ['subscription-requests'] });
            setShowDetailsModal(false);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to approve request');
        }
    });

    // Reject request mutation
    const rejectRequestMutation = useMutation({
        mutationFn: ({ requestId, reason }: { requestId: string; reason: string }) =>
            fetch(`${import.meta.env.VITE_API_URL}/admin/subscription-requests/${requestId}/reject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ rejection_reason: reason })
            }).then(async res => {
                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.message || 'Failed to reject request');
                }
                return res.json();
            }),
        onSuccess: (data) => {
            toast.success(data.message || 'Request rejected successfully');
            queryClient.invalidateQueries({ queryKey: ['subscription-requests'] });
            setShowRejectModal(false);
            setShowDetailsModal(false);
            setRejectionReason('');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to reject request');
        }
    });

    const requests: SubscriptionRequest[] = requestsData?.data || [];
    const pagination = requestsData ? {
        current_page: requestsData.current_page || 1,
        last_page: requestsData.last_page || 1,
        per_page: requestsData.per_page || 20,
        total: requestsData.total || 0
    } : null;

    const handleApproveRequest = (request: SubscriptionRequest) => {
        if (window.confirm(`Are you sure you want to approve this subscription request for ${request.user_email}?`)) {
            approveRequestMutation.mutate(request.id);
        }
    };

    const handleRejectRequest = (request: SubscriptionRequest) => {
        setSelectedRequest(request);
        setShowRejectModal(true);
    };

    const handleRejectSubmit = () => {
        if (!rejectionReason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }
        if (selectedRequest) {
            rejectRequestMutation.mutate({
                requestId: selectedRequest.id,
                reason: rejectionReason
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3" />, label: 'Pending' },
            'approved': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" />, label: 'Approved' },
            'rejected': { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" />, label: 'Rejected' }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['pending'];

        return (
            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
                {config.icon}
                <span className="ml-1">{config.label}</span>
            </span>
        );
    };

    const handleSearch = () => {
        setCurrentPage(1);
        // Trigger refetch by invalidating the query
    };

    const handleSearchKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subscription Requests</h1>
                        <p className="text-gray-600 mt-1">Manage manual payment subscription requests</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 bg-white dark:bg-secondary-900 rounded-lg border border-gray-200 px-3 py-2">
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {requests.filter(r => r.status === 'pending').length} pending
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="card-glass p-6">
                    <div className="flex items-center">
                        <Clock className="h-8 w-8 text-yellow-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {requests.filter(r => r.status === 'pending').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="card-glass p-6">
                    <div className="flex items-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {requests.filter(r => r.status === 'approved').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="card-glass p-6">
                    <div className="flex items-center">
                        <XCircle className="h-8 w-8 text-red-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {requests.filter(r => r.status === 'rejected').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="card-glass p-6">
                    <div className="flex items-center">
                        <DollarSign className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                ₦{requests.reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card-glass border border-gray-200 p-6 mb-6">
                <div className="grid md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Search className="w-4 h-4 inline mr-1" />
                            Search Requests
                        </label>
                        <input
                            type="text"
                            placeholder="Search by email, name, or plan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleSearchKeyPress}
                            className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Filter className="w-4 h-4 inline mr-1" />
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={handleSearch}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            Search
                        </button>
                    </div>
                </div>
            </div>

            {/* Requests Table */}
            <div className="card-glass border border-gray-200 dark:border-secondary-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-secondary-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        All Requests ({pagination?.total || 0})
                    </h2>
                </div>

                {requests.length === 0 ? (
                    <div className="text-center py-16">
                        <FileText className="w-24 h-24 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Requests Found</h3>
                        <p className="text-gray-600 mb-6">
                            No subscription requests have been submitted yet.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto">
                            <thead className="bg-gray-50 dark:bg-secondary-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User & Plan
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Payment Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-secondary-900 divide-y divide-gray-200 dark:divide-secondary-700">
                                {requests.map((request) => (
                                    <tr key={request.id} className="hover:bg-gray-50 dark:bg-secondary-800">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <User className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {request.user_name || request.user_email}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {request.user_email}
                                                    </div>
                                                    <div className="text-xs text-blue-600 font-medium">
                                                        {request.plan_name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                <div className="flex items-center mb-1">
                                                    <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                                                    {request.bank_name}
                                                </div>
                                                <div className="flex items-center mb-1">
                                                    <User className="w-4 h-4 mr-2 text-gray-400" />
                                                    {request.depositor_name}
                                                </div>
                                                <div className="flex items-center">
                                                    <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                                                    ₦{parseFloat(request.amount).toLocaleString()}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(request.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            <div className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                {new Date(request.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(request.created_at).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedRequest(request);
                                                        setShowDetailsModal(true);
                                                    }}
                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {request.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApproveRequest(request)}
                                                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors duration-200"
                                                            title="Approve"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectRequest(request)}
                                                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                                                            title="Reject"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
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
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-secondary-700">
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
                                    const page = i + 1;
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
                                    );
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
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {showDetailsModal && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-secondary-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Subscription Request Details
                                </h3>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Status */}
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h4>
                                {getStatusBadge(selectedRequest.status)}
                            </div>

                            {/* User Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">User Email</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{selectedRequest.user_email}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">User Name</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{selectedRequest.user_name || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Plan Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Plan</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{selectedRequest.plan_name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Plan Price</label>
                                    <p className="text-sm text-gray-900 dark:text-white">₦{selectedRequest.plan_price?.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Payment Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Bank</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{selectedRequest.bank_name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Depositor Name</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{selectedRequest.depositor_name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount Paid</label>
                                    <p className="text-sm text-gray-900 dark:text-white">₦{parseFloat(selectedRequest.amount).toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date Submitted</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Receipt */}
                            {selectedRequest.receipt_url && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500 mb-2 block">Payment Receipt</label>
                                    <div className="border rounded-lg p-4">
                                        <img
                                            src={selectedRequest.receipt_url}
                                            alt="Payment Receipt"
                                            className="max-w-full h-auto rounded-lg"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                const parent = (e.target as HTMLElement).parentElement;
                                                if (parent) {
                                                    parent.innerHTML = '<div class="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400"><FileText class="w-8 h-8 mr-2" /><span>Receipt file</span></div>';
                                                }
                                            }}
                                        />
                                        <a
                                            href={selectedRequest.receipt_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-700"
                                        >
                                            <Download className="w-4 h-4 mr-1" />
                                            Download Receipt
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {selectedRequest.notes && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</label>
                                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedRequest.notes}</p>
                                </div>
                            )}

                            {/* Rejection Reason */}
                            {selectedRequest.status === 'rejected' && selectedRequest.rejection_reason && (
                                <div>
                                    <label className="text-sm font-medium text-red-500">Rejection Reason</label>
                                    <p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">{selectedRequest.rejection_reason}</p>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 dark:border-secondary-700">
                            <div className="flex space-x-3">
                                {selectedRequest.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleApproveRequest(selectedRequest)}
                                            disabled={approveRequestMutation.isPending}
                                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                                        >
                                            {approveRequestMutation.isPending ? (
                                                <LoadingSpinner />
                                            ) : (
                                                <>
                                                    <Check className="w-4 h-4 mr-2" />
                                                    Approve Request
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setShowRejectModal(true)}
                                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Reject Request
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200 dark:border-secondary-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Reject Subscription Request
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Please provide a reason for rejecting this request
                            </p>
                        </div>

                        <div className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Rejection Reason *
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Explain why this payment request is being rejected..."
                                        rows={4}
                                        className="form-input focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setRejectionReason('');
                                    }}
                                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRejectSubmit}
                                    disabled={rejectRequestMutation.isPending || !rejectionReason.trim()}
                                    className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                                >
                                    {rejectRequestMutation.isPending ? (
                                        <LoadingSpinner />
                                    ) : (
                                        'Reject Request'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionRequests; 