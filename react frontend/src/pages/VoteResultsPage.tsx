import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    Trophy,
    Medal,
    Star,
    ChevronDown,
    Search,
    Users,
    Filter,
    BarChart3,
    Download,
    Share2,
    Calendar,
    MapPin,
    Clock,
    X,
    Award,
    TrendingUp,
    PieChart,
    Activity,
    FileText,
    Printer,
    ExternalLink
} from 'lucide-react'
import { votesApi } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatNumber } from '../utils/format'
import { getNomineeImageUrl } from '../utils/imageUtils'

interface Position {
    id: number
    title: string
    position_id: string
    slug: string
    vote_id: string
    gender: string
    minimum: string
    maximum: string
    status: string
}

interface Nominee {
    id: number
    first_name: string
    last_name: string
    nick_name?: string
    email?: string
    phone?: string
    level: string
    gender: string
    image?: string
    total_votes: string | number
    nominees_id: string
    position_id: string
    vote_id: string
}

interface VoteResult {
    position: Position
    nominees: Nominee[]
}

interface VoteData {
    id: number
    account_id: string
    levels: string[]
    image: string
    payment_mode: string
    price_per_vote: string
    status: string
    created_at: string
    updated_at: string
    user: {
        id: number
        account_id: string
        first_name: string
        last_name: string
    }
}

interface ApiResponse {
    status: string
    data: {
        vote: VoteData
        results: VoteResult[]
    }
}

