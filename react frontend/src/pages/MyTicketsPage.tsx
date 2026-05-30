import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Ticket,
    Download,
    Calendar,
    MapPin,
    Clock,
    QrCode,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Filter,
    Search,
    Eye
} from 'lucide-react';
import { ticketsApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const MyTicketsPage: React.FC = () => {
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: ticketsData, isLoading, error } = useQuery({
        queryKey: ['user-tickets', { status: statusFilter !== 'all' ? statusFilter : undefined }],
        queryFn: () => ticketsApi.getUserTickets({
            status: statusFilter !== 'all' ? statusFilter : undefined,
            per_page: 50
        })
    });

    const tickets = ticketsData?.data?.data || [];

    const filteredTickets = tickets.filter((ticket: any) => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                ticket.event?.title?.toLowerCase().includes(query) ||
                ticket.ticketTier?.name?.toLowerCase().includes(query) ||
                ticket.uuid?.toLowerCase().includes(query)
            );
        }
        return true;
    });

    const handleDownloadTicket = async (ticketId: string) => {
        try {
            const response = await ticketsApi.downloadTicket(ticketId);

            // Create blob and download
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
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'used':
                return <CheckCircle className="w-5 h-5 text-blue-500" />;
            case 'expired':
                return <XCircle className="w-5 h-5 text-red-500" />;
            case 'cancelled':
                return <XCircle className="w-5 h-5 text-red-500" />;
            case 'refunded':
                return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            default:
                return <AlertTriangle className="w-5 h-5 text-gray-500" />;
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
            weekday: 'short',
            month: 'short',
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

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Tickets</h2>
                    <p className="text-gray-600">Please try again later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tickets</h1>
                    <p className="text-gray-600">View and manage your event tickets</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Filter className="w-4 h-4 text-gray-500" />
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
                            <Search className="w-4 h-4 text-gray-500" />
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

                {/* Tickets Grid */}
                {filteredTickets.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tickets Found</h3>
                        <p className="text-gray-600 mb-6">
                            {searchQuery || statusFilter !== 'all'
                                ? 'No tickets match your current filters.'
                                : "You haven't purchased any tickets yet."
                            }
                        </p>
                        {!searchQuery && statusFilter === 'all' && (
                            <a
                                href="/events"
                                className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                            >
                                Browse Events
                            </a>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTickets.map((ticket: any) => (
                            <div key={ticket.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                {/* Event Image */}
                                <div className="h-48 bg-gray-200 relative">
                                    {ticket.event?.poster_image ? (
                                        <img
                                            src={ticket.event.poster_image}
                                            alt={ticket.event.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Calendar className="w-12 h-12 text-gray-400" />
                                        </div>
                                    )}

                                    {/* Status Badge */}
                                    <div className="absolute top-3 right-3">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                            {getStatusIcon(ticket.status)}
                                            <span className="ml-1 capitalize">{ticket.status}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Ticket Content */}
                                <div className="p-6">
                                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                        {ticket.event?.title}
                                    </h3>

                                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                                        <div className="flex items-center space-x-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>{formatDate(ticket.event?.start_date)}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Clock className="w-4 h-4" />
                                            <span>{formatTime(ticket.event?.start_time)}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <MapPin className="w-4 h-4" />
                                            <span className="truncate">{ticket.event?.venue}</span>
                                        </div>
                                    </div>

                                    {/* Ticket Details */}
                                    <div className="border-t border-gray-200 pt-4 mb-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {ticket.ticketTier?.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Ticket ID: {ticket.uuid?.slice(0, 8)}...
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    ${ticket.price_paid}
                                                </p>
                                                {ticket.scan_count > 0 && (
                                                    <p className="text-xs text-gray-500">
                                                        Scanned {ticket.scan_count}x
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
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
                                                // Show QR code modal or navigate to ticket details
                                                alert(`QR Code: ${ticket.qr_code_data}`);
                                            }}
                                            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <QrCode className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Stats Summary */}
                {tickets.length > 0 && (
                    <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-primary">
                                    {tickets.filter((t: any) => t.status === 'sold').length}
                                </p>
                                <p className="text-sm text-gray-600">Valid Tickets</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">
                                    {tickets.filter((t: any) => t.status === 'used').length}
                                </p>
                                <p className="text-sm text-gray-600">Used Tickets</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">
                                    ${tickets.reduce((sum: number, t: any) => sum + parseFloat(t.price_paid || 0), 0).toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-600">Total Spent</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900">
                                    {tickets.length}
                                </p>
                                <p className="text-sm text-gray-600">Total Tickets</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyTicketsPage; 