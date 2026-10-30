/** True only when the signed-in account role is superadmin. */
export function isCurrentUserSuperAdmin(): boolean {
    try {
        const raw = localStorage.getItem('user')
        if (!raw) return false
        const user = JSON.parse(raw) as { role?: { name?: string } | string }
        const roleName = typeof user.role === 'string' ? user.role : user.role?.name
        return roleName === 'superadmin'
    } catch {
        return false
    }
}

export function isRestrictedLogRequest(url?: string): boolean {
    if (!url) return false
    return /activity-logs|\/audit(?:\/|$)/i.test(url)
}
