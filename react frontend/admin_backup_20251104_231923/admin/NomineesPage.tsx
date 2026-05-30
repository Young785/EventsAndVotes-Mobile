import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Eye,
    Users,
    BarChart3,
    AlertTriangle,
    ArrowLeft,
    User,
    Settings,
    CheckCircle,
    XCircle,
    Phone,
    Mail,
    Image as ImageIcon,
    Award,
    Upload,
    Download,
    FileText
} from 'lucide-react'
import { nomineesApi, adminApi } from '../../services/api'
import { VoteNominee, Position } from '../../types'
import AdminLayout from '../../components/AdminLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import NomineeFormModal from '../../components/NomineeFormModal'
import { useAuditLogger } from '../../hooks/useAuditLogger'
import toast from 'react-hot-toast'
import { getNomineeImageUrl } from '../../utils/imageUtils'

const NomineesPage: React.FC = () => {
    const { voteSlug } = useParams<{ voteSlug: string }>()
    const [currentPage, setCurrentPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    const [positionFilter, setPositionFilter] = useState('')
    const [genderFilter, setGenderFilter] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedNominee, setSelectedNominee] = useState<VoteNominee | null>(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [voteId, setVoteId] = useState<number | null>(null)
    const [vote, setVote] = useState<any>(null)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [uploadFile, setUploadFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    const queryClient = useQueryClient()
    const { logUserAction, logButtonClick } = useAuditLogger({ context: 'NomineesManagement' })

    // First, get the vote details to get the vote ID
    const { data: votesData } = useQuery({
        queryKey: ['admin-votes'],
        queryFn: () => adminApi.getVotes({ per_page: 1000 }),
        enabled: !!voteSlug
    })

    // Find the vote by slug to get the ID
    useEffect(() => {
        if (votesData?.data && voteSlug) {
            const foundVote = (votesData.data as any[]).find((v: any) => v.slug === voteSlug)
            if (foundVote) {
                // Use the actual ID (primary key), not vote_id field for consistency
                setVoteId(foundVote.id || foundVote.vote_id)
                setVote(foundVote)
            }
        }
    }, [votesData, voteSlug])

    // Fetch nominees - we'll need to get them from the backend
    const { data: nomineesData, isLoading, error, refetch } = useQuery({
        queryKey: ['nominees-management', voteSlug, currentPage, searchQuery, positionFilter, genderFilter],
        queryFn: async () => {
            if (!voteSlug) throw new Error('Vote slug is required')

            const params = new URLSearchParams()
            if (searchQuery) params.append('search', searchQuery)
            if (positionFilter) params.append('position', positionFilter)
            if (genderFilter) params.append('gender', genderFilter)

            // Use the correct API endpoint for nominees
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/votes/${voteSlug}/nominees?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch nominees')
            }

            return response.json()
        },
        enabled: !!voteSlug,
        refetchInterval: 30000
    })

    // Fetch positions for the vote
    const { data: positionsData } = useQuery({
        queryKey: ['positions-for-nominees', voteId],
        queryFn: () => {
            if (!voteId) throw new Error('Vote ID is required')
            return fetch(`${import.meta.env.VITE_API_URL}/admin/votes/${voteId}/positions`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            }).then(res => res.json())
        },
        enabled: !!voteId
    })

    // Delete nominee mutation
    const deleteMutation = useMutation({
        mutationFn: async (nomineeId: string) => {
            // Find the nominee to get its position_id
            const nominee = nomineesData?.data?.nominees.find((n: any) => n.nominees_id === nomineeId)
            if (!nominee) throw new Error('Nominee not found')

            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/positions/${nominee.position_id}/nominees/${nomineeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            })

            if (!response.ok) {
                const error = await response.json()
                throw error
            }

            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nominees-management'] })
            toast.success('Nominee deleted successfully')
            setShowDeleteModal(false)
            setSelectedNominee(null)
            logUserAction('nominee_deleted', { nominee_id: selectedNominee?.id })
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete nominee')
        }
    })

    // CSV Upload functionality
    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            if (!voteSlug) throw new Error('Vote slug is required')

            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/votes/${voteSlug}/nominees/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to upload nominees')
            }

            return response.json()
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['nominees-management'] })
            toast.success(`Successfully uploaded ${data.data?.created || 0} nominees`)
            setShowUploadModal(false)
            setUploadFile(null)
            logUserAction('nominees_bulk_uploaded', { vote_slug: voteSlug, count: data.data?.created })
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to upload nominees')
        }
    })

    useEffect(() => {
        logUserAction('nominees_management_viewed', {
            vote_slug: voteSlug,
            page: currentPage,
            search: !!searchQuery,
            filters: { position: positionFilter, gender: genderFilter }
        })
    }, [voteSlug, currentPage, searchQuery, positionFilter, genderFilter, logUserAction])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)
        refetch() // Trigger a refetch with new filters
        logUserAction('nominees_search', {
            query: searchQuery,
            vote_slug: voteSlug,
            filters: {
                position: positionFilter,
                gender: genderFilter
            }
        })
    }

    // Auto-refetch when filters change
    useEffect(() => {
        if (currentPage === 1) {
            refetch()
        }
    }, [positionFilter, genderFilter, refetch])

    const handleCreateNominee = () => {
        setShowCreateModal(true)
        logButtonClick('create_nominee_modal', voteSlug)
    }

    const handleEditNominee = (nominee: VoteNominee) => {
        setSelectedNominee(nominee)
        setShowEditModal(true)
        logButtonClick('edit_nominee_modal', `nominee_${nominee.id}`)
    }

    const handleDeleteNominee = (nominee: VoteNominee) => {
        setSelectedNominee(nominee)
        setShowDeleteModal(true)
        logButtonClick('delete_nominee_modal', `nominee_${nominee.id}`)
    }

    const confirmDelete = () => {
        if (selectedNominee) {
            deleteMutation.mutate(selectedNominee.nominees_id)
        }
    }

    const handleFileUpload = () => {
        if (!uploadFile) {
            toast.error('Please select a file to upload')
            return
        }
        uploadMutation.mutate(uploadFile)
    }

    const downloadSampleCSV = () => {
        const sampleData = [
            ['first_name', 'last_name', 'nick_name', 'phone', 'email', 'level', 'position_title', 'gender'],
            ['John', 'Doe', 'Johnny', '08012345678', 'john@example.com', '100', 'President', 'MALE'],
            ['Jane', 'Smith', 'Janey', '08087654321', 'jane@example.com', '200', 'Vice President', 'FEMALE'],
            ['Mike', 'Johnson', 'MJ', '08011111111', 'mike@example.com', '100', 'Secretary', 'MALE'],
            ['Sarah', 'Williams', 'Sarah', '08022222222', 'sarah@example.com', '300', 'Treasurer', 'FEMALE']
        ]

        const csvContent = sampleData.map(row => row.join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'nominees-sample.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        logUserAction('nominees_sample_downloaded', { vote_slug: voteSlug })
    }

    const nominees = nomineesData?.data?.nominees || []
    const positions = positionsData?.data?.positions || nomineesData?.data?.positions || []
    const pagination = {
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: nominees.length
    }

    // Use nominees directly from backend (already filtered)
    const filteredNominees = nominees

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <nav className="text-sm text-gray-500 mb-2">
                    <Link to="/admin/dashboard" className="hover:text-gray-700">Home</Link>
                    <span className="mx-2">•</span>
                    <Link to="/admin/votes" className="hover:text-gray-700">Votes Management</Link>
                    <span className="mx-2">•</span>
                    <span className="text-gray-900">Nominees</span>
                </nav>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/admin/votes"
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Voting Nominees</h1>
                            <p className="text-gray-600 mt-1">
                                Manage nominees for {vote?.title || voteSlug} election
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                        >
                            <Upload className="w-4 h-4" />
                            <span>Bulk Upload</span>
                        </button>
                        <button
                            onClick={handleCreateNominee}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Nominee</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Nominees</p>
                            <p className="text-2xl font-bold text-gray-900">{nominees.length}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Male Nominees</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {nominees.filter((n: any) => n.gender === 'MALE').length}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <User className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Female Nominees</p>
                            <p className="text-2xl font-bold text-pink-600">
                                {nominees.filter((n: any) => n.gender === 'FEMALE').length}
                            </p>
                        </div>
                        <div className="p-3 bg-pink-100 rounded-lg">
                            <User className="w-6 h-6 text-pink-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Votes</p>
                            <p className="text-2xl font-bold text-green-600">
                                {nominees.reduce((sum: number, n: any) => sum + (n.total_votes || 0), 0)}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Award className="w-6 h-6 text-green-600" />
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
                            placeholder="Search nominees..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="min-w-[140px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Filter className="w-4 h-4 inline mr-1" />
                            <span className="hidden sm:inline">Position</span>
                        </label>
                        <select
                            value={positionFilter}
                            onChange={(e) => setPositionFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All</option>
                            {positions.map((position: any) => (
                                <option key={position.position_id} value={position.position_id}>
                                    {position.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="min-w-[120px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <User className="w-4 h-4 inline mr-1" />
                            <span className="hidden sm:inline">Gender</span>
                        </label>
                        <select
                            value={genderFilter}
                            onChange={(e) => setGenderFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                        </select>
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
                                setPositionFilter('')
                                setGenderFilter('')
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

            {/* Nominees Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Nominees ({filteredNominees.length})
                    </h2>
                </div>

                {error ? (
                    <div className="p-8 text-center text-red-500">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                        <p>Failed to load nominees</p>
                        <button
                            onClick={() => refetch()}
                            className="mt-2 text-blue-600 hover:text-blue-800"
                        >
                            Try again
                        </button>
                    </div>
                ) : filteredNominees.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-gray-400 mb-4">
                            <Users className="w-24 h-24 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Nominees Found</h3>
                        <p className="text-gray-600 mb-4">
                            {searchQuery || positionFilter || genderFilter
                                ? 'No nominees match your current filters.'
                                : 'Add your first nominee to get started.'
                            }
                        </p>
                        {!searchQuery && !positionFilter && !genderFilter && (
                            <button
                                onClick={handleCreateNominee}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Add Your First Nominee</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nominee
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Position
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Votes
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredNominees.map((nominee: any) => (
                                    <tr key={nominee.nominees_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex-shrink-0">
                                                    <img
                                                        src={getNomineeImageUrl({ image: nominee.image }) || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'}
                                                        alt={`${nominee.first_name} ${nominee.last_name}`}
                                                        className="w-12 h-12 rounded-lg object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {nominee.first_name} {nominee.last_name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {nominee.nick_name && `"${nominee.nick_name}"`}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        ID: {nominee.nominees_id}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-900">
                                                    {nominee.position?.title || 'N/A'}
                                                </div>
                                                <div className="text-gray-500">
                                                    {nominee.gender}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500 space-y-1">
                                                {nominee.phone && (
                                                    <div className="flex items-center">
                                                        <Phone className="w-3 h-3 mr-1" />
                                                        {nominee.phone}
                                                    </div>
                                                )}
                                                {nominee.email && (
                                                    <div className="flex items-center">
                                                        <Mail className="w-3 h-3 mr-1" />
                                                        {nominee.email}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-gray-500">
                                                <div>Level: {nominee.levelName?.level || nominee.level || 'N/A'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {nominee.total_votes || 0}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleEditNominee(nominee)}
                                                    className="p-2 text-gray-600 hover:text-gray-800"
                                                    title="Edit Nominee"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteNominee(nominee)}
                                                    className="p-2 text-red-600 hover:text-red-800"
                                                    title="Delete Nominee"
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
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedNominee && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Delete Nominee
                                </h3>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete "<strong>{selectedNominee.first_name} {selectedNominee.last_name}</strong>"?
                                This action cannot be undone.
                            </p>
                            <div className="flex items-center justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false)
                                        setSelectedNominee(null)
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
                                    {deleteMutation.isPending ? 'Deleting...' : 'Delete Nominee'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CSV Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Upload className="w-6 h-6 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Bulk Upload Nominees
                                </h3>
                            </div>

                            <div className="mb-4">
                                <p className="text-gray-600 mb-3">
                                    Upload multiple nominees at once using a CSV file. Download the sample format to get started.
                                </p>

                                <button
                                    onClick={downloadSampleCSV}
                                    className="w-full bg-blue-50 text-blue-700 border border-blue-200 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors duration-200 flex items-center justify-center space-x-2 mb-4"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Download Sample CSV Format</span>
                                </button>

                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                        id="csv-upload-nominees"
                                    />
                                    <label
                                        htmlFor="csv-upload-nominees"
                                        className="cursor-pointer flex flex-col items-center space-y-2"
                                    >
                                        <FileText className="w-8 h-8 text-gray-400" />
                                        <span className="text-sm text-gray-600">
                                            {uploadFile ? uploadFile.name : 'Click to select CSV file'}
                                        </span>
                                    </label>
                                </div>

                                <div className="mt-3 text-xs text-gray-500">
                                    <p><strong>Note:</strong> The position_title must match existing positions exactly.</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowUploadModal(false)
                                        setUploadFile(null)
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleFileUpload}
                                    disabled={!uploadFile || uploadMutation.isPending}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploadMutation.isPending ? 'Uploading...' : 'Upload Nominees'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Nominee Form Modal */}
            {(showCreateModal || showEditModal) && (
                <NomineeFormModal
                    isOpen={showCreateModal || showEditModal}
                    onClose={() => {
                        setShowCreateModal(false)
                        setShowEditModal(false)
                        setSelectedNominee(null)
                    }}
                    nominee={selectedNominee}
                    voteSlug={voteSlug!}
                    mode={showCreateModal ? 'create' : 'edit'}
                />
            )}
        </div>
    )
}

export default NomineesPage 