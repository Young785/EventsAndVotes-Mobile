// User types
export interface User {
    id: number
    account_id?: string
    first_name: string
    last_name: string
    name: string
    nick_name?: string
    email: string
    phone?: string
    address?: string
    state?: string
    country?: string
    gender?: string
    image?: string
    role: {
        id: number
        name: 'user' | 'admin' | 'superadmin' | 'admin_vote' | 'admin_event' | 'admin_both'
        display_name: string
    }
    verified: boolean
    email_verified_at?: string
    status?: 'ACTIVE' | 'INACTIVE' | 'PENDING'
    is_login?: 'YES' | 'NO'
    subscription_status?: string
    subscription?: any
    created_at: string
    updated_at: string
}

// Auth types
export interface LoginCredentials {
    email: string
    password: string
}

export interface RegisterData {
    first_name: string
    last_name: string
    email: string
    phone: string
    password: string
    password_confirmation: string
    dob: string
    gender: string
    country: string
    state: string
    role_id?: string
    address: string
    referral_code?: string
    terms?: boolean
}

export interface AuthResponse {
    status: 'success' | 'error'
    message: string
    data: {
        user: User
        token: string
        referral_processed?: boolean
        settings?: {
            site_name?: string
            site_logo?: string
            site_favicon?: string
            site_banner?: string
            currency?: string
            currency_symbol?: string
            currency_icon?: string
            site_frontend_url?: string
            monicredit_script_url?: string
            maintenance_mode?: boolean
            maintenance_message?: string
            registration_enabled?: boolean
            email_verification_required?: boolean
            withdrawal_settings?: {
                min_withdrawal_amount?: number
                max_withdrawal_amount?: number
                withdrawal_site_charges?: number
                withdrawal_pg_charges?: number
                normal_withdrawal_hours?: number
                express_withdrawal_hours?: number
                express_withdrawal_fee?: number
            }
            social_media?: {
                facebook_url?: string
                twitter_url?: string
                instagram_url?: string
                linkedin_url?: string
                youtube_url?: string
            }
        }
    }
}

// Vote/Election Management Types (Enhanced)
export interface VoteManagement {
    id: number
    vote_id: string
    title: string
    description: string
    slug: string
    start_date: string
    end_date: string
    nomination_start: string
    nomination_end_date: string
    release_result_date: string
    image: string
    payment_mode: 'FREE' | 'PAID'
    price_per_vote: number
    status: 'STARTED' | 'COMPLETED' | 'POSTPONED' | 'INACTIVE'
    positions_count: number
    nominees_count: number
    total_votes: number
    created_by: string
    created_at: string
    updated_at: string
    levels?: string[]
}

export interface VotePosition {
    id: number
    position_id: string
    vote_id: string
    title: string
    description?: string
    gender: 'MALE' | 'FEMALE' | 'ALL'
    minimum: number
    maximum: number
    status: 'ACTIVE' | 'INACTIVE'
    nominees_count?: number
    created_at: string
    updated_at: string
}

export interface VoteNominee {
    id: number
    nominees_id: string
    position_id: string
    first_name: string
    last_name: string
    nick_name: string
    email?: string
    phone: string
    level: string
    image?: string
    total_votes: number
    position?: VotePosition
    created_at: string
    updated_at: string
}

export interface VoteTransaction {
    id: number
    transaction_id: string
    vote_id?: string
    account_id?: string
    trxref?: string
    total_amount: number
    amount_paid: number
    amount_after_charges: number
    gateway_fee: number
    votes: string // JSON string
    paid_votes?: string // JSON string
    status: 'PAID' | 'PENDING' | 'FAILED'
    payment_gateway: {
        name: string
        pg_id: string
    }
    user?: {
        first_name: string
        last_name: string
        email: string
    }
    vote?: {
        name: string
        vote_id: string
    }
    created_at: string
    updated_at: string
}

