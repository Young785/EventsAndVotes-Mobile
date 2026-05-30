import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Check, X, Loader2, AlertCircle } from 'lucide-react'
import { adminApi } from '../services/api'
import toast from 'react-hot-toast'

interface BankVerificationProps {
    bankCode: string
    accountNumber: string
    onVerificationSuccess: (accountName: string) => void
    onVerificationError?: (error: string) => void
    disabled?: boolean
}

const BankVerification: React.FC<BankVerificationProps> = ({
    bankCode,
    accountNumber,
    onVerificationSuccess,
    onVerificationError,
    disabled = false
}) => {
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [accountName, setAccountName] = useState<string>('')

    const verifyMutation = useMutation({
        mutationFn: () => adminApi.verifyBankAccount({
            bank_code: bankCode,
            account_no: accountNumber
        }),
        onSuccess: (data) => {
            if (data.error === false && data) {
                setVerificationStatus('success')
                setAccountName(data.data.account_name)
                onVerificationSuccess(data.data.account_name)
                toast.success('Account verified successfully!')
            } else {
                throw new Error(data.message || 'Verification failed')
            }
        },
        onError: (error: any) => {
            setVerificationStatus('error')
            const errorMessage = error.response?.data?.message || error.message || 'Verification failed'
            onVerificationError?.(errorMessage)
            toast.error(errorMessage)
        }
    })

    const handleVerify = () => {
        if (!bankCode || !accountNumber) {
            toast.error('Please select a bank and enter account number')
            return
        }

        if (accountNumber.length < 10) {
            toast.error('Account number must be at least 10 digits')
            return
        }

        setVerificationStatus('idle')
        setAccountName('')
        verifyMutation.mutate()
    }

    const getStatusIcon = () => {
        switch (verificationStatus) {
            case 'success':
                return <Check className="w-4 h-4 text-green-600" />
            case 'error':
                return <X className="w-4 h-4 text-red-600" />
            default:
                return verifyMutation.isPending ? (
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                ) : (
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                )
        }
    }

    const getStatusColor = () => {
        switch (verificationStatus) {
            case 'success':
                return 'border-green-500 bg-green-50'
            case 'error':
                return 'border-red-500 bg-red-50'
            default:
                return 'border-gray-300 bg-white'
        }
    }

    return (
        <div className="flex items-center space-x-2">
            <button
                type="button"
                onClick={handleVerify}
                disabled={disabled || verifyMutation.isPending || !bankCode || !accountNumber}
                className={`px-3 py-2 border rounded-lg flex items-center space-x-2 transition-colors duration-200 ${getStatusColor()} ${disabled || verifyMutation.isPending || !bankCode || !accountNumber
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-blue-50 hover:border-blue-300'
                    }`}
            >
                {getStatusIcon()}
                <span className="text-sm font-medium">
                    {verifyMutation.isPending ? 'Verifying...' : 'Verify Account'}
                </span>
            </button>

            {verificationStatus === 'success' && accountName && (
                <div className="text-sm text-green-600 font-medium">
                    ✓ {accountName}
                </div>
            )}

            {verificationStatus === 'error' && (
                <div className="text-sm text-red-600">
                    ✗ Verification failed
                </div>
            )}
        </div>
    )
}

export default BankVerification 