import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import LoadingSpinner from '../../components/LoadingSpinner';
import SettingsService from '../../services/settingsService';
import { toast } from 'react-hot-toast';

interface TicketTierForm {
    id?: number;
    name: string;
    description: string;
    price: number;
    capacity: number | undefined;
    max_per_user: number | undefined;
    sale_start_date: string;
    sale_end_date: string;
    is_active: boolean;
}

const EventEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
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
        re_entry_cooldown: 15,
        status: 'draft'
    });

    const [ticketTiers, setTicketTiers] = useState<TicketTierForm[]>([]);
    const [posterImage, setPosterImage] = useState<File | null>(null);
    const [currentPosterUrl, setCurrentPosterUrl] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    // Fetch event details
    const { data: eventResponse, isLoading } = useQuery({
        queryKey: ['event', id],
        queryFn: () => eventsApi.getEvent(id!),
        enabled: !!id
    });

    const event = eventResponse?.data;

    // Populate form with event data
    useEffect(() => {
        if (event) {
            setFormData({
                title: event.title,
                description: event.description,
                venue: event.venue,
                start_date: event.start_date,
                end_date: event.end_date,
                start_time: event.start_time || '',
                end_time: event.end_time || '',
                total_capacity: event.total_capacity?.toString() || '',
                is_public: event.is_public,
                re_entry_allowed: event.re_entry_allowed,
                re_entry_cooldown: event.re_entry_cooldown || 15,
                status: event.status || 'draft'
            });

            if (event.poster_image) {
                const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
                setCurrentPosterUrl(`${baseUrl}/storage/${event.poster_image}`);
            }

            if (event.ticketTiers) {
                setTicketTiers(event.ticketTiers.map(tier => ({
                    id: tier.id,
                    name: tier.name,
                    description: tier.description || '',
                    price: tier.price,
                    capacity: tier.capacity || undefined,
                    max_per_user: tier.max_per_user || undefined,
                    sale_start_date: tier.sale_start_date || '',
                    sale_end_date: tier.sale_end_date || '',
                    is_active: tier.is_active
                })));
            }
        }
    }, [event]);

    // Update event mutation
    const updateEventMutation = useMutation({
        mutationFn: (data: FormData) => eventsApi.updateEvent(id!, data),
        onSuccess: () => {
            toast.success('Event updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['admin-events'] });
            queryClient.invalidateQueries({ queryKey: ['event', id] });
            navigate('/admin/events');
        },
        onError: (error: any) => {
            console.error('Update event error:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error(error.response?.data?.message || 'Failed to update event');
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
            // Create preview URL
            const previewUrl = URL.createObjectURL(e.target.files[0]);
            setCurrentPosterUrl(previewUrl);
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

        // Add poster image if changed
        if (posterImage) {
            formDataToSend.append('poster_image', posterImage);
        }

        // Add ticket tiers as JSON string (to match backend expectation)
        formDataToSend.append('ticket_tiers', JSON.stringify(ticketTiers));

        updateEventMutation.mutate(formDataToSend);
    };

    const getFieldError = (field: string) => {
        return errors[field]?.[0];
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!event) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
                    <p className="text-gray-600 mb-6">Sorry, we couldn't find the event you're looking for.</p>
                    <Link
                        to="/admin/events"
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link
                        to="/admin/events"
                        className="flex items-center text-gray-600 hover:text-gray-900 dark:text-white"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Events
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Event</h1>
                        <p className="text-gray-600 dark:text-gray-400">Update your event details and ticket tiers</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <div className="card-glass p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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

                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Description *
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${getFieldError('description') ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Describe your event..."
                            />
                            {getFieldError('description') && (
                                <p className="mt-1 text-sm text-red-600">{getFieldError('description')}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Total Capacity
                            </label>
                            <input
                                type="number"
                                name="total_capacity"
                                value={formData.total_capacity}
                                onChange={handleInputChange}
                                className="form-input focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Leave empty for unlimited"
                                min="1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Event Poster
                            </label>
                            {currentPosterUrl && (
                                <div className="mb-4">
                                    <img
                                        src={currentPosterUrl}
                                        alt="Current poster"
                                        className="w-32 h-32 object-cover rounded-lg"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">Current poster</p>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="form-input focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">JPG, PNG, GIF up to 2MB. Leave empty to keep current image.</p>
                        </div>
                    </div>
                </div>

                {/* Event Settings */}
                <div className="card-glass p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Event Settings</h2>

                    <div className="space-y-4">
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Event Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Ticket Tiers */}
                <div className="card-glass p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ticket Tiers</h2>
                        <button
                            type="button"
                            onClick={addTicketTier}
                            className="flex items-center px-4 py-2 text-primary hover:bg-primary hover:text-white border border-primary rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Tier
                        </button>
                    </div>

                    <div className="space-y-6">
                        {ticketTiers.map((tier, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-md font-medium text-gray-900 dark:text-white">
                                        Tier {index + 1}
                                        {tier.id && <span className="text-sm text-gray-500 ml-2">(ID: {tier.id})</span>}
                                    </h3>
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

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Tier Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={tier.name}
                                            onChange={(e) => updateTicketTier(index, 'name', e.target.value)}
                                            className="form-input focus:ring-2 focus:ring-primary focus:border-transparent"
                                            placeholder="e.g., VIP, General, Early Bird"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Price ({currencySymbol}) *
                                        </label>
                                        <input
                                            type="number"
                                            value={tier.price}
                                            onChange={(e) => updateTicketTier(index, 'price', parseFloat(e.target.value) || 0)}
                                            className="form-input focus:ring-2 focus:ring-primary focus:border-transparent"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Capacity
                                        </label>
                                        <input
                                            type="number"
                                            value={tier.capacity || ''}
                                            onChange={(e) => updateTicketTier(index, 'capacity', e.target.value ? parseInt(e.target.value) : undefined)}
                                            className="form-input focus:ring-2 focus:ring-primary focus:border-transparent"
                                            placeholder="Unlimited"
                                            min="1"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Max per User
                                        </label>
                                        <input
                                            type="number"
                                            value={tier.max_per_user || ''}
                                            onChange={(e) => updateTicketTier(index, 'max_per_user', e.target.value ? parseInt(e.target.value) : undefined)}
                                            className="form-input focus:ring-2 focus:ring-primary focus:border-transparent"
                                            placeholder="Unlimited"
                                            min="1"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Sale Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={tier.sale_start_date}
                                            onChange={(e) => updateTicketTier(index, 'sale_start_date', e.target.value)}
                                            className="form-input focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Sale End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={tier.sale_end_date}
                                            onChange={(e) => updateTicketTier(index, 'sale_end_date', e.target.value)}
                                            className="form-input focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>

                                    <div className="md:col-span-2 lg:col-span-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            value={tier.description}
                                            onChange={(e) => updateTicketTier(index, 'description', e.target.value)}
                                            className="form-input focus:ring-2 focus:ring-primary focus:border-transparent"
                                            rows={2}
                                            placeholder="Describe what this tier includes..."
                                        />
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`tier_active_${index}`}
                                            checked={tier.is_active}
                                            onChange={(e) => updateTicketTier(index, 'is_active', e.target.checked)}
                                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                        />
                                        <label htmlFor={`tier_active_${index}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                            Active
                                        </label>
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
                        Changes will be saved to the existing event
                    </div>

                    <div className="flex space-x-4">
                        <Link
                            to="/admin/events"
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={updateEventMutation.isPending}
                            className="flex items-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {updateEventMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EventEdit; 