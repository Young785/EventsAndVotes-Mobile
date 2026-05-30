import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ErrorToastProps {
    message: string
    errors?: Record<string, string>
    onDismiss?: () => void
}

const ErrorToast: React.FC<ErrorToastProps> = ({ message, errors, onDismiss }) => {
    const hasFieldErrors = errors && Object.keys(errors).length > 0

    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-md">
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-red-800">
                        {hasFieldErrors ? 'Validation Error' : 'Error'}
                    </h3>
                    <div className="mt-1 text-sm text-red-700">
                        {!hasFieldErrors ? (
                            <p>{message}</p>
                        ) : (
                            <div className="space-y-1">
                                <p className="font-medium">Please fix the following errors:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    {Object.entries(errors).map(([field, error]) => (
                                        <li key={field} className="text-sm">
                                            <span className="font-medium capitalize">{field.replace('_', ' ')}:</span> {error}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
                {onDismiss && (
                    <div className="ml-auto pl-3">
                        <div className="-mx-1.5 -my-1.5">
                            <button
                                onClick={onDismiss}
                                className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                            >
                                <span className="sr-only">Dismiss</span>
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ErrorToast 