import React from 'react'
import { Link } from 'react-router-dom'
import {
    Plus,
    Users,
    Vote,
    Calendar,
    CreditCard,
    Settings,
    Download,
    Upload,
    Bell,
    Eye,
    Edit,
    Trash2
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface QuickAction {
    id: string
    title: string
    description: string
    icon: React.ReactNode
    href: string
    color: string
    roles: string[]
    featured?: boolean
}

const quickActions: QuickAction[] = [
    {
        id: 'create-vote',
        title: 'Create Vote',
        description: 'Start a new voting campaign',
        icon: <Plus className="w-5 h-5" />,
        href: '/admin/votes/create',
        color: 'bg-blue-500 hover:bg-blue-600',
        roles: ['admin', 'admin_vote', 'admin_both', 'superadmin'],
        featured: true
    },
    {
        id: 'create-event',
        title: 'Create Event',
        description: 'Schedule a new event',
        icon: <Calendar className="w-5 h-5" />,
        href: '/admin/events/create',
        color: 'bg-green-500 hover:bg-green-600',
        roles: ['admin_event', 'admin_both', 'superadmin'],
        featured: true
    },
    {
        id: 'manage-users',
        title: 'Manage Users',
        description: 'View and edit user accounts',
        icon: <Users className="w-5 h-5" />,
        href: '/admin/user-management',
        color: 'bg-purple-500 hover:bg-purple-600',
        roles: ['superadmin']
    },
    {
        id: 'view-votes',
        title: 'View Votes',
        description: 'Monitor all voting activities',
        icon: <Vote className="w-5 h-5" />,
        href: '/admin/votes',
        color: 'bg-indigo-500 hover:bg-indigo-600',
        roles: ['admin', 'admin_vote', 'admin_both', 'superadmin']
    },
    {
        id: 'process-withdrawals',
        title: 'Withdrawals',
        description: 'Process pending withdrawals',
        icon: <CreditCard className="w-5 h-5" />,
        href: '/admin/withdrawals',
        color: 'bg-yellow-500 hover:bg-yellow-600',
        roles: ['admin', 'admin_vote', 'admin_both', 'superadmin']
    },
    {
        id: 'system-settings',
        title: 'System Settings',
        description: 'Configure platform settings',
        icon: <Settings className="w-5 h-5" />,
        href: '/admin/settings',
        color: 'bg-gray-500 hover:bg-gray-600',
        roles: ['superadmin']
    },
    {
        id: 'export-data',
        title: 'Export Data',
        description: 'Download reports and analytics',
        icon: <Download className="w-5 h-5" />,
        href: '/admin/exports',
        color: 'bg-teal-500 hover:bg-teal-600',
        roles: ['admin', 'admin_vote', 'admin_both', 'superadmin']
    },
    {
        id: 'bulk-import',
        title: 'Bulk Import',
        description: 'Import users or data in bulk',
        icon: <Upload className="w-5 h-5" />,
        href: '/admin/imports',
        color: 'bg-orange-500 hover:bg-orange-600',
        roles: ['admin', 'superadmin']
    }
]

interface QuickActionsProps {
    showFeatured?: boolean
    maxActions?: number
    layout?: 'grid' | 'list'
}

const QuickActions: React.FC<QuickActionsProps> = ({
    showFeatured = false,
    maxActions,
    layout = 'grid'
}) => {
    const { user } = useAuth()
    const userRole = user?.role?.name || ''

    const filteredActions = quickActions
        .filter(action => action.roles.includes(userRole))
        .filter(action => !showFeatured || action.featured)
        .slice(0, maxActions)

    if (filteredActions.length === 0) {
        return null
    }

    return (
        <div className="card-glass p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {showFeatured ? 'Quick Actions' : 'All Actions'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Shortcuts to common administrative tasks
                    </p>
                </div>
                <div className="text-xs text-gray-400">
                    {filteredActions.length} action{filteredActions.length !== 1 ? 's' : ''} available
                </div>
            </div>

            {layout === 'grid' ? (
                <div className={`grid gap-4 ${filteredActions.length === 1 ? 'grid-cols-1' :
                        filteredActions.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                            filteredActions.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                                'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    }`}>
                    {filteredActions.map((action) => (
                        <Link
                            key={action.id}
                            to={action.href}
                            className="group relative overflow-hidden rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md"
                        >
                            <div className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-white ${action.color} mb-3 group-hover:scale-110 transition-transform duration-200`}>
                                            {action.icon}
                                        </div>
                                        <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {action.title}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                            {action.description}
                                        </p>
                                    </div>
                                    {action.featured && (
                                        <div className="absolute top-2 right-2">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent group-hover:via-blue-500 transition-colors duration-200"></div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredActions.map((action) => (
                        <Link
                            key={action.id}
                            to={action.href}
                            className="group flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:bg-secondary-800 transition-all duration-200"
                        >
                            <div className={`flex items-center justify-center w-8 h-8 rounded-lg text-white ${action.color} group-hover:scale-110 transition-transform duration-200`}>
                                {action.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                    <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {action.title}
                                    </h4>
                                    {action.featured && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {action.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {!showFeatured && filteredActions.length > 6 && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-secondary-700">
                    <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
                        View All Actions
                    </button>
                </div>
            )}
        </div>
    )
}

export default QuickActions 