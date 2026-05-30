import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { X, Calendar, DollarSign, Upload, Tag, FileText, User, Clock, Shield } from 'lucide-react'
import { VoteManagement, Level, VoteFormData } from '../types'
import { useAuditLogger } from '../hooks/useAuditLogger'
import toast from 'react-hot-toast'

interface VoteFormModalProps {
    isOpen: boolean
    onClose: () => void
    vote?: VoteManagement | null
    mode: 'create' | 'edit'
}

const VoteFormModal: React.FC<VoteFormModalProps> = ({
    isOpen,
    onClose,
    vote,
    mode
}) => {
    const [formData, setFormData] = useState<VoteFormData>({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        nomination_start: '',
        nomination_end_date: '',
        release_result_date: '',
        payment_mode: 'FREE',
        price_per_vote: 0,
        image: '',
        levels: [],
        status: 'STARTED'
    })
    const [selectedLevels, setSelectedLevels] = useState<string[]>([])
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)

    const queryClient = useQueryClient()
    const { logUserAction } = useAuditLogger({ context: 'VoteManagement' })

    // Fetch levels using existing levels endpoint
    const { data: levelsResponse } = useQuery({
        queryKey: ['levels'],
        queryFn: async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/levels`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            })
            const data = await response.json()
            return data
        },
        enabled: isOpen
    })

    const levels = levelsResponse?.data || []

    // Create vote mutation using existing backend endpoint
    const createMutation = useMutation({
        mutationFn: async (data: VoteFormData) => {
            const formData = new FormData()
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (key === 'levels' && Array.isArray(value)) {
                        value.forEach((level, index) => {
                            formData.append(`level_id[${index}]`, level)
                        })
                    } else if (key === 'image' && value instanceof File) {
                        formData.append('image', value)
                    } else {
                        formData.append(key, value.toString())
                    }
                }
            })

            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/votes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: formData
            })

            if (!response.ok) {
                const error = await response.json()
                throw { response: { data: error } }
            }

            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-votes'] })
            toast.success('Election created successfully')
            logUserAction('vote_created', { name: formData.name })
            onClose()
            resetForm()
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to create election'
            toast.error(message)
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors
                const firstError = Object.values(errors)[0] as string[]
                toast.error(firstError[0])
            }
        }
    })

    // Update vote mutation using existing backend endpoint
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number, data: Partial<VoteFormData> }) => {
            const formData = new FormData()
            formData.append('_method', 'PUT')

            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (key === 'levels' && Array.isArray(value)) {
                        value.forEach((level, index) => {
                            formData.append(`level_id[${index}]`, level)
                        })
                    } else if (key === 'image' && value instanceof File) {
                        formData.append('image', value)
                    } else {
                        formData.append(key, value.toString())
                    }
                }
            })

            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/votes/${id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: formData
            })

            if (!response.ok) {
                const error = await response.json()
                throw { response: { data: error } }
            }

            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-votes'] })
            toast.success('Election updated successfully')
            logUserAction('vote_updated', { vote_id: vote?.id })
            onClose()
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to update election'
            toast.error(message)
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors
                const firstError = Object.values(errors)[0] as string[]
                toast.error(firstError[0])
            }
        }
    })

    // Initialize form with vote data when editing
    useEffect(() => {
        if (mode === 'edit' && vote) {
            setFormData({
                name: vote.title,
                description: vote.description,
                start_date: vote.start_date?.slice(0, 16) || '',
                end_date: vote.end_date?.slice(0, 16) || '',
                nomination_start: vote.nomination_start?.slice(0, 16) || '',
                nomination_end_date: vote.nomination_end_date?.slice(0, 16) || '',
                release_result_date: vote.release_result_date?.slice(0, 16) || '',
                payment_mode: vote.payment_mode,
                price_per_vote: vote.price_per_vote,
                image: vote.image || '',
                levels: vote.levels || [],
                status: vote.status
            })
            setSelectedLevels(vote.levels || [])
        } else {
            resetForm()
        }
    }, [mode, vote])

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            start_date: '',
            end_date: '',
            nomination_start: '',
            nomination_end_date: '',
            release_result_date: '',
            payment_mode: 'FREE',
            price_per_vote: 0,
            image: '',
            levels: [],
            status: 'STARTED'
        })
        setSelectedLevels([])
        setImageFile(null)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target

        if (type === 'number') {
            setFormData(prev => ({
                ...prev,
                [name]: parseFloat(value) || 0
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }))
        }
    }

    const handleLevelChange = (levelId: string, checked: boolean) => {
        if (checked) {
            setSelectedLevels(prev => [...prev, levelId])
        } else {
            setSelectedLevels(prev => prev.filter(id => id !== levelId))
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            setFormData(prev => ({
                ...prev,
                image: file
            }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Validation
        if (selectedLevels.length === 0) {
            toast.error('Please select at least one level')
            setLoading(false)
            return
        }

        // Prepare form data
        const submitData: VoteFormData = {
            ...formData,
            levels: selectedLevels,
            image: imageFile || formData.image
        }

        try {
            if (mode === 'create') {
                await createMutation.mutateAsync(submitData)
            } else if (vote) {
                await updateMutation.mutateAsync({ id: vote.id, data: submitData })
            }
        } catch (error) {
            // Error handling is done in mutation callbacks
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-secondary-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {mode === 'create' ? 'Create New Election' : 'Edit Election'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-secondary-800"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-6">
                        {/* Basic Information */}
                        <div className="bg-gray-50 dark:bg-secondary-800 p-4 rounded-lg">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <FileText className="w-5 h-5 mr-2" />
                                Basic Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Election Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter election title"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description *
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        required
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter election description"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Upload className="w-4 h-4 inline mr-1" />
                                        Election Image
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {vote?.image && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Current image: {vote.image.split('/').pop()}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Shield className="w-4 h-4 inline mr-1" />
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="STARTED">Started</option>
                                        <option value="INACTIVE">Inactive</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="POSTPONED">Postponed</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Date Configuration */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <Calendar className="w-5 h-5 mr-2" />
                                Date Configuration
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nomination Start Date *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="nomination_start"
                                        value={formData.nomination_start}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nomination End Date *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="nomination_end_date"
                                        value={formData.nomination_end_date}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Voting Start Date *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Voting End Date *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Result Release Date *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="release_result_date"
                                        value={formData.release_result_date}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payment Configuration */}
                        <div className="bg-green-50 p-4 rounded-lg">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <DollarSign className="w-5 h-5 mr-2" />
                                Payment Configuration
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Mode *
                                    </label>
                                    <select
                                        name="payment_mode"
                                        value={formData.payment_mode}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="FREE">Free Election</option>
                                        <option value="PAID">Paid Election</option>
                                    </select>
                                </div>

                                {formData.payment_mode === 'PAID' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Price Per Vote *
                                        </label>
                                        <input
                                            type="number"
                                            name="price_per_vote"
                                            value={formData.price_per_vote}
                                            onChange={handleInputChange}
                                            min="0"
                                            step="0.01"
                                            required={formData.payment_mode === 'PAID'}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter price per vote"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Levels Configuration */}
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <User className="w-5 h-5 mr-2" />
                                Eligible Levels *
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {levels.map((level: Level) => (
                                    <label key={level.level_id} className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedLevels.includes(level.level_id)}
                                            onChange={(e) => handleLevelChange(level.level_id, e.target.checked)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            Level {level.level}
                                        </span>
                                    </label>
                                ))}
                            </div>

                            {selectedLevels.length === 0 && (
                                <p className="text-red-500 text-xs mt-2">
                                    Please select at least one level for this election
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-secondary-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || createMutation.isPending || updateMutation.isPending}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading || createMutation.isPending || updateMutation.isPending
                                ? (mode === 'create' ? 'Creating...' : 'Updating...')
                                : (mode === 'create' ? 'Create Election' : 'Update Election')
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default VoteFormModal 