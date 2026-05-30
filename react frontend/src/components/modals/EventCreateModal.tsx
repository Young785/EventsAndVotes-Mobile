import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    X,
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

interface EventCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const EventCreateModal: React.FC<EventCreateModalProps> = ({ isOpen, onClose, onSuccess }) => {
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
            resetForm();
            onClose();
            onSuccess?.();
        },
        onError: (error: any) => {
            console.error('Create event error:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error(error.response?.data?.message || 'Failed to create event');
        }
    });

    const resetForm = () => {
        setFormData({
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
        setTicketTiers([{
            name: 'General Admission',
            description: '',
            price: 0,
            capacity: undefined,
            max_per_user: undefined,
            sale_start_date: '',
            sale_end_date: '',
            is_active: true
        }]);
        setPosterImage(null);
        setErrors({});
    };

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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-secondary-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-secondary-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Event</h2>
                        <p className="text-gray-600 dark:text-gray-400">Set up your event details and ticket tiers</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Event Title *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${getFieldError('title') ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter event title..."
                                />
                                {getFieldError('title') && (
                                    <p className="mt-1 text-sm text-red-600">{getFieldError('title')}</p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${getFieldError('description') ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Describe your event..."
                                />
                                {getFieldError('description') && (
                                    <p className="mt-1 text-sm text-red-600">{getFieldError('description')}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Venue *
                                </label>
                                <input
                                    type="text"
                                    name="venue"
                                    value={formData.venue}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${getFieldError('venue') ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Event venue..."
                                />
                                {getFieldError('venue') && (
                                    <p className="mt-1 text-sm text-red-600">{getFieldError('venue')}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Total Capacity
                                </label>
                                <input
                                    type="number"
                                    name="total_capacity"
                                    value={formData.total_capacity}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Unlimited"
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

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Event Poster
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">JPG, PNG, GIF up to 2MB</p>
                            </div>
                        </div>
                    </div>

                    {/* Event Settings */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Settings</h3>

                        <div className="space-y-3">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="is_public"
                                    name="is_public"
                                    checked={formData.is_public}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
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
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                />
                                <label htmlFor="re_entry_allowed" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                    Allow re-entry
                                </label>
                            </div>

                            {formData.re_entry_allowed && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Re-entry cooldown (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        name="re_entry_cooldown"
                                        value={formData.re_entry_cooldown}
                                        onChange={handleInputChange}
                                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        min="0"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ticket Tiers */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ticket Tiers</h3>
                            <button
                                type="button"
                                onClick={addTicketTier}
                                className="flex items-center px-3 py-1 text-sm text-primary hover:bg-primary hover:text-white border border-primary rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Tier
                            </button>
                        </div>

                        <div className="space-y-4">
                            {ticketTiers.map((tier, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-md font-medium text-gray-900 dark:text-white">
                                            Tier {index + 1}
                                        </h4>
                                        {ticketTiers.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeTicketTier(index)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                                        <div className="md:col-span-2">
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
                    <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-secondary-700">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Event will be saved as draft
                        </div>

                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:bg-secondary-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createEventMutation.isPending}
                                className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventCreateModal; 