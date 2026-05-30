import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import {
    Ticket,
    Search,
    Filter,
    Download,
    Eye,
    Calendar,
    Users,
    DollarSign,
    TrendingUp,
    CheckCircle,
    XCircle,
    Clock,
    ArrowLeft,
    QrCode,
    Mail,
    Phone,
    User
} from 'lucide-react';
import { eventsApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const EventTickets: React.FC = () => {
    const { id: eventId } = useParams<{ id: string }>();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [tierFilter, setTierFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    // Fetch specific event with ticket data
    const { data: eventData, isLoading: eventLoading } = useQuery({
        queryKey: ['admin-event', eventId],
        queryFn: () => eventsApi.getEvent(eventId!),
        enabled: !!eventId
    });

    // Fetch tickets for this event
    const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
        queryKey: ['admin-event-tickets-list', eventId, currentPage, searchTerm, statusFilter, tierFilter],
        queryFn: () => eventsApi.getEventTickets(eventId!, {
            page: currentPage,
            search: searchTerm,
            status: statusFilter === 'all' ? undefined : statusFilter,
            tier_id: tierFilter === 'all' ? undefined : tierFilter
        }),
        enabled: !!eventId
    });

    const event = eventData?.data;
    const tickets = ticketsData?.data?.data || [];
    const pagination = ticketsData?.data;

    // Calculate event statistics
    const stats = React.useMemo(() => {
        if (!event) return { totalTicketsSold: 0, totalRevenue: 0, totalCapacity: 0, salesRate: 0 };

        const totalTicketsSold = event.ticketTiers?.reduce((sum: number, tier: any) => sum + (tier.sold_count || 0), 0) || 0;
        const totalRevenue = event.ticketTiers?.reduce((sum: number, tier: any) => sum + ((tier.sold_count || 0) * tier.price), 0) || 0;
        const totalCapacity = event.ticketTiers?.reduce((sum: number, tier: any) => sum + (tier.capacity || 0), 0) || 0;
        const salesRate = totalCapacity > 0 ? ((totalTicketsSold / totalCapacity) * 100) : 0;

        return {
            totalTicketsSold,
            totalRevenue,
            totalCapacity,
            salesRate
        };
    }, [event]);

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            valid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            used: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
            cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
            pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
            </span>
        );
    };

    if (eventLoading) {
        return <LoadingSpinner />;
    }

    if (!event && !eventLoading) {
        return (
            <div className="p-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
                <p className="text-gray-600">The event you're looking for doesn't exist or you don't have permission to view it.</p>
                <Link to="/admin/events" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Back to Events
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <Link to="/admin/events" className="text-blue-600 hover:text-blue-800">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <Link to="/admin/events" className="text-blue-600 hover:text-blue-800">
                            Events
                        </Link>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-900">{event?.title || 'Event Tickets'}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Ticket Management</h1>
                    <p className="text-gray-600">Monitor and manage tickets for {event?.title}</p>
                </div>
                <div className="flex items-center space-x-3">
                    <Link
                        to={`/admin/events/${eventId}/scanner`}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                        <QrCode className="w-4 h-4 mr-2" />
                        Scanner
                    </Link>
                    <Link
                        to={`/admin/events/${eventId}/analytics`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        View Analytics
                    </Link>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Ticket className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Tickets Sold</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.totalTicketsSold.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <DollarSign className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                            <p className="text-2xl font-semibold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Users className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Capacity</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.totalCapacity.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <TrendingUp className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Sales Rate</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.salesRate.toFixed(1)}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ticket Tiers Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Ticket Tiers</h2>
                
                {event?.ticketTiers && event.ticketTiers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {event.ticketTiers.map((tier: any) => (
                            <div key={tier.id} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{tier.name}</h3>
                                        {tier.description && (
                                            <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
                                        )}
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        tier.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {tier.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Price:</span>
                                        <span className="font-medium">${tier.price}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Capacity:</span>
                                        <span className="font-medium">{tier.capacity || 'Unlimited'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Sold:</span>
                                        <span className="font-medium">{tier.sold_count || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Available:</span>
                                        <span className="font-medium">
                                            {tier.capacity ? (tier.capacity - (tier.sold_count || 0)) : 'Unlimited'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Revenue:</span>
                                        <span className="font-medium text-green-600">
                                            ${((tier.sold_count || 0) * tier.price).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                
                                {tier.capacity && (
                                    <div className="mt-3">
                                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                                            <span>Sales Progress</span>
                                            <span>{((tier.sold_count || 0) / tier.capacity * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-blue-600 h-2 rounded-full" 
                                                style={{ width: `${Math.min(((tier.sold_count || 0) / tier.capacity * 100), 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No ticket tiers configured for this event</p>
                    </div>
                )}
            </div>

            {/* Filters and Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search tickets..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="valid">Valid</option>
                            <option value="used">Used</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="pending">Pending</option>
                        </select>

                        <select
                            value={tierFilter}
                            onChange={(e) => setTierFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="all">All Tiers</option>
                            {event?.ticketTiers?.map((tier: any) => (
                                <option key={tier.id} value={tier.id}>{tier.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3">
                        <button className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <Filter className="w-4 h-4 mr-2" />
                            More Filters
                        </button>
                        <button className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                            <Download className="w-4 h-4 mr-2" />
                            Export Tickets
                        </button>
                    </div>
                </div>
            </div>

            {/* Tickets List */}
            <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Ticket Purchases</h2>
                </div>

                {ticketsLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 mt-2">Loading tickets...</p>
                    </div>
                ) : tickets && tickets.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ticket
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tier
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Purchased
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tickets.map((ticket: any) => (
                                    <tr key={ticket.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Ticket className="w-5 h-5 text-gray-400 mr-3" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        #{ticket.uuid?.substring(0, 8) || ticket.id}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {ticket.qr_code ? (
                                                            <span className="text-green-600">QR Generated</span>
                                                        ) : (
                                                            <span className="text-gray-400">No QR</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <User className="w-4 h-4 text-gray-400 mr-2" />
                                                <div>
                                                    <div className="text-sm text-gray-900">{ticket.customer_name}</div>
                                                    <div className="text-sm text-gray-500 flex items-center">
                                                        <Mail className="w-3 h-3 mr-1" />
                                                        {ticket.customer_email}
                                                    </div>
                                                    {ticket.customer_phone && (
                                                        <div className="text-sm text-gray-500 flex items-center">
                                                            <Phone className="w-3 h-3 mr-1" />
                                                            {ticket.customer_phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{ticket.ticket_tier?.name || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">${ticket.price}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(ticket.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(ticket.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex space-x-2">
                                                <button className="text-blue-600 hover:text-blue-800">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button className="text-green-600 hover:text-green-800">
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button className="text-purple-600 hover:text-purple-800">
                                                    <QrCode className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Tickets Sold Yet</h3>
                        <p className="text-gray-600">
                            Tickets purchased for this event will appear here
                        </p>
                        <Link 
                            to={`/events/${eventId}`}
                            className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            View Public Event Page
                        </Link>
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.last_page > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total || 0} tickets
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">
                                    {currentPage}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(Math.min(pagination.last_page, currentPage + 1))}
                                    disabled={currentPage === pagination.last_page}
                                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventTickets; 