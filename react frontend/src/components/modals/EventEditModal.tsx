import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Edit, Calendar, MapPin, Users, Clock, Upload, Save, Loader2 } from 'lucide-react';
import { eventsApi } from '../../services/api';
import { Event } from '../../types';
import SettingsService from '../../services/settingsService';
import toast from 'react-hot-toast';

interface EventEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event | null;
    onSuccess?: (event: Event) => void;
}

interface EventFormData {
    title: string;
    description: string;
    venue: string;
    start_date: string;
    end_date: string;
    start_time: string;
    end_time: string;
    total_capacity: string;
    is_public: boolean;
    re_entry_allowed: boolean;
    re_entry_cooldown: string;
    status: string;
    poster_image?: File | null;
    ticket_tiers: Array<{
        id?: string;
        name: string;
        description: string;
        price: string;
        capacity: string;
        max_per_user: string;
        sale_start_date: string;
        sale_end_date: string;
        is_active: boolean;
        sold_count?: number;
    }>;
}

const EventEditModal: React.FC<EventEditModalProps> = ({
    isOpen,
    onClose,
    event,
    onSuccess
}) => {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    
    // Get currency symbol from settings
    const currencySymbol = SettingsService.getCurrencySymbol();

    const [formData, setFormData] = useState<EventFormData>({
        title: '',
        description: '',
        venue: '',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        total_capacity: '',
        is_public: true,
        re_entry_allowed: false,
        re_entry_cooldown: '0',
        status: 'draft',
        poster_image: null,
        ticket_tiers: []
    });

    // Initialize form with event data
    useEffect(() => {
        if (event && isOpen) {
            setFormData({
                title: event.title || '',
                description: event.description || '',
                venue: event.venue || '',
                start_date: event.start_date ? event.start_date.split('T')[0] : '',
                end_date: event.end_date ? event.end_date.split('T')[0] : '',
                start_time: event.start_time || '',
                end_time: event.end_time || '',
                total_capacity: event.total_capacity?.toString() || '',
                is_public: event.is_public ?? true,
                re_entry_allowed: event.re_entry_allowed ?? false,
                re_entry_cooldown: event.re_entry_cooldown?.toString() || '0',
                status: event.status || 'draft',
                poster_image: null,
                ticket_tiers: (event.ticket_tiers || event.ticketTiers)?.map((tier: any) => ({
                    id: tier.id?.toString(),
                    name: tier.name || '',
                    description: tier.description || '',
                    price: tier.price?.toString() || '0',
                    capacity: tier.capacity ? tier.capacity.toString() : '',
                    max_per_user: tier.max_per_user ? tier.max_per_user.toString() : '',
                    sale_start_date: tier.sale_start_date ? tier.sale_start_date.replace('Z', '').slice(0, 16) : '',
                    sale_end_date: tier.sale_end_date ? tier.sale_end_date.replace('Z', '').slice(0, 16) : '',
                    is_active: tier.is_active ?? true,
                    sold_count: tier.sold_count || 0,
                })) || []
            });

            // Set image preview if event has poster
            if (event.poster_image) {
                setImagePreview(`${import.meta.env.VITE_STORAGE_URL}/${event.poster_image}`);
            }
        }
    }, [event, isOpen]);

    const updateEventMutation = useMutation({
        mutationFn: (data: FormData) => eventsApi.updateEvent(event?.id || '', data),
        onSuccess: (data) => {
            toast.success('Event updated successfully');
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['event', event?.id] });
            if (onSuccess && data.data) {
                onSuccess(data.data);
            }
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update event');
        },
        onSettled: () => {
            setIsSubmitting(false);
        }
    });

    if (!isOpen || !event) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, poster_image: file }));

            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const addTicketTier = () => {
        setFormData(prev => ({
            ...prev,
            ticket_tiers: [
                ...prev.ticket_tiers,
                {
                    name: '',
                    description: '',
                    price: '0',
                    capacity: '',
                    max_per_user: '',
                    sale_start_date: '',
                    sale_end_date: '',
                    is_active: true,
                }
            ]
        }));
    };

    const removeTicketTier = (index: number) => {
        setFormData(prev => ({
            ...prev,
            ticket_tiers: prev.ticket_tiers.filter((_, i) => i !== index)
        }));
    };

    const updateTicketTier = (index: number, field: string, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            ticket_tiers: prev.ticket_tiers.map((tier, i) =>
                i === index ? { ...tier, [field]: field === 'is_active' ? (value === 'true' || value === true) : value } : tier
            )
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate that we have at least one ticket tier
        if (formData.ticket_tiers.length === 0) {
            toast.error('Please add at least one ticket tier');
            return;
        }
        
        setIsSubmitting(true);

        const submitData = new FormData();

        // Add basic event data
        Object.entries(formData).forEach(([key, value]) => {
            if (key !== 'poster_image' && key !== 'ticket_tiers') {
                submitData.append(key, value.toString());
            }
        });

        // Add image if selected
        if (formData.poster_image) {
            submitData.append('poster_image', formData.poster_image);
        }

        // Add ticket tiers
        submitData.append('ticket_tiers', JSON.stringify(formData.ticket_tiers));

        updateEventMutation.mutate(submitData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-secondary-700">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Edit className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Event</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Update event information</p>
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
                <form onSubmit={handleSubmit}>
                    <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
                        <div className="p-6 space-y-6">
                            {/* Basic Information */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Event Title
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Venue
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.venue}
                                            onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Event Image */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Event Poster</h3>
                                <div className="flex flex-col lg:flex-row gap-6">
                                    {imagePreview && (
                                        <div className="lg:w-1/3">
                                            <img
                                                src={imagePreview}
                                                alt="Event preview"
                                                className="w-full h-48 object-cover rounded-lg"
                                            />
                                        </div>
                                    )}

                                    <div className="flex-1">
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600 mb-2">
                                                {imagePreview ? 'Change event poster' : 'Upload event poster'}
                                            </p>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Date and Time */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Date & Time</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.start_date ? formData.start_date.split('T')[0] : ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.end_date ? formData.end_date.split('T')[0] : ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Start Time
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.start_time}
                                            onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            End Time
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.end_time}
                                            onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Settings */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Event Settings</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Total Capacity
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.total_capacity}
                                            onChange={(e) => setFormData(prev => ({ ...prev, total_capacity: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Leave empty for unlimited"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Status
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="is_public"
                                            checked={formData.is_public}
                                            onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="is_public" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                            Public Event
                                        </label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="re_entry_allowed"
                                            checked={formData.re_entry_allowed}
                                            onChange={(e) => setFormData(prev => ({ ...prev, re_entry_allowed: e.target.checked }))}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="re_entry_allowed" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                            Allow Re-entry
                                        </label>
                                    </div>

                                    {formData.re_entry_allowed && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Re-entry Cooldown (minutes)
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.re_entry_cooldown}
                                                onChange={(e) => setFormData(prev => ({ ...prev, re_entry_cooldown: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                min="0"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Ticket Tiers */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold">Ticket Tiers</h3>
                                    <button
                                        type="button"
                                        onClick={addTicketTier}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Add Tier
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {formData.ticket_tiers.length === 0 && (
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                            <p className="mb-2">No ticket tiers added yet</p>
                                            <p className="text-sm">Click "Add Tier" to create your first ticket tier</p>
                                        </div>
                                    )}
                                    {formData.ticket_tiers.map((tier, index) => (
                                        <div key={tier.id || index} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-medium">Ticket Tier {index + 1}</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => removeTicketTier(index)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Tier Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={tier.name}
                                                        onChange={(e) => updateTicketTier(index, 'name', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Price ({currencySymbol})
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={tier.price}
                                                        onChange={(e) => updateTicketTier(index, 'price', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                        min="0"
                                                        step="0.01"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Capacity
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={tier.capacity}
                                                        onChange={(e) => updateTicketTier(index, 'capacity', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Leave empty for unlimited"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Max per User
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={tier.max_per_user}
                                                        onChange={(e) => updateTicketTier(index, 'max_per_user', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Leave empty for unlimited"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Sale Start Date
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        value={tier.sale_start_date}
                                                        onChange={(e) => updateTicketTier(index, 'sale_start_date', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Sale End Date
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        value={tier.sale_end_date}
                                                        onChange={(e) => updateTicketTier(index, 'sale_end_date', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Description
                                                </label>
                                                <textarea
                                                    value={tier.description}
                                                    onChange={(e) => updateTicketTier(index, 'description', e.target.value)}
                                                    rows={2}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Optional tier description"
                                                />
                                            </div>

                                            <div className="mt-4 flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id={`tier-active-${index}`}
                                                        checked={tier.is_active}
                                                        onChange={(e) => updateTicketTier(index, 'is_active', e.target.checked.toString())}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    />
                                                    <label htmlFor={`tier-active-${index}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                                        Active (available for purchase)
                                                    </label>
                                                </div>

                                                {tier.sold_count !== undefined && (
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        Sold: {tier.sold_count}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 dark:bg-secondary-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-white dark:bg-secondary-900 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-secondary-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            {isSubmitting ? 'Updating...' : 'Update Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventEditModal;