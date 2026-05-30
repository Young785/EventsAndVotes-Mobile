import axios, { AxiosInstance, AxiosResponse } from 'axios'
import apiConfig from '../config/api.config'
import {
    User,
    LoginCredentials,
    RegisterData,
    AuthResponse,
    Vote,
    Position,
    Nominee,
    Transaction,
    Cart,
    CartItem,
    Subscription,
    BankAccount,
    DashboardStats,
    ApiResponse,
    PaginatedResponse,
    ContactFormData,
    Withdrawal,
    Event,
    Notification,
    NotificationSettings,
    NotificationSettingsGroup,
    ActivityLog,
    ActivityLogStats,
    UserSession,
    ManagementUser,
    ManagementStats
} from '../types'

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: apiConfig.baseURL,
    timeout: apiConfig.timeout,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: false, // Use token-based auth only
})

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor for error handling
api.interceptors.response.use(
    (response: AxiosResponse) => response.data,
    (error) => {
        // Handle different types of errors
        if (error.response) {
            const { status, data } = error.response;

            // Handle verification required (403 with verification_required flag)
            if (status === 403 && data?.verification_required) {
                console.warn('Email verification required');
                // Don't clear auth tokens, just redirect to verification
                if (window.location.pathname !== '/verification') {
                    window.location.href = '/verification';
                }
                return Promise.reject(error);
            }

            // Handle redirects (302) - these usually mean authentication issues
            if (status === 302) {
                console.warn('Received redirect response - possible authentication issue');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(new Error('Authentication session expired'));
            }

            // Handle unauthorized (401)
            if (status === 401) {
                console.warn('Unauthorized access - clearing authentication');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(error);
            }

            // Handle no content (204) - this might be expected for some requests
            if (status === 204) {
                return { status: 'success', message: 'Request completed successfully', data: null };
            }

            // Handle other client/server errors
            if (status >= 400) {
                console.error(`API Error ${status}:`, data);
                return Promise.reject(error);
            }
        } else if (error.request) {
            // Network error
            console.error('Network Error:', error.message);
            return Promise.reject(new Error('Network connection failed. Please check your internet connection.'));
        } else {
            // Other error
            console.error('Request Error:', error.message);
            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
)

// Tickets API
export const ticketsApi = {
    // Purchase tickets
    purchaseTickets: async (purchaseData: {
        event_id: string
        tickets: Array<{
            tier_id: string
            quantity: number
        }>
        customer_name: string
        customer_email: string
        customer_phone?: string
    }): Promise<ApiResponse<any>> => {
        return api.post('/tickets/purchase', purchaseData)
    },

    // Handle payment callback
    paymentCallback: async (callbackData: {
        reference: string
        status: string
    }): Promise<ApiResponse<any>> => {
        return api.post('/tickets/payment-callback', callbackData)
    },

    // Get user tickets
    getUserTickets: async (params?: {
        status?: string
        event_id?: string
        page?: number
    }): Promise<PaginatedResponse<any>> => {
        const searchParams = new URLSearchParams()
        if (params?.status) searchParams.append('status', params.status)
        if (params?.event_id) searchParams.append('event_id', params.event_id)
        if (params?.page) searchParams.append('page', params.page.toString())

        return api.get(`/tickets/my-tickets?${searchParams.toString()}`)
    },

    // Download ticket
    downloadTicket: async (ticketId: string): Promise<any> => {
        return api.get(`/tickets/${ticketId}/download`, {
            responseType: 'blob',
        })
    },

    // Get ticket details
    getTicketDetails: async (uuid: string): Promise<ApiResponse<any>> => {
        return api.get(`/tickets/${uuid}/details`)
    },

    // Scan ticket
    scanTicket: async (scanData: {
        qr_data: string
        scan_type?: string
        location?: string
    }): Promise<ApiResponse<any>> => {
        return api.post('/tickets/scan', scanData)
    },

    // Override scan
    overrideScan: async (ticketId: string, overrideData: {
        reason: string
        scan_type?: string
        location?: string
    }): Promise<ApiResponse<any>> => {
        return api.post(`/tickets/${ticketId}/override`, overrideData)
    },
}

// Auth API
export const authApi = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        return api.post('/auth/login', credentials)
    },

    register: async (data: RegisterData): Promise<AuthResponse> => {
        return api.post('/auth/register', data)
    },

    logout: async (): Promise<ApiResponse<null>> => {
        return api.post('/auth/logout')
    },

    getCurrentUser: async (token?: string): Promise<ApiResponse<User>> => {
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        return api.get('/auth/user', { headers })
    },

    forgotPassword: async (email: string): Promise<ApiResponse<null>> => {
        return api.post('/auth/forgot-password', { email })
    },

    resetPassword: async (data: {
        token: string
        email: string
        password: string
        password_confirmation: string
    }): Promise<ApiResponse<null>> => {
        return api.post('/auth/reset-password', data)
    },

    validateReferralCode: async (referralCode: string): Promise<ApiResponse<{
        is_valid: boolean
        referrer_name?: string
        message: string
    }>> => {
        return api.post('/auth/validate-referral', { referral_code: referralCode })
    },
}

// Votes API
export const votesApi = {
    getVotes: async (params?: {
        status?: string
        category?: string
        page?: number
        search?: string
        searchQuery?: string
    }): Promise<PaginatedResponse<Vote>> => {
        const searchParams = new URLSearchParams()
        if (params?.status) searchParams.append('status', params.status)
        if (params?.category) searchParams.append('category', params.category)
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.search) searchParams.append('search', params.search)
        if (params?.searchQuery) searchParams.append('searchQuery', params.searchQuery)

        return api.get(`/votes?${searchParams.toString()}`)
    },

    getUpcoming: async (params?: {
        status?: string
        searchQuery?: string
    }): Promise<PaginatedResponse<Vote>> => {
        const searchParams = new URLSearchParams()
        if (params?.status) searchParams.append('status', params.status)
        if (params?.searchQuery) searchParams.append('searchQuery', params.searchQuery)

        return api.get(`/votes/upcoming?${searchParams.toString()}`)
    },

    getPopular: async (params?: {
        status?: string
        searchQuery?: string
    }): Promise<PaginatedResponse<Vote>> => {
        const searchParams = new URLSearchParams()
        if (params?.status) searchParams.append('status', params.status)
        if (params?.searchQuery) searchParams.append('searchQuery', params.searchQuery)

        return api.get(`/votes/popular?${searchParams.toString()}`)
    },

    getOngoing: async (params?: {
        status?: string
        searchQuery?: string
    }): Promise<PaginatedResponse<Vote>> => {
        const searchParams = new URLSearchParams()
        if (params?.status) searchParams.append('status', params.status)
        if (params?.searchQuery) searchParams.append('searchQuery', params.searchQuery)

        return api.get(`/votes/ongoing?${searchParams.toString()}`)
    },

    getPast: async (params?: {
        status?: string
        searchQuery?: string
    }): Promise<PaginatedResponse<Vote>> => {
        const searchParams = new URLSearchParams()
        if (params?.status) searchParams.append('status', params.status)
        if (params?.searchQuery) searchParams.append('searchQuery', params.searchQuery)

        return api.get(`/votes/past?${searchParams.toString()}`)
    },

    getPricing: async (): Promise<ApiResponse<{ subscriptions: Subscription[], currency_icon: string }>> => {
        return api.get('/votes/pricing')
    },

    getVoteDetails: async (slug: string, id: number): Promise<ApiResponse<Vote>> => {
        return api.get(`/votes/${slug}/${id}`)
    },

    getVoteResults: async (slug: string, id: number): Promise<ApiResponse<any>> => {
        return api.get(`/votes/${slug}/${id}/results`)
    }
}

// Positions API
export const positionsApi = {
    getPositions: async (voteId: number): Promise<ApiResponse<Position[]>> => {
        return api.get(`/admin/votes/${voteId}/positions`)
    },

    createPosition: async (voteId: number, data: Partial<Position>): Promise<ApiResponse<Position>> => {
        return api.post(`/admin/votes/${voteId}/positions`, data)
    },

    updatePosition: async (voteId: number, positionId: string, data: Partial<Position>): Promise<ApiResponse<Position>> => {
        return api.put(`/admin/votes/${voteId}/positions/${positionId}`, data)
    },

    deletePosition: async (voteId: number, positionId: string): Promise<ApiResponse<null>> => {
        return api.delete(`/admin/votes/${voteId}/positions/${positionId}`)
    },
}

