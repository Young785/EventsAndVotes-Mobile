import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import {
    MapPin,
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
    BarChart3,
    ArrowLeft,
    Edit,
    Trash2,
    Plus,
    MoreVertical,
    RefreshCw,
    AlertCircle,
    Mail,
    UserPlus,
    Shield,
    Activity,
    Scan,
    Settings,
    Copy,
    ExternalLink,
    QrCode
} from 'lucide-react';
import { eventsApi, scanLocationsApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import useDebounce from '../../hooks/useDebounce';
import toast from 'react-hot-toast';

interface ScanLocation {
    id: string;
    event_id: string;
    name: string;
    description: string;
    location_type: 'entry' | 'exit' | 'checkpoint';
    max_concurrent_scans: number | null;
    is_active: boolean;
    created_by: string;
    active_scan_users_count: number;
    total_scans: number;
    created_at: string;
    updated_at: string;
}

interface ScanUser {
    id: string;
    scan_location_id: string;
    name: string;
    email: string;
    phone: string;
    role: 'scanner' | 'supervisor';
    permissions: string[];
    access_token: string;
    token_expires_at: string;
    last_login_at: string | null;
    is_active: boolean;
    total_scans: number;
    created_at: string;
}

const ScanLocationManagement: React.FC = () => {
    const { id: eventId } = useParams<{ id: string }>();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [locationTypeFilter, setLocationTypeFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showUserViewModal, setShowUserViewModal] = useState(false);
    const [showUserAssignModal, setShowUserAssignModal] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [showScanUrlModal, setShowScanUrlModal] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<ScanLocation | null>(null);
    const [selectedUser, setSelectedUser] = useState<ScanUser | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [activeTab, setActiveTab] = useState<'locations' | 'users'>('locations');

    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const queryClient = useQueryClient();

    // Fetch event details
    const { data: eventData, isLoading: eventLoading } = useQuery({
        queryKey: ['event', eventId],
        queryFn: () => eventsApi.getEvent(eventId!),
        enabled: !!eventId
    });

    // Fetch scan locations
    const { data: locationsData, isLoading: locationsLoading, error: locationsError } = useQuery({
        queryKey: ['scan-locations', eventId, currentPage, debouncedSearchTerm, statusFilter, locationTypeFilter],
        queryFn: () => scanLocationsApi.getLocations({
            event_id: eventId!,
            page: currentPage,
            per_page: 10,
            search: debouncedSearchTerm,
            status: statusFilter,
            location_type: locationTypeFilter
        }),
        enabled: !!eventId,
        retry: 1
    });

    // Fetch scan users for selected location
    const { data: usersData, isLoading: usersLoading } = useQuery({
        queryKey: ['scan-users', selectedLocation?.id, debouncedSearchTerm, statusFilter],
        queryFn: () => scanLocationsApi.getLocationUsers(selectedLocation!.id, {
            search: debouncedSearchTerm,
            status: statusFilter
        }),
        enabled: !!selectedLocation?.id
    });

    // Mutations for CRUD operations
    const createLocationMutation = useMutation({
        mutationFn: (data: any) => scanLocationsApi.createLocation(data),
        onSuccess: () => {
            toast.success('Location created successfully');
            queryClient.invalidateQueries({ queryKey: ['scan-locations', eventId] });
            setShowLocationModal(false);
            setSelectedLocation(null);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create location');
        }
    });

    const updateLocationMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => scanLocationsApi.updateLocation(id, data),
        onSuccess: () => {
            toast.success('Location updated successfully');
            queryClient.invalidateQueries({ queryKey: ['scan-locations', eventId] });
            setShowLocationModal(false);
            setSelectedLocation(null);
            setEditMode(false);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update location');
        }
    });

    const deleteLocationMutation = useMutation({
        mutationFn: (id: string) => scanLocationsApi.deleteLocation(id),
        onSuccess: () => {
            toast.success('Location deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['scan-locations', eventId] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete location');
        }
    });

    const createUserMutation = useMutation({
        mutationFn: ({ locationId, data }: { locationId: string; data: any }) => 
            scanLocationsApi.createScanUser(locationId, data),
        onSuccess: () => {
            toast.success('User invitation sent successfully');
            queryClient.invalidateQueries({ queryKey: ['scan-users', selectedLocation?.id] });
            queryClient.invalidateQueries({ queryKey: ['scan-locations', eventId] });
            setShowUserModal(false);
            setShowUserAssignModal(false);
            setSelectedUser(null);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to send invitation');
        }
    });

    const updateUserMutation = useMutation({
        mutationFn: ({ locationId, userId, data }: { locationId: string; userId: string; data: any }) => 
            scanLocationsApi.updateScanUser(locationId, userId, data),
        onSuccess: () => {
            toast.success('User updated successfully');
            queryClient.invalidateQueries({ queryKey: ['scan-users', selectedLocation?.id] });
            queryClient.invalidateQueries({ queryKey: ['scan-locations', eventId] });
            setShowUserModal(false);
            setShowUserViewModal(false);
            setSelectedUser(null);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update user');
        }
    });

    const deleteUserMutation = useMutation({
        mutationFn: ({ locationId, userId }: { locationId: string; userId: string }) => 
            scanLocationsApi.deleteScanUser(locationId, userId),
        onSuccess: () => {
            toast.success('User deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['scan-users', selectedLocation?.id] });
            setShowUserViewModal(false);
            setSelectedUser(null);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete user');
        }
    });

    const regenerateTokenMutation = useMutation({
        mutationFn: ({ locationId, userId }: { locationId: string; userId: string }) => 
            scanLocationsApi.regenerateToken(locationId, userId),
        onSuccess: () => {
            toast.success('Scan URL regenerated successfully');
            queryClient.invalidateQueries({ queryKey: ['scan-users', selectedLocation?.id] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to regenerate scan URL');
        }
    });

    // Generate scan URL for a user
    const generateScanUrl = (user: ScanUser) => {
        const baseUrl = window.location.origin;
        return `${baseUrl}/scan/${user.access_token}`;
    };

    // Copy scan URL to clipboard
    const copyScanUrl = async (user: ScanUser) => {
        const scanUrl = generateScanUrl(user);
        try {
            await navigator.clipboard.writeText(scanUrl);
            toast.success('Scan URL copied to clipboard');
        } catch (error) {
            toast.error('Failed to copy URL');
        }
    };

    const event = eventData?.data;
    const locations = locationsData?.data || [];
    const users = usersData?.data || [];
    const locationsPagination = (locationsData as any)?.pagination;

    // Statistics calculations
    const stats = useMemo(() => {
        if (!locations.length) return null;

        return {
            totalLocations: locations.length,
            activeLocations: locations.filter((loc: ScanLocation) => loc.is_active).length,
            totalScanUsers: locations.reduce((sum: number, loc: ScanLocation) => sum + loc.active_scan_users_count, 0),
            totalScans: locations.reduce((sum: number, loc: ScanLocation) => sum + loc.total_scans, 0)
        };
    }, [locations]);

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setLocationTypeFilter('all');
        setCurrentPage(1);
    };

    const handleRefreshData = () => {
        queryClient.invalidateQueries({ queryKey: ['scan-locations', eventId] });
        queryClient.invalidateQueries({ queryKey: ['scan-users'] });
        toast.success('Data refreshed');
    };

    const getLocationTypeIcon = (type: string) => {
        switch (type) {
            case 'entry':
                return <ArrowLeft className="w-4 h-4 text-green-600" />;
            case 'exit':
                return <ArrowLeft className="w-4 h-4 text-red-600 transform rotate-180" />;
            case 'checkpoint':
                return <Shield className="w-4 h-4 text-blue-600" />;
            default:
                return <MapPin className="w-4 h-4 text-gray-600" />;
        }
    };

    const getStatusBadge = (isActive: boolean) => {
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                {isActive ? (
                    <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                    </>
                ) : (
                    <>
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactive
                    </>
                )}
            </span>
        );
    };

    const getRoleBadge = (role: string) => {
        const roleConfig = {
            scanner: { color: 'bg-blue-100 text-blue-800', icon: Scan },
            supervisor: { color: 'bg-purple-100 text-purple-800', icon: Shield }
        };

        const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.scanner;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
        );
    };

    if (eventLoading) {
        return <LoadingSpinner />;
    }

    if (!event) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h3>
                <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
                <Link
                    to="/admin/events"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Events
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link
                        to="/admin/events"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
                        <p className="text-gray-600">Scan Location & User Management</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleRefreshData}
                        className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                    <button
                        onClick={() => {
                            setSelectedLocation(null);
                            setEditMode(false);
                            setShowLocationModal(true);
                        }}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Location
                    </button>
                    <button
                        onClick={() => setShowUserAssignModal(true)}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Assign User
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Total Locations</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalLocations}</p>
                                <p className="text-xs text-gray-500">{stats.activeLocations} active</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Scan Users</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalScanUsers}</p>
                                <p className="text-xs text-gray-500">Active scanners</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Activity className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Total Scans</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalScans.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">All locations</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Avg Scans/Location</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats.totalLocations > 0 ? Math.round(stats.totalScans / stats.totalLocations) : 0}
                                </p>
                                <p className="text-xs text-gray-500">Performance metric</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Scan Locations Table */}
            <div className="bg-white rounded-lg shadow">
                {/* Filters */}
                <div className="p-6 border-b border-gray-200">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search locations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>

                            <select
                                value={locationTypeFilter}
                                onChange={(e) => setLocationTypeFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Types</option>
                                <option value="entry">Entry</option>
                                <option value="exit">Exit</option>
                                <option value="checkpoint">Checkpoint</option>
                            </select>

                        <div className="flex space-x-2">
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Locations Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Location
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Scan Users
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Scans
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Max Concurrent
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {locationsLoading ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center">
                                                <LoadingSpinner />
                                            </td>
                                        </tr>
                                ) : locationsError ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
                                            <p className="text-red-600 mb-2">Failed to load scan locations</p>
                                            <p className="text-gray-500 text-sm">{(locationsError as Error).message}</p>
                                            <button
                                                onClick={handleRefreshData}
                                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                            >
                                                Try Again
                                            </button>
                                            </td>
                                        </tr>
                                    ) : locations.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center">
                                                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                                <p className="text-gray-500">No scan locations found</p>
                                            <button
                                                onClick={() => setShowLocationModal(true)}
                                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                            >
                                                Add First Location
                                            </button>
                                            </td>
                                        </tr>
                                    ) : (
                                        locations.map((location: ScanLocation) => (
                                            <tr key={location.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{location.name}</div>
                                                        <div className="text-sm text-gray-500">{location.description}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {getLocationTypeIcon(location.location_type)}
                                                        <span className="ml-2 text-sm text-gray-900 capitalize">
                                                            {location.location_type}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(location.is_active)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{location.active_scan_users_count}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{location.total_scans.toLocaleString()}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {location.max_concurrent_scans || 'Unlimited'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedLocation(location);
                                                            queryClient.invalidateQueries({ queryKey: ['scan-users', location.id] });
                                                            setShowUserViewModal(true);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                                            title="View Users"
                                                        >
                                                            <Users className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedLocation(location);
                                                            setEditMode(true);
                                                                setShowLocationModal(true);
                                                            }}
                                                            className="text-green-600 hover:text-green-900 p-1 rounded"
                                                            title="Edit Location"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                        onClick={() => {
                                                            setSelectedLocation(location);
                                                            setShowStatsModal(true);
                                                        }}
                                                            className="text-purple-600 hover:text-purple-900 p-1 rounded"
                                                            title="View Statistics"
                                                        >
                                                            <BarChart3 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                        onClick={() => {
                                                            if (confirm(`Are you sure you want to delete "${location.name}"?`)) {
                                                                deleteLocationMutation.mutate(location.id);
                                                            }
                                                        }}
                                                            className="text-red-600 hover:text-red-900 p-1 rounded"
                                                            title="Delete Location"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                </div>
            </div>

            {/* Modals would go here - LocationModal, UserModal, etc. */}
            {showLocationModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
                            setShowLocationModal(false);
                            setSelectedLocation(null);
                            setEditMode(false);
                        }}></div>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const data = {
                                    event_id: eventId,
                                    name: formData.get('name') as string,
                                    description: formData.get('description') as string,
                                    location_type: formData.get('location_type') as string,
                                    max_concurrent_scans: parseInt(formData.get('max_concurrent_scans') as string) || null,
                                    is_active: formData.get('is_active') === 'on'
                                };

                                if (editMode && selectedLocation) {
                                    updateLocationMutation.mutate({ id: selectedLocation.id, data });
                                } else {
                                    createLocationMutation.mutate(data);
                                }
                            }}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="w-full">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                                {editMode ? 'Edit Scan Location' : 'Add New Scan Location'}
                                            </h3>

                                            <div className="space-y-4">
                        <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Location Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        required
                                                        defaultValue={editMode ? selectedLocation?.name : ''}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="e.g., Main Entrance"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Description
                                                    </label>
                                                    <textarea
                                                        name="description"
                                                        defaultValue={editMode ? selectedLocation?.description : ''}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        rows={3}
                                                        placeholder="Brief description of this location"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Location Type
                                                    </label>
                                                    <select
                                                        name="location_type"
                                                        defaultValue={editMode ? selectedLocation?.location_type : 'entry'}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="entry">Entry Point</option>
                                                        <option value="exit">Exit Point</option>
                                                        <option value="checkpoint">Checkpoint</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Max Concurrent Scans
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="max_concurrent_scans"
                                                        min="1"
                                                        max="20"
                                                        defaultValue={editMode ? selectedLocation?.max_concurrent_scans || 5 : 5}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>

                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        name="is_active"
                                                        defaultChecked={editMode ? selectedLocation?.is_active : true}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    />
                                                    <label className="ml-2 block text-sm text-gray-900">
                                                        Active
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        disabled={createLocationMutation.isPending || updateLocationMutation.isPending}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                    >
                                        {createLocationMutation.isPending || updateLocationMutation.isPending ? (
                                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                        ) : null}
                                        {editMode ? 'Update Location' : 'Create Location'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowLocationModal(false);
                                            setSelectedLocation(null);
                                            setEditMode(false);
                                        }}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showUserModal && selectedLocation && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
                            setShowUserModal(false);
                            setSelectedUser(null);
                        }}></div>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const data = {
                                    name: formData.get('name') as string,
                                    email: formData.get('email') as string,
                                    phone: formData.get('phone') as string,
                                    role: formData.get('role') as 'scanner' | 'supervisor',
                                    is_active: formData.get('is_active') === 'on',
                                    send_email: formData.get('send_email') === 'on'
                                };

                                if (selectedUser) {
                                    // Edit mode
                                    updateUserMutation.mutate({
                                        locationId: selectedLocation.id,
                                        userId: selectedUser.id,
                                        data
                                    });
                                } else {
                                    // Create mode - remove send_email for creation
                                    const { send_email, ...createData } = data;
                                    createUserMutation.mutate({
                                        locationId: selectedLocation.id,
                                        data: createData
                                    });
                                }
                            }}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="w-full">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                                {selectedUser ? 'Edit Scan User' : `Add Scan User to ${selectedLocation.name}`}
                                            </h3>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Full Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        required
                                                        defaultValue={selectedUser?.name || ''}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="e.g., John Scanner"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Email Address
                                                    </label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        required
                                                        defaultValue={selectedUser?.email || ''}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="john@example.com"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Phone Number
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        defaultValue={selectedUser?.phone || ''}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="+1234567890"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Role
                                                    </label>
                                                    <select
                                                        name="role"
                                                        defaultValue={selectedUser?.role || 'scanner'}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="scanner">Scanner</option>
                                                        <option value="supervisor">Supervisor</option>
                                                    </select>
                                                </div>

                                                {selectedUser && (
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            name="is_active"
                                                            defaultChecked={selectedUser.is_active}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                        />
                                                        <label className="ml-2 block text-sm text-gray-900">
                                                            Active
                                                        </label>
                                                    </div>
                                                )}

                                                {selectedUser && (
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            name="send_email"
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                        />
                                                        <label className="ml-2 block text-sm text-gray-900">
                                                            Send email notification to user
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        disabled={createUserMutation.isPending || updateUserMutation.isPending}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                    >
                                        {createUserMutation.isPending || updateUserMutation.isPending ? (
                                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                        ) : null}
                                        {selectedUser ? 'Update User' : 'Send Invitation'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowUserModal(false);
                                            setSelectedUser(null);
                                        }}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* User View Modal */}
            {showUserViewModal && selectedLocation && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
                            setShowUserViewModal(false);
                            setSelectedUser(null);
                        }}></div>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                            <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        Scan Users for {selectedLocation.name}
                                </h3>
                                    <button
                                        onClick={() => {
                                            setShowUserViewModal(false);
                                            setShowUserModal(true);
                                        }}
                                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Add User
                                    </button>
                            </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Scans</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {usersLoading ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center">
                                                        <LoadingSpinner />
                                                    </td>
                                                </tr>
                                            ) : users.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center">
                                                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                                        <p className="text-gray-500">No scan users found</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                users.map((user: ScanUser) => (
                                                    <tr key={user.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                                <div className="text-sm text-gray-500">{user.email}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {getRoleBadge(user.role)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {getStatusBadge(user.is_active)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{user.total_scans}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {user.last_login_at
                                                                    ? new Date(user.last_login_at).toLocaleDateString()
                                                                    : 'Never'
                                                                }
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <div className="flex items-center justify-end space-x-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedUser(user);
                                                                        setShowScanUrlModal(true);
                                                                    }}
                                                                    className="text-purple-600 hover:text-purple-900 p-1 rounded"
                                                                    title="View Scan URL"
                                                                >
                                                                    <QrCode className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => copyScanUrl(user)}
                                                                    className="text-orange-600 hover:text-orange-900 p-1 rounded"
                                                                    title="Copy Scan URL"
                                                                >
                                                                    <Copy className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={async () => {
                                                                        try {
                                                                            await scanLocationsApi.resendInvitation(selectedLocation.id, user.id);
                                                                            toast.success('Invitation resent successfully');
                                                                        } catch (error) {
                                                                            toast.error('Failed to resend invitation');
                                                                        }
                                                                    }}
                                                                    className="text-green-600 hover:text-green-900 p-1 rounded"
                                                                    title="Resend Invitation"
                                                                >
                                                                    <Mail className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedUser(user);
                                                                        setShowUserViewModal(false);
                                                                        setShowUserModal(true);
                                                                    }}
                                                                    className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                                                    title="Edit User"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        if (confirm(`Are you sure you want to delete "${user.name}"?`)) {
                                                                            deleteUserMutation.mutate({
                                                                                locationId: selectedLocation.id,
                                                                                userId: user.id
                                                                            });
                                                                        }
                                                                    }}
                                                                    className="text-red-600 hover:text-red-900 p-1 rounded"
                                                                    title="Delete User"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    onClick={() => {
                                        setShowUserViewModal(false);
                                        setSelectedUser(null);
                                    }}
                                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                                </div>
                            )}

            {/* User Assign Modal */}
            {showUserAssignModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowUserAssignModal(false)}></div>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const locationId = formData.get('location_id') as string;
                                
                                if (!locationId) {
                                    toast.error('Please select a location');
                                    return;
                                }

                                const data = {
                                    name: formData.get('name') as string,
                                    email: formData.get('email') as string,
                                    phone: formData.get('phone') as string,
                                    role: formData.get('role') as 'scanner' | 'supervisor'
                                };

                                createUserMutation.mutate({ locationId, data });
                            }}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="w-full">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                                Assign User to Location
                                            </h3>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Select Location
                                                    </label>
                                                    <select
                                                        name="location_id"
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="">Choose a location...</option>
                                                        {locations.filter((loc: ScanLocation) => loc.is_active).map((location: ScanLocation) => (
                                                            <option key={location.id} value={location.id}>
                                                                {location.name} ({location.location_type})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Full Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="e.g., John Scanner"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Email Address
                                                    </label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="john@example.com"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Phone Number
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="+1234567890"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Role
                                                    </label>
                                                    <select
                                                        name="role"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="scanner">Scanner</option>
                                                        <option value="supervisor">Supervisor</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        disabled={createUserMutation.isPending}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                    >
                                        {createUserMutation.isPending ? (
                                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                        ) : null}
                                        Assign User
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowUserAssignModal(false)}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                        </div>
                    )}

            {/* Statistics Modal */}
            {showStatsModal && selectedLocation && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
                            setShowStatsModal(false);
                            setSelectedLocation(null);
                        }}></div>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        Statistics for {selectedLocation.name}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowStatsModal(false);
                                            setSelectedLocation(null);
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Basic Stats */}
                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <Activity className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm text-gray-600">Total Scans</p>
                                                <p className="text-2xl font-bold text-gray-900">{selectedLocation.total_scans.toLocaleString()}</p>
                                            </div>
                </div>
            </div>

                                    <div className="bg-green-50 rounded-lg p-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                <Users className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm text-gray-600">Active Users</p>
                                                <p className="text-2xl font-bold text-gray-900">{selectedLocation.active_scan_users_count}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-purple-50 rounded-lg p-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                                <Settings className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm text-gray-600">Max Concurrent</p>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {selectedLocation.max_concurrent_scans || 'Unlimited'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-orange-50 rounded-lg p-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                                <MapPin className="w-5 h-5 text-orange-600" />
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm text-gray-600">Location Type</p>
                                                <p className="text-2xl font-bold text-gray-900 capitalize">
                                                    {selectedLocation.location_type}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <h4 className="text-md font-medium text-gray-900 mb-4">Location Details</h4>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Description</dt>
                                                <dd className="text-sm text-gray-900">{selectedLocation.description || 'No description'}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                                <dd className="text-sm text-gray-900">
                                                    {getStatusBadge(selectedLocation.is_active)}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Created</dt>
                                                <dd className="text-sm text-gray-900">
                                                    {new Date(selectedLocation.created_at).toLocaleDateString()}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                                                <dd className="text-sm text-gray-900">
                                                    {new Date(selectedLocation.updated_at).toLocaleDateString()}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <h4 className="text-md font-medium text-gray-900 mb-4">Performance Metrics</h4>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                            <div className="text-center">
                                                <p className="text-sm text-gray-500">Avg Scans/User</p>
                                                <p className="text-lg font-semibold text-gray-900">
                                                    {selectedLocation.active_scan_users_count > 0 
                                                        ? Math.round(selectedLocation.total_scans / selectedLocation.active_scan_users_count)
                                                        : 0
                                                    }
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-gray-500">Utilization</p>
                                                <p className="text-lg font-semibold text-gray-900">
                                                    {selectedLocation.max_concurrent_scans 
                                                        ? Math.round((selectedLocation.active_scan_users_count / selectedLocation.max_concurrent_scans) * 100) + '%'
                                                        : 'N/A'
                                                    }
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-gray-500">Efficiency</p>
                                                <p className="text-lg font-semibold text-green-600">
                                                    {selectedLocation.total_scans > 100 ? 'High' : 
                                                     selectedLocation.total_scans > 50 ? 'Medium' : 'Low'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    onClick={() => {
                                        setShowStatsModal(false);
                                        setSelectedLocation(null);
                                    }}
                                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Scan URL Modal */}
            {showScanUrlModal && selectedUser && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
                            setShowScanUrlModal(false);
                            setSelectedUser(null);
                        }}></div>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        Scan URL for {selectedUser.name}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowScanUrlModal(false);
                                            setSelectedUser(null);
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* User Info */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="font-medium text-gray-500">Name:</span>
                                                <p className="text-gray-900">{selectedUser.name}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-500">Email:</span>
                                                <p className="text-gray-900">{selectedUser.email}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-500">Role:</span>
                                                <p className="text-gray-900 capitalize">{selectedUser.role}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-500">Status:</span>
                                                <p className="text-gray-900">
                                                    {selectedUser.is_active ? (
                                                        <span className="text-green-600">Active</span>
                                                    ) : (
                                                        <span className="text-red-600">Inactive</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Scan URL */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Scan URL
                                        </label>
                                        <div className="flex">
                                            <input
                                                type="text"
                                                value={generateScanUrl(selectedUser)}
                                                readOnly
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm font-mono"
                                            />
                                            <button
                                                onClick={() => copyScanUrl(selectedUser)}
                                                className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                title="Copy URL"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Share this URL with the scanner to allow them to scan tickets at this location.
                                        </p>
                                    </div>

                                    {/* Token Info */}
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex items-start">
                                            <Shield className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                                            <div className="flex-1">
                                                <h4 className="text-sm font-medium text-yellow-800">Security Information</h4>
                                                <div className="mt-2 space-y-1 text-xs text-yellow-700">
                                                    <p><strong>Token Expires:</strong> {new Date(selectedUser.token_expires_at).toLocaleString()}</p>
                                                    <p><strong>Last Login:</strong> {selectedUser.last_login_at ? new Date(selectedUser.last_login_at).toLocaleString() : 'Never'}</p>
                                                    <p><strong>Total Scans:</strong> {selectedUser.total_scans}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => {
                                                const url = generateScanUrl(selectedUser);
                                                window.open(url, '_blank');
                                            }}
                                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        >
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            Open Scan Page
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('Are you sure you want to regenerate this scan URL? The current URL will become invalid.')) {
                                                    regenerateTokenMutation.mutate({
                                                        locationId: selectedUser.scan_location_id,
                                                        userId: selectedUser.id
                                                    });
                                                }
                                            }}
                                            disabled={regenerateTokenMutation.isPending}
                                            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                                        >
                                            {regenerateTokenMutation.isPending ? (
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                            )}
                                            Regenerate URL
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    onClick={() => {
                                        setShowScanUrlModal(false);
                                        setSelectedUser(null);
                                    }}
                                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScanLocationManagement; 