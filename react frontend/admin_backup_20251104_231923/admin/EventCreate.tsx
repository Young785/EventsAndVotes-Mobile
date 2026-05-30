import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    Calendar,
    MapPin,
    Users,
    Clock,
    DollarSign,
    AlertCircle
} from 'lucide-react';
import { eventsApi } from '../../services/api';
import SettingsService from '../../services/settingsService';
import { toast } from 'react-hot-toast';

interface TicketTierForm {
    name: string;
    description: string;
    price: number;
    capacity: number | undefined;
    max_per_user: number | undefined;
    sale_start_date: string;
    sale_end_date: string;
    is_active: boolean;
}

const EventCreate: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    // Get currency symbol from settings
    const currencySymbol = SettingsService.getCurrencySymbol();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        venue: '',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        total_capacity: '',
        is_public: true,
        re_entry_allowed: true,
        re_entry_cooldown: 15
    });

    const [ticketTiers, setTicketTiers] = useState<TicketTierForm[]>([
        {
            name: 'General Admission',
            description: '',
            price: 0,
            capacity: undefined,
            max_per_user: undefined,
            sale_start_date: '',
            sale_end_date: '',
            is_active: true
        }
    ]);

    const [posterImage, setPosterImage] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    // Create event mutation
    const createEventMutation = useMutation({
        mutationFn: eventsApi.createEvent,
        onSuccess: () => {
            toast.success('Event created successfully!');
            queryClient.invalidateQueries({ queryKey: ['admin-events'] });
            navigate('/admin/events');
        },
        onError: (error: any) => {
            console.error('Create event error:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error(error.response?.data?.message || 'Failed to create event');
        }
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPosterImage(e.target.files[0]);
        }
    };

    const addTicketTier = () => {
        setTicketTiers(prev => [...prev, {
            name: '',
            description: '',
            price: 0,
            capacity: undefined,
            max_per_user: undefined,
            sale_start_date: '',
            sale_end_date: '',
            is_active: true
        }]);
    };

    const removeTicketTier = (index: number) => {
        if (ticketTiers.length > 1) {
            setTicketTiers(prev => prev.filter((_, i) => i !== index));
        }
    };

    const updateTicketTier = (index: number, field: keyof TicketTierForm, value: any) => {
        setTicketTiers(prev => prev.map((tier, i) =>
            i === index ? { ...tier, [field]: value } : tier
        ));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const formDataToSend = new FormData();

        // Add event data
        Object.entries(formData).forEach(([key, value]) => {
            formDataToSend.append(key, value.toString());
        });

        // Add poster image
        if (posterImage) {
            formDataToSend.append('poster_image', posterImage);
        }

        // Add ticket tiers
        ticketTiers.forEach((tier, index) => {
            Object.entries(tier).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    formDataToSend.append(`ticket_tiers[${index}][${key}]`, value.toString());
                }
            });
        });

        createEventMutation.mutate(formDataToSend);
    };

    const getFieldError = (field: string) => {
        return errors[field]?.[0];
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link
                        to="/admin/events"
                        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Events
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Event</h1>
                        <p className="text-gray-600 dark:text-gray-400">Set up your event details and ticket tiers</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <div className="card-glass p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Basic Information</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="lg:col-span-2">
                            <label className="form-label">
                                Event Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className={`form-input ${getFieldError('title') ? 'border-red-500 dark:border-red-500' : ''
                                    }`}
                                placeholder="Enter event title..."
                            />
                            {getFieldError('title') && (
                                <p className="form-error">{getFieldError('title')}</p>
                            )}
                        </div>

                        <div className="lg:col-span-2">
                            <label className="form-label">
                                Description *
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                className={`form-textarea ${getFieldError('description') ? 'border-red-500 dark:border-red-500' : ''
                                    }`}
                                placeholder="Describe your event..."
                            />
                            {getFieldError('description') && (
                                <p className="form-error">{getFieldError('description')}</p>
                            )}
                        </div>

                        <div>
                            <label className="form-label">
                                Venue *
                            </label>
                            <input
                                type="text"
                                name="venue"
                                value={formData.venue}
                                onChange={handleInputChange}
                                className={`form-input ${getFieldError('venue') ? 'border-red-500 dark:border-red-500' : ''
                                    }`}
                                placeholder="Event venue..."
                            />
                            {getFieldError('venue') && (
                                <p className="form-error">{getFieldError('venue')}</p>
                            )}
                        </div>

                        <div>
                            <label className="form-label">
                                Total Capacity
                            </label>
                            <input
                                type="number"
                                name="total_capacity"
                                value={formData.total_capacity}
                                onChange={handleInputChange}
                                className="form-input"
                                placeholder="Leave empty for unlimited"
                                min="1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date *
                            </label>
                            <input
                                type="date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${getFieldError('start_date') ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {getFieldError('start_date') && (
                                <p className="mt-1 text-sm text-red-600">{getFieldError('start_date')}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date *
                            </label>
                            <input
                                type="date"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${getFieldError('end_date') ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {getFieldError('end_date') && (
                                <p className="mt-1 text-sm text-red-600">{getFieldError('end_date')}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Time *
                            </label>
                            <input
                                type="time"
                                name="start_time"
                                value={formData.start_time}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${getFieldError('start_time') ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {getFieldError('start_time') && (
                                <p className="mt-1 text-sm text-red-600">{getFieldError('start_time')}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Time *
                            </label>
                            <input
                                type="time"
                                name="end_time"
                                value={formData.end_time}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${getFieldError('end_time') ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {getFieldError('end_time') && (
                                <p className="mt-1 text-sm text-red-600">{getFieldError('end_time')}</p>
                            )}
                        </div>

                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Event Poster
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                            <p className="mt-1 text-sm text-gray-500">JPG, PNG, GIF up to 2MB</p>
                        </div>
                    </div>
                </div>

                {/* Event Settings */}
                <div className="card-glass p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Event Settings</h2>

                    <div className="space-y-4">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="is_public"
                                name="is_public"
                                checked={formData.is_public}
                                onChange={handleInputChange}
                                className="form-checkbox"
                            />
                            <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                Public Event (visible to everyone)
                            </label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="re_entry_allowed"
                                name="re_entry_allowed"
                                checked={formData.re_entry_allowed}
                                onChange={handleInputChange}
                                className="form-checkbox"
                            />
                            <label htmlFor="re_entry_allowed" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                Allow re-entry
                            </label>
                        </div>

                        {formData.re_entry_allowed && (
                            <div>
                                <label className="form-label">
                                    Re-entry cooldown (minutes)
                                </label>
                                <input
                                    type="number"
                                    name="re_entry_cooldown"
                                    value={formData.re_entry_cooldown}
                                    onChange={handleInputChange}
                                    className="w-32 form-input"
                                    min="0"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Ticket Tiers */}
                <div className="card-glass p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ticket Tiers</h2>
                        <button
                            type="button"
                            onClick={addTicketTier}
                            className="btn-primary"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Tier
                        </button>
                    </div>

                    <div className="space-y-6">
                        {ticketTiers.map((tier, index) => (
                            <div key={index} className="border border-gray-200 dark:border-secondary-700 rounded-xl p-4 bg-gray-50 dark:bg-secondary-800/50">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-md font-medium text-gray-900 dark:text-white">
                                        Tier {index + 1}
                                    </h3>
                                    {ticketTiers.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeTicketTier(index)}
                                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tier Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={tier.name}
                                            onChange={(e) => updateTicketTier(index, 'name', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                            placeholder="e.g., VIP, General, Early Bird"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Price ({currencySymbol}) *
                                        </label>
                                        <input
                                            type="number"
                                            value={tier.price}
                                            onChange={(e) => updateTicketTier(index, 'price', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Capacity
                                        </label>
                                        <input
                                            type="number"
                                            value={tier.capacity || ''}
                                            onChange={(e) => updateTicketTier(index, 'capacity', e.target.value ? parseInt(e.target.value) : undefined)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                            placeholder="Unlimited"
                                            min="1"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Max per User
                                        </label>
                                        <input
                                            type="number"
                                            value={tier.max_per_user || ''}
                                            onChange={(e) => updateTicketTier(index, 'max_per_user', e.target.value ? parseInt(e.target.value) : undefined)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                            placeholder="Unlimited"
                                            min="1"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Sale Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={tier.sale_start_date}
                                            onChange={(e) => updateTicketTier(index, 'sale_start_date', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Sale End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={tier.sale_end_date}
                                            onChange={(e) => updateTicketTier(index, 'sale_end_date', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>

                                    <div className="md:col-span-2 lg:col-span-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            value={tier.description}
                                            onChange={(e) => updateTicketTier(index, 'description', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                            rows={2}
                                            placeholder="Describe what this tier includes..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-between card-glass p-6">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Event will be saved as draft and can be published later
                    </div>

                    <div className="flex space-x-4">
                        <Link
                            to="/admin/events"
                            className="btn-outline"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={createEventMutation.isPending}
                            className="btn-primary disabled:opacity-50"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EventCreate; 