// Subscription Management Types (Enhanced)
export interface SubscriptionPlan {
    id: number
    plan_id: string
    name: string
    slug: string
    description?: string
    price: number
    duration: number // days
    votes: number
    voting_times: number
    nominees: number
    features: string[]
    is_active: boolean
    activity_type: 'voting' | 'events' | 'both'
    created_at: string
    updated_at: string
}

export interface UserSubscription {
    id: number
    sub_id: string
    account_id: string
    plan_id: string
    start_date: string
    end_date: string
    status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'CANCELLED'
    remaining_votes: number
    remaining_votes_times: number
    remaining_nominees: number
    total_amount: number
    numbers_of_times: number
    plan: SubscriptionPlan
    user?: User
    created_at: string
    updated_at: string
}

export interface SubscriptionTransaction {
    id: number
    transaction_id: string
    account_id: string
    sub_id: string
    plan_id: string
    reference: string
    trxref?: string
    total_amount: number
    amount_paid: number
    gateway_response?: string
    channel?: string
    message?: string
    status: 'PAID' | 'PENDING' | 'HOLDING' | 'FAILED'
    ip_address: string
    plan: SubscriptionPlan
    user?: User
    subscription?: UserSubscription
    created_at: string
    updated_at: string
}

// Combined Transaction Types
export interface TransactionManagement {
    id: number
    type: 'vote' | 'subscription'
    reference: string
    amount: number
    quantity?: number
    status: 'PAID' | 'PENDING' | 'FAILED'
    user_name?: string
    vote_name?: string
    subscription_plan?: string
    created_at: string
    updated_at: string
}

// Vote/Election types (existing - kept for compatibility)
export interface Vote {
    id: number
    title: string
    description: string
    slug: string
    start_date: string
    end_date: string
    status: 'upcoming' | 'ongoing' | 'ended'
    image?: string
    category?: string
    created_by: number
    created_at: string
    updated_at: string
    positions?: Position[]
    total_votes?: number
}

export interface Position {
    id: number
    vote_id: number
    position_id: string
    title: string
    description: string
    minimum?: number
    maximum?: number
    gender?: 'MALE' | 'FEMALE' | 'ALL'
    status?: 'ACTIVE' | 'INACTIVE'
    max_nominees?: number
    nominees?: Nominee[]
    created_at: string
    updated_at: string
}

export interface Nominee {
    id: number
    position_id: number
    name: string
    description: string
    image?: string
    vote_count: number
    created_at: string
    updated_at: string
}

// Transaction types (existing)
export interface Transaction {
    id: number
    user_id: number
    type: 'subscription' | 'vote_creation' | 'vote_entry'
    amount: number
    status: 'pending' | 'success' | 'failed'
    reference: string
    description: string
    created_at: string
}

// Management Statistics
export interface VoteManagementStats {
    categories: number
    completed: number
    ongoing: number
    inactive: number
    nominations: number
    positions: number
    paid_voters: {
        count: number
        amount: number
    }
    pending_voters: {
        count: number
        amount: number
    }
    revenue: {
        total: number
        withdrawn: number
        pending_withdrawals: number
        current: number
    }
}

export interface SubscriptionManagementStats {
    total_subscriptions: number
    active_subscriptions: number
    expired_subscriptions: number
    revenue: {
        all: number
        paid: number
        pending: number
    }
    usage: {
        votes_category: number
        total_votes: number
        nominees: number
        left_category: number
        left_votes: number
        left_nominees: number
    }
}

// Form Types for Management
export interface VoteFormData {
    name: string
    description: string
    start_date: string
    end_date: string
    nomination_start: string
    nomination_end_date: string
    release_result_date: string
    payment_mode: 'FREE' | 'PAID'
    price_per_vote?: number
    image?: string | File
    levels: string[]
    status?: 'STARTED' | 'COMPLETED' | 'POSTPONED' | 'INACTIVE'
}

export interface PositionFormData {
    title: string
    description?: string
    gender: 'MALE' | 'FEMALE' | 'ALL'
    minimum: number
    maximum: number
}

