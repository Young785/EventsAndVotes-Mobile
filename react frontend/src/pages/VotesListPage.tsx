import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import {
    Search,
    Filter,
    Calendar,
    Vote,
    User,
    Eye,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { getNomineeImageUrl } from '../utils/imageUtils'

interface Vote {
    id: number
    vote_id: string
    name: string
    slug: string
    description: string
    start_date: string
    end_date: string
    nomination_start: string
    nomination_end_date: string
    release_result_date: string
    image: string
    payment_mode: 'FREE' | 'PAID'
    price_per_vote: number
    status: 'STARTED' | 'COMPLETED' | 'POSTPONED' | 'INACTIVE'
    positions_count: number
    nominees_count: number
    total_votes: number
    created_by: string
    created_at: string
    updated_at: string
}

const VotesListPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
    const [paymentFilter, setPaymentFilter] = useState(searchParams.get('payment') || 'all')
    const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'))

    // Fetch votes
    const { data: votesData, isLoading } = useQuery({
        queryKey: ['votes', searchQuery, statusFilter, paymentFilter, currentPage],
        queryFn: () => {
            const params = new URLSearchParams()
            if (searchQuery) params.append('search', searchQuery)
            if (statusFilter !== 'all') params.append('status', statusFilter)
            if (paymentFilter !== 'all') params.append('payment_mode', paymentFilter)
            params.append('page', currentPage.toString())

            return fetch(`${import.meta.env.VITE_API_URL}/votes?${params}`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(res => res.json())
        }
    })

    const votes = votesData?.data || []
    const pagination = votesData ? {
        current_page: votesData.current_page,
        last_page: votesData.last_page,
        per_page: votesData.per_page,
        total: votesData.total
    } : null

    const handleSearch = () => {
        const params = new URLSearchParams()
        if (searchQuery) params.append('search', searchQuery)
        if (statusFilter !== 'all') params.append('status', statusFilter)
        if (paymentFilter !== 'all') params.append('payment', paymentFilter)
        params.append('page', '1')
        setSearchParams(params)
        setCurrentPage(1)
    }

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams()
        if (searchQuery) params.append('search', searchQuery)
        if (statusFilter !== 'all') params.append('status', statusFilter)
        if (paymentFilter !== 'all') params.append('payment', paymentFilter)
        params.append('page', page.toString())
        setSearchParams(params)
        setCurrentPage(page)
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'STARTED':
                return <CheckCircle className="w-4 h-4 text-green-500" />
            case 'COMPLETED':
                return <CheckCircle className="w-4 h-4 text-blue-500" />
            case 'POSTPONED':
                return <AlertCircle className="w-4 h-4 text-yellow-500" />
            case 'INACTIVE':
                return <XCircle className="w-4 h-4 text-red-500" />
            default:
                return <Clock className="w-4 h-4 text-gray-500" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'STARTED':
                return 'bg-green-100 text-green-800'
            case 'COMPLETED':
                return 'bg-blue-100 text-blue-800'
            case 'POSTPONED':
                return 'bg-yellow-100 text-yellow-800'
            case 'INACTIVE':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const isVotingActive = (vote: Vote) => {
        const now = new Date()
        const startDate = new Date(vote.start_date)
        const endDate = new Date(vote.end_date)
        return vote.status === 'STARTED' && now >= startDate && now <= endDate
    }

    const isNominationActive = (vote: Vote) => {
        const now = new Date()
        const nominationStart = new Date(vote.nomination_start)
        const nominationEnd = new Date(vote.nomination_end_date)
        return now >= nominationStart && now <= nominationEnd
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Voting Events</h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Participate in ongoing voting events and make your voice heard in decisions that matter
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                        <div className="flex-1 max-w-full lg:max-w-lg">
                            <div className="relative">
                                <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search for voting events..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-full pl-12 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                    <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 text-sm sm:text-base min-w-0"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="STARTED">Active</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="POSTPONED">Postponed</option>
                                        <option value="INACTIVE">Inactive</option>
                                    </select>
                                </div>

                                <select
                                    value={paymentFilter}
                                    onChange={(e) => setPaymentFilter(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 text-sm sm:text-base"
                                >
                                    <option value="all">All Types</option>
                                    <option value="FREE">Free</option>
                                    <option value="PAID">Paid</option>
                                </select>
                            </div>

                            <button
                                onClick={handleSearch}
                                className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-sm sm:text-base"
                            >
                                Search
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Votes Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                {votes.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <Vote className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Voting Events Found</h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            No voting events match your current filters. Try adjusting your search criteria or check back later for new events.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {votes.map((vote: Vote) => (
                            <div key={vote.vote_id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                <div className="relative">
                                    <div className="aspect-w-16 aspect-h-9">
                                        <img
                                            src={getNomineeImageUrl({ image: vote.image })}
                                            alt={vote.name}
                                            className="w-full h-48 object-cover"
                                        />
                                    </div>

                                    {/* Status badge overlay */}
                                    <div className="absolute top-4 left-4">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${getStatusColor(vote.status)}`}>
                                            {getStatusIcon(vote.status)}
                                            <span className="ml-1.5">{vote.status}</span>
                                        </span>
                                    </div>

                                    {/* Payment mode badge */}
                                    <div className="absolute top-4 right-4">
                                        {vote.payment_mode === 'PAID' ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 shadow-sm">
                                                ₦{vote.price_per_vote.toLocaleString()}/vote
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 shadow-sm">
                                                Free
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="p-6">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 leading-tight">
                                        {vote.name}
                                    </h3>

                                    <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">
                                        {vote.description}
                                    </p>

                                    {/* Event details */}
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Calendar className="w-4 h-4 mr-3" />
                                            <span>
                                                {new Date(vote.start_date).toLocaleDateString()} - {new Date(vote.end_date).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Vote className="w-4 h-4 mr-2" />
                                                <span>{vote.total_votes} votes</span>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-500">
                                                <User className="w-4 h-4 mr-2" />
                                                <span>{vote.nominees_count} nominees</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status indicators */}
                                    {isVotingActive(vote) && (
                                        <div className="flex items-center text-green-600 text-sm mb-4 p-3 bg-green-50 rounded-lg">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                                            <span className="font-medium">Voting is live!</span>
                                        </div>
                                    )}

                                    {isNominationActive(vote) && !isVotingActive(vote) && (
                                        <div className="flex items-center text-purple-600 text-sm mb-4 p-3 bg-purple-50 rounded-lg">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 animate-pulse"></div>
                                            <span className="font-medium">Nominations open</span>
                                        </div>
                                    )}

                                    {vote.status === 'COMPLETED' && (
                                        <div className="flex items-center text-blue-600 text-sm mb-4 p-3 bg-blue-50 rounded-lg">
                                            <CheckCircle className="w-4 h-4 mr-3" />
                                            <span className="font-medium">Voting completed</span>
                                        </div>
                                    )}

                                    {vote.status === 'INACTIVE' && (
                                        <div className="flex items-center text-gray-600 text-sm mb-4 p-3 bg-gray-50 rounded-lg">
                                            <XCircle className="w-4 h-4 mr-3" />
                                            <span className="font-medium">Not active</span>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="space-y-3">
                                        <Link
                                            to={`/votes/${vote.slug}/${vote.vote_id}`}
                                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2 font-medium"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span>View Details</span>
                                        </Link>

                                        <div className="flex space-x-3">
                                            {isVotingActive(vote) && (
                                                <Link
                                                    to={`/votes/${vote.slug}/${vote.vote_id}`}
                                                    className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center space-x-2 text-sm font-medium"
                                                >
                                                    <Vote className="w-4 h-4" />
                                                    <span>Vote Now</span>
                                                </Link>
                                            )}

                                            {isNominationActive(vote) && !isVotingActive(vote) && (
                                                <Link
                                                    to={`/contest/${vote.slug}`}
                                                    className="flex-1 bg-purple-600 text-white py-2 px-3 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center space-x-2 text-sm font-medium"
                                                >
                                                    <User className="w-4 h-4" />
                                                    <span>Nominate</span>
                                                </Link>
                                            )}

                                            {vote.status === 'COMPLETED' && (
                                                <Link
                                                    to={`/votes/${vote.slug}/${vote.vote_id}/results`}
                                                    className="flex-1 bg-gray-600 text-white py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center space-x-2 text-sm font-medium"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span>Results</span>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.last_page > 1 && (
                    <div className="mt-12 flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="text-sm text-gray-700">
                            Showing <span className="font-medium">{((pagination.current_page - 1) * pagination.per_page) + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> of{' '}
                            <span className="font-medium">{pagination.total}</span> results
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                                const page = i + Math.max(1, currentPage - 2)
                                if (page > pagination.last_page) return null
                                return (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${page === currentPage
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                )
                            })}
                            <button
                                onClick={() => handlePageChange(Math.min(pagination.last_page, currentPage + 1))}
                                disabled={currentPage === pagination.last_page}
                                className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default VotesListPage 