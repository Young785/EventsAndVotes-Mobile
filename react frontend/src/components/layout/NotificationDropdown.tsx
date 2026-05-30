import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    id: string;
    type: string;
    data: {
        title: string;
        message: string;
        url?: string;
        action_text?: string;
        icon?: string;
        priority?: 'low' | 'medium' | 'high';
    };
    read_at: string | null;
    created_at: string;
}

interface NotificationDropdownProps {
    className?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    // Fetch notifications
    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/notifications?per_page=10`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json',
                },
            });
            if (!response.ok) throw new Error('Failed to fetch notifications');
            const data = await response.json();
            return data.data || [];
        },
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    // Fetch unread count
    const { data: unreadCount = 0 } = useQuery({
        queryKey: ['notifications-unread-count'],
        queryFn: async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/notifications/unread-count`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json',
                },
            });
            if (!response.ok) throw new Error('Failed to fetch unread count');
            const data = await response.json();
            return data.count || 0;
        },
        refetchInterval: 30000,
    });

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: async (notificationId: string) => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json',
                },
            });
            if (!response.ok) throw new Error('Failed to mark notification as read');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        },
    });

    // Mark all as read mutation
    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/notifications/mark-all-read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json',
                },
            });
            if (!response.ok) throw new Error('Failed to mark all notifications as read');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        },
    });

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read_at) {
            markAsReadMutation.mutate(notification.id);
        }
        setIsOpen(false);
    };

    const handleMarkAllAsRead = () => {
        markAllAsReadMutation.mutate();
    };

    const getNotificationIcon = (type: string, icon?: string) => {
        if (icon) return icon;

        switch (type) {
            case 'App\\Notifications\\VoteNotification':
                return 'ph-duotone ph-chart-bar';
            case 'App\\Notifications\\WithdrawalNotification':
                return 'ph-duotone ph-currency-circle-dollar';
            case 'App\\Notifications\\SubscriptionNotification':
                return 'ph-duotone ph-crown';
            case 'App\\Notifications\\SecurityNotification':
                return 'ph-duotone ph-shield-check';
            case 'App\\Notifications\\SystemNotification':
                return 'ph-duotone ph-gear';
            default:
                return 'ph-duotone ph-info';
        }
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'high':
                return 'text-danger';
            case 'medium':
                return 'text-warning';
            default:
                return 'text-primary';
        }
    };

    const getNotificationUrl = (notification: Notification) => {
        if (notification.data.url) {
            // Convert Laravel URLs to React routes
            const url = notification.data.url;
            if (url.includes('/admin/')) {
                return url.replace('/admin/', '/');
            }
            return url;
        }
        return '/dashboard';
    };

    return (
        <li className={`dropdown pc-h-item ${className}`}>
            <a
                className="pc-head-link dropdown-toggle arrow-none me-0"
                href="#"
                role="button"
                aria-haspopup="false"
                aria-expanded={isOpen}
                onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(!isOpen);
                }}
            >
                <i className="ph-duotone ph-bell"></i>
                {unreadCount > 0 && (
                    <span className="badge bg-success pc-h-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </a>
            <div className={`dropdown-menu dropdown-notification dropdown-menu-end pc-h-dropdown ${isOpen ? 'show' : ''}`}>
                <div className="dropdown-header d-flex align-items-center justify-content-between">
                    <h5 className="m-0">Notifications</h5>
                    <ul className="list-inline ms-auto mb-0">
                        <li className="list-inline-item">
                            <button
                                type="button"
                                className="btn btn-sm btn-link-primary"
                                onClick={handleMarkAllAsRead}
                                disabled={markAllAsReadMutation.isPending || unreadCount === 0}
                                title="Mark all as read"
                            >
                                <i className="ti ti-check f-18"></i>
                            </button>
                        </li>
                        <li className="list-inline-item">
                            <Link
                                to="/notification-settings"
                                className="btn btn-sm btn-link-primary"
                                title="Notification settings"
                            >
                                <i className="ti ti-settings f-18"></i>
                            </Link>
                        </li>
                    </ul>
                </div>
                <div className="dropdown-body text-wrap header-notification-scroll position-relative" style={{ maxHeight: 'calc(100vh - 235px)' }}>
                    {isLoading ? (
                        <div className="text-center py-3">
                            <div className="spinner-border spinner-border-sm" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-4">
                            <i className="ph-duotone ph-bell-slash f-40 text-muted mb-2"></i>
                            <p className="text-muted mb-0">No notifications yet</p>
                        </div>
                    ) : (
                        <ul className="list-group list-group-flush">
                            {notifications.map((notification: Notification) => (
                                <li key={notification.id} className="list-group-item p-0">
                                    <Link
                                        to={getNotificationUrl(notification)}
                                        className={`d-flex align-items-start p-3 text-decoration-none notification-item ${!notification.read_at ? 'unread' : ''}`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="flex-shrink-0">
                                            <div className={`avtar avtar-s ${getPriorityColor(notification.data.priority)}`}>
                                                <i className={getNotificationIcon(notification.type, notification.data.icon)}></i>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <h6 className={`mb-1 ${!notification.read_at ? 'fw-bold' : ''}`}>
                                                {notification.data.title}
                                            </h6>
                                            <p className="text-muted mb-1 small">
                                                {notification.data.message}
                                            </p>
                                            <small className="text-muted">
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                            </small>
                                        </div>
                                        {!notification.read_at && (
                                            <div className="flex-shrink-0">
                                                <span className="badge bg-primary badge-sm">New</span>
                                            </div>
                                        )}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                    {notifications.length > 0 && (
                        <div className="text-center py-2 border-top">
                            <Link to="/activity-logs" className="btn btn-sm btn-link-primary">
                                View All Notifications
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </li>
    );
};

export default NotificationDropdown; 