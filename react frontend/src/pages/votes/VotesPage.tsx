import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
    Plus,
    Search,
    Filter,
    Download,
    Edit,
    Trash2,
    Eye,
    Users,
    BarChart3,
    Calendar,
    DollarSign,
    Activity,
    Settings,
    Vote,
    Trophy,
    Clock,
    AlertTriangle,
    ExternalLink,
    Copy,
    CheckCircle,
    XCircle,
    MoreVertical,
    Share2,
    CreditCard,
    UserPlus,
    X
} from 'lucide-react'
import { adminApi } from '../../services/api'
import { VoteManagement } from '../../types'
import AdminLayout from '../../components/AdminLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import VoteFormModal from '../../components/VoteFormModal'
import { useAuditLogger } from '../../hooks/useAuditLogger'
import { getNomineeImageUrl } from '../../utils/imageUtils'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const VotesPage: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [paymentModeFilter, setPaymentModeFilter] = useState('')
    const [dateFromFilter, setDateFromFilter] = useState('')
    const [dateToFilter, setDateToFilter] = useState('')
    const [dateTypeFilter, setDateTypeFilter] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedVote, setSelectedVote] = useState<VoteManagement | null>(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    // Enhanced dropdown and SuperAdmin controls
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)
    const [showManualVoteModal, setShowManualVoteModal] = useState(false)
    const [showPaymentGatewayModal, setShowPaymentGatewayModal] = useState(false)
    const [showViewVoteModal, setShowViewVoteModal] = useState(false)
    const [manualVoteData, setManualVoteData] = useState({
        vote_id: '',
        nominee_id: '',
        quantity: 1,
        voter_name: '',
        voter_email: '',
        notes: ''
    })
    const [paymentGatewayData, setPaymentGatewayData] = useState({
        vote_id: '',
        pg_id: ''
    })

    const queryClient = useQueryClient()
    const { logUserAction, logButtonClick } = useAuditLogger({ context: 'VotesManagement' })
    const { user } = useAuth()

    // Check if user is superadmin
    const isSuperAdmin = user?.role?.name === 'superadmin'

    // Fetch votes with pagination and filtering using existing API
    const { data: votesData, isLoading, error, refetch } = useQuery({
        queryKey: ['admin-votes', currentPage, searchQuery, statusFilter, paymentModeFilter, dateFromFilter, dateToFilter, dateTypeFilter],
        queryFn: () => adminApi.getVotes({
            page: currentPage,
            per_page: 20,
            search: searchQuery || undefined,
            status: statusFilter || undefined,
            payment_mode: paymentModeFilter || undefined,
            date_from: dateFromFilter || undefined,
            date_to: dateToFilter || undefined,
            date_type: dateTypeFilter || undefined,
        }),
        refetchInterval: 30000
    })

    // Fetch payment gateways for SuperAdmin
    const { data: paymentGatewaysData } = useQuery({
        queryKey: ['payment-gateways'],
        queryFn: () => fetch(`${import.meta.env.VITE_API_URL}/payment-gateways`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        }).then(async res => {
            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.message || `HTTP ${res.status}: Failed to fetch payment gateways`);
            }
            return result;
        }),
        enabled: isSuperAdmin
    })

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
    })

    // Delete vote mutation using existing API
    const deleteMutation = useMutation({
        mutationFn: (id: number) => adminApi.deleteVote(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-votes'] })
            toast.success('Election deleted successfully')
            setShowDeleteModal(false)
            setSelectedVote(null)
            logUserAction('vote_deleted', { vote_id: selectedVote?.id })
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to delete election';
            console.error('Delete vote error:', error);
            toast.error(errorMessage);
        }
    })

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
            const errorMessage = error.message || 'Failed to add manual vote';
            console.error('Manual vote error:', error);
            toast.error(errorMessage);
        }
    })

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
            const errorMessage = error.message || 'Failed to assign payment gateway';
            console.error('Payment gateway assignment error:', error);
            toast.error(errorMessage);
        }
    })

    useEffect(() => {
        logUserAction('votes_management_viewed', {
            page: currentPage,
            search: !!searchQuery,
            filters: {
                status: statusFilter,
                payment_mode: paymentModeFilter,
                date_from: dateFromFilter,
                date_to: dateToFilter,
                date_type: dateTypeFilter
            }
        })
    }, [currentPage, searchQuery, statusFilter, paymentModeFilter, dateFromFilter, dateToFilter, dateTypeFilter, logUserAction])

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
    }, [openDropdown])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)
        refetch() // Trigger a refetch with new filters
        logUserAction('votes_search', {
            query: searchQuery,
            filters: {
                status: statusFilter,
                payment_mode: paymentModeFilter,
                date_from: dateFromFilter,
                date_to: dateToFilter,
                date_type: dateTypeFilter
            }
        })
    }

    // Auto-refetch when filters change
    useEffect(() => {
        if (currentPage === 1) {
            refetch()
        }
    }, [statusFilter, paymentModeFilter, dateFromFilter, dateToFilter, dateTypeFilter, refetch])

    const handleCreateVote = () => {
        setShowCreateModal(true)
        logButtonClick('create_vote_modal')
    }

    const handleEditVote = (vote: VoteManagement) => {
        setSelectedVote(vote)
        setShowEditModal(true)
        logButtonClick('edit_vote_modal', `vote_${vote.id}`)
    }

    const handleDeleteVote = (vote: VoteManagement) => {
        setSelectedVote(vote)
        setShowDeleteModal(true)
        logButtonClick('delete_vote_modal', `vote_${vote.id}`)
    }

    const confirmDelete = () => {
        if (selectedVote) {
            deleteMutation.mutate(selectedVote.id)
        }
    }

    // SuperAdmin handler functions
    const handleManualVoteEntry = (vote: VoteManagement) => {
        setSelectedVote(vote);
        setManualVoteData(prev => ({ ...prev, vote_id: vote.vote_id }));
        setShowManualVoteModal(true);
    };

    const handleViewVote = (vote: VoteManagement) => {
        setSelectedVote(vote);
        setShowViewVoteModal(true);
    };

    const handlePaymentGatewayAssign = (vote: VoteManagement) => {
        setSelectedVote(vote);
        setPaymentGatewayData({ vote_id: vote.vote_id, pg_id: '' });
        setShowPaymentGatewayModal(true);
    };

    const handleManualVoteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualVoteData.vote_id || !manualVoteData.nominee_id) {
            toast.error('Please select vote and nominee');
            return;
        }
        manualVoteMutation.mutate(manualVoteData);
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

    const handleShareVote = async (vote: VoteManagement) => {
        try {
            // Create frontend-based share links
            const baseUrl = window.location.origin;
            const votingUrl = `${baseUrl}/votes/${vote.slug}/${vote.vote_id}`;
            const nominationUrl = `${baseUrl}/contest/${vote.slug}`;
            const resultsUrl = `${baseUrl}/votes/${vote.slug}/${vote.vote_id}/results`;

            // For now, copy the voting URL to clipboard
            await navigator.clipboard.writeText(votingUrl);
            toast.success('Voting link copied to clipboard!');

            // Optional: Show additional info
            console.log('Share URLs:', {
                voting: votingUrl,
                nomination: nominationUrl,
                results: resultsUrl
            });
        } catch (error: any) {
            console.error('Share vote error:', error);
            toast.error('Failed to copy share link');
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            STARTED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            COMPLETED: { color: 'bg-blue-100 text-blue-800', icon: Trophy },
            POSTPONED: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
            INACTIVE: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
        }

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INACTIVE
        const Icon = config.icon

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {status}
            </span>
        )
    }

    // Cast the votes data to VoteManagement type since backend returns the correct format
    const votes = (votesData?.data as unknown || []) as VoteManagement[]
    const pagination = votesData ? {
        current_page: votesData.current_page,
        last_page: votesData.last_page,
        per_page: votesData.per_page,
        total: votesData.total
    } : null

    // Additional data for SuperAdmin features
    const nominees = nomineesData?.data?.nominees || [];
    const paymentGateways = paymentGatewaysData?.data || [];

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <nav className="text-sm text-gray-500 mb-2">
                    <Link to="/admin/dashboard" className="hover:text-gray-700">Home</Link>
                    <span className="mx-2">•</span>
                    <span className="text-gray-900">Elections Management</span>
                </nav>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Elections Management</h1>
                        <p className="text-gray-600 mt-1">
                            Create, edit, delete and manage your elections along with positions, nominees lists, and transactions
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleCreateVote}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create Election</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Vote className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Elections</p>
                            <p className="text-2xl font-bold text-gray-900">{pagination?.total || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Active Elections</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {votes.filter(v => v.status === 'STARTED').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Nominees</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {votes.reduce((sum, v) => sum + (v.nominees_count || 0), 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Votes</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {votes.reduce((sum, v) => sum + (v.total_votes || 0), 0)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Search className="w-4 h-4 inline mr-1" />
                            <span className="hidden sm:inline">Search</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Search elections..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="min-w-[120px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Filter className="w-4 h-4 inline mr-1" />
                            <span className="hidden sm:inline">Status</span>
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All</option>
                            <option value="STARTED">Started</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="POSTPONED">Postponed</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>

                    <div className="min-w-[120px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <DollarSign className="w-4 h-4 inline mr-1" />
                            <span className="hidden sm:inline">Payment</span>
                        </label>
                        <select
                            value={paymentModeFilter}
                            onChange={(e) => setPaymentModeFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All</option>
                            <option value="FREE">Free</option>
                            <option value="PAID">Paid</option>
                        </select>
                    </div>

                    <div className="min-w-[140px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            <span className="hidden sm:inline">From</span>
                        </label>
                        <input
                            type="date"
                            value={dateFromFilter}
                            onChange={(e) => setDateFromFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="min-w-[140px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            <span className="hidden sm:inline">To</span>
                        </label>
                        <input
                            type="date"
                            value={dateToFilter}
                            onChange={(e) => setDateToFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            type="submit"
                            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Search</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery('')
                                setStatusFilter('')
                                setPaymentModeFilter('')
                                setDateFromFilter('')
                                setDateToFilter('')
                                setDateTypeFilter('')
                                setCurrentPage(1)
                            }}
                            className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                        >
                            <span className="hidden sm:inline">Clear</span>
                            <span className="sm:hidden">✕</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Votes Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        All Elections ({pagination?.total || 0})
                    </h2>
                </div>

                {error ? (
                    <div className="p-8 text-center text-red-500">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                        <p>Failed to load elections</p>
                        <button
                            onClick={() => refetch()}
                            className="mt-2 text-blue-600 hover:text-blue-800"
                        >
                            Try again
                        </button>
                    </div>
                ) : votes.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-gray-400 mb-4">
                            <Vote className="w-24 h-24 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Elections Found</h3>
                        <p className="text-gray-600 mb-4">
                            {searchQuery || statusFilter || paymentModeFilter || dateFromFilter || dateToFilter || dateTypeFilter
                                ? 'No elections match your current filters.'
                                : 'Create your first election to get started.'
                            }
                        </p>
                        {!searchQuery && !statusFilter && !paymentModeFilter && !dateFromFilter && !dateToFilter && !dateTypeFilter && (
                            <button
                                onClick={handleCreateVote}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Create Your First Election</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Election
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Payment
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Statistics
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Dates
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                                {votes.map((vote) => (
                                    <tr key={vote.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0">
                                                    <img
                                                        src={getNomineeImageUrl({ image: vote.image })}
                                                        alt={vote.title}
                                                        className="w-12 h-12 rounded-lg object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {vote.title}
                                                        </p>
                                                        {isSuperAdmin && (
                                                            <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-600 rounded-full" title="Admin controls available">
                                                                Admin
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 truncate">
                                                        ID: {vote.vote_id}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {vote.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(vote.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <div className="flex items-center">
                                                    <span className={`font-medium ${vote.payment_mode === 'FREE' ? 'text-green-600' : 'text-blue-600'}`}>
                                                        {vote.payment_mode}
                                                    </span>
                                                </div>
                                                {vote.payment_mode === 'PAID' && (
                                                    <p className="text-xs text-gray-500">
                                                        ₦{vote.price_per_vote} per vote
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500 space-y-1">
                                                <div className="flex items-center">
                                                    <Users className="w-3 h-3 mr-1" />
                                                    {vote.positions_count} positions
                                                </div>
                                                <div className="flex items-center">
                                                    <Users className="w-3 h-3 mr-1" />
                                                    {vote.nominees_count} nominees
                                                </div>
                                                <div className="flex items-center">
                                                    <BarChart3 className="w-3 h-3 mr-1" />
                                                    {vote.total_votes} votes
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-gray-500 space-y-1">
                                                {vote.start_date && (
                                                    <div>Start: {format(new Date(vote.start_date), 'MMM dd, yyyy')}</div>
                                                )}
                                                {vote.end_date && (
                                                    <div>End: {format(new Date(vote.end_date), 'MMM dd, yyyy')}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative dropdown-container">
                                                <button
                                                    onClick={() => setOpenDropdown(openDropdown === vote.vote_id ? null : vote.vote_id)}
                                                    className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                                    title="More actions"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>

                                                {openDropdown === vote.vote_id && (
                                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                                                        <div className="py-1">
                                                            {/* View & Manage Actions */}
                                                            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                                                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">View & Manage</span>
                                                            </div>

                                                            <button
                                                                onClick={() => {
                                                                    handleViewVote(vote);
                                                                    setOpenDropdown(null);
                                                                }}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                                                            >
                                                                <Eye className="w-4 h-4 mr-3 text-blue-500" />
                                                                View Details
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    handleEditVote(vote);
                                                                    setOpenDropdown(null);
                                                                }}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                                                            >
                                                                <Edit className="w-4 h-4 mr-3 text-blue-500" />
                                                                Edit Election
                                                            </button>

                                                            <Link
                                                                to={`/admin/votes/${vote.slug}/positions`}
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
                                                                View Nominees
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
                                                                <Activity className="w-4 h-4 mr-3 text-purple-500" />
                                                                View Transactions
                                                            </Link>

                                                            {/* SuperAdmin Actions */}
                                                            {isSuperAdmin && (
                                                                <>
                                                                    <div className="px-3 py-2 bg-orange-50 border-b border-t border-orange-100 mt-1">
                                                                        <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Admin Controls</span>
                                                                    </div>

                                                                    <button
                                                                        onClick={() => {
                                                                            handleManualVoteEntry(vote);
                                                                            setOpenDropdown(null);
                                                                        }}
                                                                        className="flex items-center w-full px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 transition-colors duration-150"
                                                                        title="Add manual votes for this election"
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
                                                                        title="Assign payment gateway to this election"
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
                                                                Share Election
                                                            </button>

                                                            {/* Danger Zone */}
                                                            {vote.status === 'INACTIVE' && (
                                                                <>
                                                                    <div className="border-t border-gray-100 mt-1"></div>
                                                                    <button
                                                                        onClick={() => {
                                                                            handleDeleteVote(vote);
                                                                            setOpenDropdown(null);
                                                                        }}
                                                                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                                                                    >
                                                                        <Trash2 className="w-4 h-4 mr-3" />
                                                                        Delete Election
                                                                    </button>
                                                                </>
                                                            )}
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

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedVote && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Delete Election
                                </h3>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete "<strong>{selectedVote.title}</strong>"?
                                This action cannot be undone and will delete all associated positions and nominees.
                            </p>
                            <div className="flex items-center justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false)
                                        setSelectedVote(null)
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={deleteMutation.isPending}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {deleteMutation.isPending ? 'Deleting...' : 'Delete Election'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Vote Form Modal */}
            <VoteFormModal
                isOpen={showCreateModal || showEditModal}
                onClose={() => {
                    setShowCreateModal(false)
                    setShowEditModal(false)
                    setSelectedVote(null)
                }}
                vote={selectedVote}
                mode={showCreateModal ? 'create' : 'edit'}
            />

            {/* Manual Vote Entry Modal */}
            {showManualVoteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
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

            {/* Payment Gateway Assignment Modal */}
            {showPaymentGatewayModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
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
                                Assign payment gateway for: <strong>{selectedVote?.title}</strong>
                            </p>
                        </div>

                        <div className="p-6">
                            <div className="space-y-4">
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
                                                    pg_id: gateway.pg_id
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
                                    disabled={assignPaymentGatewayMutation.isPending || !paymentGatewayData.pg_id}
                                    className="flex-1 py-2 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    {assignPaymentGatewayMutation.isPending ? 'Assigning...' : 'Assign Gateway'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Vote Modal */}
            {showViewVoteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    View Vote Details
                                </h3>
                                <button
                                    onClick={() => setShowViewVoteModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                                Details for: <strong>{selectedVote?.title}</strong>
                            </p>
                        </div>

                        <div className="p-6">
                            {selectedVote && (
                                <div className="space-y-4">
                                    {/* Vote Image */}
                                    {selectedVote.image && (
                                        <div className="flex justify-center">
                                            <img
                                                src={getNomineeImageUrl({ image: selectedVote.image })}
                                                alt={selectedVote.title}
                                                className="w-32 h-32 rounded-lg object-cover border border-gray-200"
                                            />
                                        </div>
                                    )}

                                    {/* Vote Information */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Vote ID</label>
                                            <p className="mt-1 text-sm text-gray-900">{selectedVote.vote_id}</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Description</label>
                                            <p className="mt-1 text-sm text-gray-900">{selectedVote.description || 'No description provided'}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                                <div className="mt-1">{getStatusBadge(selectedVote.status)}</div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Payment Mode</label>
                                                <p className={`mt-1 text-sm font-medium ${selectedVote.payment_mode === 'FREE' ? 'text-green-600' : 'text-blue-600'}`}>
                                                    {selectedVote.payment_mode}
                                                </p>
                                            </div>
                                        </div>

                                        {selectedVote.payment_mode === 'PAID' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Price per Vote</label>
                                                <p className="mt-1 text-sm text-gray-900">₦{selectedVote.price_per_vote}</p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Positions</label>
                                                <p className="mt-1 text-lg font-semibold text-gray-900">{selectedVote.positions_count || 0}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Nominees</label>
                                                <p className="mt-1 text-lg font-semibold text-gray-900">{selectedVote.nominees_count || 0}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Total Votes</label>
                                                <p className="mt-1 text-lg font-semibold text-gray-900">{selectedVote.total_votes || 0}</p>
                                            </div>
                                        </div>

                                        {(selectedVote.start_date || selectedVote.end_date) && (
                                            <div className="grid grid-cols-2 gap-3">
                                                {selectedVote.start_date && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Start Date</label>
                                                        <p className="mt-1 text-sm text-gray-900">
                                                            {format(new Date(selectedVote.start_date), 'MMM dd, yyyy')}
                                                        </p>
                                                    </div>
                                                )}
                                                {selectedVote.end_date && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">End Date</label>
                                                        <p className="mt-1 text-sm text-gray-900">
                                                            {format(new Date(selectedVote.end_date), 'MMM dd, yyyy')}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex space-x-3 pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => {
                                                setShowViewVoteModal(false);
                                                handleEditVote(selectedVote);
                                            }}
                                            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                        >
                                            Edit Vote
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowViewVoteModal(false);
                                                handleShareVote(selectedVote);
                                            }}
                                            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                        >
                                            Share
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default VotesPage 