// Nominees API
export const nomineesApi = {
    getNominees: async (positionId: number): Promise<ApiResponse<Nominee[]>> => {
        return api.get(`/admin/positions/${positionId}/nominees`)
    },

    getNomineesByVote: async (voteSlug: string): Promise<ApiResponse<{ nominees: Nominee[], positions: Position[] }>> => {
        return api.get(`/admin/votes/${voteSlug}/nominees`)
    },

    createNominee: async (positionId: number, data: FormData): Promise<ApiResponse<Nominee>> => {
        return api.post(`/admin/positions/${positionId}/nominees`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    },

    createNomineeByVote: async (voteSlug: string, data: FormData): Promise<ApiResponse<Nominee>> => {
        return api.post(`/admin/votes/${voteSlug}/nominees`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    },

    updateNominee: async (positionId: number, nomineeId: string, data: FormData): Promise<ApiResponse<Nominee>> => {
        return api.put(`/admin/positions/${positionId}/nominees/${nomineeId}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    },

    deleteNominee: async (positionId: number, nomineeId: string): Promise<ApiResponse<null>> => {
        return api.delete(`/admin/positions/${positionId}/nominees/${nomineeId}`)
    },

    voteForNominee: async (nomineeId: number): Promise<ApiResponse<null>> => {
        return api.post(`/nominees/${nomineeId}/vote`)
    },
}

// Cart API
export const cartApi = {
    getCart: async (): Promise<ApiResponse<{ carts: any[] }>> => {
        return api.get('/cart')
    },

    addToCart: async (data: { nominee_id: string; quantity: number }): Promise<ApiResponse<any>> => {
        return api.post('/cart/add', data)
    },

    removeFromCart: async (nominee_id: string): Promise<ApiResponse<any>> => {
        return api.post('/cart/remove', { nominee_id })
    },

    updateCartItem: async (data: { nominee_id: string; quantity: number }): Promise<ApiResponse<any>> => {
        return api.post('/cart/update', data)
    },

    clearCart: async (): Promise<ApiResponse<null>> => {
        return api.post('/cart/clear')
    },

    checkout: async (data: {
        full_name: string;
        customer_email: string;
        payment_method?: string
    }): Promise<ApiResponse<{ checkout_url: string }>> => {
        return api.post('/cart/checkout', data)
    }
}

// Transactions API
export const transactionsApi = {
    getTransactions: async (params?: {
        page?: number
        type?: string
        status?: string
    }): Promise<PaginatedResponse<Transaction>> => {
        return api.get('/transactions', { params })
    },

    getTransaction: async (id: number): Promise<ApiResponse<Transaction>> => {
        return api.get(`/transactions/${id}`)
    },
}

// Subscriptions API
export const subscriptionsApi = {
    getSubscriptions: async (): Promise<ApiResponse<Subscription[]>> => {
        return api.get('/subscriptions')
    },

    subscribe: async (planId: string, data?: {
        email?: string
        amount?: number
        pg_id?: string
        plan_id?: string
        reference?: string
    }): Promise<ApiResponse<{ checkout_url?: string }>> => {
        return api.post(`/subscriptions/${planId}/subscribe`, data)
    },

    getUserSubscription: async (): Promise<ApiResponse<Subscription>> => {
        return api.get('/user/subscription')
    },

    getUserSubscriptionTransactions: async (params?: {
        page?: number
        per_page?: number
        status?: string
        date_from?: string
        date_to?: string
    }): Promise<PaginatedResponse<any>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.per_page) searchParams.append('per_page', params.per_page.toString())
        if (params?.status) searchParams.append('status', params.status)
        if (params?.date_from) searchParams.append('date_from', params.date_from)
        if (params?.date_to) searchParams.append('date_to', params.date_to)

        return api.get(`/user/subscription/transactions?${searchParams.toString()}`)
    },

    callback: async (data: { reference: string }): Promise<ApiResponse<any>> => {
        return api.post('/subscriptions/callback', data)
    },
}

// Bank Accounts API
export const bankAccountsApi = {
    getBankAccounts: async (): Promise<ApiResponse<BankAccount[]>> => {
        return api.get('/bank-accounts')
    },

    createBankAccount: async (data: Partial<BankAccount>): Promise<ApiResponse<BankAccount>> => {
        return api.post('/bank-accounts', data)
    },

    updateBankAccount: async (id: number, data: Partial<BankAccount>): Promise<ApiResponse<BankAccount>> => {
        return api.put(`/bank-accounts/${id}`, data)
    },

    deleteBankAccount: async (id: number): Promise<ApiResponse<null>> => {
        return api.delete(`/bank-accounts/${id}`)
    },

    verifyBankAccount: async (id: number, token: string): Promise<ApiResponse<BankAccount>> => {
        return api.post(`/bank-accounts/${id}/verify`, { token })
    },
}

// Withdrawals API
export const withdrawalsApi = {
    getWithdrawals: async (params?: {
        page?: number
        status?: string
    }): Promise<PaginatedResponse<Withdrawal>> => {
        return api.get('/withdrawals', { params })
    },

    createWithdrawal: async (data: {
        amount: number
        bank_account_id: number
    }): Promise<ApiResponse<Withdrawal>> => {
        return api.post('/withdrawals', data)
    },

    updateWithdrawal: async (id: number, data: {
        status: string
    }): Promise<ApiResponse<Withdrawal>> => {
        return api.put(`/withdrawals/${id}`, data)
    },
}

// Dashboard API
export const dashboardApi = {
    getStats: async (): Promise<ApiResponse<DashboardStats>> => {
        return api.get('/dashboard/stats')
    },

    getAdminStats: async (): Promise<ApiResponse<DashboardStats>> => {
        return api.get('/admin/dashboard/stats')
    },

    getSuperAdminStats: async (): Promise<ApiResponse<DashboardStats>> => {
        return api.get('/superadmin/dashboard/stats')
    },
}

// Profile API
export const profileApi = {
    // Get user profile
    getProfile: async (): Promise<ApiResponse<{
        user_info: {
            account_id: string
            first_name: string
            last_name: string
            email: string
            phone: string
            image: string | null
            email_verified_at: string | null
            created_at: string
            balance: number
            role: {
                name: string
                display_name: string
            }
        }
        subscription_info: any | null
        referral_info: any
        referral_link: string
        commission_rates: any
    }>> => {
        return api.get('/profile')
    },

    // Get user profile (alias for compatibility)
    getUserProfile: async (): Promise<ApiResponse<{
        account_id: string
        first_name: string
        last_name: string
        email: string
        phone: string
        image: string | null
        email_verified_at: string | null
        created_at: string
        balance: number
        referral_code?: string
        referral_earnings?: number
        role: {
            name: string
            display_name: string
        }
    }>> => {
        return api.get('/profile')
    },

    // Update user profile
    updateProfile: async (data: {
        first_name?: string
        last_name?: string
        phone?: string
        image?: string
    }): Promise<ApiResponse<User>> => {
        return api.put('/profile', data)
    },

    // Change password
    changePassword: async (data: {
        current_password: string
        new_password: string
        new_password_confirmation: string
    }): Promise<ApiResponse<null>> => {
        return api.put('/profile/password', data)
    },

    // Upload avatar
    uploadAvatar: async (file: File): Promise<ApiResponse<{
        avatar_url: string
    }>> => {
        const formData = new FormData()
        formData.append('avatar', file)
        return api.post('/profile/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },

    // Get referral dashboard
    getReferralDashboard: async (): Promise<ApiResponse<{
        referral_code: string
        referral_link: string
        statistics: {
            total_earnings: number
            total_referrals: number
            pending_referrals: number
            completed_referrals: number
            registration_referrals: number
            subscription_referrals: number
            vote_referrals: number
            event_referrals: number
            monthly_earnings: number
            recent_referrals: any[]
        }
        commission_rates: any
        withdrawal_limits: {
            min_withdrawal: number
            max_withdrawal: number
        }
        can_withdraw: {
            can_withdraw: boolean
            message: string
        }
    }>> => {
        return api.get('/profile/referral-dashboard')
    },

    // Generate referral code
    generateReferralCode: async (): Promise<ApiResponse<{
        referral_code: string
        referral_link: string
    }>> => {
        return api.post('/profile/generate-referral-code')
    },

    // Get referral history
    getReferralHistory: async (params?: {
        page?: number
        per_page?: number
    }): Promise<PaginatedResponse<any>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.per_page) searchParams.append('per_page', params.per_page.toString())

        return api.get(`/profile/referral-history?${searchParams.toString()}`)
    },

    // Get user notification settings
    getNotificationSettings: async (): Promise<ApiResponse<any>> => {
        return api.get('/admin/notification-settings')
    },

    // Update user notification settings
    updateNotificationSettings: async (settings: Array<{
        type: string
        category: string
        enabled: boolean
    }>): Promise<ApiResponse<any>> => {
        return api.put('/admin/notification-settings', { settings })
    },

    // Reset notification settings to defaults
    resetNotificationSettings: async (): Promise<ApiResponse<any>> => {
        return api.post('/admin/notification-settings/reset')
    },

    // Test notification
    testNotification: async (data: {
        notification_type: string
        message?: string
    }): Promise<ApiResponse<any>> => {
        return api.post('/admin/notification-settings/test', data)
    },

    // Get notification statistics
    getNotificationStats: async (): Promise<ApiResponse<any>> => {
        return api.get('/admin/notification-settings/stats')
    },

    // Bulk update notification settings
    bulkUpdateNotificationSettings: async (data: {
        enable_all?: boolean
        disable_all?: boolean
        categories?: string[]
    }): Promise<ApiResponse<any>> => {
        return api.put('/admin/notification-settings/bulk-update', data)
    }
}

// Contact API
export const contactApi = {
    sendMessage: async (data: ContactFormData): Promise<ApiResponse<null>> => {
        return api.post('/contact', data)
    },
}

// File Upload API
export const uploadApi = {
    uploadImage: async (file: File, type: string = 'general'): Promise<ApiResponse<{ url: string }>> => {
        const formData = new FormData()
        formData.append('image', file)
        formData.append('type', type)
        return api.post('/upload/image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    },

    uploadAvatar: async (file: File): Promise<ApiResponse<{ url: string }>> => {
        const formData = new FormData()
        formData.append('avatar', file)

        return api.post('/profile/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    },
}

// Notifications API
export const notificationsApi = {
    // Get notifications with pagination and filtering
    getNotifications: async (params?: {
        page?: number
        per_page?: number
        read?: boolean | string
    }): Promise<PaginatedResponse<Notification> & { unread_count: number }> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.per_page) searchParams.append('per_page', params.per_page.toString())
        if (params?.read !== undefined) searchParams.append('read', params.read.toString())

        return api.get(`/admin/notifications?${searchParams.toString()}`)
    },

    // Get unread notifications count
    getUnreadCount: async (): Promise<ApiResponse<{ unread_count: number }>> => {
        return api.get('/admin/notifications/unread-count')
    },

    // Get recent notifications for header dropdown
    getRecent: async (params?: {
        limit?: number
    }): Promise<ApiResponse<Notification[]> & { unread_count: number }> => {
        const searchParams = new URLSearchParams()
        if (params?.limit) searchParams.append('limit', params.limit.toString())

        return api.get(`/admin/notifications/recent?${searchParams.toString()}`)
    },

    // Mark notification as read
    markAsRead: async (id: string): Promise<ApiResponse<null>> => {
        return api.put(`/admin/notifications/${id}/read`)
    },

    // Mark all notifications as read
    markAllAsRead: async (): Promise<ApiResponse<null>> => {
        return api.put('/admin/notifications/mark-all-read')
    },

    // Delete notification
    deleteNotification: async (id: string): Promise<ApiResponse<null>> => {
        return api.delete(`/admin/notifications/${id}`)
    },

    // Get notification settings
    getSettings: async (): Promise<ApiResponse<NotificationSettings[]>> => {
        return api.get('/admin/notifications/settings')
    },

    // Update notification settings
    updateSettings: async (settings: Array<{
        type: string
        category: string
        enabled: boolean
    }>): Promise<ApiResponse<null>> => {
        return api.put('/admin/notifications/settings', { settings })
    },
}

// Activity Logs API
export const activityLogsApi = {
    // Get activity logs with filtering and pagination
    getAll: async (params?: {
        log_name?: string
        date_from?: string
        date_to?: string
        search?: string
        causer_id?: string
        page?: number
        per_page?: number
    }): Promise<PaginatedResponse<ActivityLog>> => {
        const searchParams = new URLSearchParams()
        if (params?.log_name && params.log_name !== 'all') searchParams.append('log_name', params.log_name)
        if (params?.date_from) searchParams.append('date_from', params.date_from)
        if (params?.date_to) searchParams.append('date_to', params.date_to)
        if (params?.search) searchParams.append('search', params.search)
        if (params?.causer_id) searchParams.append('causer_id', params.causer_id.toString())
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.per_page) searchParams.append('per_page', params.per_page.toString())

        return api.get(`/admin/activity-logs?${searchParams.toString()}`)
    },

    // Get activity statistics
    getStats: async (): Promise<ApiResponse<ActivityLogStats>> => {
        return api.get('/admin/activity-logs/stats')
    },

    // Export activity logs
    export: async (params?: {
        format?: 'json' | 'csv'
        log_name?: string
        date_from?: string
        date_to?: string
    }): Promise<Blob | ApiResponse<ActivityLog[]>> => {
        const searchParams = new URLSearchParams()
        if (params?.format) searchParams.append('format', params.format)
        if (params?.log_name) searchParams.append('log_name', params.log_name)
        if (params?.date_from) searchParams.append('date_from', params.date_from)
        if (params?.date_to) searchParams.append('date_to', params.date_to)

        if (params?.format === 'csv') {
            const response = await axios.get(
                `/admin/activity-logs/export?${searchParams.toString()}`,
                {
                    baseURL: 'https://eventsandvotes.test/api',
                    responseType: 'blob',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            )
            return response.data
        }

        return api.get(`/admin/activity-logs/export?${searchParams.toString()}`)
    }
}

// Enhanced Admin API with management features
export const adminApi = {
    // Dashboard stats
    getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
        return api.get('/admin/dashboard/stats')
    },

    getChartData: async (): Promise<ApiResponse<any>> => {
        return api.get('/admin/dashboard/chart-data')
    },

    // Get recent activities for dashboard
    getRecentActivities: async (params?: {
        limit?: number
        days?: number
    }): Promise<ApiResponse<ActivityLog[]>> => {
        const searchParams = new URLSearchParams()
        if (params?.limit) searchParams.append('per_page', params.limit.toString())
        if (params?.days) {
            const fromDate = new Date(Date.now() - params.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            searchParams.append('date_from', fromDate)
        }
        searchParams.append('date_to', new Date().toISOString().split('T')[0])

        const response = await activityLogsApi.getAll({
            date_from: params?.days ? new Date(Date.now() - params.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
            date_to: new Date().toISOString().split('T')[0],
            per_page: params?.limit
        })

        // Convert PaginatedResponse to ApiResponse for compatibility
        return {
            status: 'success',
            message: 'Activities retrieved successfully',
            data: response.data
        }
    },

    // Votes Management
    getVotes: async (params?: {
        page?: number
        search?: string
        status?: string
        per_page?: number
        payment_mode?: string
        date_from?: string
        date_to?: string
        date_type?: string
    }): Promise<PaginatedResponse<Vote>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.search) searchParams.append('search', params.search)
        if (params?.status) searchParams.append('status', params.status)
        if (params?.per_page) searchParams.append('per_page', params.per_page.toString())
        if (params?.payment_mode) searchParams.append('payment_mode', params.payment_mode)
        if (params?.date_from) searchParams.append('date_from', params.date_from)
        if (params?.date_to) searchParams.append('date_to', params.date_to)
        if (params?.date_type) searchParams.append('date_type', params.date_type)

        return api.get(`/admin/votes?${searchParams.toString()}`)
    },

    createVote: async (data: Partial<Vote>): Promise<ApiResponse<Vote>> => {
        return api.post('/admin/votes', data)
    },

    updateVote: async (id: number, data: Partial<Vote>): Promise<ApiResponse<Vote>> => {
        return api.put(`/admin/votes/${id}`, data)
    },

    deleteVote: async (id: number): Promise<ApiResponse<null>> => {
        return api.delete(`/admin/votes/${id}`)
    },

    getVoteTransactions: async (params?: {
        page?: number
        search?: string
        vote_id?: string
    }): Promise<PaginatedResponse<Transaction>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.search) searchParams.append('search', params.search)
        if (params?.vote_id) searchParams.append('vote_id', params.vote_id)

        return api.get(`/admin/votes/transactions?${searchParams.toString()}`)
    },

    requeryTransactions: async (voteId: string): Promise<ApiResponse<any>> => {
        return api.post('/admin/votes/requery-transactions', { vote_id: voteId })
    },

    getLevels: async (): Promise<ApiResponse<any[]>> => {
        return api.get('/admin/levels')
    },

    withdrawVote: async (id: number, data: {
        amount: number
        bank_account_id: number
        description?: string
    }): Promise<ApiResponse<Withdrawal>> => {
        return api.post(`/admin/votes/${id}/withdraw`, data)
    },

    shareVote: async (id: number): Promise<ApiResponse<{ share_url: string }>> => {
        return api.get(`/admin/votes/${id}/share`)
    },

    // Get single vote details
    getVote: async (id: string): Promise<ApiResponse<Vote>> => {
        return api.get(`/admin/votes/${id}`)
    },

    // User Management
    getUsers: async (params?: {
        page?: number
        search?: string
        role?: string
        status?: string
        per_page?: number
    }): Promise<PaginatedResponse<ManagementUser>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.search) searchParams.append('search', params.search)
        if (params?.role) searchParams.append('role', params.role)
        if (params?.status) searchParams.append('status', params.status)
        if (params?.per_page) searchParams.append('per_page', params.per_page.toString())

        return api.get(`/admin/management/users?${searchParams.toString()}`)
    },

    createUser: async (data: {
        first_name: string
        last_name: string
        email: string
        phone?: string
        password: string
        password_confirmation: string
        role_id: number
        status?: string
    }): Promise<ApiResponse<User>> => {
        return api.post('/admin/management/users', data)
    },

    updateUser: async (id: number, data: Partial<User>): Promise<ApiResponse<User>> => {
        return api.put(`/admin/management/users/${id}`, data)
    },

    deleteUser: async (id: number): Promise<ApiResponse<null>> => {
        return api.delete(`/admin/management/users/${id}`)
    },

    getRoles: async (): Promise<ApiResponse<{
        id: number
        name: string
        display_name: string
    }[]>> => {
        return api.get('/admin/management/roles')
    },

    getManagementStats: async (): Promise<ApiResponse<ManagementStats>> => {
        return api.get('/admin/management/stats')
    },

    loginAsUser: async (accountId: string): Promise<ApiResponse<{
        user: User
        redirect_url: string
    }>> => {
        return api.post(`/admin/management/login-as-user/${accountId}`)
    },

    switchBackToAdmin: async (): Promise<ApiResponse<{
        user: User
        redirect_url: string
    }>> => {
        return api.post('/admin/management/switch-back')
    },

    // Notification methods (delegated to notificationsApi)
    getNotifications: notificationsApi.getNotifications,
    getUnreadNotificationsCount: notificationsApi.getUnreadCount,
    getRecentNotifications: notificationsApi.getRecent,
    markNotificationAsRead: notificationsApi.markAsRead,
    markAllNotificationsAsRead: notificationsApi.markAllAsRead,
    deleteNotification: notificationsApi.deleteNotification,
    getNotificationSettings: notificationsApi.getSettings,
    updateNotificationSettings: notificationsApi.updateSettings,

    // Activity log methods (delegated to activityLogsApi)
    getActivityLogs: activityLogsApi.getAll,
    getActivityStats: activityLogsApi.getStats,
    exportActivityLogs: activityLogsApi.export,

    // Settings management
    getSettings: async (): Promise<ApiResponse<any>> => {
        return api.get('/admin/settings')
    },

    updateSettings: async (data: any): Promise<ApiResponse<any>> => {
        return api.put('/admin/settings', data)
    },

    // Bank management methods
    getUserBanks: async (params?: {
        page?: number
        search?: string
    }): Promise<PaginatedResponse<any>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.search) searchParams.append('search', params.search)

        return api.get(`/admin/banks/user-banks?${searchParams.toString()}`)
    },

    // Withdrawal management methods
    getWithdrawals: async (params?: {
        page?: number
        status?: string
        search?: string
        date_from?: string
        date_to?: string
    }): Promise<PaginatedResponse<Withdrawal>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.status) searchParams.append('status', params.status)
        if (params?.search) searchParams.append('search', params.search)
        if (params?.date_from) searchParams.append('date_from', params.date_from)
        if (params?.date_to) searchParams.append('date_to', params.date_to)

        return api.get(`/admin/withdrawals?${searchParams.toString()}`)
    },

    createWithdrawalRequest: async (data: {
        amount: number
        bank_id: string
        type: string
        pace: string
        note?: string
    }): Promise<ApiResponse<Withdrawal>> => {
        return api.post('/admin/withdrawals', data)
    },

    approveWithdrawalRequest: async (id: number): Promise<ApiResponse<Withdrawal>> => {
        return api.put(`/admin/withdrawals/${id}/approve`)
    },

    rejectWithdrawalRequest: async (id: number, data: {
        rejection_reason: string
    }): Promise<ApiResponse<Withdrawal>> => {
        return api.put(`/admin/withdrawals/${id}/reject`, data)
    },

    getWithdrawalStats: async (): Promise<ApiResponse<{
        total_withdrawn: number
        pending_withdrawals: number
        processing_fees: number
        available_balance: number
        pending_count: number
        monthly_growth: number
    }>> => {
        return api.get('/admin/withdrawals/stats')
    },

    verifyBankAccount: async (data: {
        bank_code: string
        account_no: string
    }): Promise<ApiResponse<{
        account_name: string
        account_number: string
        bank_code: string
    }>> => {
        return api.post('/admin/banks/verify-account', data)
    },

    // Referral management methods
    getReferralStats: async (params?: {
        period?: string
    }): Promise<ApiResponse<{
        overview: {
            total_referrals: number
            total_earnings: number
            pending_referrals: number
            completed_referrals: number
            period_referrals: number
            period_earnings: number
            conversion_rate: number
        }
        top_referrers: any[]
        trends: any[]
        commission_breakdown: any[]
        recent_referrals: any[]
        withdrawals: {
            total_withdrawals: number
            total_withdrawn_amount: number
            pending_withdrawals: number
            pending_withdrawal_amount: number
            available_for_withdrawal: number
        }
    }>> => {
        const searchParams = new URLSearchParams()
        if (params?.period) searchParams.append('period', params.period)
        return api.get(`/admin/referrals/stats?${searchParams.toString()}`)
    },

    getReferrals: async (params?: {
        page?: number
        per_page?: number
        search?: string
        status?: string
        commission_type?: string
        date_from?: string
        date_to?: string
    }): Promise<PaginatedResponse<any>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.per_page) searchParams.append('per_page', params.per_page.toString())
        if (params?.search) searchParams.append('search', params.search)
        if (params?.status) searchParams.append('status', params.status)
        if (params?.commission_type) searchParams.append('commission_type', params.commission_type)
        if (params?.date_from) searchParams.append('date_from', params.date_from)
        if (params?.date_to) searchParams.append('date_to', params.date_to)

        return api.get(`/admin/referrals?${searchParams.toString()}`)
    },

    updateReferralStatus: async (id: number, data: {
        status: string
        commission_amount?: number
        admin_notes?: string
    }): Promise<ApiResponse<any>> => {
        return api.put(`/admin/referrals/${id}/status`, data)
    },

    exportReferrals: async (params?: {
        status?: string
        commission_type?: string
        date_from?: string
        date_to?: string
    }): Promise<any> => {
        const searchParams = new URLSearchParams()
        if (params?.status) searchParams.append('status', params.status)
        if (params?.commission_type) searchParams.append('commission_type', params.commission_type)
        if (params?.date_from) searchParams.append('date_from', params.date_from)
        if (params?.date_to) searchParams.append('date_to', params.date_to)

        return api.get(`/admin/referrals/export?${searchParams.toString()}`, {
            responseType: 'blob'
        })
    },

    getReferralWithdrawals: async (params?: {
        page?: number
        per_page?: number
        status?: string
        search?: string
    }): Promise<PaginatedResponse<any>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.per_page) searchParams.append('per_page', params.per_page.toString())
        if (params?.status) searchParams.append('status', params.status)
        if (params?.search) searchParams.append('search', params.search)

        return api.get(`/admin/referrals/withdrawals?${searchParams.toString()}`)
    },

    updateReferralWithdrawal: async (id: number, data: {
        status: string
        admin_notes?: string
    }): Promise<ApiResponse<any>> => {
        return api.put(`/admin/referrals/withdrawals/${id}`, data)
    },

    // Site Settings
    getSiteSettings: async (): Promise<ApiResponse<any>> => {
        return api.get('/superadmin/management/site-settings')
    },

    updateSiteSettings: async (data: FormData): Promise<ApiResponse<any>> => {
        // Laravel doesn't handle FormData in PUT requests well, so we use POST with _method spoofing
        data.append('_method', 'PUT');
        return api.post('/superadmin/management/site-settings', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    },

    resetSiteSettings: async (): Promise<ApiResponse<any>> => {
        return api.post('/superadmin/management/site-settings/reset')
    },

    // Profile Management
    getProfile: async (): Promise<ApiResponse<User>> => {
        return api.get('/admin/profile')
    },

    updateProfile: async (data: {
        first_name?: string
        last_name?: string
        phone?: string
        address?: string
        state?: string
        country?: string
        gender?: string
        dob?: string
    }): Promise<ApiResponse<User>> => {
        return api.put('/admin/profile', data)
    },

    updatePassword: async (data: {
        current_password: string
        password: string
        password_confirmation: string
    }): Promise<ApiResponse<null>> => {
        return api.put('/admin/profile/password', data)
    },

    uploadAvatar: async (formData: FormData): Promise<ApiResponse<{
        url: string
        user: User
    }>> => {
        return api.post('/admin/profile/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    },

    // Email and Phone Verification for Profile Updates
    requestEmailChange: async (data: {
        new_email: string
    }): Promise<ApiResponse<{
        message: string
        expires_at: string
    }>> => {
        return api.post('/admin/profile/request-email-change', data)
    },

    verifyEmailChange: async (data: {
        verification_code: string
    }): Promise<ApiResponse<User>> => {
        return api.post('/admin/profile/verify-email-change', data)
    },

    requestPhoneChange: async (data: {
        new_phone: string
    }): Promise<ApiResponse<{
        message: string
        expires_at: string
    }>> => {
        return api.post('/admin/profile/request-phone-change', data)
    },

    verifyPhoneChange: async (data: {
        verification_code: string
    }): Promise<ApiResponse<User>> => {
        return api.post('/admin/profile/verify-phone-change', data)
    },
}

// SuperAdmin API - extends adminApi with superadmin-specific functionality
export const superAdminApi = {
    // Inherit all admin methods
    ...adminApi,

    // SuperAdmin specific dashboard stats
    getSuperAdminStats: async (): Promise<ApiResponse<DashboardStats>> => {
        return api.get('/superadmin/dashboard/stats')
    },

    // SuperAdmin specific chart data
    getChartData: async (): Promise<ApiResponse<any>> => {
        return api.get('/superadmin/dashboard/chart-data')
    },

    // User Management APIs
    getUserDetails: async (accountId: string): Promise<ApiResponse<{
        user: any
        referral_stats: any
        voting_stats: any
        subscription_history: any[]
        financial_summary: any
        recent_activities: any[]
        referral_history: any[]
    }>> => {
        return api.get(`/superadmin/user-management/users/${accountId}`)
    },

    updateUserReferral: async (accountId: string, data: {
        referral_code?: string
        total_referrals?: number
        referral_earnings?: number
    }): Promise<ApiResponse<any>> => {
        return api.put(`/superadmin/user-management/users/${accountId}/referral`, data)
    },

    getSuperAdminReferrals: async (params?: {
        page?: number
        per_page?: number
        status?: string
        type?: string
        date_from?: string
        date_to?: string
    }): Promise<PaginatedResponse<any>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.per_page) searchParams.append('per_page', params.per_page.toString())
        if (params?.status) searchParams.append('status', params.status)
        if (params?.type) searchParams.append('type', params.type)
        if (params?.date_from) searchParams.append('date_from', params.date_from)
        if (params?.date_to) searchParams.append('date_to', params.date_to)

        return api.get(`/superadmin/user-management/referrals?${searchParams.toString()}`)
    },

    getSuperAdminReferralStats: async (): Promise<ApiResponse<{
        total_referrals: number
        total_commission: number
        active_referrers: number
        top_referrers: any[]
        commission_by_type: any
        monthly_stats: any[]
    }>> => {
        return api.get('/superadmin/user-management/referrals/stats')
    },

    // SuperAdmin bank management
    getBanks: async (params?: {
        page?: number
        search?: string
    }): Promise<PaginatedResponse<any>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.search) searchParams.append('search', params.search)

        return api.get(`/superadmin/banks?${searchParams.toString()}`)
    },

    createBank: async (data: {
        name: string
        code: string
        sort_code?: string
    }): Promise<ApiResponse<any>> => {
        return api.post('/superadmin/banks', data)
    },

    updateBank: async (id: number, data: Partial<any>): Promise<ApiResponse<any>> => {
        return api.put(`/superadmin/banks/${id}`, data)
    },

    deleteBank: async (id: number): Promise<ApiResponse<null>> => {
        return api.delete(`/superadmin/banks/${id}`)
    },

    getUserBanks: async (params?: {
        page?: number
        search?: string
    }): Promise<PaginatedResponse<any>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.search) searchParams.append('search', params.search)

        return api.get(`/superadmin/banks/user-banks?${searchParams.toString()}`)
    },
    updateUserBank: async (id: number, data: Partial<BankAccount>): Promise<ApiResponse<BankAccount>> => {
        return api.put(`/superadmin/banks/user/${id}`, data)
    },
    deleteUserBank: async (id: number): Promise<ApiResponse<null>> => {
        return api.delete(`/superadmin/banks/user/${id}`)
    },
    createUserBank: async (data: Partial<BankAccount>): Promise<ApiResponse<BankAccount>> => {
        return api.post('/superadmin/banks/user', data)
    },
    // SuperAdmin withdrawal management
    getWithdrawals: async (params?: {
        page?: number
        status?: string
        account_id?: string
    }): Promise<PaginatedResponse<Withdrawal>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.status) searchParams.append('status', params.status)
        if (params?.account_id) searchParams.append('account_id', params.account_id)

        return api.get(`/superadmin/withdrawals?${searchParams.toString()}`)
    },

    approveWithdrawal: async (id: number): Promise<ApiResponse<Withdrawal>> => {
        return api.put(`/superadmin/withdrawals/${id}/approve`)
    },

    rejectWithdrawal: async (id: number, data: {
        rejection_reason: string
    }): Promise<ApiResponse<Withdrawal>> => {
        return api.put(`/superadmin/withdrawals/${id}/reject`, data)
    },

    // SuperAdmin management overview
    getManagementOverview: async (): Promise<ApiResponse<any>> => {
        return api.get('/superadmin/managements')
    },

    getManagementVotes: async (params?: {
        page?: number
        account_id?: string
    }): Promise<PaginatedResponse<Vote>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.account_id) searchParams.append('account_id', params.account_id)

        return api.get(`/superadmin/managements/votes?${searchParams.toString()}`)
    },

    getManagementTransactions: async (params?: {
        page?: number
        account_id?: string
    }): Promise<PaginatedResponse<Transaction>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.account_id) searchParams.append('account_id', params.account_id)

        return api.get(`/superadmin/managements/votes/transactions?${searchParams.toString()}`)
    },

    getManagementWithdrawals: async (params?: {
        page?: number
        account_id?: string
    }): Promise<PaginatedResponse<Withdrawal>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.account_id) searchParams.append('account_id', params.account_id)

        return api.get(`/superadmin/managements/votes/withdrawals?${searchParams.toString()}`)
    },

    getManagementSubscriptions: async (params?: {
        page?: number
        account_id?: string
    }): Promise<PaginatedResponse<any>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.account_id) searchParams.append('account_id', params.account_id)

        return api.get(`/superadmin/managements/subscriptions?${searchParams.toString()}`)
    },

    loginAsAccount: async (accountId: string): Promise<ApiResponse<{
        user: User
        redirect_url: string
    }>> => {
        return api.post(`/superadmin/managements/login/${accountId}`)
    },
}

// Admin bank management API (for admin_vote users)
export const adminBankApi = {
    // Get all banks for dropdown
    getAllBanks: async (): Promise<ApiResponse<any[]>> => {
        return api.get('/admin/banks/all')
    },

    // User banks management
    getUserBanks: async (params?: {
        page?: number
        search?: string
    }): Promise<PaginatedResponse<any>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.search) searchParams.append('search', params.search)

        return api.get(`/admin/banks/user-banks?${searchParams.toString()}`)
    },

    createUserBank: async (data: {
        account_name: string
        account_number: string
        bank_id: string
        settlement_type?: string
        status?: string
        is_default?: boolean
    }): Promise<ApiResponse<any>> => {
        return api.post('/admin/banks/user-banks', data)
    },

    updateUserBank: async (id: number, data: any): Promise<ApiResponse<any>> => {
        return api.put(`/admin/banks/user-banks/${id}`, data)
    },

    deleteUserBank: async (id: number): Promise<ApiResponse<null>> => {
        return api.delete(`/admin/banks/user-banks/${id}`)
    },

    // Send verification code for bank update
    sendVerificationCode: async (userBankId: number): Promise<ApiResponse<null>> => {
        return api.post(`/admin/banks/user-banks/${userBankId}/send-verification`)
    },

    // Update user bank with verification code
    updateUserBankWithVerification: async (id: number, data: any): Promise<ApiResponse<any>> => {
        return api.put(`/admin/banks/user-banks/${id}/verify-update`, data)
    },

    // Verify bank account
    verifyBankAccount: async (data: {
        bank_code: string
        account_no: string
    }): Promise<ApiResponse<{
        account_name: string
        status: number
    }>> => {
        return api.post('/admin/banks/name-enquiry', data)
    }
}

export const getPublicSettings = async () => {
    return api.get('/public/settings');
};

// Default export
export default api;

// Additional API exports for compatibility
export const notificationSettingsApi = {
    getSettings: profileApi.getNotificationSettings,
    updateSettings: profileApi.updateNotificationSettings,
    resetSettings: profileApi.resetNotificationSettings,
    testNotification: profileApi.testNotification,
    getStats: profileApi.getNotificationStats,
    bulkUpdate: profileApi.bulkUpdateNotificationSettings
}

export const twoFactorApi = {
    getStatus: async (): Promise<ApiResponse<{
        two_factor_enabled: boolean
        two_factor_type: string | null
        has_backup_codes: boolean
    }>> => {
        return api.get('/profile/2fa/status')
    },

    setupGoogle: async (): Promise<ApiResponse<{
        qr_code: string
        secret: string
        backup_codes: string[]
    }>> => {
        return api.post('/profile/2fa/setup/google')
    },

    setupEmail: async (data: { password: string }): Promise<ApiResponse<{
        backup_codes: string[]
    }>> => {
        return api.post('/profile/2fa/setup/email', data)
    },

    verify: async (data: { code: string }): Promise<ApiResponse<{
        backup_codes: string[]
    }>> => {
        return api.post('/profile/2fa/verify', data)
    },

    disable: async (data: { password: string; code: string }): Promise<ApiResponse<null>> => {
        return api.post('/profile/2fa/disable', data)
    },

    generateBackupCodes: async (data: { password: string }): Promise<ApiResponse<{
        backup_codes: string[]
    }>> => {
        return api.post('/profile/2fa/backup-codes', data)
    }
}

// Additional API exports for admin pages
export const transactionsManagementApi = {
    // Get all transactions (admin/transactions)
    getAll: async (params?: {
        page?: number
        per_page?: number
        status?: string
        type?: 'vote' | 'subscription'
        date_from?: string
        date_to?: string
        search?: string
    }): Promise<PaginatedResponse<any>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.per_page) searchParams.append('per_page', params.per_page.toString())
        if (params?.status) searchParams.append('status', params.status)
        if (params?.type) searchParams.append('type', params.type)
        if (params?.date_from) searchParams.append('date_from', params.date_from)
        if (params?.date_to) searchParams.append('date_to', params.date_to)
        if (params?.search) searchParams.append('search', params.search)

        return api.get(`/admin/transactions?${searchParams.toString()}`)
    },

    // Get transaction stats
    getStats: async (params?: {
        type?: 'vote' | 'subscription'
        date_from?: string
        date_to?: string
    }): Promise<ApiResponse<any>> => {
        const searchParams = new URLSearchParams()
        if (params?.type) searchParams.append('type', params.type)
        if (params?.date_from) searchParams.append('date_from', params.date_from)
        if (params?.date_to) searchParams.append('date_to', params.date_to)

        return api.get(`/admin/transactions/stats?${searchParams.toString()}`)
    },

    // Get chart data
    getChartData: async (params?: {
        type?: 'vote' | 'subscription'
        date_from?: string
        date_to?: string
        period?: string
    }): Promise<ApiResponse<any>> => {
        const searchParams = new URLSearchParams()
        if (params?.type) searchParams.append('type', params.type)
        if (params?.date_from) searchParams.append('date_from', params.date_from)
        if (params?.date_to) searchParams.append('date_to', params.date_to)
        if (params?.period) searchParams.append('period', params.period)

        return api.get(`/admin/transactions/chart-data?${searchParams.toString()}`)
    },

    // Get vote transactions
    getVoteTransactions: async (params?: {
        page?: number
        per_page?: number
        status?: string
        date_from?: string
        date_to?: string
    }): Promise<PaginatedResponse<any>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.per_page) searchParams.append('per_page', params.per_page.toString())
        if (params?.status) searchParams.append('status', params.status)
        if (params?.date_from) searchParams.append('date_from', params.date_from)
        if (params?.date_to) searchParams.append('date_to', params.date_to)

        return api.get(`/admin/votes/transactions?${searchParams.toString()}`)
    },

    // Get subscription transactions
    getSubscriptionTransactions: async (params?: {
        page?: number
        per_page?: number
        status?: string
        date_from?: string
        date_to?: string
    }): Promise<PaginatedResponse<any>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.per_page) searchParams.append('per_page', params.per_page.toString())
        if (params?.status) searchParams.append('status', params.status)
        if (params?.date_from) searchParams.append('date_from', params.date_from)
        if (params?.date_to) searchParams.append('date_to', params.date_to)

        return api.get(`/admin/subscription-transactions?${searchParams.toString()}`)
    },

    // Re-query transactions
    reQueryTransactions: async (voteId?: string): Promise<ApiResponse<any>> => {
        return api.post('/admin/votes/requery-transactions', { vote_id: voteId })
    },

    // Export transactions
    exportTransactions: async (params?: {
        type?: 'vote' | 'subscription'
        date_from?: string
        date_to?: string
        status?: string
    }): Promise<any> => {
        const searchParams = new URLSearchParams()
        if (params?.type) searchParams.append('type', params.type)
        if (params?.date_from) searchParams.append('date_from', params.date_from)
        if (params?.date_to) searchParams.append('date_to', params.date_to)
        if (params?.status) searchParams.append('status', params.status)

        return api.get(`/admin/transactions/export?${searchParams.toString()}`, {
            responseType: 'blob'
        })
    }
}

export const votesManagementApi = {
    getVotes: adminApi.getVotes,
    createVote: adminApi.createVote,
    updateVote: adminApi.updateVote,
    deleteVote: adminApi.deleteVote,
    getVote: adminApi.getVote,
    shareVote: adminApi.shareVote,
    withdrawVote: adminApi.withdrawVote
}

export const subscriptionsManagementApi = {
    getSubscriptions: subscriptionsApi.getSubscriptions,
    getUserSubscription: subscriptionsApi.getUserSubscription,
    getUserSubscriptionTransactions: subscriptionsApi.getUserSubscriptionTransactions
}

// Referral API
export const referralApi = {
    // Get referral stats
    getStats: async (params?: {
        period?: 'all' | 'today' | 'week' | 'month' | 'year'
    }): Promise<ApiResponse<{
        overview: {
            total_referrals: number
            total_earnings: number
            pending_referrals: number
            completed_referrals: number
            period_referrals: number
            period_earnings: number
            conversion_rate: number
        }
        top_referrers: Array<{
            id: number
            first_name: string
            last_name: string
            email: string
            referral_count: number
            total_earnings: number
        }>
        trends: Array<{
            date: string
            referrals: number
            earnings: number
        }>
        commission_breakdown: Array<{
            commission_type: string
            count: number
            total_amount: number
        }>
        recent_referrals: Array<{
            id: number
            referrer_name: string
            referrer_email: string
            referred_name: string
            referred_email: string
            commission_amount: number
            commission_type: string
            status: string
            created_at: string
            completed_at: string | null
        }>
        withdrawals: {
            total_withdrawals: number
            total_withdrawn_amount: number
            pending_withdrawals: number
            pending_withdrawal_amount: number
            available_for_withdrawal: number
        }
    }>> => {
        const searchParams = new URLSearchParams()
        if (params?.period) searchParams.append('period', params.period)

        return api.get(`/admin/referrals/stats?${searchParams.toString()}`)
    },

    // Get all referrals with pagination
    getReferrals: async (params?: {
        page?: number
        per_page?: number
        search?: string
        status?: string
        commission_type?: string
        date_from?: string
        date_to?: string
    }): Promise<PaginatedResponse<any>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.per_page) searchParams.append('per_page', params.per_page.toString())
        if (params?.search) searchParams.append('search', params.search)
        if (params?.status) searchParams.append('status', params.status)
        if (params?.commission_type) searchParams.append('commission_type', params.commission_type)
        if (params?.date_from) searchParams.append('date_from', params.date_from)
        if (params?.date_to) searchParams.append('date_to', params.date_to)

        return api.get(`/admin/referrals?${searchParams.toString()}`)
    },

    // Update referral status
    updateStatus: async (id: number, data: {
        status: string
        notes?: string
    }): Promise<ApiResponse<any>> => {
        return api.put(`/admin/referrals/${id}/status`, data)
    },

    // Get withdrawals
    getWithdrawals: async (params?: {
        page?: number
        per_page?: number
        search?: string
        status?: string
        date_from?: string
        date_to?: string
    }): Promise<PaginatedResponse<any>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.per_page) searchParams.append('per_page', params.per_page.toString())
        if (params?.search) searchParams.append('search', params.search)
        if (params?.status) searchParams.append('status', params.status)
        if (params?.date_from) searchParams.append('date_from', params.date_from)
        if (params?.date_to) searchParams.append('date_to', params.date_to)

        return api.get(`/admin/referrals/withdrawals?${searchParams.toString()}`)
    },

    // Update withdrawal status
    updateWithdrawal: async (id: number, data: {
        status: string
        notes?: string
    }): Promise<ApiResponse<any>> => {
        return api.put(`/admin/referrals/withdrawals/${id}`, data)
    },

    // Export referrals
    exportReferrals: async (params?: {
        status?: string
        commission_type?: string
        date_from?: string
        date_to?: string
    }): Promise<any> => {
        const searchParams = new URLSearchParams()
        if (params?.status) searchParams.append('status', params.status)
        if (params?.commission_type) searchParams.append('commission_type', params.commission_type)
        if (params?.date_from) searchParams.append('date_from', params.date_from)
        if (params?.date_to) searchParams.append('date_to', params.date_to)

        return api.get(`/admin/referrals/export?${searchParams.toString()}`, {
            responseType: 'blob'
        })
    }
}

// Site Settings API
export const siteSettingsApi = {
    // Get site settings
    getSiteSettings: async (): Promise<ApiResponse<{
        settings: any
        payment_gateways?: any[]
    }>> => {
        return api.get('/superadmin/management/site-settings')
    },

    // Update site settings
    updateSiteSettings: async (data: FormData): Promise<ApiResponse<any>> => {
        // Laravel doesn't handle FormData in PUT requests well, so we use POST with _method spoofing
        data.append('_method', 'PUT');
        return api.post('/superadmin/management/site-settings', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    },

    // Reset site settings to default
    resetSiteSettings: async (): Promise<ApiResponse<any>> => {
        return api.post('/superadmin/management/site-settings/reset')
    }
}

// Add site settings to adminApi for backward compatibility
// Add site settings to adminApi for backward compatibility
Object.assign(adminApi, {
    getSiteSettings: siteSettingsApi.getSiteSettings,
    updateSiteSettings: siteSettingsApi.updateSiteSettings,
    resetSiteSettings: siteSettingsApi.resetSiteSettings
})

// Events API
export const eventsApi = {
    // Get all events (public)
    getEvents: async (params?: {
        page?: number
        per_page?: number
        search?: string
        status?: string
        upcoming?: boolean
        start_date?: string
        end_date?: string
    }): Promise<ApiResponse<PaginatedResponse<Event>>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.per_page) searchParams.append('per_page', params.per_page.toString())
        if (params?.search) searchParams.append('search', params.search)
        if (params?.status) searchParams.append('status', params.status)
        if (params?.upcoming) searchParams.append('upcoming', 'true')
        if (params?.start_date) searchParams.append('start_date', params.start_date)
        if (params?.end_date) searchParams.append('end_date', params.end_date)

        return api.get(`/events?${searchParams.toString()}`)
    },

    // Get admin events (with proper permission filtering)
    getAdminEvents: async (params?: {
        page?: number
        per_page?: number
        search?: string
        status?: string
        category?: string
    }): Promise<ApiResponse<PaginatedResponse<Event>>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.per_page) searchParams.append('per_page', params.per_page.toString())
        if (params?.search) searchParams.append('search', params.search)
        if (params?.status) searchParams.append('status', params.status)
        if (params?.category) searchParams.append('category', params.category)

        return api.get(`/admin/events?${searchParams.toString()}`)
    },

    // Create admin event
    createAdminEvent: async (data: {
        name: string
        description: string
        location: string
        category: string
        start_date: string
        end_date: string
        registration_start?: string
        registration_end?: string
        max_attendees?: number
        ticket_price?: number
        image?: string
        status?: string
    }): Promise<ApiResponse<Event>> => {
        return api.post('/admin/events', data)
    },

    // Update admin event
    updateAdminEvent: async (id: string, data: {
        name?: string
        description?: string
        location?: string
        category?: string
        start_date?: string
        end_date?: string
        registration_start?: string
        registration_end?: string
        max_attendees?: number
        ticket_price?: number
        image?: string
        status?: string
    }): Promise<ApiResponse<Event>> => {
        return api.put(`/admin/events/${id}`, data)
    },

    // Delete admin event
    deleteAdminEvent: async (id: string): Promise<ApiResponse<null>> => {
        return api.delete(`/admin/events/${id}`)
    },

    // Get single event
    getEvent: async (id: string): Promise<ApiResponse<Event>> => {
        return api.get(`/events/${id}`)
    },

    // Create event
    createEvent: async (data: FormData): Promise<ApiResponse<Event>> => {
        return api.post('/events', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    },

    // Update event
    updateEvent: async (id: string, data: FormData): Promise<ApiResponse<Event>> => {
        return api.post(`/events/${id}/update`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    },

    // Delete event
    deleteEvent: async (id: string): Promise<ApiResponse<null>> => {
        return api.delete(`/events/${id}`)
    },

    // Publish event
    publishEvent: async (id: string): Promise<ApiResponse<Event>> => {
        return api.post(`/events/${id}/publish`)
    },

    // Get event analytics
    getEventAnalytics: async (id: string): Promise<ApiResponse<{
        overview: {
            total_capacity: number
            tickets_sold: number
            total_revenue: number
            total_scans: number
            unique_entries: number
            attendance_rate: number
        }
        ticket_tiers: Array<{
            name: string
            price: number
            capacity: number | null
            sold_count: number
            available_count: number | null
            revenue: number
            attendance: number
        }>
        daily_sales: Array<{
            date: string
            count: number
            revenue: number
        }>
        hourly_entries: Array<{
            hour: number
            count: number
        }>
    }>> => {
        return api.get(`/admin/events/${id}/analytics`)
    },

    // Get event tickets
    getEventTickets: async (eventId: string, params?: {
        page?: number
        per_page?: number
        search?: string
        status?: string
        tier_id?: string
    }): Promise<PaginatedResponse<any>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.per_page) searchParams.append('per_page', params.per_page.toString())
        if (params?.search) searchParams.append('search', params.search)
        if (params?.status) searchParams.append('status', params.status)
        if (params?.tier_id) searchParams.append('tier_id', params.tier_id)

        return api.get(`/admin/events/${eventId}/tickets?${searchParams.toString()}`)
    },

    // Purchase ticket
    purchaseTicket: async (data: {
        event_id: string
        customer_info: {
            name: string
            email: string
            phone: string
        }
        tickets: Array<{
            ticket_tier_id: number
            quantity: number
        }>
    }): Promise<ApiResponse<any>> => {
        return api.post('/tickets/purchase', data)
    },

    // Event Subscription Plans (SuperAdmin only)
    getEventSubscriptionPlans: async (params?: {
        page?: number
        per_page?: number
        search?: string
        status?: string
    }): Promise<PaginatedResponse<any>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.per_page) searchParams.append('per_page', params.per_page.toString())
        if (params?.search) searchParams.append('search', params.search)
        if (params?.status) searchParams.append('status', params.status)

        return api.get(`/superadmin/event-subscription-plans?${searchParams.toString()}`)
    },

    createEventSubscriptionPlan: async (data: {
        name: string
        description: string
        price: number
        duration_days: number
        max_events: number
        max_attendees_per_event: number
        features: string[]
        is_active: boolean
        is_popular: boolean
    }): Promise<ApiResponse<any>> => {
        return api.post('/superadmin/event-subscription-plans', data)
    },

    updateEventSubscriptionPlan: async (id: string, data: {
        name?: string
        description?: string
        price?: number
        duration_days?: number
        max_events?: number
        max_attendees_per_event?: number
        features?: string[]
        is_active?: boolean
        is_popular?: boolean
    }): Promise<ApiResponse<any>> => {
        return api.put(`/superadmin/event-subscription-plans/${id}`, data)
    },

    deleteEventSubscriptionPlan: async (id: string): Promise<ApiResponse<null>> => {
        return api.delete(`/superadmin/event-subscription-plans/${id}`)
    },

    // Event Subscriptions (SuperAdmin only)
    getEventSubscriptions: async (params?: {
        page?: number
        per_page?: number
        search?: string
        status?: string
    }): Promise<PaginatedResponse<any>> => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.per_page) searchParams.append('per_page', params.per_page.toString())
        if (params?.search) searchParams.append('search', params.search)
        if (params?.status) searchParams.append('status', params.status)

        return api.get(`/superadmin/event-subscriptions?${searchParams.toString()}`)
    },

    // Event Subscription Analytics (SuperAdmin only)
    getEventSubscriptionAnalytics: async (): Promise<ApiResponse<{
        total_plans: number
        active_subscriptions: number
        monthly_revenue: number
        growth_rate: number
    }>> => {
        return api.get('/superadmin/event-subscription-analytics')
    }
}

// Event Subscriptions API (SuperAdmin only)
export const eventSubscriptionsApi = {
    // Get user's event subscription details
    getUserSubscription: () =>
        api.get('/superadmin/event-subscription-details'),

    // Get subscription plans
    getPlans: (params?: any) =>
        api.get('/superadmin/event-subscription-plans', { params }),

    // Get user's event subscriptions
    getSubscriptions: (params?: any) =>
        api.get('/superadmin/event-subscriptions', { params }),

    // Get analytics
    getAnalytics: () =>
        api.get('/superadmin/event-subscription-analytics'),

    // Subscribe to plan
    subscribe: (data: any) =>
        api.post('/superadmin/event-subscribe', data),

    // Cancel subscription
    cancelSubscription: (id: string, data?: any) =>
        api.post(`/superadmin/event-subscriptions/${id}/cancel`, data),
}

// Scan Locations API
export const scanLocationsApi = {
    // Get scan locations for an event
    getLocations: async (params: {
        event_id: string
        page?: number
        per_page?: number
        search?: string
        status?: string
        location_type?: string
    }): Promise<ApiResponse<any>> => {
        const searchParams = new URLSearchParams()
        searchParams.append('event_id', params.event_id)
        if (params.page) searchParams.append('page', params.page.toString())
        if (params.per_page) searchParams.append('per_page', params.per_page.toString())
        if (params.search) searchParams.append('search', params.search)
        if (params.status) searchParams.append('status', params.status)
        if (params.location_type) searchParams.append('location_type', params.location_type)

        return api.get(`/admin/scan-locations?${searchParams.toString()}`)
    },

    // Create scan location
    createLocation: async (data: {
        event_id: string
        name: string
        description?: string
        location_type: 'entry' | 'exit' | 'checkpoint'
        max_concurrent_scans?: number
        is_active?: boolean
    }): Promise<ApiResponse<any>> => {
        return api.post('/admin/scan-locations', data)
    },

    // Update scan location
    updateLocation: async (id: string, data: {
        name?: string
        description?: string
        location_type?: 'entry' | 'exit' | 'checkpoint'
        max_concurrent_scans?: number
        is_active?: boolean
    }): Promise<ApiResponse<any>> => {
        return api.put(`/admin/scan-locations/${id}`, data)
    },

    // Delete scan location
    deleteLocation: async (id: string): Promise<ApiResponse<any>> => {
        return api.delete(`/admin/scan-locations/${id}`)
    },

    // Get scan users for a location
    getLocationUsers: async (locationId: string, params?: {
        search?: string
        status?: string
    }): Promise<ApiResponse<any>> => {
        const searchParams = new URLSearchParams()
        if (params?.search) searchParams.append('search', params.search)
        if (params?.status) searchParams.append('status', params.status)

        const queryString = searchParams.toString()
        const url = queryString ? `/admin/scan-locations/${locationId}/users?${queryString}` : `/admin/scan-locations/${locationId}/users`
        
        return api.get(url)
    },

    // Create scan user
    createScanUser: async (locationId: string, data: {
        name: string
        email: string
        phone?: string
        role: 'scanner' | 'supervisor'
        permissions?: string[]
    }): Promise<ApiResponse<any>> => {
        return api.post(`/admin/scan-locations/${locationId}/users`, data)
    },

    // Update scan user
    updateScanUser: async (locationId: string, userId: string, data: {
        name?: string
        email?: string
        phone?: string
        role?: 'scanner' | 'supervisor'
        permissions?: string[]
        is_active?: boolean
    }): Promise<ApiResponse<any>> => {
        return api.put(`/admin/scan-locations/${locationId}/users/${userId}`, data)
    },

    // Delete scan user
    deleteScanUser: async (locationId: string, userId: string): Promise<ApiResponse<any>> => {
        return api.delete(`/admin/scan-locations/${locationId}/users/${userId}`)
    },

    // Resend invitation
    resendInvitation: async (locationId: string, userId: string): Promise<ApiResponse<any>> => {
        return api.post(`/admin/scan-locations/${locationId}/users/${userId}/resend-invitation`)
    },

    // Regenerate access token for scan user
    regenerateToken: async (locationId: string, userId: string): Promise<ApiResponse<any>> => {
        return api.post(`/admin/scan-locations/${locationId}/users/${userId}/regenerate-token`)
    },
}

// Scan API
export const scanApi = {
    // Validate scan user token
    validateScanUser: async (token: string): Promise<ApiResponse<any>> => {
        return api.get(`/scan/validate/${token}`)
    },

    // Scan ticket
    scanTicket: async (data: {
        qr_data: string
        scan_token: string
        scan_type?: 'entry' | 'exit' | 'checkpoint'
        location?: string
    }): Promise<ApiResponse<any>> => {
        return api.post('/scan/ticket', data)
    },
}