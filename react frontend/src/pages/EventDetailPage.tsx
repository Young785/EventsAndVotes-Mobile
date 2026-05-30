import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Calendar,
    MapPin,
    Users,
    Clock,
    Share2,
    Heart,
    ArrowLeft,
    User,
    Ticket,
    DollarSign,
    Star,
    AlertCircle,
    CheckCircle,
    XCircle,
    Info,
    Plus,
    Minus,
    ShoppingCart,
    CreditCard
} from 'lucide-react';
import { eventsApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import TicketPurchaseModal from '../components/TicketPurchaseModal';
import { Event, TicketTier } from '../types';
import { format } from 'date-fns';

interface TicketSelection {
    tierId: number;
    quantity: number;
    tier: TicketTier;
}

const EventDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [selectedTickets, setSelectedTickets] = useState<TicketSelection[]>([]);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        email: '',
        phone: ''
    });

    // Fetch event details
    const { data: eventResponse, isLoading, error } = useQuery({
        queryKey: ['event', id],
        queryFn: () => eventsApi.getEvent(id!),
        enabled: !!id
    });

    const event = eventResponse?.data;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
                    <p className="text-gray-600 mb-6">Sorry, we couldn't find the event you're looking for.</p>
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

    const getImageUrl = (posterImage: string | undefined) => {
        if (!posterImage) {
            return 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
        }

        if (posterImage.startsWith('http')) return posterImage;

        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        return `${baseUrl}/storage/${posterImage}`;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'draft':
                return <Clock className="w-5 h-5 text-gray-500" />;
            case 'active':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'completed':
                return <Calendar className="w-5 h-5 text-blue-500" />;
            case 'cancelled':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Info className="w-5 h-5 text-primary" />;
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

    const formatEventDateTime = (startDate: string, endDate: string, startTime?: string, endTime?: string) => {
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);

            // Check if dates are valid
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return {
                    date: 'Invalid date',
                    time: null
                };
            }

            if (startDate === endDate) {
                return {
                    date: format(start, 'EEEE, MMMM dd, yyyy'),
                    time: startTime && endTime ? `${startTime} - ${endTime}` : null
                };
            } else {
                return {
                    date: `${format(start, 'MMMM dd, yyyy')} - ${format(end, 'MMMM dd, yyyy')}`,
                    time: null
                };
            }
        } catch (error) {
            console.error('Date formatting error:', error, { startDate, endDate, startTime, endTime });
            return {
                date: 'Date error',
                time: null
            };
        }
    };

    const handleTicketQuantityChange = (tier: TicketTier, quantity: number) => {
        if (quantity <= 0) {
            setSelectedTickets(prev => prev.filter(t => t.tierId !== tier.id));
        } else {
            setSelectedTickets(prev => {
                const existing = prev.find(t => t.tierId === tier.id);
                if (existing) {
                    return prev.map(t =>
                        t.tierId === tier.id
                            ? { ...t, quantity: Math.min(quantity, tier.available_count || tier.capacity || Infinity) }
                            : t
                    );
                } else {
                    return [...prev, {
                        tierId: tier.id,
                        quantity: Math.min(quantity, tier.available_count || tier.capacity || Infinity),
                        tier
                    }];
                }
            });
        }
    };

    const getSelectedQuantity = (tierId: number) => {
        return selectedTickets.find(t => t.tierId === tierId)?.quantity || 0;
    };

    const getTotalCost = () => {
        return selectedTickets.reduce((total, selection) => {
            return total + (selection.tier.price * selection.quantity);
        }, 0);
    };

    const getTotalTickets = () => {
        return selectedTickets.reduce((total, selection) => total + selection.quantity, 0);
    };

    const canPurchaseTickets = () => {
        return event.status === 'active' && selectedTickets.length > 0 && getTotalTickets() > 0;
    };

    const isTicketTierAvailable = (tier: TicketTier) => {
        const now = new Date();
        
        // Check if tier is active
        if (!tier.is_active) {
            console.log(`Tier "${tier.name}" is not active`);
            return false;
        }
        
        // Check sale dates
        if (tier.sale_start_date) {
            const saleStart = new Date(tier.sale_start_date);
            if (now < saleStart) {
                console.log(`Tier "${tier.name}" sale hasn't started yet. Start: ${tier.sale_start_date}, Now: ${now.toISOString()}`);
                return false;
            }
        }
        
        if (tier.sale_end_date) {
            const saleEnd = new Date(tier.sale_end_date);
            // Set to end of day for sale end date
            saleEnd.setHours(23, 59, 59, 999);
            if (now > saleEnd) {
                console.log(`Tier "${tier.name}" sale has ended. End: ${tier.sale_end_date}, Now: ${now.toISOString()}`);
                return false;
            }
        }
        
        // Check capacity
        if (tier.available_count !== null && tier.available_count !== undefined && tier.available_count <= 0) {
            console.log(`Tier "${tier.name}" is sold out. Available: ${tier.available_count}`);
            return false;
        }

        console.log(`Tier "${tier.name}" is available`);
        return true;
    };

    const handlePurchaseSuccess = (data: any) => {
        // Reset selections and refresh event data
        setSelectedTickets([]);
        queryClient.invalidateQueries({ queryKey: ['event', id] });

        if (data.payment_status === 'completed') {
            // Free tickets or payment completed
            alert('Tickets purchased successfully! Check your email for confirmation.');
        } else if (data.authorization_url) {
            // Redirect to payment gateway
            window.location.href = data.authorization_url;
        }
    };

    const dateTime = formatEventDateTime(event.start_date, event.end_date, event.start_time, event.end_time);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="relative h-96 bg-gray-900">
                <img
                    src={getImageUrl(event.poster_image)}
                    alt={event.title}
                    className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60" />

                <div className="absolute inset-0 flex items-end">
                    <div className="container mx-auto px-4 pb-8">
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="inline-flex items-center px-4 py-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
                            >
                                <ArrowLeft className="mr-2 w-4 h-4" />
                                Back
                            </button>

                            <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status)}`}>
                                    {getStatusIcon(event.status)}
                                    <span className="ml-1 capitalize">{event.status}</span>
                                </span>
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{event.title}</h1>

                        <div className="flex flex-wrap items-center gap-6 text-white">
                            <div className="flex items-center">
                                <Calendar className="w-5 h-5 mr-2" />
                                <span>{dateTime.date}</span>
                            </div>
                            {dateTime.time && (
                                <div className="flex items-center">
                                    <Clock className="w-5 h-5 mr-2" />
                                    <span>{dateTime.time}</span>
                                </div>
                            )}
                            <div className="flex items-center">
                                <MapPin className="w-5 h-5 mr-2" />
                                <span>{event.venue}</span>
                            </div>
                            {event.total_capacity && (
                                <div className="flex items-center">
                                    <Users className="w-5 h-5 mr-2" />
                                    <span>Capacity: {event.total_capacity}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-12">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-3 gap-12">
                        {/* Event Details */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">About This Event</h2>
                                <div className="prose max-w-none">
                                    <p className="text-gray-600 leading-relaxed">{event.description}</p>
                                </div>

                                {event.organizer && (
                                    <div className="mt-8 pt-8 border-t border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Organized by</h3>
                                        <div className="flex items-center">
                                            <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center">
                                                <User className="w-6 h-6" />
                                            </div>
                                            <div className="ml-4">
                                                <p className="font-medium text-gray-900">
                                                    {event.organizer.first_name} {event.organizer.last_name}
                                                </p>
                                                <p className="text-gray-500">{event.organizer.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Event Rules */}
                            <div className="bg-white rounded-lg shadow-lg p-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Information</h2>
                                <div className="space-y-4">
                                    <div className="flex items-start">
                                        <Info className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-gray-900">Public Event</p>
                                            <p className="text-gray-600">
                                                {event.is_public ? 'This is a public event - anyone can attend' : 'This is a private event'}
                                            </p>
                                        </div>
                                    </div>

                                    {event.re_entry_allowed && (
                                        <div className="flex items-start">
                                            <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-gray-900">Re-entry Allowed</p>
                                                <p className="text-gray-600">
                                                    You can leave and return to the event
                                                    {event.re_entry_cooldown && ` (${event.re_entry_cooldown} minute cooldown)`}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Ticket Purchase Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Get Your Tickets</h3>

                                {(() => {
                                    // Debug information
                                    console.log('Event ticket tiers:', event.ticketTiers);
                                    console.log('Event status:', event.status);
                                    return null;
                                })()}
                                {event.ticketTiers && event.ticketTiers.length > 0 ? (
                                    <div className="space-y-4">
                                        {event.ticketTiers
                                            .filter(tier => tier.is_active)
                                            .map((tier) => {
                                                const isAvailable = isTicketTierAvailable(tier);
                                                const selectedQty = getSelectedQuantity(tier.id);

                                                return (
                                                    <div key={tier.id} className={`border rounded-lg p-4 ${isAvailable ? 'border-gray-200' : 'border-gray-100 bg-gray-50'}`}>
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900">{tier.name}</h4>
                                                                {tier.description && (
                                                                    <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
                                                                )}
                                                            </div>
                                                            <div className="text-right">
                                                                {tier.price > 0 ? (
                                                                    <span className="text-lg font-bold text-green-600">
                                                                        ${tier.price}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-lg font-bold text-green-600">Free</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {tier.available_count !== null && tier.available_count !== undefined && (
                                                            <p className="text-sm text-gray-500 mb-3">
                                                                {tier.available_count} of {tier.capacity} remaining
                                                            </p>
                                                        )}

                                                        {isAvailable ? (
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-2">
                                                                    <button
                                                                        onClick={() => handleTicketQuantityChange(tier, selectedQty - 1)}
                                                                        disabled={selectedQty <= 0}
                                                                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        <Minus className="w-4 h-4" />
                                                                    </button>
                                                                    <span className="w-8 text-center font-medium">{selectedQty}</span>
                                                                    <button
                                                                        onClick={() => handleTicketQuantityChange(tier, selectedQty + 1)}
                                                                        disabled={selectedQty >= (tier.available_count || tier.capacity || Infinity)}
                                                                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        <Plus className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                                {selectedQty > 0 && (
                                                                    <span className="text-sm font-medium text-gray-900">
                                                                        ${(tier.price * selectedQty).toFixed(2)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center">
                                                                <span className="text-sm text-red-500 font-medium">
                                                                    {tier.available_count === 0 ? 'Sold Out' : 'Not Available'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                        {/* Order Summary */}
                                        {selectedTickets.length > 0 && (
                                            <div className="border-t border-gray-200 pt-4 mt-6">
                                                <div className="space-y-2 mb-4">
                                                    <div className="flex justify-between text-sm">
                                                        <span>Tickets ({getTotalTickets()})</span>
                                                        <span>${getTotalCost().toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between font-bold text-lg">
                                                        <span>Total</span>
                                                        <span>${getTotalCost().toFixed(2)}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setShowPurchaseModal(true)}
                                                    disabled={!canPurchaseTickets()}
                                                    className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                                >
                                                    <ShoppingCart className="mr-2 w-4 h-4" />
                                                    Purchase Tickets
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-600">No tickets available for this event</p>
                                    </div>
                                )}

                                {event.status !== 'active' && (
                                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-center">
                                            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                                            <p className="text-sm text-yellow-800">
                                                {event.status === 'draft' && 'This event is not yet published'}
                                                {event.status === 'completed' && 'This event has ended'}
                                                {event.status === 'cancelled' && 'This event has been cancelled'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Ticket Purchase Modal */}
            <TicketPurchaseModal
                isOpen={showPurchaseModal}
                onClose={() => setShowPurchaseModal(false)}
                event={event}
                selectedTickets={selectedTickets}
                onPurchaseSuccess={handlePurchaseSuccess}
            />
        </div>
    );
};

export default EventDetailPage; 