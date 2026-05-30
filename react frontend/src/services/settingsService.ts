interface SiteSettings {
    site_name?: string;
    site_logo?: string;
    site_favicon?: string;
    site_banner?: string;
    currency?: string;
    currency_symbol?: string;
    currency_icon?: string;
    site_frontend_url?: string;
    monicredit_script_url?: string;
    maintenance_mode?: boolean;
    maintenance_message?: string;
    registration_enabled?: boolean;
    email_verification_required?: boolean;
    withdrawal_settings?: {
        min_withdrawal_amount?: number;
        max_withdrawal_amount?: number;
        withdrawal_site_charges?: number;
        withdrawal_pg_charges?: number;
        normal_withdrawal_hours?: number;
        express_withdrawal_hours?: number;
        express_withdrawal_fee?: number;
    };
    social_media?: {
        facebook_url?: string;
        twitter_url?: string;
        instagram_url?: string;
        linkedin_url?: string;
        youtube_url?: string;
    };
    commission_rates?: {
        user_registration?: number;
        event_purchase?: number;
        subscription?: number;
    };
}

class SettingsService {
    private static readonly STORAGE_KEY = 'site_settings';
    private static readonly DEFAULT_SETTINGS: SiteSettings = {
        site_name: 'Events And Votes',
        currency: 'NGN',
        currency_symbol: '₦',
        currency_icon: '₦',
        monicredit_script_url: 'https://demo.monicredit.com/js/demo.js',
        maintenance_mode: false,
        registration_enabled: true,
        email_verification_required: true,
        withdrawal_settings: {
            min_withdrawal_amount: 1000,
            max_withdrawal_amount: 1000000,
            withdrawal_site_charges: 2.5,
            withdrawal_pg_charges: 2.5,
            normal_withdrawal_hours: 24,
            express_withdrawal_hours: 2,
            express_withdrawal_fee: 500,
        },
        social_media: {
            facebook_url: undefined,
            twitter_url: undefined,
            instagram_url: undefined,
            linkedin_url: undefined,
            youtube_url: undefined,
        },
        commission_rates: {
            user_registration: 5,
            event_purchase: 10,
            subscription: 15,
        }
    };

    /**
     * Store settings in localStorage
     */
    static storeSettings(settings: SiteSettings): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to store settings:', error);
        }
    }

    /**
     * Get settings from localStorage
     */
    static getSettings(): SiteSettings {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Ensure parsed is an object and not null
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    // Merge with defaults to ensure all properties exist
                    return { ...this.DEFAULT_SETTINGS, ...parsed };
                }
            }
        } catch (error) {
            console.error('Failed to retrieve settings:', error);
        }
        return this.DEFAULT_SETTINGS;
    }

    /**
     * Get a specific setting value
     */
    static getSetting<K extends keyof SiteSettings>(key: K): SiteSettings[K] {
        const settings = this.getSettings();
        return settings[key];
    }

    /**
     * Get site name
     */
    static getSiteName(): string {
        return this.getSetting('site_name') || 'Events And Votes';
    }

    /**
     * Get site logo URL
     */
    static getSiteLogo(): string | null {
        return this.getSetting('site_logo') || null;
    }

    /**
     * Get site favicon URL
     */
    static getSiteFavicon(): string | null {
        return this.getSetting('site_favicon') || null;
    }

    /**
     * Get currency symbol
     */
    static getCurrencySymbol(): string {
        return this.getSetting('currency_symbol') || this.getSetting('currency_icon') || '₦';
    }

    /**
     * Get currency code
     */
    static getCurrency(): string {
        return this.getSetting('currency') || 'NGN';
    }

    /**
     * Get withdrawal settings
     */
    static getWithdrawalSettings() {
        return this.getSetting('withdrawal_settings') || this.DEFAULT_SETTINGS.withdrawal_settings;
    }

    /**
     * Get social media links
     */
    static getSocialMedia() {
        return this.getSetting('social_media') || this.DEFAULT_SETTINGS.social_media;
    }

    /**
     * Get Monicredit script URL
     */
    static getMonicreditScriptUrl(): string {
        return this.getSetting('monicredit_script_url') || 'https://demo.monicredit.com/js/demo.js';
    }

    /**
     * Check if maintenance mode is enabled
     */
    static isMaintenanceMode(): boolean {
        return this.getSetting('maintenance_mode') || false;
    }

    /**
     * Get maintenance message
     */
    static getMaintenanceMessage(): string {
        return this.getSetting('maintenance_message') || 'We are currently under maintenance. Please check back later.';
    }

    /**
     * Check if registration is enabled
     */
    static isRegistrationEnabled(): boolean {
        return this.getSetting('registration_enabled') ?? true;
    }

    /**
     * Check if email verification is required
     */
    static isEmailVerificationRequired(): boolean {
        return this.getSetting('email_verification_required') ?? true;
    }

    /**
     * Clear settings from localStorage
     */
    static clearSettings(): void {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (error) {
            console.error('Failed to clear settings:', error);
        }
    }

    /**
     * Update specific setting
     */
    static updateSetting<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]): void {
        const currentSettings = this.getSettings();
        const updatedSettings = { ...currentSettings, [key]: value };
        this.storeSettings(updatedSettings);
    }

    /**
     * Format currency amount with symbol
     */
    static formatCurrency(amount: number): string {
        const symbol = this.getCurrencySymbol();
        const currency = this.getCurrency();
        
        // Format number with commas
        const formattedAmount = amount.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
        
        return `${symbol}${formattedAmount}`;
    }

    /**
     * Get site frontend URL
     */
    static getSiteFrontendUrl(): string | null {
        return this.getSetting('site_frontend_url') || null;
    }
}

export default SettingsService;
export type { SiteSettings }; 