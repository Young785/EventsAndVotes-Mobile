/**
 * Image utilities for handling backend image URLs
 */

const getBackendUrl = (): string => {
    // Remove '/api' suffix if it exists to get the base backend URL
    const apiUrl = import.meta.env.VITE_BACKEND_URL || 'https://eventsandvotes.test';
    return apiUrl;
};

/**
 * Get full image URL by combining backend URL with image path
 * @param imagePath - The relative image path from the backend
 * @param fallbackImage - Optional fallback image URL
 * @returns Full image URL
 */
export const getImageUrl = (imagePath?: string | null, fallbackImage?: string): string => {
    if (!imagePath) {
        return fallbackImage || '/images/images/default-avatar.jpg';
    }

    // If it's already a full URL (starts with http), return as is
    if (imagePath.startsWith('http')) {
        return imagePath;
    }

    // If it's a relative path starting with '/', remove it to avoid double slashes
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;

    const backendUrl = getBackendUrl();
    return `${backendUrl}/${cleanPath}`;
};

/**
 * Get user avatar URL with fallback
 * @param user - User object with image property
 * @param fallback - Optional fallback image
 * @returns Full avatar URL
 */
export const getUserAvatarUrl = (user?: { image?: string | null }, fallback?: string): string => {
    const defaultAvatar = fallback || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80';
    return getImageUrl(user?.image, defaultAvatar);
};

/**
 * Get vote image URL with fallback
 * @param vote - Vote object with image property
 * @param fallback - Optional fallback image
 * @returns Full vote image URL
 */
export const getVoteImageUrl = (vote?: { image?: string | null }, fallback?: string): string => {
    const defaultVoteImage = fallback || '/images/default-vote.jpg';
    return getImageUrl(vote?.image, defaultVoteImage);
};

/**
 * Get nominee image URL with fallback to vote image
 * @param nominee - Nominee object with image property
 * @param vote - Vote object for fallback image
 * @param fallback - Optional final fallback image
 * @returns Full nominee image URL
 */
export const getNomineeImageUrl = (
    nominee?: { image?: string | null },
    vote?: { image?: string | null },
    fallback?: string
): string => {
    if (nominee?.image) {
        return getImageUrl(nominee.image);
    }

    if (vote?.image) {
        return getImageUrl(vote.image);
    }

    const defaultNomineeImage = fallback || '/images/default-avatar.jpg';
    return getImageUrl(null, defaultNomineeImage);
};

/**
 * Get backend URL for file uploads or other backend resources
 * @returns Backend base URL
 */
export const getBackendBaseUrl = (): string => {
    return getBackendUrl();
};

/**
 * Convert storage path to public URL
 * For Laravel Storage files that are stored in storage/app/public
 * @param storagePath - The storage path (e.g., 'admin/accounts/images/votes/image.jpg')
 * @returns Full public URL
 */
export const getStorageUrl = (storagePath?: string | null): string => {
    if (!storagePath) {
        return '/images/default-image.png';
    }

    // If it's already a full URL, return as is
    if (storagePath.startsWith('http')) {
        return storagePath;
    }

    const backendUrl = getBackendUrl();
    const cleanPath = storagePath.startsWith('/') ? storagePath.substring(1) : storagePath;

    // For Laravel storage files, they're accessible via /storage/ path
    return `${backendUrl}/storage/${cleanPath}`;
}; 