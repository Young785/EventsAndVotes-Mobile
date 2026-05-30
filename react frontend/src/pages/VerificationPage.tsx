import React, { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
    Shield,
    Mail,
    Smartphone,
    Key,
    CheckCircle,
    AlertTriangle,
    RefreshCw,
    Copy,
    QrCode,
    Download,
    Eye,
    EyeOff,
    Lock,
    Unlock,
    ArrowRight,
    ArrowLeft,
    Info,
    User,
    Calendar,
    Building
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { getNomineeImageUrl } from '../utils/imageUtils'

const VerificationPage: React.FC = () => {
    const [step, setStep] = useState<'email' | '2fa-choice' | '2fa-email' | '2fa-google' | 'complete'>('email')
    const [verificationCode, setVerificationCode] = useState('')
    const [twoFactorCode, setTwoFactorCode] = useState('')
    const [showBackupCodes, setShowBackupCodes] = useState(false)
    const [backupCodes, setBackupCodes] = useState<string[]>([])
    const [googleSecret, setGoogleSecret] = useState('')
    const [qrCodeUrl, setQrCodeUrl] = useState('')
    const [copiedCode, setCopiedCode] = useState<string | null>(null)

    const { user, updateUser } = useAuth()

    // Fetch verification status and auto-send code if needed
    const { data: verificationData, refetch: refetchVerification, isError: isVerificationError, error: verificationError } = useQuery({
        queryKey: ['verification-status'],
        queryFn: async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/verification?auto_send=true`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            })
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to fetch verification status')
            }
            return response.json()
        },
        retry: (failureCount, error) => {
            // Only retry on network errors, not auth errors
            if (error.message.includes('Unauthenticated') || error.message.includes('401')) {
                return false
            }
            return failureCount < 2
        }
    })

    // Fetch 2FA status
    const { data: twoFactorData, refetch: refetch2FA, isError: is2FAError, error: twoFactorError } = useQuery({
        queryKey: ['2fa-status'],
        queryFn: async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/profile/2fa`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            })
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to fetch 2FA status')
            }
            return response.json()
        },
        retry: (failureCount, error) => {
            // Only retry on network errors, not auth errors
            if (error.message.includes('Unauthenticated') || error.message.includes('401')) {
                return false
            }
            return failureCount < 2
        }
    })

    // Resend email verification
    const resendEmailMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/verification`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            })
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to resend verification code')
            }
            return response.json()
        },
        onSuccess: () => {
            toast.success('Verification code sent to your email')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to send verification code')
        }
    })

    // Confirm email verification
    const confirmEmailMutation = useMutation({
        mutationFn: async (code: string) => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/verification/confirm`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code })
            })
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to verify email')
            }
            return response.json()
        },
        onSuccess: () => {
            toast.success('Email verified successfully!')
            refetchVerification()
            setStep('2fa-choice')
            setVerificationCode('')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to verify email')
        }
    })

    // Generate Google 2FA
    const generateGoogle2FAMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/profile/2fa/google/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            })
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to generate Google 2FA')
            }
            return response.json()
        },
        onSuccess: (data) => {
            setGoogleSecret(data.data.secret)
            setQrCodeUrl(data.data.qr_code_url)
            setStep('2fa-google')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to generate Google 2FA')
        }
    })

    // Verify Google 2FA
    const verifyGoogle2FAMutation = useMutation({
        mutationFn: async (code: string) => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/profile/2fa/google/verify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code })
            })
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to verify Google 2FA')
            }
            return response.json()
        },
        onSuccess: (data) => {
            toast.success('Google 2FA enabled successfully!')
            setBackupCodes(data.data.backup_codes)
            setShowBackupCodes(true)
            refetch2FA()
            setStep('complete')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to verify Google 2FA')
        }
    })

    // Enable Email 2FA
    const enableEmail2FAMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/profile/2fa/email/enable`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json'
                }
            })
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to enable email 2FA')
            }
            return response.json()
        },
        onSuccess: () => {
            toast.success('2FA code sent to your email')
            setStep('2fa-email')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to enable email 2FA')
        }
    })

    // Verify Email 2FA
    const verifyEmail2FAMutation = useMutation({
        mutationFn: async (code: string) => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/2fa/email/verify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code })
            })
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to verify email 2FA')
            }
            return response.json()
        },
        onSuccess: (data) => {
            toast.success('Email 2FA enabled successfully!')
            setBackupCodes(data.data.backup_codes)
            setShowBackupCodes(true)
            refetch2FA()
            setStep('complete')
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to verify email 2FA')
        }
    })

    const copyToClipboard = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedCode(type)
            toast.success('Copied to clipboard!')
            setTimeout(() => setCopiedCode(null), 2000)
        } catch (error) {
            toast.error('Failed to copy to clipboard')
        }
    }

    const downloadBackupCodes = () => {
        const content = `Backup Codes for ${user?.email}\n\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.join('\n')}\n\nImportant:\n- Keep these codes safe and secure\n- Each code can only be used once\n- Use these codes if you lose access to your 2FA device`

        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `backup-codes-${Date.now()}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    useEffect(() => {
        if (verificationData?.data?.email_verified && !twoFactorData?.data?.two_factor_enabled) {
            setStep('2fa-choice')
        } else if (verificationData?.data?.email_verified && twoFactorData?.data?.two_factor_enabled) {
            setStep('complete')
        }
    }, [verificationData, twoFactorData])

    // Show auto-send success message
    useEffect(() => {
        if (verificationData?.data?.verification_code_info?.code_sent) {
            toast.success(verificationData.data.verification_code_info.message)
            if (verificationData.data.verification_code_info.email_warning) {
                toast(verificationData.data.verification_code_info.email_warning, { 
                    duration: 5000,
                    icon: '⚠️',
                    style: {
                        background: '#FEF3C7',
                        color: '#92400E',
                        border: '1px solid #FBBF24'
                    }
                })
            }
        }
    }, [verificationData?.data?.verification_code_info])

    // Show error messages
    useEffect(() => {
        if (isVerificationError && verificationError) {
            toast.error((verificationError as Error).message || 'Failed to load verification status')
        }
    }, [isVerificationError, verificationError])

    useEffect(() => {
        if (is2FAError && twoFactorError) {
            toast.error((twoFactorError as Error).message || 'Failed to load 2FA status')
        }
    }, [is2FAError, twoFactorError])

    const isEmailVerified = verificationData?.data?.email_verified
    const is2FAEnabled = twoFactorData?.data?.two_factor_enabled

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                    <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900">Account Security</h1>
                    <p className="text-gray-600 mt-2">Secure your account with verification and 2FA</p>
                </div>

                {/* User Info Section */}
                {user && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                        <div className="flex items-start">
                            <Info className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-yellow-800 mb-2">Email Verification Required</h3>
                                <p className="text-sm text-yellow-700 mb-3">
                                    You need to verify your email address to access all features of your account. 
                                    This helps us keep your account secure and ensures you receive important notifications.
                                </p>
                                <div className="text-xs text-yellow-600 space-y-1">
                                    <div className="flex items-center">
                                        <User className="w-3 h-3 mr-2" />
                                        <span>{user.first_name} {user.last_name}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Mail className="w-3 h-3 mr-2" />
                                        <span>{user.email}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Calendar className="w-3 h-3 mr-2" />
                                        <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                                    </div>
                                    {user.role && (
                                        <div className="flex items-center">
                                            <Building className="w-3 h-3 mr-2" />
                                            <span className="capitalize">{user.role.display_name || user.role.name || user.role} Account</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className={`flex items-center ${isEmailVerified ? 'text-green-600' : 'text-blue-600'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isEmailVerified ? 'bg-green-100' : 'bg-blue-100'}`}>
                                {isEmailVerified ? <CheckCircle className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                            </div>
                            <span className="ml-2 text-sm font-medium">Email</span>
                        </div>
                        <div className={`flex-1 h-1 mx-4 ${isEmailVerified ? 'bg-green-200' : 'bg-gray-200'}`}></div>
                        <div className={`flex items-center ${is2FAEnabled ? 'text-green-600' : isEmailVerified ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${is2FAEnabled ? 'bg-green-100' : isEmailVerified ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                {is2FAEnabled ? <CheckCircle className="w-5 h-5" /> : <Key className="w-5 h-5" />}
                            </div>
                            <span className="ml-2 text-sm font-medium">2FA</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6">
                    {/* Error State */}
                    {(isVerificationError || is2FAError) && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center">
                                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                                <div>
                                    <h3 className="text-sm font-medium text-red-800">Unable to load security status</h3>
                                    <p className="text-sm text-red-700 mt-1">
                                        {(verificationError as Error)?.message || (twoFactorError as Error)?.message || 'Please try refreshing the page or contact support.'}
                                    </p>
                                    <button
                                        onClick={() => {
                                            refetchVerification()
                                            refetch2FA()
                                        }}
                                        className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Email Verification Step */}
                    {step === 'email' && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Verify Your Email</h2>
                            <div className="mb-6">
                                <p className="text-gray-600">
                                    {verificationData?.data?.verification_code_info?.code_sent 
                                        ? `A verification code has been sent to `
                                        : `We'll send a verification code to `}
                                    <strong>{user?.email}</strong>.
                                    {verificationData?.data?.verification_code_info?.code_sent
                                        ? ` Enter the code below to verify your email address.`
                                        : ` Click "Resend Code" to get started.`}
                                </p>
                                {verificationData?.data?.verification_code_info?.email_warning && (
                                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-center">
                                            <Info className="w-4 h-4 text-yellow-600 mr-2" />
                                            <p className="text-sm text-yellow-700">
                                                {verificationData.data.verification_code_info.email_warning}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Verification Code
                                    </label>
                                    <input
                                        type="text"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        placeholder="Enter 6-digit code"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        maxLength={6}
                                    />
                                </div>

                                <button
                                    onClick={() => confirmEmailMutation.mutate(verificationCode)}
                                    disabled={verificationCode.length !== 6 || confirmEmailMutation.isPending}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                                >
                                    {confirmEmailMutation.isPending ? (
                                        <LoadingSpinner size="sm" />
                                    ) : (
                                        <>
                                            <span>Verify Email</span>
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => resendEmailMutation.mutate()}
                                    disabled={resendEmailMutation.isPending}
                                    className="w-full text-blue-600 hover:text-blue-700 py-2 px-4 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center"
                                >
                                    {resendEmailMutation.isPending ? (
                                        <LoadingSpinner size="sm" />
                                    ) : (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            <span>Resend Code</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 2FA Choice Step */}
                    {step === '2fa-choice' && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose 2FA Method</h2>
                            <p className="text-gray-600 mb-6">
                                Add an extra layer of security to your account by enabling two-factor authentication.
                            </p>

                            <div className="space-y-4">
                                <button
                                    onClick={() => generateGoogle2FAMutation.mutate()}
                                    disabled={generateGoogle2FAMutation.isPending}
                                    className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200 text-left"
                                >
                                    <div className="flex items-center">
                                        <Smartphone className="w-8 h-8 text-blue-600 mr-4" />
                                        <div>
                                            <h3 className="font-medium text-gray-900">Google Authenticator</h3>
                                            <p className="text-sm text-gray-600">Use an authenticator app for secure codes</p>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => enableEmail2FAMutation.mutate()}
                                    disabled={enableEmail2FAMutation.isPending}
                                    className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200 text-left"
                                >
                                    <div className="flex items-center">
                                        <Mail className="w-8 h-8 text-green-600 mr-4" />
                                        <div>
                                            <h3 className="font-medium text-gray-900">Email 2FA</h3>
                                            <p className="text-sm text-gray-600">Receive codes via email</p>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setStep('complete')}
                                    className="w-full text-gray-600 hover:text-gray-700 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                >
                                    Skip for now
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Google 2FA Setup */}
                    {step === '2fa-google' && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Setup Google Authenticator</h2>

                            <div className="space-y-6">
                                <div className="text-center">
                                    <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block">
                                        <img src={getNomineeImageUrl({ image: qrCodeUrl })} alt="QR Code" className="w-48 h-48" />
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">Scan this QR code with your authenticator app</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Manual Entry Key
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={googleSecret}
                                            readOnly
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(googleSecret, 'secret')}
                                            className="p-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                                        >
                                            {copiedCode === 'secret' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Enter Code from Authenticator
                                    </label>
                                    <input
                                        type="text"
                                        value={twoFactorCode}
                                        onChange={(e) => setTwoFactorCode(e.target.value)}
                                        placeholder="Enter 6-digit code"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        maxLength={6}
                                    />
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setStep('2fa-choice')}
                                        className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back
                                    </button>
                                    <button
                                        onClick={() => verifyGoogle2FAMutation.mutate(twoFactorCode)}
                                        disabled={twoFactorCode.length !== 6 || verifyGoogle2FAMutation.isPending}
                                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                                    >
                                        {verifyGoogle2FAMutation.isPending ? (
                                            <LoadingSpinner size="sm" />
                                        ) : (
                                            <>
                                                <span>Verify & Enable</span>
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Email 2FA Setup */}
                    {step === '2fa-email' && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Verify Email 2FA</h2>
                            <p className="text-gray-600 mb-6">
                                We've sent a verification code to your email. Enter the code below to enable email 2FA.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Verification Code
                                    </label>
                                    <input
                                        type="text"
                                        value={twoFactorCode}
                                        onChange={(e) => setTwoFactorCode(e.target.value)}
                                        placeholder="Enter 6-digit code"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        maxLength={6}
                                    />
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setStep('2fa-choice')}
                                        className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back
                                    </button>
                                    <button
                                        onClick={() => verifyEmail2FAMutation.mutate(twoFactorCode)}
                                        disabled={twoFactorCode.length !== 6 || verifyEmail2FAMutation.isPending}
                                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                                    >
                                        {verifyEmail2FAMutation.isPending ? (
                                            <LoadingSpinner size="sm" />
                                        ) : (
                                            <>
                                                <span>Verify & Enable</span>
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Complete Step */}
                    {step === 'complete' && (
                        <div className="text-center">
                            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Secured!</h2>
                            <p className="text-gray-600 mb-6">
                                Your account is now verified and secured. You can access all platform features.
                            </p>

                            {showBackupCodes && backupCodes.length > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                    <div className="flex items-center mb-3">
                                        <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                                        <h3 className="font-medium text-yellow-800">Save Your Backup Codes</h3>
                                    </div>
                                    <p className="text-sm text-yellow-700 mb-4">
                                        These codes can be used to access your account if you lose your 2FA device.
                                        Save them in a secure location.
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        {backupCodes.map((code, index) => (
                                            <div key={index} className="bg-white p-2 rounded border text-sm font-mono">
                                                {code}
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={downloadBackupCodes}
                                        className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors duration-200 flex items-center justify-center"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Backup Codes
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={() => window.location.href = '/admin/dashboard'}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                            >
                                Continue to Dashboard
                            </button>
                        </div>
                    )}
                </div>

                {/* Security Tips */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                        <Info className="w-5 h-5 text-blue-600 mr-2" />
                        <h3 className="font-medium text-blue-800">Security Tips</h3>
                    </div>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Never share your verification codes with anyone</li>
                        <li>• Keep your backup codes in a secure location</li>
                        <li>• Use a strong, unique password for your account</li>
                        <li>• Enable 2FA for maximum security</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default VerificationPage 