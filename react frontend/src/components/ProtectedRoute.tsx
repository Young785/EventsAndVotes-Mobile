import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'

interface ProtectedRouteProps {
    children: React.ReactNode
    allowedRoles?: string[]
    requireVerification?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    allowedRoles = [],
    requireVerification = true
}) => {
    const { user, isLoading } = useAuth()
    const location = useLocation()
    const [verificationStatus, setVerificationStatus] = useState<any>(null)
    const [checkingVerification, setCheckingVerification] = useState(true)

    useEffect(() => {
        const checkVerificationStatus = async () => {
            if (!user || !requireVerification) {
                setCheckingVerification(false)
                return
            }

            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/verification`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Accept': 'application/json'
                    }
                })

                if (response.ok) {
                    const data = await response.json()
                    setVerificationStatus(data.data)
                }
            } catch (error) {
                console.error('Failed to check verification status:', error)
            } finally {
                setCheckingVerification(false)
            }
        }

        checkVerificationStatus()
    }, [user, requireVerification])

    if (isLoading || checkingVerification) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Check role permissions
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role?.name)) {
        return <Navigate to="/dashboard" replace />
    }

    // Check verification status (skip for verification page itself)
    if (requireVerification &&
        verificationStatus &&
        !verificationStatus.email_verified &&
        location.pathname !== '/verification') {
        return <Navigate to="/verification" replace />
    }

    return <>{children}</>
}

export default ProtectedRoute 