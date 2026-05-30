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
    Upload,
    Download,
    FileText
} from 'lucide-react'
import { positionsApi, adminApi } from '../../services/api'
import { Position } from '../../types'
import AdminLayout from '../../components/AdminLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import PositionFormModal from '../../components/PositionFormModal'
import { useAuditLogger } from '../../hooks/useAuditLogger'
import toast from 'react-hot-toast'

const PositionsPage: React.FC = () => {
    const { voteSlug } = useParams<{ voteSlug: string }>()
    const [currentPage, setCurrentPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [voteId, setVoteId] = useState<number | null>(null)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [uploadFile, setUploadFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    const queryClient = useQueryClient()
    const { logUserAction, logButtonClick } = useAuditLogger({ context: 'PositionsManagement' })

    // First, get the vote details to get the vote ID
    const { data: votesData } = useQuery({
        queryKey: ['admin-votes'],
        queryFn: () => adminApi.getVotes({ per_page: 1000 }),
        enabled: !!voteSlug
    })

    // Find the vote by slug to get the ID
    useEffect(() => {
        if (votesData?.data && voteSlug) {
            const vote = (votesData.data as any[]).find((v: any) => v.vote_id === voteSlug)
            if (vote) {
                // Use the actual ID (primary key), not vote_id field
                setVoteId(vote.vote_id || vote.vote_id)
            }
        }
    }, [votesData, voteSlug])

    // Fetch positions using the correct API with vote ID
    const { data: positionsData, isLoading, error, refetch } = useQuery({
        queryKey: ['positions-management', voteId, currentPage, searchQuery, statusFilter],
        queryFn: async () => {
            if (!voteId) throw new Error('Vote ID is required')

            const params = new URLSearchParams()
            if (searchQuery) params.append('search', searchQuery)
            if (statusFilter) params.append('status', statusFilter)

            // Use the correct API endpoint with vote_id
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/votes/${voteId}/positions?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch positions')
            }

            return response.json()
        },
        enabled: !!voteId,
        refetchInterval: 30000
    })

    // Delete position mutation
    const deleteMutation = useMutation({
        mutationFn: (position: Position) => {
            if (!voteId) throw new Error('Vote ID is required')
            return positionsApi.deletePosition(voteId, position.position_id)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['positions-management'] })
            toast.success('Position deleted successfully')
            setShowDeleteModal(false)
            setSelectedPosition(null)
            logUserAction('position_deleted', { position_id: selectedPosition?.position_id })
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete position')
        }
    })

    useEffect(() => {
        logUserAction('positions_management_viewed', {
            vote_slug: voteSlug,
            page: currentPage,
            search: !!searchQuery,
            filters: { status: statusFilter }
        })
    }, [voteSlug, currentPage, searchQuery, statusFilter, logUserAction])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)
        refetch() // Trigger a refetch with new filters
        logUserAction('positions_search', { query: searchQuery, vote_slug: voteSlug })
    }

    // Auto-refetch when filters change
    useEffect(() => {
        if (currentPage === 1) {
            refetch()
        }
    }, [statusFilter, refetch])

    const handleCreatePosition = () => {
        if (!voteId) {
            toast.error('Vote is still loading. Please wait...')
            return
        }
        console.log('Creating position, voteId:', voteId)
        setShowCreateModal(true)
        logButtonClick('create_position_modal', voteSlug)
    }

    const handleEditPosition = (position: Position) => {
        if (!voteId) {
            toast.error('Vote is still loading. Please wait...')
            return
        }
        console.log('Editing position:', position, 'voteId:', voteId)
        setSelectedPosition(position)
        setShowEditModal(true)
        logButtonClick('edit_position_modal', `position_${position.position_id}`)
    }

    const handleDeletePosition = (position: Position) => {
        setSelectedPosition(position)
        setShowDeleteModal(true)
        logButtonClick('delete_position_modal', `position_${position.position_id}`)
    }

    const confirmDelete = () => {
        if (selectedPosition) {
            deleteMutation.mutate(selectedPosition)
        }
    }

    // CSV Upload functionality
    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            if (!voteId) throw new Error('Vote ID is required')

            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/votes/${voteId}/positions/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to upload positions')
            }

            return response.json()
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['positions-management'] })
            toast.success(`Successfully uploaded ${data.count || 0} positions`)
            setShowUploadModal(false)
            setUploadFile(null)
            logUserAction('positions_bulk_uploaded', { vote_slug: voteSlug, count: data.count })
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to upload positions')
        }
    })

    const handleFileUpload = () => {
        if (!uploadFile) {
            toast.error('Please select a file to upload')
            return
        }
        uploadMutation.mutate(uploadFile)
    }

    const downloadSampleCSV = () => {
        const sampleData = [
            ['title', 'minimum', 'maximum', 'gender'],
            ['President', '1', '1', 'MALE'],
            ['Vice President', '1', '1', 'FEMALE'],
            ['Secretary', '1', '1', 'MALE'],
            ['Treasurer', '1', '1', 'FEMALE']
        ]

        const csvContent = sampleData.map(row => row.join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'positions-sample.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        logUserAction('positions_sample_downloaded', { vote_slug: voteSlug })
    }

    const getStatusBadge = (status: string) => {
        return status === 'ACTIVE' ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                ACTIVE
            </span>
        ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                <XCircle className="w-3 h-3 mr-1" />
                INACTIVE
            </span>
        )
    }

    const positions = Array.isArray(positionsData?.data) ? positionsData.data : []
    const pagination = {
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: positions.length
    }

    // Use positions directly from backend (already filtered)
    const filteredPositions = positions

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <nav className="text-sm text-gray-500 mb-2">
                    <Link to="/admin/dashboard" className="hover:text-gray-700">Home</Link>
                    <span className="mx-2">•</span>
                    <Link to="/admin/votes" className="hover:text-gray-700">Votes Management</Link>
                    <span className="mx-2">•</span>
                    <span className="text-gray-900">Positions</span>
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
                            <h1 className="text-3xl font-bold text-gray-900">Voting Positions</h1>
                            <p className="text-gray-600 mt-1">
                                Manage positions for {voteSlug} election
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
                            onClick={handleCreatePosition}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create Position</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Positions</p>
                            <p className="text-2xl font-bold text-gray-900">{positions.length}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Settings className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Active Positions</p>
                            <p className="text-2xl font-bold text-green-600">
                                {positions.filter((p: any) => p.status === 'ACTIVE').length}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Male Positions</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {positions.filter((p: any) => p.gender === 'MALE').length}
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
                            <p className="text-sm font-medium text-gray-600">Female Positions</p>
                            <p className="text-2xl font-bold text-pink-600">
                                {positions.filter((p: any) => p.gender === 'FEMALE').length}
                            </p>
                        </div>
                        <div className="p-3 bg-pink-100 rounded-lg">
                            <User className="w-6 h-6 text-pink-600" />
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
                            placeholder="Search positions..."
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
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
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
                                setStatusFilter('')
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

            {/* Positions Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Positions ({filteredPositions.length})
                    </h2>
                </div>

                {error ? (
                    <div className="p-8 text-center text-red-500">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                        <p>Failed to load positions</p>
                        <button
                            onClick={() => refetch()}
                            className="mt-2 text-blue-600 hover:text-blue-800"
                        >
                            Try again
                        </button>
                    </div>
                ) : filteredPositions.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-gray-400 mb-4">
                            <Settings className="w-24 h-24 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Positions Found</h3>
                        <p className="text-gray-600 mb-4">
                            {searchQuery || statusFilter
                                ? 'No positions match your current filters.'
                                : 'Create your first position to get started.'
                            }
                        </p>
                        {!searchQuery && !statusFilter && (
                            <button
                                onClick={handleCreatePosition}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Create Your First Position</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Position
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Gender
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Limits
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredPositions.map((position: any, index: number) => (
                                    <tr key={position.position_id || index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {position.title}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    ID: {position.position_id}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${position.gender === 'MALE'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-pink-100 text-pink-800'
                                                }`}>
                                                {position.gender}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(position.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500">
                                                Min: {position.minimum} | Max: {position.maximum}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleEditPosition(position)}
                                                    className="p-2 text-gray-600 hover:text-gray-800"
                                                    title="Edit Position"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePosition(position)}
                                                    className="p-2 text-red-600 hover:text-red-800"
                                                    title="Delete Position"
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
            {showDeleteModal && selectedPosition && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Delete Position
                                </h3>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete "<strong>{selectedPosition.title}</strong>"?
                                This action cannot be undone.
                            </p>
                            <div className="flex items-center justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false)
                                        setSelectedPosition(null)
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
                                    {deleteMutation.isPending ? 'Deleting...' : 'Delete Position'}
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
                                    Bulk Upload Positions
                                </h3>
                            </div>

                            <div className="mb-4">
                                <p className="text-gray-600 mb-3">
                                    Upload multiple positions at once using a CSV file. Download the sample format to get started.
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
                                        id="csv-upload"
                                    />
                                    <label
                                        htmlFor="csv-upload"
                                        className="cursor-pointer flex flex-col items-center space-y-2"
                                    >
                                        <FileText className="w-8 h-8 text-gray-400" />
                                        <span className="text-sm text-gray-600">
                                            {uploadFile ? uploadFile.name : 'Click to select CSV file'}
                                        </span>
                                    </label>
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
                                    {uploadMutation.isPending ? 'Uploading...' : 'Upload Positions'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Position Form Modal */}
            {voteId && (
                <PositionFormModal
                    isOpen={showCreateModal || showEditModal}
                    onClose={() => {
                        setShowCreateModal(false)
                        setShowEditModal(false)
                        setSelectedPosition(null)
                    }}
                    position={selectedPosition}
                    voteId={voteId}
                    voteSlug={voteSlug!}
                    mode={showCreateModal ? 'create' : 'edit'}
                />
            )}
        </div>
    )
}

export default PositionsPage 