const VoteResultsPage: React.FC = () => {
    const { slug, voteId } = useParams<{ slug: string; voteId: string }>()
    const [searchParams, setSearchParams] = useSearchParams()

    const [selectedPosition, setSelectedPosition] = useState<string>('')
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)
    const [genderFilter, setGenderFilter] = useState(searchParams.get('gender') || '')
    const [showFilters, setShowFilters] = useState(false)
    const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null)

    // Debounce search term to avoid too many API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, 500)

        return () => clearTimeout(timer)
    }, [searchTerm])

    // Close lightbox on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setLightboxImage(null)
            }
        }

        if (lightboxImage) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [lightboxImage])

    // Fetch vote results
    const { data: resultsData, isLoading: resultsLoading } = useQuery<ApiResponse>({
        queryKey: ['vote-results', slug, voteId, selectedPosition, debouncedSearchTerm, genderFilter],
        queryFn: async () => {
            if (!slug || !voteId) throw new Error('Slug and Vote ID are required')

            // Build query parameters for filtering
            const params = new URLSearchParams()
            if (selectedPosition) params.append('position', selectedPosition)
            if (debouncedSearchTerm) params.append('search', debouncedSearchTerm)
            if (genderFilter) params.append('gender', genderFilter)

            const queryString = params.toString()
            const url = `${import.meta.env.VITE_API_URL}/votes/${slug}/${voteId}/results${queryString ? `?${queryString}` : ''}`

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch vote results')
            }

            return response.json()
        },
        enabled: !!(slug && voteId),
    })

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams()
        if (selectedPosition) params.set('position', selectedPosition)
        if (debouncedSearchTerm) params.set('search', debouncedSearchTerm)
        if (genderFilter) params.set('gender', genderFilter)
        setSearchParams(params)
    }, [selectedPosition, debouncedSearchTerm, genderFilter, setSearchParams])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        // Search is handled by useEffect above
    }

    const handleJumpToPosition = (positionId: string) => {
        setSelectedPosition(positionId)
        const element = document.getElementById(`position-${positionId}`)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    const clearFilters = () => {
        setSelectedPosition('')
        setSearchTerm('')
        setGenderFilter('')
    }

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="w-5 h-5 text-yellow-500" />
            case 2:
                return <Medal className="w-5 h-5 text-gray-400" />
            case 3:
                return <Medal className="w-5 h-5 text-amber-600" />
            default:
                return <div className="w-5 h-5 flex items-center justify-center bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{rank}</div>
        }
    }

    const getRankBadge = (rank: number) => {
        switch (rank) {
            case 1: return 'bg-yellow-500 text-white'
            case 2: return 'bg-gray-400 text-white'
            case 3: return 'bg-amber-600 text-white'
            default: return 'bg-blue-500 text-white'
        }
    }

    // Utility function to safely format numbers
    const safeFormatNumber = (value: string | number | undefined): number => {
        if (typeof value === 'number') return value
        if (typeof value === 'string') {
            const parsed = parseInt(value, 10)
            return isNaN(parsed) ? 0 : parsed
        }
        return 0
    }

    const getNomineeImageUrl = (nominee: { image?: string }) => {
        if (!nominee.image) return '/images/default-avatar.jpg'
        if (nominee.image.startsWith('http')) return nominee.image
        return `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${nominee.image}`
    }

    // Share functionality
    const handleShare = () => {
        const currentUrl = window.location.href
        const voteTitle = resultsData?.data?.vote?.user ?
            `${resultsData.data.vote.user.first_name} ${resultsData.data.vote.user.last_name}'s Vote` :
            'Vote Results'

        if (navigator.share) {
            navigator.share({
                title: `${voteTitle} - Results`,
                text: `Check out the results for ${voteTitle}!`,
                url: currentUrl,
            }).catch((error) => console.log('Error sharing:', error))
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(currentUrl).then(() => {
                toast.success('Link copied to clipboard!')
            }).catch(() => {
                toast.error('Failed to copy link')
            })
        }
    }

    // Export functionality
    const handleExport = async (format: 'csv' | 'pdf') => {
        try {
            if (!resultsData?.data?.results) {
                toast.error('No results data to export')
                return
            }

            if (format === 'csv') {
                // Generate CSV data
                let csvContent = 'Position,Nominee Name,Votes,Percentage,Rank\n'

                resultsData.data.results.forEach((result: VoteResult) => {
                    const positionName = result.position?.title || 'Unknown Position'
                    result.nominees?.forEach((nominee: Nominee, index: number) => {
                        const totalVotes = result.nominees?.reduce((sum: number, n: Nominee) => sum + safeFormatNumber(n.total_votes), 0) || 1
                        const nomineevotes = safeFormatNumber(nominee.total_votes)
                        const percentage = ((nomineevotes / totalVotes) * 100).toFixed(1)
                        const nomineeName = `${nominee.first_name || ''} ${nominee.last_name || ''}`.trim() || 'Unknown'
                        csvContent += `"${positionName}","${nomineeName}",${nomineevotes},${percentage}%,${index + 1}\n`
                    })
                })

                // Download CSV
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                const link = document.createElement('a')
                link.href = URL.createObjectURL(blob)
                link.download = `${slug}-${voteId}-results.csv`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)

                toast.success('Results exported to CSV!')
            } else if (format === 'pdf') {
                // For PDF, we'll create a print-friendly version
                window.print()
                toast.success('Print dialog opened for PDF export')
            }
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Failed to export results')
        }
    }

    // Get filtered results
    const getFilteredResults = (): VoteResult[] => {
        let results = resultsData?.data?.results || []

        // Filter by position if selected
        if (selectedPosition) {
            results = results.filter(result => result.position?.position_id === selectedPosition)
        }

        // Filter by search term if provided
        if (debouncedSearchTerm) {
            results = results.map(result => ({
                ...result,
                nominees: result.nominees.filter(nominee => {
                    const name = `${nominee.first_name} ${nominee.last_name} ${nominee.nick_name || ''}`.toLowerCase()
                    return name.includes(debouncedSearchTerm.toLowerCase())
                })
            })).filter(result => result.nominees.length > 0)
        }

        // Filter by gender if selected
        if (genderFilter) {
            results = results.filter(result => result.position?.gender?.toLowerCase() === genderFilter.toLowerCase())
        }

        return results
    }

    // Calculate total votes across all results
    const getTotalVotes = (): number => {
        return getFilteredResults().reduce((sum: number, result: VoteResult) =>
            sum + result.nominees.reduce((nSum: number, nominee: Nominee) => nSum + safeFormatNumber(nominee.total_votes), 0), 0
        )
    }

    if (resultsLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (!resultsData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Vote Not Found</h2>
                    <p className="text-gray-600">The requested vote could not be found.</p>
                </div>
            </div>
        )
    }

    const vote = resultsData.data.vote
    const voteTitle = vote?.user ? `${vote.user.first_name} ${vote.user.last_name}'s Vote` : 'Vote Results'

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                                {voteTitle} - Results
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>Created: {new Date(vote.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>Updated: {new Date(vote.updated_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    <span>{formatNumber(getTotalVotes())} total votes</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${vote.status === 'STARTED' ? 'bg-green-100 text-green-800' :
                                        vote.status === 'ENDED' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {vote.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Share2 className="w-4 h-4" />
                                <span>Share</span>
                            </button>
                            <div className="relative group">
                                <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                    <Download className="w-4 h-4" />
                                    <span>Export</span>
                                    <ChevronDown className="w-3 h-3" />
                                </button>
                                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                    <button
                                        onClick={() => handleExport('csv')}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg flex items-center gap-2"
                                    >
                                        <Download className="w-3 h-3" />
                                        Export CSV
                                    </button>
                                    <button
                                        onClick={() => handleExport('pdf')}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg flex items-center gap-2"
                                    >
                                        <Download className="w-3 h-3" />
                                        Print/PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className={`bg-white rounded-lg shadow-sm transition-all duration-300 mb-6 ${showFilters ? 'p-6' : 'p-4'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Filter Results</h3>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Filter className="w-4 h-4" />
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    <div className={`transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Position Selector */}
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Position
                                </label>
                                <select
                                    value={selectedPosition}
                                    onChange={(e) => setSelectedPosition(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Positions</option>
                                    {resultsData?.data?.results?.map((result: VoteResult, index: number) => (
                                        <option key={result.position?.position_id || index} value={result.position?.position_id}>
                                            {result.position?.title} ({result.nominees?.length || 0} nominees)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Search */}
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Search Nominees
                                </label>
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by name..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Gender Filter */}
                            <div className="lg:w-48">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Gender
                                </label>
                                <select
                                    value={genderFilter}
                                    onChange={(e) => setGenderFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Genders</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* Clear Filters */}
                            {(selectedPosition || searchTerm || genderFilter) && (
                                <div className="lg:w-auto flex items-end">
                                    <button
                                        onClick={clearFilters}
                                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                        <span>Clear</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Navigation */}
                {resultsData?.data?.results && resultsData.data.results.length > 1 && (
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Navigation</h4>
                        <div className="flex flex-wrap gap-2">
                            {resultsData.data.results.map((result: VoteResult, index: number) => (
                                <button
                                    key={result.position?.position_id || index}
                                    onClick={() => handleJumpToPosition(result.position?.position_id || index.toString())}
                                    className="inline-flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors"
                                >
                                    <Award className="w-3 h-3 mr-1" />
                                    {result.position?.title}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Results Summary */}
                {resultsData?.data?.results && (
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                {(selectedPosition || debouncedSearchTerm || genderFilter) ? (
                                    <>
                                        Showing {getFilteredResults().length} filtered positions
                                        {debouncedSearchTerm && ` matching "${debouncedSearchTerm}"`}
                                        {genderFilter && ` • ${genderFilter} positions`}
                                        {selectedPosition && ` • specific position`}
                                    </>
                                ) : (
                                    `Showing all ${getFilteredResults().length} positions`
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                {(selectedPosition || debouncedSearchTerm || genderFilter) && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                    >
                                        <X className="w-3 h-3" />
                                        Clear Filters
                                    </button>
                                )}
                                <span className="text-xs text-gray-500">
                                    Total Votes: {getTotalVotes().toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Results */}
                {resultsLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : (
                    <div className="space-y-8">
                        {getFilteredResults().length === 0 ? (
                            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                                <div className="text-gray-400 mb-4">
                                    <BarChart3 className="w-16 h-16 mx-auto" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {(selectedPosition || debouncedSearchTerm || genderFilter) ? 'No Results Found' : 'No Results Available'}
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    {(selectedPosition || debouncedSearchTerm || genderFilter)
                                        ? 'No nominees match your current filters. Try adjusting your search criteria.'
                                        : 'No voting results are available for this vote yet.'}
                                </p>
                                {(selectedPosition || debouncedSearchTerm || genderFilter) && (
                                    <button
                                        onClick={clearFilters}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Clear All Filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            getFilteredResults().map((result: VoteResult, index: number) => (
                                <div key={result.position?.position_id || index} id={`position-${result.position?.position_id || index}`} className="bg-white rounded-lg shadow-sm overflow-hidden">
                                    {/* Position Header */}
                                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">
                                                    {result.position?.title}
                                                </h2>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                                    <span className="capitalize">Gender: {result.position?.gender?.toLowerCase()}</span>
                                                    <span>Min: {result.position?.minimum}</span>
                                                    <span>Max: {result.position?.maximum}</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${result.position?.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {result.position?.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-blue-600">
                                                    {formatNumber(result.nominees?.reduce((sum: number, nominee: Nominee) => sum + safeFormatNumber(nominee.total_votes), 0) || 0)}
                                                </div>
                                                <div className="text-sm text-gray-600">Total Votes</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Nominees Grid */}
                                    <div className="p-6">
                                        {result.nominees.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                No nominees found for this position.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {/* Sort nominees by votes (descending) */}
                                                {result.nominees
                                                    .sort((a, b) => safeFormatNumber(b.total_votes) - safeFormatNumber(a.total_votes))
                                                    .map((nominee: Nominee, nomIndex: number) => {
                                                        const totalPositionVotes = result.nominees?.reduce((sum: number, n: Nominee) => sum + safeFormatNumber(n.total_votes), 0) || 1
                                                        const nomineeVotes = safeFormatNumber(nominee.total_votes)
                                                        const percentage = totalPositionVotes > 0 ? ((nomineeVotes / totalPositionVotes) * 100) : 0
                                                        const nomineeImageUrl = getNomineeImageUrl({ image: nominee.image })
                                                        const nomineeName = `${nominee.first_name || ''} ${nominee.last_name || ''}`.trim() || 'Unknown Nominee'

                                                        return (
                                                            <div
                                                                key={nominee.id || nomIndex}
                                                                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 relative overflow-hidden"
                                                            >
                                                                {/* Rank Badge */}
                                                                <div className="absolute top-4 right-4">
                                                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getRankBadge(nomIndex + 1)}`}>
                                                                        #{nomIndex + 1}
                                                                    </div>
                                                                </div>

                                                                {/* Profile Section */}
                                                                <div className="text-center mb-4">
                                                                    {/* Profile Image - Clickable for Lightbox */}
                                                                    <div
                                                                        className="relative w-24 h-24 mx-auto mb-3 cursor-pointer group"
                                                                        onClick={() => setLightboxImage({
                                                                            src: nomineeImageUrl,
                                                                            alt: nomineeName
                                                                        })}
                                                                    >
                                                                        <img
                                                                            src={nomineeImageUrl}
                                                                            alt={nomineeName}
                                                                            className="w-full h-full rounded-full object-cover border-4 border-gray-200 group-hover:border-blue-400 transition-colors"
                                                                            onError={(e) => {
                                                                                (e.target as HTMLImageElement).src = '/images/default-avatar.jpg'
                                                                            }}
                                                                        />
                                                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full flex items-center justify-center transition-all">
                                                                            <Search className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                        </div>
                                                                    </div>

                                                                    {/* Nominee Name */}
                                                                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                                        {nomineeName}
                                                                    </h3>

                                                                    {/* Nickname */}
                                                                    {nominee.nick_name && (
                                                                        <p className="text-sm text-gray-500 mb-1">
                                                                            "{nominee.nick_name}"
                                                                        </p>
                                                                    )}

                                                                    {/* Level */}
                                                                    <p className="text-sm text-blue-600 font-medium mb-3">
                                                                        {nominee.level}
                                                                    </p>
                                                                </div>

                                                                {/* Vote Statistics */}
                                                                <div className="space-y-3">
                                                                    {/* Vote Count */}
                                                                    <div className="text-center">
                                                                        <div className="text-3xl font-bold text-blue-600 mb-1">
                                                                            {formatNumber(nomineeVotes)}
                                                                        </div>
                                                                        <div className="text-sm text-gray-600">
                                                                            {nomineeVotes === 1 ? 'vote' : 'votes'}
                                                                        </div>
                                                                    </div>

                                                                    {/* Percentage Bar */}
                                                                    <div>
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <span className="text-sm font-medium text-gray-700">
                                                                                Vote Share
                                                                            </span>
                                                                            <span className="text-sm font-bold text-gray-900">
                                                                                {percentage.toFixed(1)}%
                                                                            </span>
                                                                        </div>
                                                                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                                            <div
                                                                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out"
                                                                                style={{ width: `${Math.max(percentage, 2)}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    {/* Winner Badge */}
                                                                    {nomIndex === 0 && nomineeVotes > 0 && (
                                                                        <div className="text-center pt-2">
                                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                                                                <Trophy className="w-4 h-4 mr-1" />
                                                                                Winner
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                    {/* Runner-up Badges */}
                                                                    {nomIndex === 1 && nomineeVotes > 0 && (
                                                                        <div className="text-center pt-2">
                                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                                                                <Medal className="w-4 h-4 mr-1" />
                                                                                2nd Place
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                    {nomIndex === 2 && nomineeVotes > 0 && (
                                                                        <div className="text-center pt-2">
                                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                                                                                <Medal className="w-4 h-4 mr-1" />
                                                                                3rd Place
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Lightbox Modal */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                    onClick={() => setLightboxImage(null)}
                >
                    <div className="relative max-w-4xl max-h-full">
                        {/* Close Button */}
                        <button
                            onClick={() => setLightboxImage(null)}
                            className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all z-10"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>

                        {/* Image */}
                        <img
                            src={lightboxImage.src}
                            alt={lightboxImage.alt}
                            className="max-w-full max-h-full object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />

                        {/* Image Caption */}
                        <div className="absolute bottom-4 left-4 right-4 text-center">
                            <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
                                <h3 className="font-semibold">{lightboxImage.alt}</h3>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default VoteResultsPage 