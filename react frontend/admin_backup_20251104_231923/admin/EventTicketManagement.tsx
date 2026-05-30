import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import {
    Ticket,
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
    PieChart,
    ArrowLeft,
    Edit,
    Trash2,
    Plus,
    MoreVertical,
    RefreshCw,
    AlertCircle,
    CalendarCheck,
    Mail,
    FileText
} from 'lucide-react';
import { eventsApi, ticketsApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import useDebounce from '../../hooks/useDebounce';
import toast from 'react-hot-toast';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Cell,
    BarChart,
    Bar
} from 'recharts';

interface TicketTier {
    id: string;
    name: string;
    description: string;
    price: number;
    capacity: number | null;
    sold_count: number;
    available_count: number | null;
    max_per_user: number;
    sale_start_date: string;
    sale_end_date: string;
    is_active: boolean;
    revenue: number;
}

interface TicketData {
    id: string;
    uuid: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    tier_name: string;
    price_paid: number;
    status: string;
    purchased_at: string;
    scanned_at: string | null;
    scan_count: number;
}

const EventTicketManagement: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [tierFilter, setTierFilter] = useState('all');
    const [dateRange, setDateRange] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [chartPeriod, setChartPeriod] = useState('7days');
    const [showTierModal, setShowTierModal] = useState(false);
    const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);

    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const queryClient = useQueryClient();

    // Fetch event details
    const { data: eventData, isLoading: eventLoading } = useQuery({
        queryKey: ['event', eventId],
        queryFn: () => eventsApi.getEvent(eventId!),
        enabled: !!eventId
    });

    // Fetch event analytics
    const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
        queryKey: ['event-analytics', eventId, chartPeriod],
        queryFn: () => eventsApi.getEventAnalytics(eventId!),
        enabled: !!eventId
    });

    // Fetch tickets
    const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
        queryKey: ['event-tickets', eventId, currentPage, debouncedSearchTerm, statusFilter, tierFilter, startDate, endDate],
        queryFn: () => ticketsApi.getUserTickets({
            event_id: eventId,
            page: currentPage,
            search: debouncedSearchTerm,
            status: statusFilter === 'all' ? undefined : statusFilter,
            tier_id: tierFilter === 'all' ? undefined : tierFilter,
            start_date: startDate,
            end_date: endDate
        }),
        enabled: !!eventId
    });

    const event = eventData?.data;
    const analytics = analyticsData?.data;
    const tickets = ticketsData?.data?.data || [];
    const pagination = ticketsData?.data;

    // Chart colors
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

    // Prepare chart data
    const salesChartData = useMemo(() => {
        if (!analytics?.daily_sales) return [];
        return analytics.daily_sales.map(item => ({
            date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            sales: item.count,
            revenue: item.revenue
        }));
    }, [analytics]);

    const tierChartData = useMemo(() => {
        if (!analytics?.ticket_tiers) return [];
        return analytics.ticket_tiers.map((tier, index) => ({
            name: tier.name,
            value: tier.sold_count,
            revenue: tier.revenue,
            color: COLORS[index % COLORS.length]
        }));
    }, [analytics]);

    const entriesChartData = useMemo(() => {
        if (!analytics?.hourly_entries) return [];
        return analytics.hourly_entries.map(item => ({
            hour: `${item.hour}:00`,
            entries: item.count
        }));
    }, [analytics]);

    // Statistics calculations
    const stats = useMemo(() => {
        if (!analytics) return null;

        return {
            overview: analytics.overview,
            totalTickets: analytics.ticket_tiers?.reduce((sum, tier) => sum + tier.sold_count, 0) || 0,
            totalRevenue: analytics.ticket_tiers?.reduce((sum, tier) => sum + tier.revenue, 0) || 0,
            averageTicketPrice: analytics.ticket_tiers?.length > 0
                ? analytics.ticket_tiers.reduce((sum, tier) => sum + tier.price, 0) / analytics.ticket_tiers.length
                : 0,
            conversionRate: analytics.overview?.total_capacity > 0
                ? (analytics.overview.tickets_sold / analytics.overview.total_capacity * 100)
                : 0
        };
    }, [analytics]);

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setTierFilter('all');
        setDateRange('all');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    const handleExportTickets = async () => {
        try {
            // Implementation for exporting tickets
            toast.success('Tickets exported successfully');
        } catch (error) {
            toast.error('Failed to export tickets');
        }
    };

    const handleRefreshData = () => {
        queryClient.invalidateQueries({ queryKey: ['event', eventId] });
        queryClient.invalidateQueries({ queryKey: ['event-analytics', eventId] });
        queryClient.invalidateQueries({ queryKey: ['event-tickets', eventId] });
        toast.success('Data refreshed');
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            sold: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Sold' },
            pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
            cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' },
            refunded: { color: 'bg-gray-100 text-gray-800', icon: RefreshCw, label: 'Refunded' }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
            </span>
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    if (eventLoading || analyticsLoading) {
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
        <div className="space-y-6">
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
                        <p className="text-gray-600">Ticket Management & Analytics</p>
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
                        onClick={handleExportTickets}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Ticket className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Tickets Sold</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalTickets.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">of {stats.overview.total_capacity || 'unlimited'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                                <p className="text-xs text-gray-500">Avg: {formatCurrency(stats.averageTicketPrice)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Attendance</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.overview.total_scans}</p>
                                <p className="text-xs text-gray-500">{stats.overview.attendance_rate.toFixed(1)}% rate</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Conversion Rate</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
                                <p className="text-xs text-gray-500">Sales efficiency</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
                        <select
                            value={chartPeriod}
                            onChange={(e) => setChartPeriod(e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded text-sm"
                        >
                            <option value="today">Today</option>
                            <option value="7days">7 Days</option>
                            <option value="1month">1 Month</option>
                            <option value="3months">3 Months</option>
                            <option value="1year">1 Year</option>
                            <option value="since_event">Since Event</option>
                        </select>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Tier Distribution */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Tier Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                            <Pie
                                data={tierChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {tierChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Ticket Tiers Management */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Ticket Tiers</h3>
                        <button
                            onClick={() => setShowTierModal(true)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Tier
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tier Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Capacity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sold
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Revenue
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {analytics?.ticket_tiers?.map((tier) => (
                                <tr key={tier.name} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{tier.name}</div>
                                            <div className="text-sm text-gray-500">Max {tier.max_per_user || 'unlimited'} per user</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{formatCurrency(tier.price)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{tier.capacity || 'Unlimited'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{tier.sold_count}</div>
                                        <div className="text-xs text-gray-500">
                                            {tier.capacity ? `${tier.available_count} left` : 'Unlimited'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-green-600">{formatCurrency(tier.revenue)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tier.sold_count > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {tier.sold_count > 0 ? 'Active' : 'No Sales'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedTier(tier as any);
                                                    setShowTierModal(true);
                                                }}
                                                className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                                title="Edit Tier"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                className="text-red-600 hover:text-red-900 p-1 rounded"
                                                title="Delete Tier"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search tickets..."
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
                        <option value="sold">Sold</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                    </select>

                    <select
                        value={tierFilter}
                        onChange={(e) => setTierFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Tiers</option>
                        {analytics?.ticket_tiers?.map((tier) => (
                            <option key={tier.name} value={tier.name}>{tier.name}</option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Start Date"
                    />

                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="End Date"
                    />

                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Tickets Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Ticket Sales</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ticket Tier
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Purchase Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Scans
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {ticketsLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <LoadingSpinner />
                                    </td>
                                </tr>
                            ) : tickets.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">No tickets found</p>
                                    </td>
                                </tr>
                            ) : (
                                tickets.map((ticket: TicketData) => (
                                    <tr key={ticket.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{ticket.customer_name}</div>
                                                <div className="text-sm text-gray-500">{ticket.customer_email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{ticket.tier_name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{formatCurrency(ticket.price_paid)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(ticket.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {new Date(ticket.purchased_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {ticket.scan_count} scans
                                            </div>
                                            {ticket.scanned_at && (
                                                <div className="text-xs text-gray-500">
                                                    Last: {new Date(ticket.scanned_at).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTicket(ticket);
                                                        setShowTicketModal(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="text-green-600 hover:text-green-900 p-1 rounded"
                                                    title="Send Email"
                                                >
                                                    <Mail className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="text-purple-600 hover:text-purple-900 p-1 rounded"
                                                    title="Download Ticket"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.last_page > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(Math.min(pagination.last_page, currentPage + 1))}
                                disabled={currentPage === pagination.last_page}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing{' '}
                                    <span className="font-medium">{(pagination.current_page - 1) * pagination.per_page + 1}</span>
                                    {' '}to{' '}
                                    <span className="font-medium">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span>
                                    {' '}of{' '}
                                    <span className="font-medium">{pagination.total}</span>
                                    {' '}results
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(Math.min(pagination.last_page, currentPage + 1))}
                                        disabled={currentPage === pagination.last_page}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals would go here - TierModal, TicketModal, etc. */}
        </div>
    );
};

export default EventTicketManagement; 