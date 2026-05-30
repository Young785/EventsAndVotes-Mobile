import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
    ArrowLeft,
    Upload,
    User,
    Mail,
    Phone,
    Trophy,
    Check,
    AlertCircle
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { getUserAvatarUrl } from '../utils/imageUtils'

interface Vote {
    id: number
    account_id: string
    vote_id: string
    name: string
    description: string
    slug: string
    image: string
    status: string
    start_date: string
    end_date: string
    nomination_start: string
    nomination_end_date: string
    levels: string
    payment_mode: string
    price_per_vote: string
}

interface Position {
    id: number
    title: string
    slug: string
    minimum: string
    maximum: string
    position_id: string
    vote_id: string
    gender: 'MALE' | 'FEMALE' | 'ALL'
    status: 'ACTIVE' | 'INACTIVE'
}

interface Level {
    id: number
    level: string
    level_id: string
}

interface NominationFormData {
    first_name: string
    last_name: string
    nick_name: string
    email: string
    phone: string
    level: string
    position_id: string
    image?: File
}

const NominationFormPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [formData, setFormData] = useState<NominationFormData>({
        first_name: '',
        last_name: '',
        nick_name: '',
        email: '',
        phone: '',
        level: '',
        position_id: '',
    })
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Fetch contest details
    const { data: contestData, isLoading: contestLoading } = useQuery({
        queryKey: ['contest-details', slug],
        queryFn: async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/contest/${slug}`)
            if (!response.ok) throw new Error('Failed to fetch contest details')
            return response.json()
        },
        enabled: !!slug
    })

    // Submit nomination mutation
    const nominationMutation = useMutation({
        mutationFn: async (data: FormData) => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/contest/${slug}`, {
                method: 'POST',
                body: data
            })
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to submit nomination')
            }
            return response.json()
        },
        onSuccess: (data) => {
            toast.success('Nomination submitted successfully!')
            navigate(`/contest/${slug}/${contestData?.data?.vote?.vote_id}`)
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to submit nomination')
            if (error.errors) {
                setErrors(error.errors)
            }
        }
    })

    const vote: Vote = contestData?.data?.vote
    const positions: Position[] = contestData?.data?.positions || []
    const levels: Level[] = contestData?.data?.levels || []
    const nominationActive: boolean = contestData?.data?.nomination_active || false

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setFormData(prev => ({ ...prev, image: file }))
            const reader = new FileReader()
            reader.onload = () => setImagePreview(reader.result as string)
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // Basic validation
        const newErrors: Record<string, string> = {}
        if (!formData.first_name) newErrors.first_name = 'First name is required'
        if (!formData.last_name) newErrors.last_name = 'Last name is required'
        if (!formData.nick_name) newErrors.nick_name = 'Nick name is required'
        if (!formData.phone) newErrors.phone = 'Phone number is required'
        if (!formData.level) newErrors.level = 'Level is required'
        if (!formData.position_id) newErrors.position_id = 'Position is required'

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        // Create form data
        const submitData = new FormData()
        Object.entries(formData).forEach(([key, value]) => {
            if (value instanceof File) {
                submitData.append(key, value)
            } else if (value) {
                submitData.append(key, value)
            }
        })

        nominationMutation.mutate(submitData)
    }

    if (contestLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner />
                    <p className="mt-4 text-gray-600">Loading nomination form...</p>
                </div>
            </div>
        )
    }

    if (!vote) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Contest Not Found</h2>
                    <p className="text-gray-600 mb-6">The contest you're looking for doesn't exist or nomination period has ended.</p>
                    <Link
                        to="/votes"
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Votes
                    </Link>
                </div>
            </div>
        )
    }

    if (!nominationActive) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Nomination Period Inactive</h2>
                    <p className="text-gray-600 mb-6">The nomination period for this contest is not currently active.</p>
                    <div className="text-sm text-gray-500 mb-6">
                        <p>Nomination Period: {new Date(vote.nomination_start).toLocaleDateString()} - {new Date(vote.nomination_end_date).toLocaleDateString()}</p>
                    </div>
                    <Link
                        to={`/contest/${slug}/${vote.vote_id}`}
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        View Contest
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center space-x-4">
                        <Link
                            to={`/contest/${slug}/${vote.vote_id}`}
                            className="text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Nomination Form</h1>
                            <p className="text-gray-600">{vote.name}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Submit Your Nomination</h2>
                        <p className="text-gray-600 mt-1">Please complete the form below to submit your nomination.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* First Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <User className="w-4 h-4 inline mr-1" />
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.first_name ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter first name"
                                />
                                {errors.first_name && (
                                    <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
                                )}
                            </div>

                            {/* Last Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <User className="w-4 h-4 inline mr-1" />
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.last_name ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter last name"
                                />
                                {errors.last_name && (
                                    <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Nick Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nick Name (P.K.A) *
                                </label>
                                <input
                                    type="text"
                                    name="nick_name"
                                    value={formData.nick_name}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.nick_name ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter nick name"
                                />
                                {errors.nick_name && (
                                    <p className="text-red-500 text-sm mt-1">{errors.nick_name}</p>
                                )}
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Upload className="w-4 h-4 inline mr-1" />
                                    Upload Image (Optional)
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {imagePreview && (
                                    <div className="mt-2">
                                        <img src={getUserAvatarUrl({ image: imagePreview })} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Phone className="w-4 h-4 inline mr-1" />
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.phone ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter phone number"
                                />
                                {errors.phone && (
                                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Mail className="w-4 h-4 inline mr-1" />
                                    Email (Optional)
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter email address"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Level */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Level *
                                </label>
                                <select
                                    name="level"
                                    value={formData.level}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.level ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                >
                                    <option value="">-- Select your Level --</option>
                                    {levels.map((level) => (
                                        <option key={level.level_id} value={level.level_id}>
                                            {level.level} Level
                                        </option>
                                    ))}
                                </select>
                                {errors.level && (
                                    <p className="text-red-500 text-sm mt-1">{errors.level}</p>
                                )}
                            </div>

                            {/* Position */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Trophy className="w-4 h-4 inline mr-1" />
                                    Position *
                                </label>
                                <select
                                    name="position_id"
                                    value={formData.position_id}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.position_id ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                >
                                    <option value="">-- Select Position --</option>
                                    {positions.map((position) => (
                                        <option key={position.position_id} value={position.position_id}>
                                            {position.title} - ({position.gender})
                                        </option>
                                    ))}
                                </select>
                                {errors.position_id && (
                                    <p className="text-red-500 text-sm mt-1">{errors.position_id}</p>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-6 border-t border-gray-200">
                            <button
                                type="submit"
                                disabled={nominationMutation.isPending}
                                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {nominationMutation.isPending ? (
                                    <>
                                        <LoadingSpinner />
                                        <span className="ml-2">Submitting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Submit Nomination
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default NominationFormPage 