import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, ArrowRight, Clock, Star, Users, BarChart, Settings, FileText, CreditCard } from 'lucide-react';

interface NavigationItem {
    id: string;
    title: string;
    description: string;
    path: string;
    icon: React.ReactNode;
    category: string;
    keywords: string[];
    frequency?: number;
}

interface QuickNavigationProps {
    isOpen: boolean;
    onClose: () => void;
}

const QuickNavigation: React.FC<QuickNavigationProps> = ({ isOpen, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [recentItems, setRecentItems] = useState<string[]>([]);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const navigationItems: NavigationItem[] = [
        // Dashboard & Overview
        {
            id: 'dashboard',
            title: 'Dashboard',
            description: 'Overview and analytics',
            path: '/dashboard',
            icon: <BarChart className="w-4 h-4" />,
            category: 'General',
            keywords: ['home', 'overview', 'stats', 'analytics']
        },

        // Votes Management
        {
            id: 'votes',
            title: 'Votes',
            description: 'Manage voting categories',
            path: '/votes',
            icon: <BarChart className="w-4 h-4" />,
            category: 'Votes',
            keywords: ['voting', 'elections', 'categories', 'polls']
        },
        {
            id: 'create-vote',
            title: 'Create Vote',
            description: 'Start a new voting category',
            path: '/votes/create',
            icon: <BarChart className="w-4 h-4" />,
            category: 'Votes',
            keywords: ['new', 'add', 'create', 'voting', 'election']
        },
        {
            id: 'vote-results',
            title: 'Vote Results',
            description: 'View voting results and analytics',
            path: '/votes/results',
            icon: <BarChart className="w-4 h-4" />,
            category: 'Votes',
            keywords: ['results', 'analytics', 'winner', 'statistics']
        },

        // Nominees Management
        {
            id: 'nominees',
            title: 'Nominees',
            description: 'Manage candidates',
            path: '/nominees',
            icon: <Users className="w-4 h-4" />,
            category: 'Nominees',
            keywords: ['candidates', 'participants', 'contestants']
        },
        {
            id: 'add-nominee',
            title: 'Add Nominee',
            description: 'Register new candidate',
            path: '/nominees/create',
            icon: <Users className="w-4 h-4" />,
            category: 'Nominees',
            keywords: ['new', 'add', 'register', 'candidate']
        },

        // Positions
        {
            id: 'positions',
            title: 'Positions',
            description: 'Manage voting positions',
            path: '/positions',
            icon: <FileText className="w-4 h-4" />,
            category: 'Votes',
            keywords: ['roles', 'offices', 'positions', 'categories']
        },

        // Users Management
        {
            id: 'users',
            title: 'Users',
            description: 'Manage user accounts',
            path: '/users',
            icon: <Users className="w-4 h-4" />,
            category: 'Users',
            keywords: ['accounts', 'members', 'people', 'management']
        },
        {
            id: 'user-management',
            title: 'User Management',
            description: 'Advanced user management',
            path: '/users/management',
            icon: <Users className="w-4 h-4" />,
            category: 'Users',
            keywords: ['admin', 'management', 'control', 'users']
        },

        // Subscriptions
        {
            id: 'subscriptions',
            title: 'Subscriptions',
            description: 'Manage subscription plans',
            path: '/subscriptions',
            icon: <CreditCard className="w-4 h-4" />,
            category: 'Billing',
            keywords: ['plans', 'billing', 'payments', 'packages']
        },
        {
            id: 'subscription-requests',
            title: 'Subscription Requests',
            description: 'Manual payment requests',
            path: '/subscription-requests',
            icon: <CreditCard className="w-4 h-4" />,
            category: 'Billing',
            keywords: ['requests', 'manual', 'payments', 'approval']
        },

        // Financial
        {
            id: 'transactions',
            title: 'Transactions',
            description: 'View payment history',
            path: '/transactions',
            icon: <CreditCard className="w-4 h-4" />,
            category: 'Financial',
            keywords: ['payments', 'history', 'money', 'revenue']
        },
        {
            id: 'withdrawals',
            title: 'Withdrawals',
            description: 'Manage withdrawal requests',
            path: '/withdrawals',
            icon: <CreditCard className="w-4 h-4" />,
            category: 'Financial',
            keywords: ['payouts', 'cash out', 'withdraw', 'money']
        },

        // Reports
        {
            id: 'reports',
            title: 'Reports',
            description: 'Analytics and insights',
            path: '/reports',
            icon: <FileText className="w-4 h-4" />,
            category: 'Reports',
            keywords: ['analytics', 'insights', 'data', 'statistics']
        },

        // Settings
        {
            id: 'settings',
            title: 'Settings',
            description: 'System configuration',
            path: '/settings',
            icon: <Settings className="w-4 h-4" />,
            category: 'Settings',
            keywords: ['config', 'preferences', 'system', 'options']
        },
        {
            id: 'profile',
            title: 'Profile',
            description: 'Account settings',
            path: '/profile',
            icon: <Users className="w-4 h-4" />,
            category: 'Settings',
            keywords: ['account', 'personal', 'info', 'details']
        },
        {
            id: 'activity-logs',
            title: 'Activity Logs',
            description: 'System activity and audit trail',
            path: '/activity-logs',
            icon: <Clock className="w-4 h-4" />,
            category: 'Settings',
            keywords: ['audit', 'logs', 'history', 'activity', 'tracking']
        },

        // Additional
        {
            id: 'referrals',
            title: 'Referrals',
            description: 'Referral program management',
            path: '/referrals',
            icon: <Star className="w-4 h-4" />,
            category: 'Marketing',
            keywords: ['referral', 'program', 'commissions', 'affiliate']
        }
    ];

    const filteredItems = navigationItems.filter(item => {
        if (!searchTerm) return true;

        const searchLower = searchTerm.toLowerCase();
        return (
            item.title.toLowerCase().includes(searchLower) ||
            item.description.toLowerCase().includes(searchLower) ||
            item.category.toLowerCase().includes(searchLower) ||
            item.keywords.some(keyword => keyword.includes(searchLower))
        );
    });

    const groupedItems = filteredItems.reduce((groups, item) => {
        if (!groups[item.category]) {
            groups[item.category] = [];
        }
        groups[item.category].push(item);
        return groups;
    }, {} as Record<string, NavigationItem[]>);

    // Recent items logic
    useEffect(() => {
        const saved = localStorage.getItem('recentNavigation');
        if (saved) {
            setRecentItems(JSON.parse(saved));
        }
    }, []);

    const addToRecent = (itemId: string) => {
        const updated = [itemId, ...recentItems.filter(id => id !== itemId)].slice(0, 5);
        setRecentItems(updated);
        localStorage.setItem('recentNavigation', JSON.stringify(updated));
    };

    const getRecentItems = () => {
        return recentItems
            .map(id => navigationItems.find(item => item.id === id))
            .filter(Boolean) as NavigationItem[];
    };

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev =>
                        prev < filteredItems.length - 1 ? prev + 1 : 0
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev =>
                        prev > 0 ? prev - 1 : filteredItems.length - 1
                    );
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (filteredItems[selectedIndex]) {
                        handleSelect(filteredItems[selectedIndex]);
                    }
                    break;
                case 'Escape':
                    onClose();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, filteredItems, onClose]);

    // Focus search input when opened
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (item: NavigationItem) => {
        addToRecent(item.id);
        navigate(item.path);
        onClose();
        setSearchTerm('');
        setSelectedIndex(0);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-start justify-center z-50 pt-20">
            <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-hidden">
                {/* Search Input */}
                <div className="p-4 border-b border-gray-200 dark:border-secondary-700">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search pages, features, settings..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setSelectedIndex(0);
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">
                            <Command className="w-3 h-3 inline mr-1" />
                            K
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-80 overflow-y-auto">
                    {searchTerm === '' && getRecentItems().length > 0 && (
                        <div className="p-3 border-b border-gray-100">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Recent
                            </h3>
                            {getRecentItems().map((item, index) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleSelect(item)}
                                    className="w-full flex items-center p-2 rounded-lg hover:bg-gray-100 text-left"
                                >
                                    <div className="flex-shrink-0 mr-3">
                                        {item.icon}
                                    </div>
                                    <div className="flex-grow">
                                        <div className="font-medium text-gray-900 dark:text-white">{item.title}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{item.description}</div>
                                    </div>
                                    <Clock className="w-3 h-3 text-gray-400" />
                                </button>
                            ))}
                        </div>
                    )}

                    {Object.entries(groupedItems).map(([category, items]) => (
                        <div key={category} className="p-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                {category}
                            </h3>
                            {items.map((item, itemIndex) => {
                                const globalIndex = filteredItems.findIndex(i => i.id === item.id);
                                const isSelected = globalIndex === selectedIndex;

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleSelect(item)}
                                        className={`w-full flex items-center p-2 rounded-lg text-left transition-colors ${isSelected ? 'bg-blue-100 border-blue-200' : 'hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className="flex-shrink-0 mr-3">
                                            {item.icon}
                                        </div>
                                        <div className="flex-grow">
                                            <div className="font-medium text-gray-900 dark:text-white">{item.title}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{item.description}</div>
                                        </div>
                                        <ArrowRight className="w-3 h-3 text-gray-400" />
                                    </button>
                                );
                            })}
                        </div>
                    ))}

                    {filteredItems.length === 0 && (
                        <div className="p-8 text-center">
                            <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">No results found for "{searchTerm}"</p>
                            <p className="text-sm text-gray-400 mt-1">Try different keywords or browse categories</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-200 bg-gray-50 dark:bg-secondary-800">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-3">
                            <span className="flex items-center">
                                <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">↑↓</kbd>
                                <span className="ml-1">Navigate</span>
                            </span>
                            <span className="flex items-center">
                                <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">↵</kbd>
                                <span className="ml-1">Select</span>
                            </span>
                            <span className="flex items-center">
                                <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Esc</kbd>
                                <span className="ml-1">Close</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickNavigation; 