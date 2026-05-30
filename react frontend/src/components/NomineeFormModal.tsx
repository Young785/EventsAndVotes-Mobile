import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { X, Save, Loader2, Upload, User } from 'lucide-react'
import { nomineesApi, adminApi } from '../services/api'
import { VoteNominee, Position } from '../types'
import toast from 'react-hot-toast'
import { getNomineeImageUrl } from '../utils/imageUtils'

interface NomineeFormModalProps {
    isOpen: boolean
    onClose: () => void
    nominee?: VoteNominee | null
    voteSlug: string
    mode: 'create' | 'edit'
}

const NomineeFormModal: React.FC<NomineeFormModalProps> = ({
    isOpen,
    onClose,
    nominee,
    voteSlug,
    mode
}) => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        nick_name: '',
        phone: '',
        email: '',
        level: '',
        position_id: '',
        gender: 'MALE'
    })
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string>('')

    const queryClient = useQueryClient()

    // Get positions for the vote
    const { data: positionsData } = useQuery({
        queryKey: ['positions-for-nominees', voteSlug],
        queryFn: async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/votes/${voteSlug}/nominees`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            })
            return response.json()
        },
        enabled: isOpen
    })

    // Get levels
    const { data: levelsData } = useQuery({
        queryKey: ['levels'],
        queryFn: () => adminApi.getLevels(),
        enabled: isOpen
    })

    useEffect(() => {
        if (nominee && mode === 'edit') {
            setFormData({
                first_name: nominee.first_name || '',
                last_name: nominee.last_name || '',
                nick_name: nominee.nick_name || '',
                phone: nominee.phone || '',
                email: nominee.email || '',
                level: nominee.level || '',
                position_id: nominee.position_id || '',
                gender: nominee.gender || 'MALE'
            })
            if (nominee.image) {
                setImagePreview(nominee.image)
            }
        } else {
            setFormData({
                first_name: '',
                last_name: '',
                nick_name: '',
                phone: '',
                email: '',
                level: '',
                position_id: '',
                gender: 'MALE'
            })
            setImagePreview('')
            setImageFile(null)
        }
    }, [nominee, mode, isOpen])

    const createMutation = useMutation({
        mutationFn: (data: FormData) => nomineesApi.createNomineeByVote(voteSlug, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nominees-management'] })
            toast.success('Nominee created successfully')
            onClose()
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create nominee')
        }
    })

    const updateMutation = useMutation({
        mutationFn: (data: FormData) => {
            // For update, we need to find the position_id and use the correct API
            const position = positionsData?.data?.positions?.find((p: any) => p.position_id === formData.position_id)
            if (!position) throw new Error('Position not found')
            return nomineesApi.updateNominee(position.position_id, nominee?.nominees_id!, data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nominees-management'] })
            toast.success('Nominee updated successfully')
            onClose()
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update nominee')
        }
    })

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.first_name.trim() || !formData.last_name.trim()) {
            toast.error('First name and last name are required')
            return
        }

        if (!formData.phone.trim()) {
            toast.error('Phone number is required')
            return
        }

        if (!formData.position_id) {
            toast.error('Please select a position')
            return
        }

        const submitData = new FormData()
        submitData.append('first_name', formData.first_name.trim())
        submitData.append('last_name', formData.last_name.trim())
        submitData.append('nick_name', formData.nick_name.trim())
        submitData.append('phone', formData.phone.trim())
        submitData.append('email', formData.email.trim())
        submitData.append('level', formData.level)
        submitData.append('position_id', formData.position_id)
        submitData.append('gender', formData.gender)

        if (imageFile) {
            submitData.append('image', imageFile)
        }

        if (mode === 'create') {
            createMutation.mutate(submitData)
        } else {
            updateMutation.mutate(submitData)
        }
    }

    const isLoading = createMutation.isPending || updateMutation.isPending
    const positions = positionsData?.data?.positions || []
    const levels = Array.isArray(levelsData?.data) ? levelsData.data : []

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {mode === 'create' ? 'Add New Nominee' : 'Edit Nominee'}
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
                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Profile Image (Optional)
                            </label>
                            <div className="flex items-center space-x-4">
                                <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                    {imagePreview ? (
                                        <img
                                            src={getNomineeImageUrl({ image: imagePreview })}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-8 h-8 text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    <label
                                        htmlFor="image-upload"
                                        className="cursor-pointer bg-white dark:bg-secondary-900 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-secondary-800 flex items-center space-x-2"
                                    >
                                        <Upload className="w-4 h-4" />
                                        <span>Upload Image</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter first name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter last name"
                                    required
                                />
                            </div>
                        </div>

                        {/* Nick Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nick Name (PKA)
                            </label>
                            <input
                                type="text"
                                value={formData.nick_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, nick_name: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter nick name"
                            />
                        </div>

                        {/* Contact Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter phone number"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email (Optional)
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter email"
                                />
                            </div>
                        </div>

                        {/* Level and Position */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Level
                                </label>
                                <select
                                    value={formData.level}
                                    onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select a Level</option>
                                    {levels.map((level: any, index: number) => {
                                        // Handle both string levels and level objects
                                        const levelValue = typeof level === 'string' ? level : level.level
                                        const levelDisplay = typeof level === 'string' ? level : level.level
                                        return (
                                            <option key={`level-${index}-${levelValue}`} value={level.level_id}>
                                                {levelDisplay}
                                            </option>
                                        )
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Position *
                                </label>
                                <select
                                    value={formData.position_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, position_id: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Select a Position</option>
                                    {positions.map((position: any) => (
                                        <option key={position.position_id} value={position.position_id}>
                                            {position.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Gender */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Gender
                            </label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
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
                                <span>{mode === 'create' ? 'Add Nominee' : 'Update Nominee'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default NomineeFormModal 