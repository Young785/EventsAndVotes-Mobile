import apiConfig from '../config/api.config';

export interface ImageUploadResponse {
    success: boolean;
    message?: string;
    url?: string;
    path?: string;
    error?: string;
}

export interface ImageUploadOptions {
    endpoint?: string;
    maxSizeKB?: number;
    acceptedTypes?: string[];
    compress?: boolean;
    compressionQuality?: number;
    maxWidth?: number;
    maxHeight?: number;
}

class ImageUploadService {
    private baseURL: string;

    constructor() {
        this.baseURL = apiConfig.baseURL;
    }

    /**
     * Upload avatar image
     */
    async uploadAvatar(file: File): Promise<ImageUploadResponse> {
        return this.uploadImage(file, {
            endpoint: '/profile/avatar',
            maxSizeKB: 500,
            maxWidth: 400,
            maxHeight: 400,
            acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg']
        });
    }

    /**
     * Upload vote/election image
     */
    async uploadVoteImage(file: File): Promise<ImageUploadResponse> {
        return this.uploadImage(file, {
            endpoint: '/admin/votes/upload-image',
            maxSizeKB: 1000,
            maxWidth: 1200,
            maxHeight: 800,
            acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg']
        });
    }

    /**
     * Upload nominee image
     */
    async uploadNomineeImage(file: File, voteId?: string): Promise<ImageUploadResponse> {
        const endpoint = voteId
            ? `/admin/nominees/upload-image/${voteId}`
            : '/admin/nominees/upload-image';

        return this.uploadImage(file, {
            endpoint,
            maxSizeKB: 800,
            maxWidth: 800,
            maxHeight: 800,
            acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg']
        });
    }

    /**
     * Generic image upload
     */
    async uploadImage(file: File, options: ImageUploadOptions = {}): Promise<ImageUploadResponse> {
        const {
            endpoint = '/upload/image',
            maxSizeKB = 1000,
            acceptedTypes = ['image/jpeg', 'image/png', 'image/jpg'],
            maxWidth = 1024,
            maxHeight = 1024,
            compressionQuality = 0.8
        } = options;

        try {
            // Validate file type
            if (!acceptedTypes.includes(file.type)) {
                return {
                    success: false,
                    error: `Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`
                };
            }

            // Validate file size (before compression)
            const maxSizeBytes = maxSizeKB * 1024;
            let finalFile = file;

            // Compress if needed
            if (file.size > maxSizeBytes) {
                try {
                    finalFile = await this.compressImage(file, {
                        maxWidth,
                        maxHeight,
                        quality: compressionQuality,
                        targetSizeKB: maxSizeKB
                    });
                } catch (compressionError) {
                    return {
                        success: false,
                        error: 'Failed to compress image: ' + (compressionError as Error).message
                    };
                }
            }

            // Final size check
            if (finalFile.size > maxSizeBytes) {
                return {
                    success: false,
                    error: `Image is too large. Maximum size: ${maxSizeKB}KB`
                };
            }

            // Create FormData
            const formData = new FormData();
            formData.append('image', finalFile);

            // Get auth token
            const token = localStorage.getItem('token');

            // Upload to backend
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok && data.status !== false) {
                return {
                    success: true,
                    message: data.message || 'Image uploaded successfully',
                    url: data.url,
                    path: data.path
                };
            } else {
                return {
                    success: false,
                    error: data.message || 'Upload failed'
                };
            }

        } catch (error) {
            return {
                success: false,
                error: 'Upload failed: ' + (error as Error).message
            };
        }
    }

    /**
     * Compress image using canvas
     */
    private async compressImage(
        file: File,
        options: {
            maxWidth: number;
            maxHeight: number;
            quality: number;
            targetSizeKB: number;
        }
    ): Promise<File> {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate dimensions
                let { width, height } = img;

                // Resize if needed
                if (width > options.maxWidth || height > options.maxHeight) {
                    const ratio = Math.min(options.maxWidth / width, options.maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;

                if (ctx) {
                    // Enable image smoothing for better quality
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    // Draw image
                    ctx.drawImage(img, 0, 0, width, height);

                    // Determine format and quality
                    const format = file.type.includes('png') ? 'image/png' : 'image/jpeg';
                    let quality = options.quality;

                    const tryCompress = (currentQuality: number) => {
                        canvas.toBlob(
                            (blob) => {
                                if (blob) {
                                    const compressedFile = new File([blob], file.name, {
                                        type: format,
                                        lastModified: Date.now(),
                                    });

                                    // Check if size is acceptable
                                    const targetBytes = options.targetSizeKB * 1024;
                                    if (compressedFile.size <= targetBytes || currentQuality <= 0.3) {
                                        resolve(compressedFile);
                                    } else {
                                        // Try with lower quality
                                        tryCompress(currentQuality - 0.1);
                                    }
                                } else {
                                    reject(new Error('Canvas compression failed'));
                                }
                            },
                            format,
                            currentQuality
                        );
                    };

                    tryCompress(quality);
                } else {
                    reject(new Error('Canvas context not available'));
                }
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Validate image file
     */
    validateFile(file: File, options: {
        maxSizeMB?: number;
        acceptedTypes?: string[];
    } = {}): { valid: boolean; error?: string } {
        const {
            maxSizeMB = 5,
            acceptedTypes = ['image/jpeg', 'image/png', 'image/jpg']
        } = options;

        // Check file type
        if (!acceptedTypes.includes(file.type)) {
            return {
                valid: false,
                error: `Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`
            };
        }

        // Check file size
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            return {
                valid: false,
                error: `File too large. Maximum size: ${maxSizeMB}MB`
            };
        }

        return { valid: true };
    }

    /**
     * Get image dimensions
     */
    async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({ width: img.width, height: img.height });
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Generate thumbnail
     */
    async generateThumbnail(
        file: File,
        maxWidth: number = 150,
        maxHeight: number = 150
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                let { width, height } = img;

                // Calculate thumbnail dimensions
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width *= ratio;
                height *= ratio;

                canvas.width = width;
                canvas.height = height;

                if (ctx) {
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);

                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                } else {
                    reject(new Error('Canvas context not available'));
                }
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }
}

export default new ImageUploadService(); 