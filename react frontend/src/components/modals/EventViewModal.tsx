import React from 'react';
import { X, Calendar, MapPin, Users, Clock, Eye, Tag, Settings, DollarSign } from 'lucide-react';
import { Event } from '../../types';

interface EventViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event | null;
}

const EventViewModal: React.FC<EventViewModalProps> = ({
    isOpen,
    onClose,
    event
}) => {
    if (!isOpen || !event) return null;

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
            return 'Date error';
        }
    };

    const formatTime = (time: string) => {
        try {
            if (!time) return '';
            const timeObj = new Date(`2000-01-01T${time}`);
            return timeObj.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            return time;
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'active': { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
            'draft': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
            'completed': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completed' },
            'cancelled': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[100vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-secondary-700">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Eye className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Event Details</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">View event information</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="p-6">
                        {/* Event Header */}
                        <div className="flex flex-col lg:flex-row gap-6 mb-8">
                            {/* Event Image */}
                            <div className="lg:w-1/3">
                                {event.poster_image ? (
                                    <img
                                        src={`${import.meta.env.VITE_STORAGE_URL}/${event.poster_image}`}
                                        alt={event.title}
                                        className="w-full h-64 object-cover rounded-lg"
                                    />
                                ) : (
                                    <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                                        <Calendar className="w-16 h-16 text-gray-400" />
                                    </div>
                                )}
                            </div>

                            {/* Event Info */}
                            <div className="lg:w-2/3">
                                <div className="flex items-start justify-between mb-4">
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{event.title}</h1>
                                    {getStatusBadge(event.status)}
                                </div>

                                <p className="text-gray-600 mb-6">{event.description}</p>

                                {/* Event Details Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-3">
                                        <Calendar className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                                            <p className="font-medium">{formatEventDate(event.start_date, event.end_date)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <Clock className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Time</p>
                                            <p className="font-medium">
                                                {formatTime(event.start_time)} - {formatTime(event.end_time)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <MapPin className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Venue</p>
                                            <p className="font-medium">{event.venue}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <Users className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Capacity</p>
                                            <p className="font-medium">{event.total_capacity || 'Unlimited'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Settings Section */}
                        <div className="bg-gray-50 dark:bg-secondary-800 rounded-lg p-6 mb-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <Settings className="w-5 h-5 mr-2" />
                                Event Settings
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Visibility</p>
                                    <p className="font-medium">{event.is_public ? 'Public' : 'Private'}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Re-entry</p>
                                    <p className="font-medium">{event.re_entry_allowed ? 'Allowed' : 'Not Allowed'}</p>
                                </div>

                                {event.re_entry_allowed && (
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Cooldown</p>
                                        <p className="font-medium">{event.re_entry_cooldown || 0} minutes</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ticket Tiers */}
                        {event.ticket_tiers && event.ticket_tiers.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center">
                                    <Tag className="w-5 h-5 mr-2" />
                                    Ticket Tiers
                                </h3>

                                <div className="space-y-4">
                                    {event.ticket_tiers.map((tier) => (
                                        <div key={tier.id} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-semibold text-gray-900 dark:text-white">{tier.name}</h4>
                                                <div className="text-right">
                                                    <p className="text-xl font-bold text-green-600">
                                                        {tier.price === 0 ? 'Free' : `$${tier.price}`}
                                                    </p>
                                                </div>
                                            </div>

                                            {tier.description && (
                                                <p className="text-gray-600 text-sm mb-3">{tier.description}</p>
                                            )}

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400">Capacity</p>
                                                    <p className="font-medium">{tier.capacity || 'Unlimited'}</p>
                                                </div>

                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400">Available</p>
                                                    <p className="font-medium">{tier.available_count || tier.capacity || 'N/A'}</p>
                                                </div>

                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400">Max per User</p>
                                                    <p className="font-medium">{tier.max_per_user || 'Unlimited'}</p>
                                                </div>

                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400">Sold</p>
                                                    <p className="font-medium">{tier.sold_count || 0}</p>
                                                </div>
                                            </div>

                                            {(tier.sale_start_date || tier.sale_end_date) && (
                                                <div className="mt-3 pt-3 border-t border-gray-100">
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Sale Period: {tier.sale_start_date || 'No start date'} - {tier.sale_end_date || 'No end date'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 dark:bg-secondary-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-white dark:bg-secondary-900 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-secondary-800 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventViewModal; 