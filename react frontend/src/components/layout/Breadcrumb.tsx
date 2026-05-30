import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    path?: string;
    icon?: React.ReactNode;
}

interface BreadcrumbProps {
    customItems?: BreadcrumbItem[];
    showHome?: boolean;
    className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
    customItems,
    showHome = true,
    className = ''
}) => {
    const location = useLocation();

    const getRouteConfig = () => {
        const routes: Record<string, string> = {
            '/dashboard': 'Dashboard',
            '/votes': 'Votes',
            '/votes/create': 'Create Vote',
            '/votes/edit': 'Edit Vote',
            '/votes/results': 'Vote Results',
            '/nominees': 'Nominees',
            '/nominees/create': 'Add Nominee',
            '/nominees/edit': 'Edit Nominee',
            '/positions': 'Positions',
            '/positions/create': 'Create Position',
            '/subscription-requests': 'Subscription Requests',
            '/subscriptions': 'Subscriptions',
            '/subscriptions/plans': 'Subscription Plans',
            '/users': 'Users',
            '/users/create': 'Create User',
            '/users/edit': 'Edit User',
            '/users/management': 'User Management',
            '/withdrawals': 'Withdrawals',
            '/transactions': 'Transactions',
            '/reports': 'Reports',
            '/reports/votes': 'Vote Reports',
            '/reports/users': 'User Reports',
            '/reports/revenue': 'Revenue Reports',
            '/settings': 'Settings',
            '/settings/profile': 'Profile Settings',
            '/settings/security': 'Security Settings',
            '/settings/notifications': 'Notification Settings',
            '/activity-logs': 'Activity Logs',
            '/referrals': 'Referrals',
            '/banks': 'Bank Accounts',
            '/profile': 'Profile',
            '/notification-settings': 'Notification Settings'
        };
        return routes;
    };

    const generateBreadcrumbs = (): BreadcrumbItem[] => {
        if (customItems) {
            return customItems;
        }

        const pathSegments = location.pathname.split('/').filter(segment => segment);
        const routes = getRouteConfig();
        const breadcrumbs: BreadcrumbItem[] = [];

        // Add home if requested
        if (showHome) {
            breadcrumbs.push({
                label: 'Home',
                path: '/dashboard',
                icon: <Home className="w-4 h-4" />
            });
        }

        let currentPath = '';

        pathSegments.forEach((segment, index) => {
            currentPath += `/${segment}`;

            // Get the label from route config or format the segment
            let label = routes[currentPath];

            if (!label) {
                // If not found in routes, format the segment
                label = segment
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            }

            // Don't add link for the last segment (current page)
            const isLast = index === pathSegments.length - 1;

            breadcrumbs.push({
                label,
                path: isLast ? undefined : currentPath
            });
        });

        return breadcrumbs;
    };

    const breadcrumbs = generateBreadcrumbs();

    if (breadcrumbs.length <= 1) {
        return null; // Don't show breadcrumb for single items
    }

    return (
        <nav className={`breadcrumb-nav ${className}`} aria-label="Breadcrumb">
            <ol className="breadcrumb mb-0">
                {breadcrumbs.map((item, index) => (
                    <li
                        key={index}
                        className={`breadcrumb-item ${!item.path ? 'active' : ''}`}
                        aria-current={!item.path ? 'page' : undefined}
                    >
                        {item.path ? (
                            <Link
                                to={item.path}
                                className="text-decoration-none d-flex align-items-center"
                            >
                                {item.icon && <span className="me-1">{item.icon}</span>}
                                {item.label}
                            </Link>
                        ) : (
                            <span className="d-flex align-items-center">
                                {item.icon && <span className="me-1">{item.icon}</span>}
                                {item.label}
                            </span>
                        )}
                        {index < breadcrumbs.length - 1 && (
                            <ChevronRight className="breadcrumb-separator ms-2 me-2" size={14} />
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default Breadcrumb; 