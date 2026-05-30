interface AuditEvent {
    type: 'user_action' | 'api_call' | 'navigation' | 'error' | 'performance'
    action: string
    details?: Record<string, any>
    timestamp: string
    userId?: string
    sessionId: string
    url: string
    userAgent: string
    metadata?: Record<string, any>
}

interface PerformanceMetrics {
    loadTime?: number
    renderTime?: number
    apiResponseTime?: number
    memoryUsage?: number
}

class AuditLogger {
    private sessionId: string
    private userId?: string
    private events: AuditEvent[] = []
    private maxEvents = 1000
    private flushInterval = 30000 // 30 seconds
    private apiEndpoint = '/api/audit/frontend'

    constructor() {
        this.sessionId = this.generateSessionId()
        this.initializeSession()
        this.startPeriodicFlush()
        this.setupEventListeners()
    }

    private generateSessionId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    private initializeSession(): void {
        // Get user info from localStorage or context
        const token = localStorage.getItem('token')
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]))
                this.userId = payload.sub || payload.user_id
            } catch (e) {
                console.warn('Failed to parse user token for audit logging')
            }
        }

        this.logEvent('user_action', 'session_start', {
            referrer: document.referrer,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language
        })
    }

    private setupEventListeners(): void {
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.logEvent('user_action', document.hidden ? 'page_hidden' : 'page_visible')
        })

        // Track page unload
        window.addEventListener('beforeunload', () => {
            this.logEvent('user_action', 'session_end')
            this.flushEvents(true) // Synchronous flush on unload
        })

        // Track errors
        window.addEventListener('error', (event) => {
            this.logEvent('error', 'javascript_error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            })
        })

        // Track unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logEvent('error', 'unhandled_promise_rejection', {
                reason: event.reason?.toString(),
                stack: event.reason?.stack
            })
        })

        // Track performance metrics
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
                    this.logEvent('performance', 'page_load', {
                        loadTime: perfData.loadEventEnd - perfData.navigationStart,
                        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
                        firstPaint: this.getFirstPaint(),
                        firstContentfulPaint: this.getFirstContentfulPaint()
                    })
                }, 0)
            })
        }
    }

    private getFirstPaint(): number | undefined {
        const paintEntries = performance.getEntriesByType('paint')
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
        return firstPaint?.startTime
    }

    private getFirstContentfulPaint(): number | undefined {
        const paintEntries = performance.getEntriesByType('paint')
        const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint')
        return firstContentfulPaint?.startTime
    }

    public setUserId(userId: string): void {
        this.userId = userId
        this.logEvent('user_action', 'user_identified', { userId })
    }

    public logEvent(
        type: AuditEvent['type'],
        action: string,
        details?: Record<string, any>,
        metadata?: Record<string, any>
    ): void {
        const event: AuditEvent = {
            type,
            action,
            details: this.sanitizeDetails(details),
            timestamp: new Date().toISOString(),
            userId: this.userId,
            sessionId: this.sessionId,
            url: window.location.href,
            userAgent: navigator.userAgent,
            metadata
        }

        this.events.push(event)

        // Prevent memory issues by limiting stored events
        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(-this.maxEvents)
        }

        // Immediate flush for critical events
        if (type === 'error' || action.includes('security') || action.includes('payment')) {
            this.flushEvents()
        }
    }

    public logUserAction(action: string, details?: Record<string, any>): void {
        this.logEvent('user_action', action, details)
    }

    public logNavigation(from: string, to: string, method: 'push' | 'replace' | 'back' | 'forward' = 'push'): void {
        this.logEvent('navigation', 'route_change', {
            from,
            to,
            method,
            timestamp: Date.now()
        })
    }

    public logApiCall(
        method: string,
        url: string,
        statusCode: number,
        duration: number,
        requestSize?: number,
        responseSize?: number,
        error?: any
    ): void {
        this.logEvent('api_call', 'http_request', {
            method,
            url: this.sanitizeUrl(url),
            statusCode,
            duration,
            requestSize,
            responseSize,
            success: statusCode >= 200 && statusCode < 400,
            error: error ? {
                message: error.message,
                code: error.code
            } : undefined
        })
    }

    public logFormSubmission(formName: string, fields: string[], success: boolean, errors?: Record<string, string>): void {
        this.logEvent('user_action', 'form_submission', {
            formName,
            fieldCount: fields.length,
            fields: fields, // Don't include values for privacy
            success,
            errors: errors ? Object.keys(errors) : undefined
        })
    }

    public logButtonClick(buttonName: string, context?: string): void {
        this.logEvent('user_action', 'button_click', {
            buttonName,
            context
        })
    }

    public logSearch(query: string, resultsCount?: number, filters?: Record<string, any>): void {
        this.logEvent('user_action', 'search', {
            queryLength: query.length,
            hasQuery: query.length > 0,
            resultsCount,
            filters: filters ? Object.keys(filters) : undefined
        })
    }

    public logFileUpload(fileName: string, fileSize: number, fileType: string, success: boolean): void {
        this.logEvent('user_action', 'file_upload', {
            fileName: fileName.split('.').pop(), // Only log extension for privacy
            fileSize,
            fileType,
            success
        })
    }

    private sanitizeDetails(details?: Record<string, any>): Record<string, any> | undefined {
        if (!details) return undefined

        const sanitized = { ...details }
        const sensitiveKeys = ['password', 'token', 'secret', 'key', 'credit_card', 'ssn', 'email']

        const sanitizeObject = (obj: any): any => {
            if (typeof obj !== 'object' || obj === null) return obj

            if (Array.isArray(obj)) {
                return obj.map(sanitizeObject)
            }

            const result: any = {}
            for (const [key, value] of Object.entries(obj)) {
                const lowerKey = key.toLowerCase()
                if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
                    result[key] = '[REDACTED]'
                } else {
                    result[key] = sanitizeObject(value)
                }
            }
            return result
        }

        return sanitizeObject(sanitized)
    }

    private sanitizeUrl(url: string): string {
        try {
            const urlObj = new URL(url, window.location.origin)
            // Remove sensitive query parameters
            const sensitiveParams = ['token', 'key', 'secret', 'password']
            sensitiveParams.forEach(param => {
                if (urlObj.searchParams.has(param)) {
                    urlObj.searchParams.set(param, '[REDACTED]')
                }
            })
            return urlObj.toString()
        } catch {
            return url
        }
    }

    private startPeriodicFlush(): void {
        setInterval(() => {
            if (this.events.length > 0) {
                this.flushEvents()
            }
        }, this.flushInterval)
    }

    private async flushEvents(synchronous = false): Promise<void> {
        if (this.events.length === 0) return

        const eventsToSend = [...this.events]
        this.events = []

        // Temporarily disable API calls to prevent connection errors
        // TODO: Implement /api/audit/frontend endpoint in Laravel backend
        console.log('Audit events collected (not sent to API):', {
            sessionId: this.sessionId,
            eventCount: eventsToSend.length,
            events: eventsToSend.slice(-5) // Log last 5 events for debugging
        })

        // Original API call code (commented out temporarily)
        /*
        const payload = {
            sessionId: this.sessionId,
            events: eventsToSend,
            metadata: {
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                url: window.location.href
            }
        }

        try {
            if (synchronous) {
                // Use sendBeacon for synchronous sending (e.g., on page unload)
                if ('sendBeacon' in navigator) {
                    navigator.sendBeacon(
                        `${window.location.origin}${this.apiEndpoint}`,
                        JSON.stringify(payload)
                    )
                }
            } else {
                // Use fetch for normal async sending
                await fetch(`${window.location.origin}${this.apiEndpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                    },
                    body: JSON.stringify(payload)
                }).catch(error => {
                    console.warn('Failed to send audit events:', error)
                    // Re-add events to queue if sending failed
                    this.events.unshift(...eventsToSend)
                })
            }
        } catch (error) {
            console.warn('Failed to flush audit events:', error)
            // Re-add events to queue if sending failed
            this.events.unshift(...eventsToSend)
        }
        */
    }

    public getSessionSummary(): {
        sessionId: string
        userId?: string
        eventCount: number
        sessionDuration: number
        lastActivity: string
    } {
        const firstEvent = this.events[0]
        const lastEvent = this.events[this.events.length - 1]

        return {
            sessionId: this.sessionId,
            userId: this.userId,
            eventCount: this.events.length,
            sessionDuration: firstEvent && lastEvent
                ? new Date(lastEvent.timestamp).getTime() - new Date(firstEvent.timestamp).getTime()
                : 0,
            lastActivity: lastEvent?.timestamp || new Date().toISOString()
        }
    }

    public exportEvents(): AuditEvent[] {
        return [...this.events]
    }

    public clearEvents(): void {
        this.events = []
    }
}

// Create singleton instance
export const auditLogger = new AuditLogger()

// Export types for use in other files
export type { AuditEvent, PerformanceMetrics } 