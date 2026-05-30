import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Camera, Loader, AlertCircle, CheckCircle } from 'lucide-react';

interface ImageUploadProps {
    onImageSelect: (file: File | null, compressedFile?: File) => void;
    onImageUpload?: (file: File) => Promise<{ success: boolean; url?: string; error?: string }>;
    maxSizeKB?: number;
    maxSizeMB?: number;
    acceptedTypes?: string[];
    compressionQuality?: number;
    maxWidth?: number;
    maxHeight?: number;
    currentImageUrl?: string;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    showPreview?: boolean;
    autoUpload?: boolean;
}

interface CompressionOptions {
    maxWidth: number;
    maxHeight: number;
    quality: number;
    format: 'jpeg' | 'png' | 'webp';
}

const ImageUpload: React.FC<ImageUploadProps> = ({
    onImageSelect,
    onImageUpload,
    maxSizeKB = 500, // 500KB default
    maxSizeMB = 2, // 2MB max before compression
    acceptedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
    compressionQuality = 0.8,
    maxWidth = 1024,
    maxHeight = 1024,
    currentImageUrl,
    placeholder = 'Upload an image',
    className = '',
    disabled = false,
    showPreview = true,
    autoUpload = false
}) => {
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [compressedFile, setCompressedFile] = useState<File | null>(null);
    const [compressionInfo, setCompressionInfo] = useState<{ originalSize: number; compressedSize: number } | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);

    // Compress image using canvas
    const compressImage = useCallback(async (file: File, options: CompressionOptions): Promise<File> => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;

                if (width > options.maxWidth || height > options.maxHeight) {
                    const ratio = Math.min(options.maxWidth / width, options.maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                if (ctx) {
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const compressedFile = new File([blob], file.name, {
                                    type: `image/${options.format}`,
                                    lastModified: Date.now(),
                                });
                                resolve(compressedFile);
                            } else {
                                reject(new Error('Canvas compression failed'));
                            }
                        },
                        `image/${options.format}`,
                        options.quality
                    );
                } else {
                    reject(new Error('Canvas context not available'));
                }
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }, []);

    // Validate file
    const validateFile = useCallback((file: File): string | null => {
        // Check file type
        if (!acceptedTypes.includes(file.type)) {
            return `Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`;
        }

        // Check file size (before compression)
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            return `File too large. Maximum size: ${maxSizeMB}MB`;
        }

        return null;
    }, [acceptedTypes, maxSizeMB]);

    // Process selected file
    const processFile = useCallback(async (file: File) => {
        setError(null);
        setSuccess(null);

        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setOriginalFile(file);

        try {
            // Create preview
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);

            // Determine if compression is needed
            const targetSizeBytes = maxSizeKB * 1024;
            let finalFile = file;

            if (file.size > targetSizeBytes) {
                // Compress the image
                const compressionOptions: CompressionOptions = {
                    maxWidth,
                    maxHeight,
                    quality: compressionQuality,
                    format: file.type.includes('png') ? 'png' : 'jpeg'
                };

                finalFile = await compressImage(file, compressionOptions);

                // If still too large, reduce quality
                if (finalFile.size > targetSizeBytes && compressionOptions.quality > 0.3) {
                    compressionOptions.quality = 0.6;
                    finalFile = await compressImage(file, compressionOptions);
                }

                setCompressedFile(finalFile);
                setCompressionInfo({
                    originalSize: file.size,
                    compressedSize: finalFile.size
                });
            } else {
                setCompressedFile(null);
                setCompressionInfo(null);
            }

            // Check final file size
            if (finalFile.size > targetSizeBytes) {
                setError(`Image is still too large after compression. Please choose a smaller image or reduce quality.`);
                return;
            }

            // Call parent callback
            onImageSelect(finalFile, finalFile !== file ? finalFile : undefined);

            // Auto upload if enabled
            if (autoUpload && onImageUpload) {
                setUploading(true);
                try {
                    const result = await onImageUpload(finalFile);
                    if (result.success) {
                        setSuccess('Image uploaded successfully!');
                        if (result.url) {
                            setPreview(result.url);
                        }
                    } else {
                        setError(result.error || 'Upload failed');
                    }
                } catch (error) {
                    setError('Upload failed: ' + (error as Error).message);
                } finally {
                    setUploading(false);
                }
            }

        } catch (error) {
            setError('Failed to process image: ' + (error as Error).message);
        }
    }, [validateFile, maxSizeKB, maxWidth, maxHeight, compressionQuality, compressImage, onImageSelect, autoUpload, onImageUpload]);

    // Handle file selection
    const handleFileSelect = useCallback((files: FileList | null) => {
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    }, [processFile]);

    // Handle drag events
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (disabled) return;

        handleFileSelect(e.dataTransfer.files);
    }, [disabled, handleFileSelect]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(e.target.files);
    }, [handleFileSelect]);

    const openFileDialog = useCallback(() => {
        if (!disabled && inputRef.current) {
            inputRef.current.click();
        }
    }, [disabled]);

    const clearImage = useCallback(() => {
        setPreview(null);
        setOriginalFile(null);
        setCompressedFile(null);
        setCompressionInfo(null);
        setError(null);
        setSuccess(null);
        onImageSelect(null);

        if (inputRef.current) {
            inputRef.current.value = '';
        }
    }, [onImageSelect]);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className={`image-upload ${className}`}>
            <input
                ref={inputRef}
                type="file"
                accept={acceptedTypes.join(',')}
                onChange={handleInputChange}
                className="hidden"
                disabled={disabled}
            />

            {/* Upload Area */}
            <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : disabled
                            ? 'border-gray-200 bg-gray-50'
                            : 'border-gray-300 hover:border-gray-400 cursor-pointer'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={openFileDialog}
            >
                {uploading && (
                    <div className="absolute inset-0 bg-white dark:bg-secondary-900 bg-opacity-80 flex items-center justify-center rounded-lg">
                        <Loader className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                )}

                {preview && showPreview ? (
                    <div className="relative">
                        <img
                            src={preview}
                            alt="Preview"
                            className="max-w-full max-h-48 mx-auto rounded-lg shadow-sm"
                        />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                clearImage();
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
                            disabled={disabled || uploading}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-center">
                            {dragActive ? (
                                <Upload className="w-12 h-12 text-blue-500" />
                            ) : (
                                <Camera className="w-12 h-12 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                                {dragActive ? 'Drop image here' : placeholder}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Click to browse or drag and drop
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                                Max {maxSizeMB}MB • {acceptedTypes.join(', ').replace(/image\//g, '').toUpperCase()}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* File Info */}
            {originalFile && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-secondary-800 rounded-lg text-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300">File Info:</span>
                        <span className="text-gray-600 dark:text-gray-400">{originalFile.name}</span>
                    </div>

                    {compressionInfo ? (
                        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                            <div className="flex justify-between">
                                <span>Original:</span>
                                <span>{formatFileSize(compressionInfo.originalSize)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Compressed:</span>
                                <span className="text-green-600 font-medium">
                                    {formatFileSize(compressionInfo.compressedSize)}
                                    <span className="ml-1">
                                        ({Math.round((1 - compressionInfo.compressedSize / compressionInfo.originalSize) * 100)}% smaller)
                                    </span>
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                            Size: {formatFileSize(originalFile.size)} (no compression needed)
                        </div>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-red-700">{error}</span>
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-green-700">{success}</span>
                </div>
            )}
        </div>
    );
};

export default ImageUpload; 