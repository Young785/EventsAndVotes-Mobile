import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, User, Mail, Lock, Phone, ArrowRight, UserPlus, Building, Calendar, MapPin, Globe, Gift } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { authApi } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const createRegisterSchema = (isAdmin: boolean) => z.object({
    first_name: z.string().min(2, 'First name must be at least 2 characters'),
    last_name: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string(),
    dob: z.string().min(1, 'Date of birth is required'),
    gender: z.enum(['male', 'female'], { required_error: 'Gender is required' }),
    country: z.string().min(1, 'Country is required'),
    state: z.string().min(1, 'State is required'),
    role_id: isAdmin ? z.string().min(1, 'Registration purpose is required') : z.string().optional(),
    address: z.string().min(10, 'Address must be at least 10 characters'),
    referral_code: z.string().optional(),
    terms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
}).refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
})

// Nigeria states data
const nigeriaStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River',
    'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe', 'Imo', 'Jigawa', 'Kaduna',
    'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
    'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
]

const RegisterPage: React.FC = () => {
    const [searchParams] = useSearchParams()
    const isAdminRegistration = searchParams.get('admin') === 'true'
    const refCode = searchParams.get('ref')

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isValidatingReferral, setIsValidatingReferral] = useState(false)
    const [referralValidation, setReferralValidation] = useState<{
        isValid: boolean
        message: string
        referrerName?: string
    } | null>(null)
    const { register: registerUser } = useAuth()
    const navigate = useNavigate()

    const registerSchema = createRegisterSchema(isAdminRegistration)
    type RegisterFormData = z.infer<typeof registerSchema>

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors }
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            country: 'Nigeria',
            gender: 'male',
            role_id: isAdminRegistration ? '' : 'user',
            referral_code: refCode || ''
        }
    })

    // Set default role for non-admin registration and referral code from URL
    useEffect(() => {
        if (!isAdminRegistration) {
            setValue('role_id', 'user')
        }
        if (refCode) {
            setValue('referral_code', refCode)
        }
    }, [isAdminRegistration, refCode, setValue])

    const referralCode = watch('referral_code')

    // Validate referral code
    const validateReferralCode = async (code: string) => {
        if (!code || code.length < 3) {
            setReferralValidation(null)
            return
        }

        setIsValidatingReferral(true)
        try {
            const response = await authApi.validateReferralCode(code)

            if (response.status === 'success' && response.data) {
                setReferralValidation({
                    isValid: response.data.is_valid,
                    message: response.data.message,
                    referrerName: response.data.referrer_name
                })
            } else {
                setReferralValidation({
                    isValid: false,
                    message: 'Invalid referral code'
                })
            }
        } catch (error) {
            setReferralValidation({
                isValid: false,
                message: 'Error validating referral code'
            })
        } finally {
            setIsValidatingReferral(false)
        }
    }

    // Debounce referral code validation
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (referralCode) {
                validateReferralCode(referralCode)
            } else {
                setReferralValidation(null)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [referralCode])

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true)
        try {
            const success = await registerUser(data)
            if (success) {
                // Check if user needs email verification
                const storedUser = localStorage.getItem('user')
                if (storedUser) {
                    const user = JSON.parse(storedUser)
                    if (!user.email_verified_at) {
                        // Redirect to verification page
                        toast.success('Registration successful! Please verify your email to continue.')
                        navigate('/verification')
                        return
                    }
                }
                
                // Email is verified, redirect to dashboard
                toast.success('Registration completed successfully!')
                if (isAdminRegistration) {
                    navigate('/admin/dashboard')
                } else {
                    navigate('/dashboard')
                }
            }
        } catch (error: any) {
            console.error('Registration error:', error)
            
            // Handle different types of errors
            if (error.response && error.response.data) {
                const { data } = error.response
                
                // Check for validation errors
                if (data.errors && typeof data.errors === 'object') {
                    // Show field-specific validation errors
                    Object.keys(data.errors).forEach(field => {
                        const fieldErrors = data.errors[field]
                        const errorMessage = Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors
                        toast.error(`${field.replace('_', ' ')}: ${errorMessage}`)
                    })
                } else if (data.message) {
                    // Show general error message
                    toast.error(data.message)
                } else {
                    toast.error('Registration failed. Please check your information and try again.')
                }
            } else {
                toast.error(error.message || 'Registration failed. Please try again.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute top-10 left-10 w-32 h-32 bg-blue-600 rounded-full"></div>
                <div className="absolute bottom-10 right-10 w-48 h-48 bg-purple-500 rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500 rounded-full"></div>
            </div>

            <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl w-full space-y-8">
                    {/* Header */}
                    <div className="text-center">
                        <Link to="/" className="inline-block">
                            <div className="flex items-center justify-center space-x-2 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                                    <Building className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <span className="text-2xl font-bold text-blue-600">Events</span>
                                    <span className="text-2xl font-bold text-green-600">And</span>
                                    <span className="text-2xl font-bold text-blue-600">Votes</span>
                                </div>
                            </div>
                        </Link>
                        <h2 className="text-3xl font-bold text-gray-900">
                            {isAdminRegistration ? 'Admin Registration' : 'Create Account'}
                        </h2>
                        <p className="mt-2 text-gray-600">
                            {isAdminRegistration
                                ? 'Register as an admin to manage votes and events'
                                : 'Join our platform to participate in votes and events'
                            }
                        </p>
                    </div>

                    {/* Registration Form Card */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600">
                            <div className="flex items-center space-x-3">
                                <UserPlus className="w-6 h-6 text-white" />
                                <h3 className="text-xl font-semibold text-white">Create Account</h3>
                            </div>
                            <p className="text-blue-100 mt-1 text-sm">Fill in your details to get started</p>
                        </div>

                        <form className="px-8 py-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                            {/* Name Fields Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                                        First Name *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            {...register('first_name')}
                                            type="text"
                                            autoComplete="given-name"
                                            className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${errors.first_name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                                            placeholder="First Name"
                                        />
                                    </div>
                                    {errors.first_name && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                                            {errors.first_name.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                                        Last Name *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            {...register('last_name')}
                                            type="text"
                                            autoComplete="family-name"
                                            className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${errors.last_name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                                            placeholder="Last Name"
                                        />
                                    </div>
                                    {errors.last_name && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                                            {errors.last_name.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Email and Phone Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            {...register('email')}
                                            type="email"
                                            autoComplete="email"
                                            className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                                            placeholder="Email Address"
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                                            {errors.email.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Phone className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            {...register('phone')}
                                            type="tel"
                                            autoComplete="tel"
                                            className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                                            placeholder="Phone Number"
                                        />
                                    </div>
                                    {errors.phone && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                                            {errors.phone.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Password Fields Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                        Password *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            {...register('password')}
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="new-password"
                                            className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                                            placeholder="Password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                            ) : (
                                                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                                            {errors.password.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm Password *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            {...register('password_confirmation')}
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            autoComplete="new-password"
                                            className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${errors.password_confirmation ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                                            placeholder="Confirm Password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                            ) : (
                                                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.password_confirmation && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                                            {errors.password_confirmation.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Date of Birth and Gender Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex">
                                <div className="flex flex-col col-span-1">
                                    <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-2">
                                        Date of Birth *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Calendar className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            {...register('dob')}
                                            type="date"
                                            className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${errors.dob ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                                        />
                                    </div>
                                    {errors.dob && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                                            {errors.dob.message}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col col-span-1">
                                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                                        Gender *
                                    </label>
                                    <select
                                        {...register('gender')}
                                        className={`block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${errors.gender ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                    {errors.gender && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                                            {errors.gender.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Country and State Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                                        Country *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Globe className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <select
                                            {...register('country')}
                                            className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${errors.country ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                                        >
                                            <option value="Nigeria">Nigeria</option>
                                        </select>
                                    </div>
                                    {errors.country && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                                            {errors.country.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                                        State *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <MapPin className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <select
                                            {...register('state')}
                                            className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${errors.state ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                                        >
                                            <option value="">Select State</option>
                                            {nigeriaStates.map((state) => (
                                                <option key={state} value={state}>{state}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.state && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                                            {errors.state.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Registration Purpose - Only for Admin Registration */}
                            {isAdminRegistration && (
                                <div>
                                    <label htmlFor="role_id" className="block text-sm font-medium text-gray-700 mb-2">
                                        Registration Purpose *
                                    </label>
                                    <select
                                        {...register('role_id')}
                                        className={`block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${errors.role_id ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                                    >
                                        <option value="">-- Select the Registration purpose --</option>
                                        <option value="admin_vote">Voting Purpose</option>
                                        <option value="admin_event">Events Purpose (Coming Soon)</option>
                                        <option value="admin_both">Event and Voting Purpose (Coming Soon)</option>
                                    </select>
                                    {errors.role_id && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                                            {errors.role_id.message}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Address Field */}
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                                    Street Address *
                                </label>
                                <div className="relative">
                                    <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                                        <MapPin className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <textarea
                                        {...register('address')}
                                        rows={3}
                                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 resize-none ${errors.address ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                                        placeholder="Enter Street Address"
                                    />
                                </div>
                                {errors.address && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                                        {errors.address.message}
                                    </p>
                                )}
                            </div>

                            {/* Referral Code */}
                            <div>
                                <label htmlFor="referral_code" className="block text-sm font-medium text-gray-700 mb-2">
                                    Referral Code (Optional)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Gift className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        {...register('referral_code')}
                                        type="text"
                                        autoComplete="off"
                                        className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${referralValidation?.isValid === false
                                            ? 'border-red-300 bg-red-50'
                                            : referralValidation?.isValid === true
                                                ? 'border-green-300 bg-green-50'
                                                : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                        placeholder="Enter referral code if you have one"
                                    />
                                    {isValidatingReferral && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        </div>
                                    )}
                                </div>

                                {/* Referral validation feedback */}
                                {referralValidation && (
                                    <div className={`mt-2 p-3 rounded-lg ${referralValidation.isValid
                                        ? 'bg-green-50 border border-green-200'
                                        : 'bg-red-50 border border-red-200'
                                        }`}>
                                        <p className={`text-sm flex items-center ${referralValidation.isValid ? 'text-green-700' : 'text-red-700'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full mr-2 ${referralValidation.isValid ? 'bg-green-500' : 'bg-red-500'
                                                }`}></span>
                                            {referralValidation.message}
                                        </p>
                                        {/* {referralValidation.isValid && referralValidation.referrerName && (
                                            <p className="text-xs text-green-600 mt-1 ml-4">
                                                You'll be credited to {referralValidation.referrerName}'s referral program
                                            </p>
                                        )} */}
                                    </div>
                                )}

                                <p className="mt-1 text-xs text-gray-500">
                                    Have a referral code? Enter it here to get special benefits and help your referrer earn rewards.
                                </p>
                            </div>

                            {/* Terms Agreement */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                    <input
                                        {...register('terms')}
                                        id="terms"
                                        name="terms"
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                                    />
                                    <label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed">
                                        I agree to the{' '}
                                        <Link to="/terms-of-service" className="text-blue-600 hover:text-blue-700 font-medium">
                                            Terms and Conditions
                                        </Link>{' '}
                                        of this Platform.
                                    </label>
                                </div>
                                {errors.terms && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                                        {errors.terms.message}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                                >
                                    {isLoading ? (
                                        <LoadingSpinner />
                                    ) : (
                                        <>
                                            Register
                                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Sign In Link */}
                        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">
                                    Already have an account?{' '}
                                    <Link
                                        to="/login"
                                        className="font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
                                    >
                                        Sign in to your account
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center">
                        <p className="text-xs text-gray-500">
                            By creating an account, you agree to our{' '}
                            <Link to="/terms" className="text-blue-600 hover:text-blue-700">
                                Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link to="/privacy" className="text-blue-600 hover:text-blue-700">
                                Privacy Policy
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RegisterPage 