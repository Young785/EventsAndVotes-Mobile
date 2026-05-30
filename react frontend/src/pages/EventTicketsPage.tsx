import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft,
    Ticket,
    Download,
    Calendar,
    MapPin,
    Clock,
    Users,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Filter,
    Search,
    QrCode
} from 'lucide-react';
import { eventsApi, ticketsApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import TicketPurchaseModal from '../components/TicketPurchaseModal';

const EventTicketsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch event details
    const { data: eventResponse, isLoading: eventLoading } = useQuery({
        queryKey: ['event', id],
        queryFn: () => eventsApi.getEvent(id!),
        enabled: !!id
    });

    // Fetch user's tickets for this event
    const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
        queryKey: ['user-tickets', id, statusFilter],
        queryFn: () => ticketsApi.getUserTickets({
            event_id: id,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            per_page: 50
        }),
        enabled: !!id
    });

    const event = eventResponse?.data;
    const tickets = ticketsData?.data?.data || [];

    const filteredTickets = tickets.filter((ticket: any) => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                ticket.ticketTier?.name?.toLowerCase().includes(query) ||
                ticket.uuid?.toLowerCase().includes(query)
            );
        }
        return true;
    });

    const handleDownloadTicket = async (ticketId: string) => {
        try {
            const response = await ticketsApi.downloadTicket(ticketId);

            const blob = new Blob([response], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `ticket-${ticketId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download ticket. Please try again.');
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'sold':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'used':
                return <CheckCircle className="w-4 h-4 text-blue-500" />;
            case 'expired':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'cancelled':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'refunded':
                return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            default:
                return <AlertTriangle className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'sold':
                return 'bg-green-100 text-green-800';
            case 'used':
                return 'bg-blue-100 text-blue-800';
            case 'expired':
                return 'bg-red-100 text-red-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            case 'refunded':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (timeString: string) => {
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    if (eventLoading || ticketsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
                    <p className="text-gray-600 mb-6">The event you're looking for doesn't exist.</p>
                    <Link
                        to="/events"
                        className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        Back to Events
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-secondary-800 py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        to={`/events/${id}`}
                        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Event
                    </Link>

                    <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-sm p-6">
                        <div className="flex items-start space-x-4">
                            {event.poster_image && (
                                <img
                                    src={event.poster_image}
                                    alt={event.title}
                                    className="w-20 h-20 object-cover rounded-lg"
                                />
                            )}
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h1>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center space-x-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>{formatDate(event.start_date)}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{formatTime(event.start_time)}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <MapPin className="w-4 h-4" />
                                        <span>{event.venue}</span>
                                    </div>
                                </div>
                            </div>

                            {event.status === 'active' && (
                                <button
                                    onClick={() => setShowPurchaseModal(true)}
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                                >
                                    Buy Tickets
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* My Tickets Section */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">My Tickets for This Event</h2>

                    {/* Filters */}
                    <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-sm p-4 mb-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                                    >
                                        <option value="all">All Tickets</option>
                                        <option value="sold">Valid</option>
                                        <option value="used">Used</option>
                                        <option value="expired">Expired</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="refunded">Refunded</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search tickets..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tickets List */}
                    {filteredTickets.length === 0 ? (
                        <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-sm p-12 text-center">
                            <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tickets Found</h3>
                            <p className="text-gray-600 mb-6">
                                {searchQuery || statusFilter !== 'all'
                                    ? 'No tickets match your current filters.'
                                    : "You don't have any tickets for this event yet."
                                }
                            </p>
                            {!searchQuery && statusFilter === 'all' && event.status === 'active' && (
                                <button
                                    onClick={() => setShowPurchaseModal(true)}
                                    className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                                >
                                    Purchase Tickets
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTickets.map((ticket: any) => (
                                <div key={ticket.id} className="card-glass p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {ticket.ticketTier?.name}
                                        </h3>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                            {getStatusIcon(ticket.status)}
                                            <span className="ml-1 capitalize">{ticket.status}</span>
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                                        <div>
                                            <span className="font-medium">Ticket ID:</span> {ticket.uuid?.slice(0, 8)}...
                                        </div>
                                        <div>
                                            <span className="font-medium">Price:</span> ${ticket.price_paid}
                                        </div>
                                        {ticket.scan_count > 0 && (
                                            <div>
                                                <span className="font-medium">Scanned:</span> {ticket.scan_count} times
                                            </div>
                                        )}
                                        {ticket.purchased_at && (
                                            <div>
                                                <span className="font-medium">Purchased:</span> {new Date(ticket.purchased_at).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleDownloadTicket(ticket.id)}
                                            disabled={ticket.download_disabled}
                                            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Download className="w-4 h-4" />
                                            <span>Download</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                alert(`QR Code: ${ticket.qr_code_data}`);
                                            }}
                                            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:bg-secondary-800 transition-colors"
                                        >
                                            <QrCode className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Available Ticket Tiers */}
                {event.status === 'active' && event.ticketTiers && event.ticketTiers.length > 0 && (
                    <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Tickets</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {event.ticketTiers.filter((tier: any) => tier.is_active).map((tier: any) => (
                                <div key={tier.id} className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-900 mb-2">{tier.name}</h4>
                                    {tier.description && (
                                        <p className="text-sm text-gray-600 mb-3">{tier.description}</p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-bold text-primary">
                                            {tier.price > 0 ? `$${tier.price}` : 'FREE'}
                                        </span>
                                        {tier.available_count !== null && (
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {tier.available_count} left
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => setShowPurchaseModal(true)}
                                className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                            >
                                Purchase Tickets
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Ticket Purchase Modal */}
            <TicketPurchaseModal
                isOpen={showPurchaseModal}
                onClose={() => setShowPurchaseModal(false)}
                event={event}
                onPurchaseSuccess={() => {
                    // Refresh tickets data
                    window.location.reload();
                }}
            />
        </div>
    );
};

export default EventTicketsPage; 