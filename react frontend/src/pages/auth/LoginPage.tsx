import React, { useState } from 'react'
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../contexts/AuthContext'
import { Eye, EyeOff, Mail, Lock, ArrowRight, User } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
    remember: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

const LoginPage: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false)
    const { login, isLoading, isAuthenticated } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const from = location.state?.from?.pathname || '/dashboard'

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    })

    // Redirect if already authenticated (after all hooks are declared)
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const onSubmit = async (data: LoginFormData) => {
        try {
            const success = await login(data)
            if (success) {
                // Get user from auth context after successful login
                // Note: we'll need to get this from context or make login return user
                // For now, we'll check localStorage which gets updated in login
                const userStr = localStorage.getItem('user')
                if (userStr) {
                    const user = JSON.parse(userStr)
                    // Check if user has admin role and redirect accordingly
                    const adminRoles = ['admin', 'admin_vote', 'admin_both', 'admin_event', 'superadmin']
                    if (user.role && adminRoles.includes(user.role.name)) {
                        navigate('/admin/dashboard', { replace: true })
                        return
                    }
                }
                // Default redirect for regular users
                navigate(from, { replace: true })
            }
        } catch (error: any) {
            if (error.response?.data?.errors) {
                // Handle validation errors
                Object.entries(error.response.data.errors).forEach(([field, messages]) => {
                    setError(field as keyof LoginFormData, {
                        type: 'server',
                        message: (messages as string[])[0],
                    })
                })
            } else {
                setError('email', {
                    type: 'server',
                    message: error.response?.data?.message || 'Login failed. Please try again.',
                })
            }
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full"></div>
                <div className="absolute bottom-10 right-10 w-48 h-48 bg-purple-500 rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500 rounded-full"></div>
            </div>

            <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    {/* Header */}
                    <div className="text-center">
                        <Link to="/" className="inline-block">
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-2xl font-bold text-gray-900">Events & Votes</span>
                            </div>
                        </Link>
                        <h2 className="mt-6 text-3xl font-bold text-gray-900">Welcome back!</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Sign in to your account to continue
                        </p>
                    </div>

                    {/* Login Form */}
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                            {/* Email Field */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        {...register('email')}
                                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-300 ${errors.email ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="Enter your email"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        {...register('password')}
                                        className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-300 ${errors.password ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="Enter your password"
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
                                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                                )}
                            </div>

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember"
                                        type="checkbox"
                                        {...register('remember')}
                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    />
                                    <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                                        Remember me
                                    </label>
                                </div>

                                <div className="text-sm">
                                    <Link
                                        to="/forgot-password"
                                        className="font-medium text-primary hover:text-primary-dark transition-colors duration-300"
                                    >
                                        Forgot your password?
                                    </Link>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <LoadingSpinner />
                                    ) : (
                                        <>
                                            Sign in
                                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
                                </div>
                            </div>

                            {/* Sign Up Link */}
                            <div className="text-center">
                                <Link
                                    to="/register"
                                    className="font-medium text-primary hover:text-primary-dark transition-colors duration-300"
                                >
                                    Create a new account
                                </Link>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="text-center">
                        <p className="text-xs text-gray-500">
                            By signing in, you agree to our{' '}
                            <Link to="/terms" className="text-primary hover:text-primary-dark">
                                Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link to="/privacy" className="text-primary hover:text-primary-dark">
                                Privacy Policy
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoginPage 