import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, LoginCredentials, RegisterData, AuthResponse } from '../types'
import { authApi } from '../services/api'
import SettingsService from '../services/settingsService'
import toast from 'react-hot-toast'

interface AuthContextType {
    user: User | null
    token: string | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (credentials: LoginCredentials) => Promise<boolean>
    register: (data: RegisterData) => Promise<boolean>
    logout: () => void
    updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

interface AuthProviderProps {
    children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const isAuthenticated = !!user && !!token

    // Initialize auth state from localStorage
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const storedToken = localStorage.getItem('token')
                const storedUser = localStorage.getItem('user')

                if (storedToken && storedUser) {
                    try {
                        const parsedUser = JSON.parse(storedUser)
                        setToken(storedToken)
                        setUser(parsedUser)
                        
                        // Verify token with backend
                        await verifyToken(storedToken)
                    } catch (error) {
                        console.error('Error parsing stored user:', error)
                        localStorage.removeItem('token')
                        localStorage.removeItem('user')
                        setToken(null)
                        setUser(null)
                    }
                }
            } catch (error) {
                console.error('Error initializing auth:', error)
                // Clear potentially corrupted data
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                setToken(null)
                setUser(null)
            } finally {
                setIsLoading(false)
            }
        }

        initializeAuth()
    }, [])

    const verifyToken = async (token: string) => {
        try {
            const response = await authApi.getCurrentUser(token)
            if (response.status === 'success' && response.data) {
                setUser(response.data)
                // Update stored user data with fresh data from server
                localStorage.setItem('user', JSON.stringify(response.data))
            } else {
                // Token is invalid, clear auth state
                logout()
            }
        } catch (error) {
            console.error('Token verification failed:', error)
            // Token is invalid, clear auth state
            logout()
        }
    }

    const login = async (credentials: LoginCredentials): Promise<boolean> => {
        try {
            setIsLoading(true)
            console.log('Attempting login with:', { email: credentials.email })
            
            const response: AuthResponse = await authApi.login(credentials)
            console.log('Login response:', response)
            
            // Handle successful response
            if (response.status === 'success' && response.data?.token && response.data?.user) {
                const { token, user, settings } = response.data
                setToken(token)
                setUser(user)
                localStorage.setItem('token', token)
                localStorage.setItem('user', JSON.stringify(user))
                
                // Store site settings if provided
                if (settings) {
                    SettingsService.storeSettings(settings)
                    console.log('Site settings stored:', settings)
                }
                
                toast.success(response.message || 'Login successful!')
                return true
            } else {
                console.error('Login failed - invalid response structure:', response)
                toast.error('Login failed. Invalid server response.')
                return false
            }
        } catch (error: any) {
            console.error('Login error:', error)
            
            // Handle different types of errors
            if (error.response) {
                const { status, data } = error.response
                console.error(`HTTP ${status} Error:`, data)
                
                if (status === 302) {
                    toast.error('Authentication session expired. Please try again.')
                } else if (status === 422 && data?.errors) {
                    // Validation errors
                    const firstError = Object.values(data.errors)[0]
                    const message = Array.isArray(firstError) ? firstError[0] : firstError
                    toast.error(message || 'Validation failed')
                } else if (status === 401) {
                    toast.error(data?.message || 'Invalid credentials')
                } else {
                    toast.error(data?.message || 'Login failed. Please try again.')
                }
            } else if (error.request) {
                console.error('Network error:', error.request)
                toast.error('Network error. Please check your connection.')
            } else {
                console.error('Request setup error:', error.message)
                toast.error('Login request failed. Please try again.')
            }
            
            return false
        } finally {
            setIsLoading(false)
        }
    }

    const register = async (data: RegisterData): Promise<boolean> => {
        try {
            setIsLoading(true)
            const response: AuthResponse = await authApi.register(data)

            if (response.status === 'success' && response.data?.token && response.data?.user) {
                const { token, user } = response.data
                setToken(token)
                setUser(user)
                localStorage.setItem('token', token)
                localStorage.setItem('user', JSON.stringify(user))
                
                // Check if email is verified
                if (!user.email_verified_at) {
                    toast.success('Registration successful! Please verify your email to continue.')
                } else {
                    toast.success(response.message || 'Registration successful!')
                }
                return true
            } else {
                toast.error('Registration failed. Please try again.')
                return false
            }
        } catch (error: any) {
            console.error('Registration error:', error)
            
            // Handle validation errors properly
            if (error.response) {
                const { status, data } = error.response
                console.error(`HTTP ${status} Error:`, data)
                
                if (status === 422 && data?.errors) {
                    // Show validation errors
                    const errors = data.errors
                    const firstErrorKey = Object.keys(errors)[0]
                    const firstError = errors[firstErrorKey]
                    const message = Array.isArray(firstError) ? firstError[0] : firstError
                    toast.error(message || 'Validation failed')
                } else {
                    toast.error(data?.message || 'Registration failed. Please try again.')
                }
            } else if (error.request) {
                toast.error('Network error. Please check your connection.')
            } else {
                toast.error('Registration request failed. Please try again.')
            }
            
            return false
        } finally {
            setIsLoading(false)
        }
    }

    const logout = () => {
        setUser(null)
        setToken(null)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // Clear settings on logout for security
        SettingsService.clearSettings()
        toast.success('Logged out successfully!')
    }

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
    }

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 