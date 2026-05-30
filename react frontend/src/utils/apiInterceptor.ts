import { auditLogger } from './auditLogger'

interface ApiCallMetrics {
    startTime: number
    endTime?: number
    requestSize?: number
    responseSize?: number
}

class ApiInterceptor {
    private activeRequests = new Map<string, ApiCallMetrics>()

    // Generate a unique request ID
    private generateRequestId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    // Calculate request size
    private calculateRequestSize(data?: any): number {
        if (!data) return 0

        try {
            if (typeof data === 'string') {
                return new Blob([data]).size
            }
            if (data instanceof FormData) {
                // Approximate size for FormData
                let size = 0
                for (const [key, value] of data.entries()) {
                    size += key.length
                    if (typeof value === 'string') {
                        size += value.length
                    } else if (value instanceof File) {
                        size += value.size
                    }
                }
                return size
            }
            return new Blob([JSON.stringify(data)]).size
        } catch {
            return 0
        }
    }

    // Calculate response size
    private calculateResponseSize(response: Response): number {
        const contentLength = response.headers.get('content-length')
        if (contentLength) {
            return parseInt(contentLength, 10)
        }
        return 0
    }

    // Sanitize URL for logging (remove sensitive parameters)
    private sanitizeUrl(url: string): string {
        try {
            const urlObj = new URL(url, window.location.origin)
            const sensitiveParams = ['token', 'key', 'secret', 'password', 'api_key']

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

    // Intercept fetch requests
    public interceptFetch() {
        const originalFetch = window.fetch

        window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            const requestId = this.generateRequestId()
            const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
            const method = init?.method || 'GET'
            const startTime = performance.now()

            // Calculate request size
            const requestSize = this.calculateRequestSize(init?.body)

            // Store request metrics
            this.activeRequests.set(requestId, {
                startTime,
                requestSize
            })

            try {
                // Make the actual request
                const response = await originalFetch(input, init)
                const endTime = performance.now()
                const duration = endTime - startTime

                // Calculate response size
                const responseSize = this.calculateResponseSize(response)

                // Update metrics
                const metrics = this.activeRequests.get(requestId)
                if (metrics) {
                    metrics.endTime = endTime
                    metrics.responseSize = responseSize
                }

                // Log the API call
                auditLogger.logApiCall(
                    method,
                    this.sanitizeUrl(url),
                    response.status,
                    duration,
                    requestSize,
                    responseSize
                )

                // Log errors for non-2xx responses
                if (!response.ok) {
                    auditLogger.logEvent('error', 'api_error', {
                        method,
                        url: this.sanitizeUrl(url),
                        status: response.status,
                        statusText: response.statusText,
                        duration
                    })
                }

                // Clean up
                this.activeRequests.delete(requestId)

                return response

            } catch (error) {
                const endTime = performance.now()
                const duration = endTime - startTime

                // Log the error
                auditLogger.logApiCall(
                    method,
                    this.sanitizeUrl(url),
                    0, // No status code for network errors
                    duration,
                    requestSize,
                    0,
                    error
                )

                auditLogger.logEvent('error', 'api_network_error', {
                    method,
                    url: this.sanitizeUrl(url),
                    error: error instanceof Error ? error.message : 'Network error',
                    duration
                })

                // Clean up
                this.activeRequests.delete(requestId)

                throw error
            }
        }
    }

    // Intercept XMLHttpRequest
    public interceptXHR() {
        const originalXHR = window.XMLHttpRequest
        const self = this

        window.XMLHttpRequest = function () {
            const xhr = new originalXHR()
            const requestId = self.generateRequestId()
            let method = 'GET'
            let url = ''
            let startTime = 0

            // Override open method
            const originalOpen = xhr.open
            xhr.open = function (m: string, u: string | URL, ...args: any[]) {
                method = m
                url = typeof u === 'string' ? u : u.toString()
                return originalOpen.apply(this, [m, u, ...args])
            }

            // Override send method
            const originalSend = xhr.send
            xhr.send = function (data?: any) {
                startTime = performance.now()
                const requestSize = self.calculateRequestSize(data)

                // Store request metrics
                self.activeRequests.set(requestId, {
                    startTime,
                    requestSize
                })

                return originalSend.apply(this, [data])
            }

            // Add event listeners
            xhr.addEventListener('loadend', () => {
                const endTime = performance.now()
                const duration = endTime - startTime

                if (startTime > 0) {
                    // Get response size from content-length header
                    const contentLength = xhr.getResponseHeader('content-length')
                    const responseSize = contentLength ? parseInt(contentLength, 10) : 0

                    // Log the API call
                    auditLogger.logApiCall(
                        method,
                        self.sanitizeUrl(url),
                        xhr.status,
                        duration,
                        self.activeRequests.get(requestId)?.requestSize,
                        responseSize
                    )

                    // Log errors for non-2xx responses
                    if (xhr.status >= 400) {
                        auditLogger.logEvent('error', 'api_error', {
                            method,
                            url: self.sanitizeUrl(url),
                            status: xhr.status,
                            statusText: xhr.statusText,
                            duration
                        })
                    }

                    // Clean up
                    self.activeRequests.delete(requestId)
                }
            })

            xhr.addEventListener('error', () => {
                const endTime = performance.now()
                const duration = endTime - startTime

                if (startTime > 0) {
                    auditLogger.logEvent('error', 'api_network_error', {
                        method,
                        url: self.sanitizeUrl(url),
                        error: 'XMLHttpRequest network error',
                        duration
                    })

                    // Clean up
                    self.activeRequests.delete(requestId)
                }
            })

            return xhr
        }
    }

    // Initialize all interceptors
    public initialize() {
        this.interceptFetch()
        this.interceptXHR()

        // Log that API interceptor has been initialized
        auditLogger.logEvent('system', 'api_interceptor_initialized', {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        })
    }

    // Get current request metrics
    public getActiveRequestsCount(): number {
        return this.activeRequests.size
    }

    // Get performance summary
    public getPerformanceSummary(): {
        activeRequests: number
        totalRequests: number
    } {
        return {
            activeRequests: this.activeRequests.size,
            totalRequests: this.activeRequests.size // This would need to be tracked separately for total
        }
    }
}

// Create and export singleton instance
export const apiInterceptor = new ApiInterceptor()

// Auto-initialize when module is imported
if (typeof window !== 'undefined') {
    apiInterceptor.initialize()
} 