import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { X, Save, Loader2 } from 'lucide-react'
import { positionsApi, adminApi } from '../services/api'
import { Position } from '../types'
import toast from 'react-hot-toast'

interface PositionFormModalProps {
    isOpen: boolean
    onClose: () => void
    position?: Position | null
    voteId: number
    voteSlug: string
    mode: 'create' | 'edit'
}

const PositionFormModal: React.FC<PositionFormModalProps> = ({
    isOpen,
    onClose,
    position,
    voteId,
    voteSlug,
    mode
}) => {
    const [formData, setFormData] = useState({
        title: '',
        minimum: '1',
        maximum: '20',
        gender: [] as string[],
        status: 'ACTIVE'
    })

    const queryClient = useQueryClient()

    // Get levels for the vote
    const { data: levelsData } = useQuery({
        queryKey: ['levels'],
        queryFn: () => adminApi.getLevels(),
        enabled: isOpen
    })

    useEffect(() => {
        if (position && mode === 'edit') {
            setFormData({
                title: position.title || '',
                minimum: position.minimum?.toString() || '1',
                maximum: position.maximum?.toString() || '20',
                gender: position.gender ? [position.gender] : [],
                status: position.status || 'ACTIVE'
            })
        } else {
            setFormData({
                title: '',
                minimum: '1',
                maximum: '20',
                gender: [],
                status: 'ACTIVE'
            })
        }
    }, [position, mode, isOpen])

    const createMutation = useMutation({
        mutationFn: (data: any) => {
            return positionsApi.createPosition(voteId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['positions-management'] })
            toast.success('Position created successfully')
            onClose()
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || error.message || 'Failed to create position')
        }
    })

    const updateMutation = useMutation({
        mutationFn: (data: any) => {
            return positionsApi.updatePosition(voteId, position?.position_id!, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['positions-management'] })
            toast.success('Position updated successfully')
            onClose()
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || error.message || 'Failed to update position')
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.title.trim()) {
            toast.error('Position title is required')
            return
        }

        if (formData.gender.length === 0) {
            toast.error('Please select at least one gender')
            return
        }

        const submitData = {
            vote_id: voteId,
            title: formData.title.trim(),
            minimum: parseInt(formData.minimum) || 1,
            maximum: parseInt(formData.maximum) || 20,
            gender: formData.gender,
            status: formData.status
        }

        if (mode === 'create') {
            createMutation.mutate(submitData)
        } else {
            updateMutation.mutate(submitData)
        }
    }

    const handleGenderChange = (gender: string, checked: boolean) => {
        if (checked) {
            setFormData(prev => ({
                ...prev,
                gender: [...prev.gender, gender]
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                gender: prev.gender.filter(g => g !== gender)
            }))
        }
    }

    const isLoading = createMutation.isPending || updateMutation.isPending

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {mode === 'create' ? 'Create New Position' : 'Edit Position'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-secondary-800"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Position Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Position Title *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter position title"
                                required
                            />
                        </div>

                        {/* Min/Max Nominees */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Minimum Nominees
                                </label>
                                <input
                                    type="number"
                                    value={formData.minimum}
                                    onChange={(e) => setFormData(prev => ({ ...prev, minimum: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    min="1"
                                    disabled
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Maximum Nominees
                                </label>
                                <input
                                    type="number"
                                    value={formData.maximum}
                                    onChange={(e) => setFormData(prev => ({ ...prev, maximum: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    min="1"
                                />
                            </div>
                        </div>

                        {/* Gender Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Gender Eligibility *
                            </label>
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.gender.includes('MALE')}
                                        onChange={(e) => handleGenderChange('MALE', e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Male</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.gender.includes('FEMALE')}
                                        onChange={(e) => handleGenderChange('FEMALE', e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Female</span>
                                </label>
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-secondary-700">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                <span>{mode === 'create' ? 'Create Position' : 'Update Position'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default PositionFormModal 