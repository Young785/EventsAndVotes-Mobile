import { useState, useEffect } from 'react';
import SettingsService, { SiteSettings } from '../services/settingsService';

/**
 * Custom hook to access site settings from localStorage
 * Automatically updates when settings change
 */
export const useSettings = () => {
    const [settings, setSettings] = useState<SiteSettings>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const loadedSettings = SettingsService.getSettings();
            setSettings(loadedSettings || {});
            setLoading(false);
        } catch (err) {
            setError('Failed to load settings');
            setLoading(false);
            console.error('Settings loading error:', err);
        }

        // Listen for storage changes to update settings when they change
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'site_settings') {
                try {
                    const newSettings = SettingsService.getSettings();
                    setSettings(newSettings || {});
                } catch (err) {
                    console.error('Settings update error:', err);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return {
        settings,
        loading,
        error,
        siteName: settings?.site_name || 'Events And Votes',
        siteLogo: settings?.site_logo,
        siteFavicon: settings?.site_favicon,
        siteBanner: settings?.site_banner,
        currency: settings?.currency || 'NGN',
        currencySymbol: settings?.currency_symbol || settings?.currency_icon || '₦',
        withdrawalSettings: settings?.withdrawal_settings,
        socialMedia: settings?.social_media,
        isMaintenanceMode: settings?.maintenance_mode || false,
        maintenanceMessage: settings?.maintenance_message,
        isRegistrationEnabled: settings?.registration_enabled ?? true,
        isEmailVerificationRequired: settings?.email_verification_required ?? true,
        monicreditScriptUrl: settings?.monicredit_script_url || 'https://demo.monicredit.com/js/demo.js',
        formatCurrency: (amount: number) => SettingsService.formatCurrency(amount),
        updateSettings: (newSettings: SiteSettings) => {
            SettingsService.storeSettings(newSettings);
            setSettings(newSettings);
        }
    };
};

/**
 * Hook to get specific setting value
 */
export const useSetting = <K extends keyof SiteSettings>(key: K): SiteSettings[K] => {
    const { settings } = useSettings();
    return settings?.[key];
};

/**
 * Hook for currency formatting
 */
export const useCurrency = () => {
    const { currencySymbol, formatCurrency } = useSettings();
    
    return {
        symbol: currencySymbol,
        format: formatCurrency,
        currency: useSetting('currency') || 'NGN'
    };
};

/**
 * Hook for withdrawal settings
 */
export const useWithdrawalSettings = () => {
    const withdrawalSettings = useSetting('withdrawal_settings');
    
    return {
        minAmount: withdrawalSettings?.min_withdrawal_amount || 1000,
        maxAmount: withdrawalSettings?.max_withdrawal_amount || 1000000,
        siteCharges: withdrawalSettings?.withdrawal_site_charges || 2.5,
        pgCharges: withdrawalSettings?.withdrawal_pg_charges || 2.5,
        normalHours: withdrawalSettings?.normal_withdrawal_hours || 24,
        expressHours: withdrawalSettings?.express_withdrawal_hours || 2,
        expressFee: withdrawalSettings?.express_withdrawal_fee || 500,
    };
};

/**
 * Hook for social media links
 */
export const useSocialMedia = () => {
    const socialMedia = useSetting('social_media');
    
    return {
        facebook: socialMedia?.facebook_url,
        twitter: socialMedia?.twitter_url,
        instagram: socialMedia?.instagram_url,
        linkedin: socialMedia?.linkedin_url,
        youtube: socialMedia?.youtube_url,
    };
}; 