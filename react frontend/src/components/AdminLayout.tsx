import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationCenter from './NotificationCenter';
import ThemeToggle from './layout/ThemeToggle';
import { getUserAvatarUrl } from '../utils/imageUtils';
import {
    Home,
    Vote,
    Users,
    Settings,
    LogOut,
    Bell,
    Search,
    Menu,
    X,
    ChevronDown,
    ChevronRight,
    User,
    Activity,
    BarChart3,
    FileText,
    CreditCard,
    Shield,
    LayoutDashboard,
    Calendar,
    DollarSign,
    UserCheck,
    HelpCircle,
    Package,
    Database,
    Target
} from 'lucide-react';

interface AdminLayoutProps {
    children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['elections']);

    const toggleMenu = (menuId: string) => {
        setExpandedMenus(prev =>
            prev.includes(menuId)
                ? prev.filter(id => id !== menuId)
                : [...prev, menuId]
        );
    };

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const isMenuExpanded = (menuId: string) => {
        return expandedMenus.includes(menuId);
    };

    const userRole = user?.role?.name || '';
    const isAdmin = ['admin', 'admin_vote', 'admin_both'].includes(userRole);
    const isSuperAdmin = userRole === 'superadmin';
    const hasEventRole = ['admin_event', 'admin_both'].includes(userRole);
    const hasVoteRole = ['admin_vote', 'admin_both'].includes(userRole);

    const navigationItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <LayoutDashboard className="w-5 h-5" />,
            path: '/admin/dashboard',
            show: true
        },
        {
            id: 'activity-logs',
            label: 'Activity Logs',
            icon: <Activity className="w-5 h-5" />,
            path: '/admin/activity-logs',
            show: isSuperAdmin
        },
        {
            id: 'events',
            label: 'Events',
            icon: <Calendar className="w-5 h-5" />,
            show: isSuperAdmin || hasEventRole,
            submenu: [
                { label: 'All Events', path: '/admin/events' },
                { label: 'Event Subscriptions', path: '/admin/events/subscriptions', show: isSuperAdmin },
            ].filter(item => item.show !== false)
        },
        {
            id: 'elections',
            label: 'Elections',
            icon: <Vote className="w-5 h-5" />,
            show: isSuperAdmin || isAdmin || hasVoteRole,
            submenu: [
                { label: 'All Votings', path: '/admin/votes' },
                { label: 'Subscriptions', path: '/admin/subscriptions' },
            ]
        },
        {
            id: 'management',
            label: 'Management',
            icon: <Shield className="w-5 h-5" />,
            show: isSuperAdmin,
            submenu: [
                { label: 'Users Management', path: '/admin/users', show: isSuperAdmin },
                { label: 'Transactions', path: '/admin/transactions', show: isSuperAdmin },
                { label: 'Site Settings', path: '/admin/management/site-settings', show: isSuperAdmin },
                { label: 'Subscription Plans', path: isSuperAdmin ? '/superadmin/subscription-plans' : '/admin/subscription-plans', show: true },
                { label: 'Subscription Transactions', path: '/superadmin/subscription-transactions', show: isSuperAdmin },
                { label: 'Payment Gateways', path: '/superadmin/payment-gateways', show: isSuperAdmin }
            ].filter(item => item.show !== false)
        },
        {
            id: 'withdrawals',
            label: 'Withdrawals',
            icon: <DollarSign className="w-5 h-5" />,
            path: '/admin/withdrawals',
            show: isSuperAdmin || isAdmin || hasVoteRole
        },
        {
            id: 'withdrawal-requests',
            label: 'Withdrawal Requests',
            icon: <UserCheck className="w-5 h-5" />,
            path: '/admin/withdrawal-requests',
            show: isSuperAdmin
        },
        {
            id: 'banks',
            label: 'Bank Management',
            icon: <CreditCard className="w-5 h-5" />,
            path: isSuperAdmin ? '/superadmin/banks' : '/admin/banks',
            show: isSuperAdmin || hasVoteRole
        },
        {
            id: 'notifications',
            label: 'Notifications',
            icon: <Bell className="w-5 h-5" />,
            show: true,
            submenu: [
                { label: 'All Notifications', path: '/admin/notifications' },
                { label: 'Settings', path: '/admin/notifications/settings' }
            ]
        },
        {
            id: 'referrals',
            label: 'Referrals',
            icon: <Target className="w-5 h-5" />,
            path: '/admin/referrals',
            show: isSuperAdmin || isAdmin || hasVoteRole
        },
        {
            id: 'subscription-requests',
            label: 'Subscription Requests',
            icon: <FileText className="w-5 h-5" />,
            path: '/admin/subscription-requests',
            show: isSuperAdmin
        },
        {
            id: 'account',
            label: 'My Account',
            icon: <Settings className="w-5 h-5" />,
            path: '/admin/profile',
            show: true
        },
        {
            id: 'logout',
            label: 'Logout',
            icon: <LogOut className="w-5 h-5" />,
            path: '/admin/logout',
            show: true
        },
        {
            id: 'go-home',
            label: 'Go Home',
            icon: <Home className="w-5 h-5" />,
            path: '/',
            show: true
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-secondary-800 dark:bg-secondary-900 flex transition-colors duration-300">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-secondary-950 shadow-xl dark:shadow-2xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 border-r border-gray-200 dark:border-secondary-800`}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-secondary-800 bg-gradient-to-r from-blue-600 to-purple-600">
                    <Link to="/admin/dashboard" className="flex items-center space-x-2 group">
                        <div className="w-9 h-9 bg-white dark:bg-secondary-900 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                            <Vote className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex items-center">
                            <span className="text-lg font-bold text-white">Events</span>
                            <span className="text-lg font-bold text-yellow-300 mx-1">&</span>
                            <span className="text-lg font-bold text-white">Votes</span>
                        </div>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 rounded-md text-white hover:bg-white dark:bg-secondary-900/10 transition-colors duration-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="mt-6 px-3 h-[calc(100vh-15rem)] overflow-y-auto">
                    <div className="space-y-1">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Navigation
                        </div>

                        {navigationItems.map((item) => {
                            if (!item.show) return null;

                            if (item.submenu) {
                                return (
                                    <div key={item.id} className="animate-slide-in-right">
                                        <button
                                            onClick={() => toggleMenu(item.id)}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group ${isMenuExpanded(item.id)
                                                ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-700 dark:text-blue-400 shadow-sm'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-secondary-800 hover:scale-[1.02]'
                                                }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={`transition-transform duration-200 ${isMenuExpanded(item.id) ? 'scale-110' : 'group-hover:scale-110'}`}>
                                                    {item.icon}
                                                </div>
                                                <span>{item.label}</span>
                                            </div>
                                            {isMenuExpanded(item.id) ? (
                                                <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 transition-transform duration-200" />
                                            )}
                                        </button>
                                        {isMenuExpanded(item.id) && (
                                            <div className="ml-6 mt-1 space-y-1 animate-slide-down">
                                                {item.submenu.map((subItem) => (
                                                    <Link
                                                        key={subItem.path}
                                                        to={subItem.path}
                                                        className={`block px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:translate-x-1 ${isActive(subItem.path)
                                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium shadow-sm'
                                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-secondary-800'
                                                            }`}
                                                    >
                                                        {subItem.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={item.id}
                                    to={item.path!}
                                    className={`flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group animate-slide-in-right ${isActive(item.path!)
                                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-700 dark:text-blue-400 shadow-sm'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-secondary-800 hover:scale-[1.02]'
                                        }`}
                                >
                                    <div className={`transition-transform duration-200 ${isActive(item.path!) ? 'scale-110' : 'group-hover:scale-110'}`}>
                                        {item.icon}
                                    </div>
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}

                        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-secondary-800">
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Other
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Help Center Card */}
                <div className="absolute bottom-4 left-3 right-3 animate-fade-in-up">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <div className="flex items-center space-x-2 mb-2">
                            <div className="w-8 h-8 bg-white dark:bg-secondary-900/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                <HelpCircle className="w-5 h-5" />
                            </div>
                            <h5 className="font-semibold">Help Center</h5>
                        </div>
                        <p className="text-sm text-blue-100 mb-3">
                            Please contact us for more questions.
                        </p>
                        <Link
                            to="/contact"
                            className="inline-block bg-white dark:bg-secondary-900 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 hover:shadow-md transition-all duration-200 active:scale-95"
                        >
                            Go to Help Center
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="bg-white dark:bg-secondary-900/80 dark:bg-secondary-950/80 backdrop-blur-lg shadow-sm border-b border-gray-200 dark:border-secondary-800 sticky top-0 z-40">
                    <div className="flex items-center justify-between h-16 px-6">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-secondary-800 transition-all duration-200"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <div className="hidden md:flex items-center space-x-2 bg-gray-100 dark:bg-secondary-800 rounded-lg px-4 py-2 min-w-[300px] transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500">
                                <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 dark:text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 w-full"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <NotificationCenter />
                            <ThemeToggle />

                            <div className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-secondary-800 transition-all duration-200 cursor-pointer group">
                                <img
                                    src={getUserAvatarUrl(user || undefined)}
                                    alt={user?.first_name}
                                    className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-200 dark:ring-secondary-700 group-hover:ring-blue-500 transition-all duration-200"
                                />
                                <div className="hidden md:block">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {user?.first_name} {user?.last_name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                        {user?.role?.name?.replace('_', ' ')}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={logout}
                                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all duration-200 active:scale-95"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden md:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto bg-gray-50 dark:bg-secondary-800 dark:bg-secondary-900 p-6 transition-colors duration-300">
                    <div className="animate-fade-in">
                        {children || <Outlet />}
                    </div>
                </main>
            </div>

            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default AdminLayout; 