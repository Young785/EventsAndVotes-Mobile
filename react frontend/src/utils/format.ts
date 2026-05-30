/**
 * Format number as Nigerian Naira currency
 * @param amount - The amount to format
 * @param showCurrency - Whether to show the currency symbol
 * @returns Formatted string
 */
export const formatNaira = (amount: number | string, showCurrency: boolean = true): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) {
        return showCurrency ? '₦0' : '0';
    }

    const formatted = new Intl.NumberFormat('en-NG', {
        style: showCurrency ? 'currency' : 'decimal',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(numAmount);

    // Replace NGN with ₦ symbol
    return showCurrency ? formatted.replace('NGN', '₦') : formatted;
};

/**
 * Format number with commas (no currency)
 * @param amount - The amount to format
 * @returns Formatted string with commas
 */
export const formatNumber = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) {
        return '0';
    }

    return new Intl.NumberFormat('en-NG').format(numAmount);
};

/**
 * Format number as compact notation (1K, 1M, etc.)
 * @param amount - The amount to format
 * @param showCurrency - Whether to show currency symbol
 * @returns Compact formatted string
 */
export const formatCompactNumber = (amount: number | string, showCurrency: boolean = false): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) {
        return showCurrency ? '₦0' : '0';
    }

    const formatted = new Intl.NumberFormat('en-NG', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
    }).format(numAmount);

    return showCurrency ? `₦${formatted}` : formatted;
};

/**
 * Format percentage
 * @param value - The percentage value
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
    if (isNaN(value)) {
        return '0%';
    }

    return `${value.toFixed(decimals)}%`;
};

/**
 * Format date to Nigerian format
 * @param date - Date to format
 * @param includeTime - Whether to include time
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date, includeTime: boolean = false): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
    }

    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'Africa/Lagos',
    };

    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.hour12 = true;
    }

    return new Intl.DateTimeFormat('en-NG', options).format(dateObj);
};

/**
 * Format time duration (e.g., "2 days ago", "in 3 hours")
 * @param date - Date to compare with now
 * @returns Relative time string
 */
export const formatRelativeTime = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'week', seconds: 604800 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
    ];

    for (const interval of intervals) {
        const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds);
        if (count > 0) {
            const rtf = new Intl.RelativeTimeFormat('en-NG', { numeric: 'auto' });
            return rtf.format(diffInSeconds < 0 ? count : -count, interval.label as Intl.RelativeTimeFormatUnit);
        }
    }

    return 'just now';
};

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
    if (text.length <= maxLength) {
        return text;
    }

    return text.substring(0, maxLength).trim() + '...';
};

/**
 * Format file size in bytes to human readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Re-export image utilities for convenience
export {
    getImageUrl,
    getUserAvatarUrl,
    getVoteImageUrl,
    getNomineeImageUrl,
    getBackendBaseUrl,
    getStorageUrl
} from './imageUtils'; 