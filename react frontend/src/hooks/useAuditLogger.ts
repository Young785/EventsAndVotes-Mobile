import React, { useEffect, useCallback, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { auditLogger, AuditEvent } from '../utils/auditLogger'

interface UseAuditLoggerOptions {
    trackNavigation?: boolean
    trackClicks?: boolean
    trackFormSubmissions?: boolean
    trackErrors?: boolean
    context?: string
}

interface AuditLoggerHook {
    logUserAction: (action: string, details?: Record<string, any>) => void
    logButtonClick: (buttonName: string, context?: string) => void
    logFormSubmission: (formName: string, fields: string[], success: boolean, errors?: Record<string, string>) => void
    logSearch: (query: string, resultsCount?: number, filters?: Record<string, any>) => void
    logFileUpload: (fileName: string, fileSize: number, fileType: string, success: boolean) => void
    logApiCall: (method: string, url: string, statusCode: number, duration: number, requestSize?: number, responseSize?: number, error?: any) => void
    logCustomEvent: (type: AuditEvent['type'], action: string, details?: Record<string, any>) => void
    getSessionSummary: () => ReturnType<typeof auditLogger.getSessionSummary>
}

export const useAuditLogger = (options: UseAuditLoggerOptions = {}): AuditLoggerHook => {
    const {
        trackNavigation = true,
        trackClicks = true,
        trackFormSubmissions = true,
        trackErrors = true,
        context
    } = options

    const location = useLocation()
    const navigationType = useNavigationType()
    const previousLocation = useRef<string>()

    // Track navigation changes
    useEffect(() => {
        if (trackNavigation && previousLocation.current) {
            auditLogger.logNavigation(
                previousLocation.current,
                location.pathname,
                navigationType === 'PUSH' ? 'push' :
                    navigationType === 'REPLACE' ? 'replace' : 'back'
            )
        }
        previousLocation.current = location.pathname
    }, [location.pathname, navigationType, trackNavigation])

    // Track component mount/unmount
    useEffect(() => {
        if (context) {
            auditLogger.logUserAction('component_mount', { context })

            return () => {
                auditLogger.logUserAction('component_unmount', { context })
            }
        }
    }, [context])

    // Set up global click tracking
    useEffect(() => {
        if (!trackClicks) return

        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            if (!target) return

            // Get button or clickable element info
            const button = target.closest('button, a, [role="button"], [onclick]')
            if (button) {
                const buttonText = button.textContent?.trim() ||
                    button.getAttribute('aria-label') ||
                    button.getAttribute('title') ||
                    button.className

                auditLogger.logButtonClick(buttonText, context)
            }
        }

        document.addEventListener('click', handleClick, true)
        return () => document.removeEventListener('click', handleClick, true)
    }, [trackClicks, context])

    // Set up form submission tracking
    useEffect(() => {
        if (!trackFormSubmissions) return

        const handleSubmit = (event: SubmitEvent) => {
            const form = event.target as HTMLFormElement
            if (!form) return

            const formName = form.name || form.id || form.className || 'unnamed-form'
            const formData = new FormData(form)
            const fields = Array.from(formData.keys())

            // We'll track the submission attempt here, success/failure should be logged by the component
            auditLogger.logUserAction('form_submit_attempt', {
                formName,
                fieldCount: fields.length,
                context
            })
        }

        document.addEventListener('submit', handleSubmit, true)
        return () => document.removeEventListener('submit', handleSubmit, true)
    }, [trackFormSubmissions, context])

    // Set up error boundary integration
    useEffect(() => {
        if (!trackErrors) return

        const handleError = (event: ErrorEvent) => {
            auditLogger.logUserAction('component_error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                context
            })
        }

        window.addEventListener('error', handleError)
        return () => window.removeEventListener('error', handleError)
    }, [trackErrors, context])

    const logUserAction = useCallback((action: string, details?: Record<string, any>) => {
        auditLogger.logUserAction(action, { ...details, context })
    }, [context])

    const logButtonClick = useCallback((buttonName: string, buttonContext?: string) => {
        auditLogger.logButtonClick(buttonName, buttonContext || context)
    }, [context])

    const logFormSubmission = useCallback((
        formName: string,
        fields: string[],
        success: boolean,
        errors?: Record<string, string>
    ) => {
        auditLogger.logFormSubmission(formName, fields, success, errors)
    }, [])

    const logSearch = useCallback((
        query: string,
        resultsCount?: number,
        filters?: Record<string, any>
    ) => {
        auditLogger.logSearch(query, resultsCount, filters)
    }, [])

    const logFileUpload = useCallback((
        fileName: string,
        fileSize: number,
        fileType: string,
        success: boolean
    ) => {
        auditLogger.logFileUpload(fileName, fileSize, fileType, success)
    }, [])

    const logApiCall = useCallback((
        method: string,
        url: string,
        statusCode: number,
        duration: number,
        requestSize?: number,
        responseSize?: number,
        error?: any
    ) => {
        auditLogger.logApiCall(method, url, statusCode, duration, requestSize, responseSize, error)
    }, [])

    const logCustomEvent = useCallback((
        type: AuditEvent['type'],
        action: string,
        details?: Record<string, any>
    ) => {
        auditLogger.logEvent(type, action, { ...details, context })
    }, [context])

    const getSessionSummary = useCallback(() => {
        return auditLogger.getSessionSummary()
    }, [])

    return {
        logUserAction,
        logButtonClick,
        logFormSubmission,
        logSearch,
        logFileUpload,
        logApiCall,
        logCustomEvent,
        getSessionSummary
    }
}

// Hook for tracking specific user interactions
export const useUserInteractionTracking = (elementRef: React.RefObject<HTMLElement>, eventName: string) => {
    const { logUserAction } = useAuditLogger()

    useEffect(() => {
        const element = elementRef.current
        if (!element) return

        const handleInteraction = (event: Event) => {
            logUserAction(`${eventName}_${event.type}`, {
                elementTag: element.tagName.toLowerCase(),
                elementId: element.id,
                elementClass: element.className,
                timestamp: Date.now()
            })
        }

        // Track multiple interaction types
        const events = ['click', 'focus', 'blur', 'mouseenter', 'mouseleave']
        events.forEach(eventType => {
            element.addEventListener(eventType, handleInteraction)
        })

        return () => {
            events.forEach(eventType => {
                element.removeEventListener(eventType, handleInteraction)
            })
        }
    }, [elementRef, eventName, logUserAction])
}

// Hook for tracking form field interactions
export const useFormFieldTracking = (formName: string) => {
    const { logUserAction } = useAuditLogger()

    const trackFieldInteraction = useCallback((fieldName: string, action: string, value?: any) => {
        logUserAction('form_field_interaction', {
            formName,
            fieldName,
            action,
            hasValue: value !== undefined && value !== '',
            valueLength: typeof value === 'string' ? value.length : undefined
        })
    }, [formName, logUserAction])

    return { trackFieldInteraction }
}

export type { AuditLoggerHook, UseAuditLoggerOptions } 