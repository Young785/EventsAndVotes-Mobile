import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Eye,
    Calendar,
    Users,
    DollarSign,
    Share2,
    Download,
    MoreVertical,
    Settings,
    CreditCard,
    UserPlus,
    X,
    BarChart3,
    ExternalLink,
    FileText,
    TrendingUp,
    Ticket,
    CalendarCheck
} from 'lucide-react';
import { eventsApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import EventCreateModal from '../../components/modals/EventCreateModal';
import EventViewModal from '../../components/modals/EventViewModal';
import EventEditModal from '../../components/modals/EventEditModal';
import useDebounce from '../../hooks/useDebounce';
import { Event } from '../../types';

const AdminEvents: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    // Debounce search query to prevent excessive API calls
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const queryClient = useQueryClient();
    const { user } = useAuth();

    // Check if user is superadmin or admin
    const isSuperAdmin = user?.role?.name === 'superadmin';
    const isAdmin = user?.role?.name === 'admin' || user?.role?.name === 'admin_event' || user?.role?.name === 'admin_both';

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (openDropdown && !target.closest('.dropdown-container')) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openDropdown]);

    // Fetch events using the correct API structure
    const { data: eventsData, isLoading } = useQuery({
        queryKey: ['admin-events', currentPage, debouncedSearchQuery, statusFilter, startDate, endDate],
        queryFn: () => eventsApi.getAdminEvents({
            page: currentPage,
            per_page: 20,
            search: debouncedSearchQuery,
            status: statusFilter,
            // Note: admin events API uses different date filtering structure
            // Remove start_date and end_date for now since the admin API doesn't support them yet
        })
    });

    // Delete event mutation
    const deleteEventMutation = useMutation({
        mutationFn: eventsApi.deleteAdminEvent,
        onSuccess: () => {
            toast.success('Event deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-events'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete event');
        }
    });

    // Publish event mutation
    const publishEventMutation = useMutation({
        mutationFn: eventsApi.publishEvent,
        onSuccess: () => {
            toast.success('Event published successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-events'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to publish event');
        }
    });

    // Export events mutation
    const exportEventsMutation = useMutation({
        mutationFn: () => fetch(`${import.meta.env.VITE_API_URL}/admin/events/export`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        }).then(res => res.blob()),
        onSuccess: (blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `events-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success('Events exported successfully');
        },
        onError: (error: any) => {
            toast.error('Failed to export events');
        }
    });

    const formatEventDate = (startDate: string, endDate: string, startTime?: string, endTime?: string) => {
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return 'Invalid date';
            }

            const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
            const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
            const startDay = start.getDate();
            const endDay = end.getDate();

            let dateStr = '';
            if (startMonth === endMonth && startDay === endDay) {
                dateStr = `${startMonth} ${startDay}`;
            } else if (startMonth === endMonth) {
                dateStr = `${startMonth} ${startDay}-${endDay}`;
            } else {
                dateStr = `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
            }

            // Add time if provided
            if (startTime) {
                try {
                    const timeObj = new Date(`2000-01-01T${startTime}`);
                    const timeStr = timeObj.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    });
                    dateStr += ` at ${timeStr}`;
                } catch (timeError) {
                    // If time parsing fails, just return the date
                }
            }

            return dateStr;
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'Date error';
        }
    };

    const handleDeleteEvent = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            deleteEventMutation.mutate(id);
        }
    };

    const handlePublishEvent = async (id: string) => {
        if (window.confirm('Are you sure you want to publish this event?')) {
            publishEventMutation.mutate(id);
        }
    };

    const handleExportEvents = () => {
        exportEventsMutation.mutate();
    };

    const handleViewEvent = (event: Event) => {
        setSelectedEvent(event);
        setShowViewModal(true);
    };

    const handleEditEvent = (event: Event) => {
        setSelectedEvent(event);
        setShowEditModal(true);
    };

    const handleShareEvent = async (event: Event) => {
        const shareUrl = `${window.location.origin}/events/${event.id}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Event link copied to clipboard');
        } catch (error) {
            toast.error('Failed to copy link');
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'active': { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
            'draft': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
            'completed': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completed' },
            'cancelled': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
            'inactive': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Inactive' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    // Extract events from API response - adjust based on actual API response structure
    const events = Array.isArray(eventsData?.data) ? eventsData.data : [];
    const pagination = (eventsData as any)?.pagination || (eventsData as any)?.meta || {
        total: events.length,
        current_page: currentPage,
        last_page: Math.ceil(events.length / 20),
        per_page: 20
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Events Management</h1>
                    <p className="text-gray-600 mt-1">Manage and track your events</p>
                </div>

                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                    <button
                        onClick={handleExportEvents}
                        disabled={exportEventsMutation.isPending}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {exportEventsMutation.isPending ? 'Exporting...' : 'Export'}
                    </button>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Event
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-600">Total Events</p>
                            <p className="text-2xl font-bold text-gray-900">{pagination?.total || events.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-600">Active Events</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {events.filter((event: any) => event.status === 'active').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-600">Draft Events</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {events.filter((event: any) => event.status === 'draft').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-600">Total Capacity</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {events.reduce((sum: number, event: any) => sum + (event.max_attendees || 0), 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(events.reduce((sum: number, event: any) => sum + (event.ticket_price || 0), 0))}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search events..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    <div className="relative">
                        <CalendarCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="date"
                            placeholder="Start Date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="relative">
                        <CalendarCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="date"
                            placeholder="End Date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Events Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto overflow-y-visible" style={{ minHeight: '400px' }}>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Event
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date & Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Capacity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Attendees
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ticket Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {events.map((event: any) => (
                                <tr key={event.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {event.image ? (
                                                <img
                                                    src={`${import.meta.env.VITE_STORAGE_URL}/${event.image}`}
                                                    alt={event.name || 'Event'}
                                                    className="w-12 h-12 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                                    <Calendar className="w-6 h-6 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{event.name || 'Untitled Event'}</div>
                                                <div className="text-sm text-gray-500">{event.description ? event.description.substring(0, 50) + '...' : 'No description'}</div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {formatEventDate(event.start_date, event.end_date)}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{event.location || 'Not specified'}</div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(event.status)}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {event.max_attendees || 'Unlimited'}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {event.current_attendees || 0}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-green-600">
                                            {formatCurrency(event.ticket_price || 0)}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {event.category || 'Uncategorized'}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button
                                                onClick={() => handleViewEvent(event)}
                                                className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                                title="View Event"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() => handleEditEvent(event)}
                                                className="text-green-600 hover:text-green-900 p-1 rounded"
                                                title="Edit Event"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>

                                            <Link
                                                to={`/admin/events/${event.id}/tickets`}
                                                className="text-purple-600 hover:text-purple-900 p-1 rounded"
                                                title="Manage Tickets"
                                            >
                                                <Ticket className="w-4 h-4" />
                                            </Link>

                                            <Link
                                                to={`/admin/events/${event.id}/analytics`}
                                                className="text-orange-600 hover:text-orange-900 p-1 rounded"
                                                title="Analytics"
                                            >
                                                <BarChart3 className="w-4 h-4" />
                                            </Link>

                                            <div className="relative dropdown-container">
                                                <button
                                                    onClick={() => setOpenDropdown(openDropdown === event.id ? null : event.id)}
                                                    className="text-gray-600 hover:text-gray-900 p-1 rounded"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>

                                                {openDropdown === event.id && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-[100] border border-gray-200"
                                                         style={{ top: '100%', right: '0' }}>
                                                        <div className="py-1">
                                                            <Link
                                                                to={`/admin/events/${event.id}/scan-locations`}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                onClick={() => setOpenDropdown(null)}
                                                            >
                                                                <Settings className="w-4 h-4 mr-2" />
                                                                Manage Locations
                                                            </Link>


                                            <Link
                                                to={`/admin/events/${event.id}/scanner`}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <CreditCard className="w-4 h-4 mr-2" />
                                                Scan Tickets
                                            </Link>


                                                            <Link
                                                                to={`/admin/events/${event.id}/withdrawals`}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                onClick={() => setOpenDropdown(null)}
                                                            >
                                                                <DollarSign className="w-4 h-4 mr-2" />
                                                                Event Withdrawals
                                                            </Link>

                                                            <div className="border-t border-gray-100"></div>

                                                            <button
                                                                onClick={() => {
                                                                    handleShareEvent(event);
                                                                    setOpenDropdown(null);
                                                                }}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                            >
                                                                <Share2 className="w-4 h-4 mr-2" />
                                                                Share Event
                                                            </button>

                                                            <Link
                                                                to={`/events/${event.id}`}
                                                                target="_blank"
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                onClick={() => setOpenDropdown(null)}
                                                            >
                                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                                View Public Page
                                                            </Link>

                                                            {event.status === 'draft' && (
                                                                <button
                                                                    onClick={() => {
                                                                        handlePublishEvent(event.id);
                                                                        setOpenDropdown(null);
                                                                    }}
                                                                    className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-gray-100"
                                                                >
                                                                    <TrendingUp className="w-4 h-4 mr-2" />
                                                                    Publish Event
                                                                </button>
                                                            )}

                                                            <div className="border-t border-gray-100"></div>

                                                            <button
                                                                onClick={() => {
                                                                    handleDeleteEvent(event.id);
                                                                    setOpenDropdown(null);
                                                                }}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Delete Event
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Enhanced Pagination */}
                {pagination && pagination.last_page > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(Math.min(pagination.last_page, currentPage + 1))}
                                disabled={currentPage === pagination.last_page}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing{' '}
                                    <span className="font-medium">{(pagination.current_page - 1) * pagination.per_page + 1}</span>
                                    {' '}to{' '}
                                    <span className="font-medium">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span>
                                    {' '}of{' '}
                                    <span className="font-medium">{pagination.total}</span>
                                    {' '}results
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>

                                    {/* Page Numbers */}
                                    {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                                        let pageNum;
                                        if (pagination.last_page <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= pagination.last_page - 2) {
                                            pageNum = pagination.last_page - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum
                                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}

                                    <button
                                        onClick={() => setCurrentPage(Math.min(pagination.last_page, currentPage + 1))}
                                        disabled={currentPage === pagination.last_page}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <EventCreateModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['admin-events'] });
                    setShowCreateModal(false);
                }}
            />

            <EventViewModal
                isOpen={showViewModal}
                onClose={() => {
                    setShowViewModal(false);
                    setSelectedEvent(null);
                }}
                event={selectedEvent}
            />

            <EventEditModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedEvent(null);
                }}
                event={selectedEvent}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['admin-events'] });
                    setShowEditModal(false);
                    setSelectedEvent(null);
                }}
            />
        </div>
    );
};

export default AdminEvents; 