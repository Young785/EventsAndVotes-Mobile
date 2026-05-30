import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import {
    BarChart3,
    TrendingUp,
    Users,
    DollarSign,
    Calendar,
    Clock,
    MapPin,
    Ticket,
    Eye,
    Download,
    Filter,
    RefreshCw,
    ArrowLeft,
    PieChart,
    Activity,
    Target
} from 'lucide-react';
import { eventsApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Event } from '../../types';

const EventAnalytics: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const [selectedPeriod, setSelectedPeriod] = useState('7d');
    const [selectedMetric, setSelectedMetric] = useState('sales');

    // Fetch event details
    const { data: eventData, isLoading: eventLoading } = useQuery({
        queryKey: ['event', eventId],
        queryFn: () => eventsApi.getEvent(eventId!),
        enabled: !!eventId
    });

    // Fetch event analytics
    const { data: analyticsData, isLoading: analyticsLoading, refetch } = useQuery({
        queryKey: ['event-analytics', eventId, selectedPeriod],
        queryFn: () => eventsApi.getEventAnalytics(eventId!),
        enabled: !!eventId,
        refetchInterval: 30000 // Refresh every 30 seconds
    });

    const event = eventData?.data;
    const analytics = analyticsData?.data;

    // Cast event to any to handle different field names from backend
    const eventDetails = event as any;

    const formatEventDate = (startDate: string, endDate: string) => {
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

            if (startMonth === endMonth && startDay === endDay) {
                return `${startMonth} ${startDay}`;
            } else if (startMonth === endMonth) {
                return `${startMonth} ${startDay}-${endDay}`;
            } else {
                return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
            }
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'Date error';
        }
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

    const handleExportAnalytics = () => {
        // Implementation for exporting analytics data
        const csvData = [
            ['Metric', 'Value'],
            ['Total Capacity', analytics?.overview.total_capacity || 0],
            ['Tickets Sold', analytics?.overview.tickets_sold || 0],
            ['Total Revenue', `$${analytics?.overview.total_revenue || 0}`],
            ['Attendance Rate', `${analytics?.overview.attendance_rate || 0}%`],
            ['Total Scans', analytics?.overview.total_scans || 0],
            ['Unique Entries', analytics?.overview.unique_entries || 0],
        ];

        const csvContent = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `event-analytics-${eventDetails?.name || eventDetails?.title || 'event'}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    if (!eventId) {
        return (
            <div className="p-6">
                <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Event Selected</h3>
                    <p className="text-gray-600 mb-4">Please select an event to view analytics</p>
                    <Link
                        to="/admin/events"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Events
                    </Link>
                </div>
            </div>
        );
    }

    if (eventLoading || analyticsLoading) {
        return <LoadingSpinner />;
    }

    if (!event) {
        return (
            <div className="p-6">
                <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Event Not Found</h3>
                    <p className="text-gray-600 mb-4">The requested event could not be found</p>
                    <Link
                        to="/admin/events"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Events
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
                <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                    <Link
                        to="/admin/events"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>

                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Event Analytics</h1>
                        <p className="text-gray-600">{eventDetails.name || eventDetails.title}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => refetch()}
                        className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>

                    <button
                        onClick={handleExportAnalytics}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                </div>
            </div>

            {/* Event Overview Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Event Image */}
                    <div className="lg:w-1/4">
                        {eventDetails.image || eventDetails.poster_image ? (
                            <img
                                src={`${import.meta.env.VITE_STORAGE_URL}/${eventDetails.image || eventDetails.poster_image}`}
                                alt={eventDetails.name || eventDetails.title}
                                className="w-full h-48 object-cover rounded-lg"
                            />
                        ) : (
                            <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                                <Calendar className="w-16 h-16 text-gray-400" />
                            </div>
                        )}
                    </div>

                    {/* Event Details */}
                    <div className="lg:w-3/4">
                        <div className="flex items-start justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">{eventDetails.name || eventDetails.title}</h2>
                            {getStatusBadge(eventDetails.status)}
                        </div>

                        <p className="text-gray-600 mb-4">{eventDetails.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center space-x-3">
                                <Calendar className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Date</p>
                                    <p className="font-medium">{formatEventDate(eventDetails.start_date, eventDetails.end_date)}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <MapPin className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Location</p>
                                    <p className="font-medium">{eventDetails.location || eventDetails.venue}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <Users className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Capacity</p>
                                    <p className="font-medium">{eventDetails.max_attendees || eventDetails.total_capacity || 'Unlimited'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Ticket className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-600">Tickets Sold</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {analytics?.overview.tickets_sold || 0}
                            </p>
                            <p className="text-sm text-gray-500">
                                of {analytics?.overview.total_capacity || 'unlimited'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">
                                ${analytics?.overview.total_revenue || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Activity className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-600">Total Scans</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {analytics?.overview.total_scans || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Target className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-600">Attendance Rate</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {analytics?.overview.attendance_rate || 0}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ticket Tiers Performance */}
            {analytics?.ticket_tiers && analytics.ticket_tiers.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4">Ticket Tier Performance</h3>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tier Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sold / Capacity
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Revenue
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Attendance
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Performance
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {analytics.ticket_tiers.map((tier, index) => {
                                    const soldPercentage = tier.capacity
                                        ? (tier.sold_count / tier.capacity) * 100
                                        : 0;

                                    return (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {tier.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {tier.price === 0 ? 'Free' : `$${tier.price}`}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {tier.sold_count} / {tier.capacity || 'Unlimited'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-green-600">
                                                    ${tier.revenue}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {tier.attendance}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full"
                                                            style={{ width: `${Math.min(soldPercentage, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm text-gray-600">
                                                        {soldPercentage.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Daily Sales Chart */}
                {analytics?.daily_sales && analytics.daily_sales.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-4">Daily Sales</h3>
                        <div className="h-64 flex items-end justify-between space-x-2">
                            {analytics.daily_sales.map((day, index) => {
                                const maxCount = Math.max(...analytics.daily_sales.map(d => d.count));
                                const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;

                                return (
                                    <div key={index} className="flex flex-col items-center flex-1">
                                        <div
                                            className="bg-blue-500 rounded-t w-full min-h-[4px] flex items-end justify-center text-xs text-white font-medium"
                                            style={{ height: `${height}%` }}
                                        >
                                            {day.count > 0 && <span className="mb-1">{day.count}</span>}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left">
                                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Hourly Entries Chart */}
                {analytics?.hourly_entries && analytics.hourly_entries.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-4">Hourly Entry Pattern</h3>
                        <div className="h-64 flex items-end justify-between space-x-1">
                            {analytics.hourly_entries.map((hour, index) => {
                                const maxCount = Math.max(...analytics.hourly_entries.map(h => h.count));
                                const height = maxCount > 0 ? (hour.count / maxCount) * 100 : 0;

                                return (
                                    <div key={index} className="flex flex-col items-center flex-1">
                                        <div
                                            className="bg-purple-500 rounded-t w-full min-h-[4px] flex items-end justify-center text-xs text-white font-medium"
                                            style={{ height: `${height}%` }}
                                        >
                                            {hour.count > 0 && <span className="mb-1">{hour.count}</span>}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2">
                                            {hour.hour}:00
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Additional Insights */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Key Insights</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Eye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Unique Entries</p>
                        <p className="text-xl font-bold text-blue-600">
                            {analytics?.overview.unique_entries || 0}
                        </p>
                    </div>

                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Sales Rate</p>
                        <p className="text-xl font-bold text-green-600">
                            {analytics?.overview.total_capacity
                                ? ((analytics.overview.tickets_sold / analytics.overview.total_capacity) * 100).toFixed(1)
                                : 0}%
                        </p>
                    </div>

                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <Activity className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Avg. Revenue per Ticket</p>
                        <p className="text-xl font-bold text-purple-600">
                            ${analytics?.overview?.tickets_sold && analytics.overview.tickets_sold > 0
                                ? (analytics.overview.total_revenue / analytics.overview.tickets_sold).toFixed(2)
                                : '0.00'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventAnalytics; 