import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Search,
    Filter,
    Calendar,
    Users,
    ArrowRight,
    Clock,
    MapPin,
    Eye,
    CalendarDays,
    Star,
    Ticket,
    DollarSign,
    User
} from 'lucide-react';
import { eventsApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Event } from '../types';
import { format } from 'date-fns';

const EventsPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    // Fetch events using the new eventsApi
    const { data: eventsData, isLoading, error } = useQuery({
        queryKey: ['events', currentPage, selectedStatus, searchTerm],
        queryFn: () => eventsApi.getEvents({
            page: currentPage,
            status: selectedStatus !== 'all' ? selectedStatus : undefined,
            search: searchTerm || undefined,
            upcoming: selectedStatus === 'upcoming' || undefined
        })
    });

    const events = eventsData?.data?.data || [];
    const pagination = eventsData?.data;

    const statuses = [
        { value: 'all', label: 'All Events' },
        { value: 'upcoming', label: 'Upcoming' },
        { value: 'active', label: 'Active' },
        { value: 'completed', label: 'Completed' }
    ];

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'draft':
                return <Clock className="w-4 h-4 text-gray-500" />;
            case 'active':
                return <Eye className="w-4 h-4 text-green-500" />;
            case 'completed':
                return <Calendar className="w-4 h-4 text-blue-500" />;
            case 'cancelled':
                return <Calendar className="w-4 h-4 text-red-500" />;
            default:
                return <CalendarDays className="w-4 h-4 text-primary" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-800';
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'completed':
                return 'bg-blue-100 text-blue-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-primary-100 text-primary-800';
        }
    };

    const formatEventDate = (startDate: string, endDate: string, startTime?: string, endTime?: string) => {
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);

            // Check if dates are valid
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return 'Invalid date';
            }

            if (startDate === endDate) {
                const dateStr = format(start, 'MMM dd, yyyy');
                const timeStr = startTime && endTime ? ` ${startTime} - ${endTime}` : '';
                return dateStr + timeStr;
            } else {
                return `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`;
            }
        } catch (error) {
            console.error('Date formatting error:', error, { startDate, endDate, startTime, endTime });
            return 'Date error';
        }
    };

    const getImageUrl = (posterImage: string | undefined) => {
        if (!posterImage) {
            return 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
        }

        if (posterImage.startsWith('http')) {
            return posterImage;
        }

        // Assuming Laravel storage is set up to serve files from storage/app/public
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        return `${baseUrl}/storage/${posterImage}`;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="relative py-20 bg-gradient-to-r from-green-900 via-blue-900 to-purple-900 text-white">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')"
                    }}
                ></div>
                <div className="absolute inset-0 bg-black/50"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">Browse Events</h1>
                        <nav className="text-lg mb-8">
                            <Link to="/" className="text-gray-300 hover:text-white">Home</Link>
                            <span className="mx-2">•</span>
                            <span className="text-white">Events</span>
                        </nav>
                        <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
                        <p className="text-xl opacity-90 max-w-2xl mx-auto">
                            Discover and participate in exciting events. Get your tickets and create memorable experiences.
                        </p>
                    </div>
                </div>
            </section>

            {/* Search and Filter Section */}
            <section className="py-8 bg-white shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search events..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
                                >
                                    {statuses.map((status) => (
                                        <option key={status.value} value={status.value}>
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Events Grid */}
            <section className="py-12">
                <div className="container mx-auto px-4">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <LoadingSpinner />
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <div className="text-red-500 mb-4">Error loading events</div>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-300"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-12">
                            <CalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">No events found</h3>
                            <p className="text-gray-600 mb-6">
                                {searchTerm || selectedStatus !== 'all'
                                    ? 'Try adjusting your search or filters'
                                    : 'No events are currently available'}
                            </p>
                            {(searchTerm || selectedStatus !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedStatus('all');
                                    }}
                                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-300"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {events.map((event: Event) => (
                                    <div key={event.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                                        <div className="relative">
                                            <img
                                                src={getImageUrl(event.poster_image)}
                                                alt={event.title}
                                                className="w-full h-48 object-cover"
                                            />
                                            <div className="absolute top-4 right-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                                                    {getStatusIcon(event.status)}
                                                    <span className="ml-1 capitalize">{event.status}</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                                {event.title}
                                            </h3>

                                            <p className="text-gray-600 mb-4 line-clamp-2">
                                                {event.description}
                                            </p>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Calendar className="w-4 h-4 mr-2" />
                                                    <span>{formatEventDate(event.start_date, event.end_date, event.start_time, event.end_time)}</span>
                                                </div>

                                                <div className="flex items-center text-sm text-gray-500">
                                                    <MapPin className="w-4 h-4 mr-2" />
                                                    <span>{event.venue}</span>
                                                </div>

                                                {event.organizer && (
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <User className="w-4 h-4 mr-2" />
                                                        <span>{event.organizer.first_name} {event.organizer.last_name}</span>
                                                    </div>
                                                )}

                                                {event.total_capacity && (
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <Users className="w-4 h-4 mr-2" />
                                                        <span>Capacity: {event.total_capacity}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Ticket Tiers Preview */}
                                            {event.ticketTiers && event.ticketTiers.length > 0 && (
                                                <div className="mb-4">
                                                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                                        <span className="font-medium">Tickets from:</span>
                                                        <Ticket className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-lg font-bold text-green-600">
                                                            ${Math.min(...event.ticketTiers.filter(tier => tier.is_active).map(tier => tier.price))}
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            {event.ticketTiers.length} tier{event.ticketTiers.length > 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between">
                                                <Link
                                                    to={`/events/${event.id}`}
                                                    className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors duration-300"
                                                >
                                                    View Details
                                                    <ArrowRight className="ml-2 w-4 h-4" />
                                                </Link>

                                                {event.status === 'active' && (
                                                    <Link
                                                        to={`/events/${event.id}/tickets`}
                                                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-300"
                                                    >
                                                        <Ticket className="mr-2 w-4 h-4" />
                                                        Get Tickets
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination && pagination.last_page > 1 && (
                                <div className="mt-12 flex justify-center">
                                    <nav className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>

                                        {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`px-3 py-2 rounded-lg ${currentPage === page
                                                    ? 'bg-primary text-white'
                                                    : 'border border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage === pagination.last_page}
                                            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </nav>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
};

export default EventsPage; 