export interface NomineeFormData {
    first_name: string
    last_name: string
    nick_name: string
    email?: string
    phone: string
    level: string
    position_id: string
    image?: string | File
}

// Level type
export interface Level {
    level_id: string
    level: string
    description?: string
    created_at: string
    updated_at: string
}

// Cart types
export interface CartItem {
    id: number
    vote_id: number
    position_id: number
    nominee_id: number
    quantity: number
    amount: number
    vote_title: string
    position_title: string
    nominee_name: string
}

export interface Cart {
    items: CartItem[]
    total: number
}

// Subscription types (existing - kept for compatibility)
export interface Subscription {
    id: number
    name: string
    price: number
    duration: number
    features: string[]
    is_active: boolean
}

// Bank details types
export interface BankAccount {
    id: number
    user_id: number
    bank_name: string
    account_number: string
    account_name: string
    bank_code: string
    verified: boolean
    created_at: string
}

// Dashboard stats types
export interface DashboardStats {
    total_votes: number
    active_votes: number
    total_revenue: number
    total_transactions: number
    recent_votes: Vote[]
    recent_transactions: Transaction[]
}

// API Response types
export interface ApiResponse<T> {
    status: 'success' | 'error'
    message: string
    data?: T
    errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
    data: T[]
    current_page: number
    last_page: number
    per_page: number
    total: number
}

// Form validation types
export interface ValidationErrors {
    [key: string]: string[]
}

// Event types
export interface Event {
    id: string
    organizer_id: number
    title: string
    description: string
    venue: string
    slug: string
    start_date: string
    end_date: string
    start_time?: string
    end_time?: string
    poster_image?: string
    total_capacity?: number
    is_public: boolean
    re_entry_allowed: boolean
    re_entry_cooldown?: number
    status: 'draft' | 'active' | 'inactive' | 'completed' | 'cancelled'
    created_at: string
    updated_at: string
    deleted_at?: string

    // Relationships
    organizer?: User
    ticketTiers?: TicketTier[]
    ticket_tiers?: TicketTier[]  // API response format
    tickets?: Ticket[]
    scanLogs?: ScanLog[]

    // Computed attributes
    is_expired?: boolean
    total_sold_tickets?: number
    available_capacity?: number

    // Statistics (when included)
    statistics?: {
        total_tickets_sold: number
        total_revenue: number
        total_scans: number
        unique_entries: number
        tier_stats: Array<{
            tier_id: number
            name: string
            sold_count: number
            available_count: number | null
            revenue: number
        }>
    }
}

export interface TicketTier {
    id: number
    event_id: number
    name: string
    description?: string
    price: number
    capacity?: number
    sold_count: number
    is_active: boolean
    sale_start_date?: string
    sale_end_date?: string
    max_per_user?: number
    metadata?: Record<string, any>
    created_at: string
    updated_at: string

    // Relationships
    event?: Event
    tickets?: Ticket[]

    // Computed attributes
    available_count?: number | null
    is_sold_out?: boolean
    is_sale_active?: boolean
}

export interface Ticket {
    id: number
    uuid: string
    user_id: number
    event_id: number
    ticket_tier_id: number
    qr_code_data: string
    status: 'pending' | 'sold' | 'used' | 'expired' | 'cancelled' | 'refunded'
    price_paid: number
    payment_reference?: string
    purchased_at?: string
    first_scanned_at?: string
    last_scanned_at?: string
    scan_count: number
    download_disabled: boolean
    metadata?: Record<string, any>
    created_at: string
    updated_at: string
    deleted_at?: string

    // Relationships
    user?: User
    event?: Event
    ticketTier?: TicketTier
    scanLogs?: ScanLog[]

    // Computed attributes
    is_valid?: boolean
    is_used?: boolean
    can_re_enter?: boolean
}

export interface ScanLog {
    id: number
    ticket_id: number
    event_id: number
    scanner_user_id?: number
    scan_type: 'entry' | 'exit' | 'validation' | 'manual_override'
    scan_result: 'success' | 'denied' | 'warning'
    scan_reason?: string
    scanned_at: string
    ip_address?: string
    device_info?: string
    location?: string
    metadata?: Record<string, any>
    created_at: string
    updated_at: string

