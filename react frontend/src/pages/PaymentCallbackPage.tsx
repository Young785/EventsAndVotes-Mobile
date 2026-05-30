import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Loader } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const PaymentCallbackPage: React.FC = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                const reference = searchParams.get('reference') || searchParams.get('trxref')

                if (!reference) {
                    setStatus('error')
                    setMessage('Payment reference not found')
                    return
                }

                console.log('Verifying payment with reference:', reference)

                // Verify the payment
                const verifyResponse = await api.post('/subscriptions/callback', {
                    reference: reference
                })

                console.log('Verification response:', verifyResponse)

                if (verifyResponse.data.status === 'success') {
                    setStatus('success')
                    setMessage('Payment successful! Your subscription has been activated.')
                    toast.success('Payment successful! Your subscription has been activated.')

                    // Redirect to dashboard after 3 seconds
                    setTimeout(() => {
                        navigate('/dashboard')
                    }, 3000)
                } else {
                    setStatus('error')
                    setMessage(verifyResponse.data.message || 'Payment verification failed')
                    toast.error(verifyResponse.data.message || 'Payment verification failed')
                }
            } catch (error: any) {
                console.error('Payment verification error:', error)
                setStatus('error')
                setMessage(error.response?.data?.message || 'Payment verification failed')
                toast.error('Payment verification failed')
            }
        }

        verifyPayment()
    }, [searchParams, navigate])

    const handleRetry = () => {
        navigate('/vote-pricing')
    }

    const handleGoToDashboard = () => {
        navigate('/dashboard')
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                {status === 'loading' && (
                    <div className="space-y-4">
                        <Loader className="w-16 h-16 text-blue-500 mx-auto animate-spin" />
                        <h2 className="text-xl font-semibold text-gray-900">
                            Verifying Payment...
                        </h2>
                        <p className="text-gray-600">
                            Please wait while we confirm your payment.
                        </p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-4">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                        <h2 className="text-xl font-semibold text-gray-900">
                            Payment Successful!
                        </h2>
                        <p className="text-gray-600">{message}</p>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-500">
                                Redirecting to dashboard in 3 seconds...
                            </p>
                            <button
                                onClick={handleGoToDashboard}
                                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Go to Dashboard Now
                            </button>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-4">
                        <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                        <h2 className="text-xl font-semibold text-gray-900">
                            Payment Failed
                        </h2>
                        <p className="text-gray-600">{message}</p>
                        <div className="space-y-2">
                            <button
                                onClick={handleRetry}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default PaymentCallbackPage 