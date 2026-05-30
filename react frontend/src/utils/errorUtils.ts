import toast from 'react-hot-toast'
import ErrorToast from '../components/ErrorToast'

/**
 * Convert field name to human readable format
 */
const formatFieldName = (fieldName: string): string => {
    return fieldName
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Extract error message from API response
 * Handles Laravel validation errors and other API errors
 */
export const extractErrorMessage = (error: any): string => {
    // If no error or no response, return generic message
    if (!error || !error.response) {
        return error?.message || 'An unexpected error occurred'
    }

    const { data, status } = error.response

    // Handle validation errors (422)
    if (status === 422 && data?.errors) {
        const fieldErrors = Object.entries(data.errors) as [string, string[]][]

        if (fieldErrors.length === 1) {
            // Single field error - show it directly without "Validation failed" prefix
            const [fieldName, errors] = fieldErrors[0]
            const formattedFieldName = formatFieldName(fieldName)
            return errors[0] // Return the first (and likely only) error for this field
        } else if (fieldErrors.length > 1) {
            // Multiple field errors - show them as a clean list
            const errorMessages = fieldErrors.map(([fieldName, errors]) => {
                const formattedFieldName = formatFieldName(fieldName)
                return `${formattedFieldName}: ${errors[0]}`
            })
            return errorMessages.join('\n')
        }
    }

    // Handle other structured errors
    if (data?.message && data.message !== 'Validation failed') {
        return data.message
    }

    // Handle HTTP status codes
    switch (status) {
        case 400:
            return 'Bad request. Please check your input.'
        case 401:
            return 'Unauthorized. Please log in again.'
        case 403:
            return 'Access forbidden. You don\'t have permission to perform this action.'
        case 404:
            return 'Resource not found.'
        case 409:
            return 'Conflict. The resource already exists or there\'s a conflict.'
        case 429:
            return 'Too many requests. Please try again later.'
        case 500:
            return 'Server error. Please try again later.'
        case 503:
            return 'Service unavailable. Please try again later.'
        default:
            return `Request failed with status ${status}`
    }
}

/**
 * Extract field-specific errors for form validation
 */
export const extractFieldErrors = (error: any): Record<string, string> => {
    if (!error?.response?.data?.errors) {
        return {}
    }

    const fieldErrors: Record<string, string> = {}
    const errors = error.response.data.errors

    Object.keys(errors).forEach(field => {
        if (Array.isArray(errors[field]) && errors[field].length > 0) {
            fieldErrors[field] = errors[field][0] // Take the first error for each field
        }
    })

    return fieldErrors
}

/**
 * Check if error is a validation error
 */
export const isValidationError = (error: any): boolean => {
    return error?.response?.status === 422 && error?.response?.data?.errors
}

/**
 * Format error for toast display with line breaks
 */
export const formatErrorForToast = (error: any): string => {
    const message = extractErrorMessage(error)

    // Convert newlines to HTML breaks for toast display
    return message.replace(/\n/g, '<br/>')
}

/**
 * Show error toast with enhanced validation error display
 */
export const showErrorToast = (error: any) => {
    if (isValidationError(error)) {
        const fieldErrors = extractFieldErrors(error)
        const errorEntries = Object.entries(fieldErrors)

        if (errorEntries.length === 1) {
            // Single field error - show it cleanly without field name if the message is descriptive
            const [fieldName, fieldError] = errorEntries[0]
            const formattedFieldName = formatFieldName(fieldName)

            // Check if the error message already contains the field context
            const errorContainsFieldName = fieldError.toLowerCase().includes(fieldName.replace('_', ' ').toLowerCase())

            if (errorContainsFieldName) {
                toast.error(fieldError, { duration: 6000 })
            } else {
                toast.error(`${formattedFieldName}: ${fieldError}`, { duration: 6000 })
            }
        } else if (errorEntries.length > 1) {
            // Multiple field errors - show as a clean list
            const errorList = errorEntries
                .map(([fieldName, fieldError]) => {
                    const formattedFieldName = formatFieldName(fieldName)
                    return `• ${formattedFieldName}: ${fieldError}`
                })
                .join('\n')

            toast.error(errorList, {
                duration: 8000,
                style: {
                    whiteSpace: 'pre-line',
                    maxWidth: '450px',
                    textAlign: 'left'
                }
            })
        } else {
            // Fallback to generic message extraction
            toast.error(extractErrorMessage(error), { duration: 5000 })
        }
    } else {
        toast.error(extractErrorMessage(error), { duration: 5000 })
    }
}

/**
 * Get a user-friendly error message for a specific field
 */
export const getFieldErrorMessage = (error: any, fieldName: string): string | null => {
    if (!isValidationError(error)) {
        return null
    }

    const fieldErrors = extractFieldErrors(error)
    return fieldErrors[fieldName] || null
}

/**
 * Get all validation errors as a formatted object with human-readable field names
 */
export const getFormattedValidationErrors = (error: any): Record<string, string> => {
    if (!isValidationError(error)) {
        return {}
    }

    const fieldErrors = extractFieldErrors(error)
    const formattedErrors: Record<string, string> = {}

    Object.entries(fieldErrors).forEach(([fieldName, fieldError]) => {
        const formattedFieldName = formatFieldName(fieldName)
        formattedErrors[formattedFieldName] = fieldError
    })

    return formattedErrors
} 