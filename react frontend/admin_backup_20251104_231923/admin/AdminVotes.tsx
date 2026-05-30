import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Eye,
    Calendar,
    Users,
    DollarSign,
    Share2,
    Download,
    MoreVertical,
    Settings,
    CreditCard,
    UserPlus,
    X,
    BarChart3
} from 'lucide-react';
import { adminApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import VoteFormModal from '../../components/VoteFormModal';
import { getNomineeImageUrl } from '../../utils/imageUtils';

const AdminVotes: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showManualVoteModal, setShowManualVoteModal] = useState(false);
    const [showManualSubscriptionModal, setShowManualSubscriptionModal] = useState(false);
    const [showPaymentGatewayModal, setShowPaymentGatewayModal] = useState(false);
    const [showVotingDetailsModal, setShowVotingDetailsModal] = useState(false);
    const [selectedVote, setSelectedVote] = useState<any>(null);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [manualVoteData, setManualVoteData] = useState({
        vote_id: '',
        nominee_id: '',
        quantity: 1,
        voter_name: '',
        voter_email: '',
        notes: ''
    });
    const [manualSubscriptionData, setManualSubscriptionData] = useState({
        vote_id: '',
        user_email: '',
        plan_id: '',
        notes: ''
    });
    const [paymentGatewayData, setPaymentGatewayData] = useState({
        vote_id: '',
        pg_id: ''
    });
    const queryClient = useQueryClient();
    const { user } = useAuth();

    // Check if user is superadmin
    const isSuperAdmin = user?.role?.name === 'superadmin';

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (openDropdown && !target.closest('.dropdown-container')) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openDropdown]);

    // Fetch votes
    const { data: votesData, isLoading } = useQuery({
        queryKey: ['admin-votes', currentPage, searchQuery, statusFilter],
        queryFn: () => adminApi.getVotes({
            page: currentPage,
            search: searchQuery,
            status: statusFilter
        })
    });

    // Fetch financial summary for all votes
    const { data: financialSummaryData } = useQuery({
        queryKey: ['votes-financial-summary'],
        queryFn: () => fetch(`${import.meta.env.VITE_API_URL}/admin/votes/financial-summary`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        }).then(res => res.json())
    });

    // Fetch payment gateways
    const { data: paymentGatewaysData } = useQuery({
        queryKey: ['payment-gateways'],
        queryFn: () => fetch(`${import.meta.env.VITE_API_URL}/payment-gateways`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        }).then(res => res.json()),
        enabled: isSuperAdmin
    });

    // Fetch subscription plans
    const { data: subscriptionPlansData } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: () => fetch(`${import.meta.env.VITE_API_URL}/admin/subscriptions/plans`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        }).then(res => res.json()),
        enabled: isSuperAdmin
    });

    // Fetch nominees for selected vote
    const { data: nomineesData } = useQuery({
        queryKey: ['vote-nominees', selectedVote?.vote_id],
        queryFn: () => fetch(`${import.meta.env.VITE_API_URL}/admin/votes/${selectedVote?.slug}/nominees`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        }).then(async res => {
            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.message || `HTTP ${res.status}: Failed to fetch nominees`);
            }
            return result;
        }),
        enabled: !!selectedVote?.slug && !!selectedVote?.vote_id && showManualVoteModal
    });

    // Delete vote mutation
    const deleteVoteMutation = useMutation({
        mutationFn: adminApi.deleteVote,
        onSuccess: () => {
            toast.success('Vote deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-votes'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete vote');
        }
    });

    // Manual vote entry mutation
    const manualVoteMutation = useMutation({
        mutationFn: (data: any) => fetch(`${import.meta.env.VITE_API_URL}/admin/votes/manual-vote`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(async res => {
            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.message || 'Failed to add manual vote');
            }
            return result;
        }),
        onSuccess: (data) => {
            toast.success(data.message || 'Manual vote added successfully');
            setShowManualVoteModal(false);
            setManualVoteData({
                vote_id: '',
                nominee_id: '',
                quantity: 1,
                voter_name: '',
                voter_email: '',
                notes: ''
            });
            queryClient.invalidateQueries({ queryKey: ['admin-votes'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to add manual vote');
        }
    });

    // Manual subscription entry mutation
    const manualSubscriptionMutation = useMutation({
        mutationFn: (data: any) => fetch(`${import.meta.env.VITE_API_URL}/admin/subscriptions/manual-entry`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(async res => {
            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.message || 'Failed to add manual subscription');
            }
            return result;
        }),
        onSuccess: (data) => {
            toast.success(data.message || 'Manual subscription added successfully');
            setShowManualSubscriptionModal(false);
            setManualSubscriptionData({
                vote_id: '',
                user_email: '',
                plan_id: '',
                notes: ''
            });
            queryClient.invalidateQueries({ queryKey: ['admin-votes'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to add manual subscription');
        }
    });

    // Payment gateway assignment mutation
    const assignPaymentGatewayMutation = useMutation({
        mutationFn: (data: { vote_id: string; pg_id: string }) =>
            fetch(`${import.meta.env.VITE_API_URL}/admin/votes/${data.vote_id}/assign-payment-gateway`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pg_id: data.pg_id })
            }).then(async res => {
                const result = await res.json();
                if (!res.ok) {
                    throw new Error(result.message || 'Failed to assign payment gateway');
                }
                return result;
            }),
        onSuccess: (data) => {
            toast.success(data.message || 'Payment gateway assigned successfully');
            setShowPaymentGatewayModal(false);
            setSelectedVote(null);
            setPaymentGatewayData({ vote_id: '', pg_id: '' });
            queryClient.invalidateQueries({ queryKey: ['admin-votes'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to assign payment gateway');
        }
    });

    // Export votes mutation
    const exportVotesMutation = useMutation({
        mutationFn: () => fetch(`${import.meta.env.VITE_API_URL}/admin/votes/export`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            }
        }).then(async res => {
            if (!res.ok) {
                const result = await res.json();
                throw new Error(result.message || 'Failed to export votes');
            }
            return res.blob();
        }),
        onSuccess: (blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `votes_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Votes exported successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to export votes');
        }
    });

    const votes = votesData?.data || [];
    const pagination = votesData ? {
        current_page: votesData.current_page,
        last_page: votesData.last_page,
        per_page: votesData.per_page,
        total: votesData.total
    } : null;

    const nominees = nomineesData?.data?.nominees || [];
    const paymentGateways = paymentGatewaysData?.data || [];
    const subscriptionPlans = subscriptionPlansData?.data || [];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
    };

    const handleDeleteVote = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this vote?')) {
            deleteVoteMutation.mutate(id);
        }
    };

    const handleDownloadVotes = () => {
        exportVotesMutation.mutate();
    };

    const handleManualVoteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualVoteData.vote_id || !manualVoteData.nominee_id) {
            toast.error('Please select vote and nominee');
            return;
        }
        manualVoteMutation.mutate(manualVoteData);
    };

    const handleManualSubscriptionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualSubscriptionData.vote_id || !manualSubscriptionData.user_email || !manualSubscriptionData.plan_id) {
            toast.error('Please fill in all required fields');
            return;
        }
        manualSubscriptionMutation.mutate(manualSubscriptionData);
    };

    const handlePaymentGatewayAssign = (vote: any) => {
        setSelectedVote(vote);
        setPaymentGatewayData({ vote_id: vote.vote_id, pg_id: '' });
        setShowPaymentGatewayModal(true);
    };

    const handleGlobalPaymentGatewayAssign = () => {
        setSelectedVote(null);
        setPaymentGatewayData({ vote_id: '', pg_id: '' });
        setShowPaymentGatewayModal(true);
    };

    const handlePaymentGatewaySubmit = () => {
        const voteId = selectedVote ? selectedVote.vote_id : paymentGatewayData.vote_id;
        const pgId = paymentGatewayData.pg_id;

        if (!voteId || !pgId) {
            toast.error('Please select both vote and payment gateway');
            return;
        }

        assignPaymentGatewayMutation.mutate({
            vote_id: voteId,
            pg_id: pgId
        });
    };

    const handleManualVoteEntry = (vote: any) => {
        setSelectedVote(vote);
        setManualVoteData(prev => ({ ...prev, vote_id: vote.vote_id }));
        setShowManualVoteModal(true);
    };

    const handleManualSubscriptionEntry = (vote: any) => {
        setSelectedVote(vote);
        setManualSubscriptionData(prev => ({ ...prev, vote_id: vote.vote_id }));
        setShowManualSubscriptionModal(true);
    };

    const handleEditVote = (vote: any) => {
        setSelectedVote(vote);
        setShowEditModal(true);
    };

    const handleShareVote = async (vote: any) => {
        try {
            // Create frontend-based share links
            const baseUrl = window.location.origin;
            const votingUrl = `${baseUrl}/votes/${vote.slug}/${vote.vote_id}`;
            const nominationUrl = `${baseUrl}/contest/${vote.slug}`;
            const resultsUrl = `${baseUrl}/votes/${vote.slug}/${vote.vote_id}/results`;

            // For now, copy the voting URL to clipboard
            // In future, you can show a modal with all three options
            await navigator.clipboard.writeText(votingUrl);
            toast.success('Voting link copied to clipboard!');

            // Optional: Show additional info
            console.log('Share URLs:', {
                voting: votingUrl,
                nomination: nominationUrl,
                results: resultsUrl
            });
        } catch (error) {
            console.error('Share vote error:', error);
            toast.error('Failed to copy share link');
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'STARTED': { color: 'bg-green-100 text-green-800', label: 'Started' },
            'COMPLETED': { color: 'bg-blue-100 text-blue-800', label: 'Completed' },
            'INACTIVE': { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
            'POSTPONED': { color: 'bg-yellow-100 text-yellow-800', label: 'Postponed' }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['INACTIVE'];

        return (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
                {config.label}
            </span>
        );
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
                <nav className="text-sm text-gray-500 mb-2">
                    <Link to="/admin/dashboard" className="hover:text-gray-700">Home</Link>
                    <span className="mx-2">•</span>
                    <span className="text-gray-900">Votings</span>
                </nav>
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">Votings Management</h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create Vote</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card-glass p-6 mb-6 animate-fade-in-up">
                <form onSubmit={handleSearch} className="grid md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <label className="form-label">
                            <Search className="w-4 h-4 inline mr-1" />
                            Search Votes
                        </label>
                        <input
                            type="text"
                            placeholder="Search by title, description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Filter className="w-4 h-4 inline mr-1" />
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Status</option>
                            <option value="STARTED">Started</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="POSTPONED">Postponed</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            Search
                        </button>
                    </div>
                </form>
            </div>

            {/* Payment Gateway Assignment Section - SuperAdmin Only */}
            {isSuperAdmin && (
                <div className="card-glass p-6 mb-6 animate-fade-in-up">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                <CreditCard className="w-5 h-5 mr-2 text-orange-600" />
                                Payment Gateway Assignment
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Assign payment gateways to votes for processing payments
                            </p>
                        </div>
                        <button
                            onClick={() => handleGlobalPaymentGatewayAssign()}
                            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors duration-200 flex items-center space-x-2"
                        >
                            <CreditCard className="w-4 h-4" />
                            <span>Assign Gateway</span>
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paymentGateways.map((gateway: any) => (
                            <div key={gateway.id} className="p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-medium text-gray-900">{gateway.name}</h3>
                                    <span className={`px-2 py-1 text-xs rounded-full ${gateway.status === 'active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {gateway.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">ID: {gateway.pg_id}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Votes using this gateway: {votes.filter((vote: any) => vote.assigned_pg_id === gateway.pg_id).length}
                                </p>
                            </div>
                        ))}

                        {paymentGateways.length === 0 && (
                            <div className="col-span-full text-center py-8">
                                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No payment gateways available</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Votes Table */}
            <div className="card-glass overflow-hidden animate-fade-in-up">
                <div className="px-6 py-5 border-b border-gray-200 dark:border-secondary-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            All Votes ({pagination?.total || 0})
                        </h2>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleDownloadVotes}
                                disabled={exportVotesMutation.isPending}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                                title="Export votes to CSV"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {votes.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-gray-400 mb-4">
                            <Eye className="w-24 h-24 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Votes Found</h3>
                        <p className="text-gray-600 mb-6">
                            Get started by creating your first vote.
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                        >
                            Create Vote
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="min-w-full">
                            <table className="w-full table-auto">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Vote
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Dates
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Stats & Financials
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                                            <div className="flex items-center">
                                                Actions
                                                {isSuperAdmin && (
                                                    <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-600 rounded-full" title="SuperAdmin controls enabled">
                                                        SA
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {votes.map((vote: any) => (
                                        <tr key={vote.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <img
                                                        src={getNomineeImageUrl({ image: vote.image }) || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'}
                                                        alt={vote.title}
                                                        className="w-12 h-12 rounded-lg object-cover"
                                                    />
                                                    <div className="ml-4">
                                                        <div className="flex items-center">
                                                            <h3 className="text-sm font-medium text-gray-900">
                                                                {vote.title}
                                                            </h3>
                                                            {isSuperAdmin && (
                                                                <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-600 rounded-full" title="Admin controls available">
                                                                    Admin
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-500 line-clamp-1">
                                                            {vote.description}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            ID: {vote.vote_id}
                                                            {vote.assigned_pg_id && (
                                                                <span className="ml-2 text-green-600">• Gateway: {vote.assigned_pg_id}</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(vote.status)}
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {vote.payment_mode}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="flex items-center text-xs text-gray-500">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    Start: {new Date(vote.start_date).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    End: {new Date(vote.end_date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="space-y-1">
                                                <div className="flex items-center text-xs text-gray-500">
                                                    <Users className="w-3 h-3 mr-1" />
                                                    {vote.nominees?.length || 0} nominees
                                                </div>
                                                    <div className="flex items-center text-xs text-gray-500">
                                                    <Eye className="w-3 h-3 mr-1" />
                                                    {vote.total_votes || 0} votes
                                                    </div>
                                                    <div className="flex items-center text-xs text-green-600">
                                                        <DollarSign className="w-3 h-3 mr-1" />
                                                        ₦{((financialSummaryData?.data?.[vote.vote_id]?.total_revenue || 0)).toLocaleString()}
                                                    </div>
                                                    <div className="flex items-center text-xs text-blue-600">
                                                        <BarChart3 className="w-3 h-3 mr-1" />
                                                        ₦{((financialSummaryData?.data?.[vote.vote_id]?.total_withdrawals || 0)).toLocaleString()} withdrawn
                                                    </div>
                                                    <div className="flex items-center text-xs text-purple-600">
                                                        <DollarSign className="w-3 h-3 mr-1" />
                                                        ₦{((financialSummaryData?.data?.[vote.vote_id]?.available_balance || 0)).toLocaleString()} available
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 relative">
                                                <div className="dropdown-container">
                                                    <button
                                                        onClick={() => setOpenDropdown(openDropdown === vote.vote_id ? null : vote.vote_id)}
                                                        className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                                        title="More actions"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>

                                                    {openDropdown === vote.vote_id && (
                                                        <div className="fixed z-[9999] w-56 bg-white dark:bg-secondary-900 rounded-xl shadow-xl border border-gray-200 dark:border-secondary-700 max-h-[80vh] overflow-y-auto"
                                                            style={{
                                                                top: '50%',
                                                                right: '1rem',
                                                                transform: 'translateY(-50%)',
                                                                maxWidth: '250px'
                                                            }}
                                                        >
                                                            <div className="py-1">
                                                                {/* View & Manage Actions */}
                                                                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                                                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">View & Manage</span>
                                                                </div>

                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedVote(vote);
                                                                        setShowVotingDetailsModal(true);
                                                                        setOpenDropdown(null);
                                                                    }}
                                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                                                                >
                                                                    <Eye className="w-4 h-4 mr-3 text-blue-500" />
                                                                    View More
                                                                </button>

                                                                <button
                                                                    onClick={() => {
                                                                        handleEditVote(vote);
                                                                        setOpenDropdown(null);
                                                                    }}
                                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                                                                >
                                                                    <Edit className="w-4 h-4 mr-3 text-blue-500" />
                                                                    Edit Vote
                                                                </button>

                                                                <Link
                                                                    to={`/admin/votes/${vote.vote_id}/positions`}
                                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                                                                    onClick={() => setOpenDropdown(null)}
                                                                >
                                                                    <Users className="w-4 h-4 mr-3 text-purple-500" />
                                                                    Manage Positions
                                                                </Link>

                                                                <Link
                                                                    to={`/admin/votes/${vote.slug}/nominees`}
                                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                                                                    onClick={() => setOpenDropdown(null)}
                                                                >
                                                                    <Users className="w-4 h-4 mr-3 text-green-500" />
                                                                    Manage Nominees
                                                                </Link>

                                                                {/* Financial Actions */}
                                                                <div className="px-3 py-2 bg-gray-50 border-b border-t border-gray-100 mt-1">
                                                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Financial</span>
                                                                </div>

                                                                <Link
                                                                    to={`/admin/votes/${vote.vote_id}/transactions`}
                                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                                                                    onClick={() => setOpenDropdown(null)}
                                                                >
                                                                    <CreditCard className="w-4 h-4 mr-3 text-purple-500" />
                                                                    Manage Transactions
                                                                </Link>

                                                                {/* SuperAdmin Actions */}
                                                                {isSuperAdmin && (
                                                                    <>
                                                                        <div className="px-3 py-2 bg-orange-50 border-b border-t border-orange-100 mt-1">
                                                                            <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Admin Controls</span>
                                                                        </div>

                                                                        <button
                                                                            onClick={() => {
                                                                                handleManualSubscriptionEntry(vote);
                                                                                setOpenDropdown(null);
                                                                            }}
                                                                            className="flex items-center w-full px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 transition-colors duration-150"
                                                                        >
                                                                            <UserPlus className="w-4 h-4 mr-3" />
                                                                            Manual Subscription Entry
                                                                        </button>

                                                                        <button
                                                                            onClick={() => {
                                                                                handleManualVoteEntry(vote);
                                                                                setOpenDropdown(null);
                                                                            }}
                                                                            className="flex items-center w-full px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 transition-colors duration-150"
                                                                            title="Add manual votes for this voting"
                                                                        >
                                                                            <UserPlus className="w-4 h-4 mr-3" />
                                                                            Manual Vote Entry
                                                                        </button>

                                                                        <button
                                                                            onClick={() => {
                                                                                handlePaymentGatewayAssign(vote);
                                                                                setOpenDropdown(null);
                                                                            }}
                                                                            className="flex items-center w-full px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 transition-colors duration-150"
                                                                            title="Assign payment gateway to this voting"
                                                                        >
                                                                            <CreditCard className="w-4 h-4 mr-3" />
                                                                            Assign Payment Gateway
                                                                        </button>
                                                                    </>
                                                                )}

                                                                {/* Sharing & More Actions */}
                                                                <div className="px-3 py-2 bg-gray-50 border-b border-t border-gray-100 mt-1">
                                                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Share & More</span>
                                                                </div>

                                                                <button
                                                                    onClick={() => {
                                                                        handleShareVote(vote);
                                                                        setOpenDropdown(null);
                                                                    }}
                                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                                                                >
                                                                    <Share2 className="w-4 h-4 mr-3 text-blue-500" />
                                                                    Share Vote
                                                                </button>

                                                                {/* Danger Zone */}
                                                                <div className="border-t border-gray-100 mt-1"></div>

                                                                <button
                                                                    onClick={() => {
                                                                        handleDeleteVote(vote.vote_id);
                                                                        setOpenDropdown(null);
                                                                    }}
                                                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-3" />
                                                                    Delete Vote
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
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
                                    const page = i + 1;
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
                                    );
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

            {/* Manual Vote Entry Modal */}
            {showManualVoteModal && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="card-glass max-w-md w-full animate-scale-in">
                        <div className="p-6 border-b border-gray-200 dark:border-secondary-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Manual Vote Entry
                                </h3>
                                <button
                                    onClick={() => setShowManualVoteModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                                Add manual votes for: <strong>{selectedVote?.title}</strong>
                            </p>
                        </div>

                        <form onSubmit={handleManualVoteSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Nominee
                                    </label>
                                    <select
                                        value={manualVoteData.nominee_id}
                                        onChange={(e) => setManualVoteData(prev => ({ ...prev, nominee_id: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="">Choose a nominee...</option>
                                        {nominees.map((nominee: any) => (
                                            <option key={nominee.nominees_id} value={nominee.nominees_id}>
                                                {nominee.first_name} {nominee.last_name} - {nominee.position?.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Number of Votes
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={manualVoteData.quantity}
                                        onChange={(e) => setManualVoteData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Voter Name
                                    </label>
                                    <input
                                        type="text"
                                        value={manualVoteData.voter_name}
                                        onChange={(e) => setManualVoteData(prev => ({ ...prev, voter_name: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter voter name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Voter Email (Optional)
                                    </label>
                                    <input
                                        type="email"
                                        value={manualVoteData.voter_email}
                                        onChange={(e) => setManualVoteData(prev => ({ ...prev, voter_email: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter voter email"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={manualVoteData.notes}
                                        onChange={(e) => setManualVoteData(prev => ({ ...prev, notes: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={3}
                                        placeholder="Add any notes about this manual vote entry"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowManualVoteModal(false)}
                                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={manualVoteMutation.isPending}
                                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    {manualVoteMutation.isPending ? 'Adding...' : 'Add Votes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manual Subscription Entry Modal */}
            {showManualSubscriptionModal && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="card-glass max-w-md w-full animate-scale-in">
                        <div className="p-6 border-b border-gray-200 dark:border-secondary-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Manual Subscription Entry
                                </h3>
                                <button
                                    onClick={() => setShowManualSubscriptionModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                                Add manual subscription for: <strong>{selectedVote?.title}</strong>
                            </p>
                        </div>

                        <form onSubmit={handleManualSubscriptionSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        User Email
                                    </label>
                                    <input
                                        type="email"
                                        value={manualSubscriptionData.user_email}
                                        onChange={(e) => setManualSubscriptionData(prev => ({ ...prev, user_email: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter user email"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Subscription Type
                                    </label>
                                    <select
                                        value={manualSubscriptionData.plan_id}
                                        onChange={(e) => setManualSubscriptionData(prev => ({ ...prev, plan_id: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="">Choose a subscription...</option>
                                        {subscriptionPlans.map((plan: any) => (
                                            <option key={plan.plan_id} value={plan.plan_id}>
                                                {plan.name} - ₦{plan.price?.toLocaleString()} ({plan.duration} days)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Selected Plan Details */}
                                {manualSubscriptionData.plan_id && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        {(() => {
                                            const selectedPlan = subscriptionPlans.find((plan: any) => plan.plan_id === manualSubscriptionData.plan_id);
                                            if (!selectedPlan) return null;

                                            return (
                                                <div>
                                                    <h4 className="font-medium text-blue-900 mb-2">Selected Plan Details</h4>
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <div>
                                                            <span className="text-blue-600">Price:</span> ₦{selectedPlan.price?.toLocaleString()}
                                                        </div>
                                                        <div>
                                                            <span className="text-blue-600">Duration:</span> {selectedPlan.duration} days
                                                        </div>
                                                        <div>
                                                            <span className="text-blue-600">Votes:</span> {selectedPlan.votes}
                                                        </div>
                                                        <div>
                                                            <span className="text-blue-600">Voting Times:</span> {selectedPlan.voting_times}
                                                        </div>
                                                        <div>
                                                            <span className="text-blue-600">Nominees:</span> {selectedPlan.nominees}
                                                        </div>
                                                    </div>
                                                    {selectedPlan.description && (
                                                        <p className="text-xs text-blue-700 mt-2">{selectedPlan.description}</p>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={manualSubscriptionData.notes}
                                        onChange={(e) => setManualSubscriptionData(prev => ({ ...prev, notes: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={3}
                                        placeholder="Add any notes about this manual subscription entry"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowManualSubscriptionModal(false)}
                                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={manualSubscriptionMutation.isPending}
                                    className="flex-1 py-2 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    {manualSubscriptionMutation.isPending ? 'Adding...' : 'Add Subscription'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Gateway Assignment Modal */}
            {showPaymentGatewayModal && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="card-glass max-w-md w-full animate-scale-in">
                        <div className="p-6 border-b border-gray-200 dark:border-secondary-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Assign Payment Gateway
                                </h3>
                                <button
                                    onClick={() => setShowPaymentGatewayModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                                {selectedVote
                                    ? `Assign payment gateway for: ${selectedVote.title}`
                                    : 'Select a vote and payment gateway to assign'
                                }
                            </p>
                        </div>

                        <div className="p-6">
                            <div className="space-y-4">
                                {!selectedVote && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Vote
                                        </label>
                                        <select
                                            value={paymentGatewayData.vote_id}
                                            onChange={(e) => setPaymentGatewayData(prev => ({ ...prev, vote_id: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        >
                                            <option value="">Choose a vote...</option>
                                            {votes.map((vote: any) => (
                                                <option key={vote.vote_id} value={vote.vote_id}>
                                                    {vote.title} ({vote.status})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Payment Gateway
                                    </label>
                                    <div className="space-y-2">
                                        {paymentGateways.map((gateway: any) => (
                                            <div
                                                key={gateway.pg_id}
                                                onClick={() => setPaymentGatewayData(prev => ({
                                                    ...prev,
                                                    pg_id: gateway.pg_id,
                                                    vote_id: selectedVote ? selectedVote.vote_id : prev.vote_id
                                                }))}
                                                className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${paymentGatewayData.pg_id === gateway.pg_id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="p-2 bg-gray-100 rounded-lg mr-3">
                                                            <CreditCard className="w-4 h-4 text-gray-600" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-gray-900">{gateway.name}</h4>
                                                            <p className="text-sm text-gray-500">
                                                                Status: <span className={`font-medium ${gateway.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {gateway.status}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {paymentGatewayData.pg_id === gateway.pg_id && (
                                                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {paymentGateways.length === 0 && (
                                <div className="text-center py-8">
                                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">No payment gateways available</p>
                                </div>
                            )}

                            <div className="mt-6 flex space-x-3">
                                <button
                                    onClick={() => setShowPaymentGatewayModal(false)}
                                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePaymentGatewaySubmit}
                                    disabled={assignPaymentGatewayMutation.isPending || !paymentGatewayData.pg_id || (!selectedVote && !paymentGatewayData.vote_id)}
                                    className="flex-1 py-2 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    {assignPaymentGatewayMutation.isPending ? 'Assigning...' : 'Assign Gateway'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Voting Details Modal */}
            {showVotingDetailsModal && selectedVote && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="card-glass max-w-2xl w-full animate-scale-in">
                        <div className="p-6 border-b border-gray-200 dark:border-secondary-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Voting Details: {selectedVote.title}
                                </h3>
                                <button
                                    onClick={() => setShowVotingDetailsModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Vote Information */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Vote ID</label>
                                    <p className="text-sm text-gray-900">{selectedVote.vote_id}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                    <div className="mt-1">{getStatusBadge(selectedVote.status)}</div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Payment Mode</label>
                                    <p className="text-sm text-gray-900">{selectedVote.payment_mode}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Price per Vote</label>
                                    <p className="text-sm text-gray-900">₦{selectedVote.price_per_vote?.toLocaleString() || 0}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Total Nominees</label>
                                    <p className="text-sm text-gray-900">{selectedVote.nominees_count || 0}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Total Votes</label>
                                    <p className="text-sm text-gray-900">{selectedVote.total_votes || 0}</p>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <Link
                                        to={`/contest/${selectedVote.slug}/${selectedVote.vote_id}`}
                                        target="_blank"
                                        className="flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                                        onClick={() => setShowVotingDetailsModal(false)}
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Voting
                                    </Link>
                                    <Link
                                        to={`/contest/${selectedVote.slug}/nominees`}
                                        target="_blank"
                                        className="flex items-center justify-center px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors duration-200"
                                        onClick={() => setShowVotingDetailsModal(false)}
                                    >
                                        <Users className="w-4 h-4 mr-2" />
                                        Nominees
                                    </Link>
                                    <Link
                                        to={`/votes/${selectedVote.slug}/${selectedVote.vote_id}/results`}
                                        className="flex items-center justify-center px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200"
                                        onClick={() => setShowVotingDetailsModal(false)}
                                    >
                                        <BarChart3 className="w-4 h-4 mr-2" />
                                        Results
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleShareVote(selectedVote);
                                            setShowVotingDetailsModal(false);
                                        }}
                                        className="flex items-center justify-center px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors duration-200"
                                    >
                                        <Share2 className="w-4 h-4 mr-2" />
                                        Share
                                    </button>
                                </div>
                            </div>

                            {/* Vote Description */}
                            {selectedVote.description && (
                                <div className="border-t pt-4">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                                    <p className="text-sm text-gray-600">{selectedVote.description}</p>
                                </div>
                            )}

                            {/* Vote Dates */}
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Important Dates</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    {selectedVote.nomination_start && (
                                        <div>
                                            <label className="font-medium text-gray-500">Nomination Start</label>
                                            <p className="text-gray-900">{new Date(selectedVote.nomination_start).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}</p>
                                        </div>
                                    )}
                                    {selectedVote.nomination_end_date && (
                                        <div>
                                            <label className="font-medium text-gray-500">Nomination End</label>
                                            <p className="text-gray-900">{new Date(selectedVote.nomination_end_date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}</p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="font-medium text-gray-500">Start Date</label>
                                        <p className="text-gray-900">{new Date(selectedVote.start_date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}</p>
                                    </div>
                                    <div>
                                        <label className="font-medium text-gray-500">End Date</label>
                                        <p className="text-gray-900">{new Date(selectedVote.end_date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}</p>
                                    </div>
                                    {selectedVote.release_result_date && (
                                        <div>
                                            <label className="font-medium text-gray-500">Results Date</label>
                                            <p className="text-gray-900">{new Date(selectedVote.release_result_date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200">
                            <button
                                onClick={() => setShowVotingDetailsModal(false)}
                                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Vote Form Modal */}
            <VoteFormModal
                isOpen={showCreateModal || showEditModal}
                onClose={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedVote(null);
                }}
                vote={selectedVote}
                mode={showCreateModal ? 'create' : 'edit'}
            />
        </div>
    );
};

export default AdminVotes; 