    // Relationships
    ticket?: Ticket
    event?: Event
    scanner?: User

    // Computed attributes
    is_success?: boolean
    is_entry?: boolean
    is_exit?: boolean
}

export interface EventFormData {
    title: string
    description: string
    venue: string
    start_date: string
    end_date: string
    start_time: string
    end_time: string
    poster_image?: File
    total_capacity?: number
    is_public: boolean
    re_entry_allowed: boolean
    re_entry_cooldown?: number
    ticket_tiers: TicketTierFormData[]
}

export interface TicketTierFormData {
    name: string
    description?: string
    price: number
    capacity?: number
    max_per_user?: number
    sale_start_date?: string
    sale_end_date?: string
    is_active?: boolean
}

// Contact form type
export interface ContactFormData {
    name: string
    email: string
    message: string
}

// Withdrawal types
export interface Withdrawal {
    id: number
    user_id?: number
    user?: {
        name: string
        email: string
        image?: string
    }
    amount: number
    amount_settled?: number
    balance?: number
    bank_account_id?: number
    bank_account?: {
        bank_name: string
        account_number: string
        account_name: string
        bank_code?: string
    }
    status: 'pending' | 'approved' | 'rejected' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'PAID'
    reference: string
    type?: 'VOTE' | 'EVENT'
    pace?: 'NORMAL' | 'EXPRESS'
    note?: string
    estimated_time?: string
    requested_at: string
    processed_at?: string
    description?: string
    rejection_reason?: string
}

// Notification types
export interface Notification {
    id: string
    type: string
    notifiable_type: string
    notifiable_id: number
    data: {
        title: string
        message: string
        type: string
        icon: string
        priority?: 'low' | 'medium' | 'high'
        action_url?: string
        action_text?: string
        time: string
        device_info?: {
            device: string
            platform: string
            browser: string
            ip_address: string
            location?: string
        }
        [key: string]: any
    }
    read_at: string | null
    created_at: string
    updated_at: string
}

export interface NotificationSettings {
    id: number
    user_id: number
    type: 'email' | 'database' | 'sms'
    category: 'login' | 'security' | 'activity' | 'system' | 'marketing'
    enabled: boolean
}

export interface NotificationSettingsGroup {
    [category: string]: {
        [type: string]: boolean
    }
}

// Activity Log types
export interface ActivityLog {
    id: number
    log_name: string
    description: string
    subject_type: string | null
    subject_id: number | null
    causer_type: string | null
    causer_id: number | null
    properties: {
        attributes?: Record<string, any>
        old?: Record<string, any>
        changes?: Record<string, any>
        [key: string]: any
    }
    batch_uuid: string | null
    created_at: string
    updated_at: string
    subject?: any
    causer?: {
        id: number
        first_name: string
        last_name: string
        email: string
        image?: string
        role?: {
            name: string
            display_name: string
        }
    }
}

export interface ActivityLogStats {
    total_activities: number
    login_activities: number
    security_activities: number
    admin_activities: number
    user_management: number
    vote_management: number
    financial_activities: number
    daily_activities: Array<{
        date: string
        count: number
    }>
    period_days: number
}

// User Session types
export interface UserSession {
    id: string
    user_id: number
    ip_address: string
    user_agent: string
    device: string
    platform: string
    browser: string
    browser_version: string
    location?: string
    is_current: boolean
    last_activity: string
    created_at: string
}

// Management types for admin
export interface ManagementUser extends User {
    balance?: number
    last_login?: string
    bank_account?: {
        account_name: string
        account_number: string
        bank_name: string
    }
}

export interface ManagementStats {
    total_users?: number
    active_users?: number
    total_admins?: number
    total_subscriptions?: number
    total_transactions?: number
    total_revenue?: number
    account_users?: number
    account_subscriptions?: number
    account_transactions?: number
} 