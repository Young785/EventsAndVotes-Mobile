import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    DollarSign,
    TrendingUp,
    Calendar,
    Download,
    Clock,
    CheckCircle,
    AlertCircle,
    CreditCard,
    Search,
    Filter,
    Plus
} from 'lucide-react';
import { eventsApi, adminApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import WithdrawalModal from '../../components/WithdrawalModal';

interface TicketTier {
    price: number;
    quantity: number;
    sold_count?: number;
}

interface Event {
    id: number;
    title: string;
    ticketTiers: TicketTier[];
    // ... other event properties
}

const EventWithdrawals: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [withdrawalForm, setWithdrawalForm] = useState({
        amount: '',
        bank_id: '',
        pace: 'NORMAL'
    });

    const queryClient = useQueryClient();

    // Fetch events with financial data
    const { data: eventsData, isLoading } = useQuery({
        queryKey: ['admin-events', currentPage, searchTerm, statusFilter],
        queryFn: () => eventsApi.getEvents({
            page: currentPage,
            search: searchTerm,
            status: statusFilter === 'all' ? undefined : statusFilter
        })
    });

    // Site settings for withdrawal configuration
    const { data: siteSettingsData } = useQuery({
        queryKey: ['site-settings'],
        queryFn: () => adminApi.getSiteSettings()
    });

    // Fetch user banks for withdrawal request
    const { data: userBanksData } = useQuery({
        queryKey: ['user-banks'],
        queryFn: () => adminApi.getUserBanks(),
        enabled: showRequestModal
    });

    // Create withdrawal request mutation
    const createWithdrawalMutation = useMutation({
        mutationFn: adminApi.createWithdrawalRequest,
        onSuccess: () => {
            toast.success('Withdrawal request submitted successfully');
            setShowRequestModal(false);
            queryClient.invalidateQueries({ queryKey: ['admin-events'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to submit withdrawal request');
        }
    });

    const events = eventsData?.data?.data || [];
    const userBanks = userBanksData?.data || [];
    const siteSettings = siteSettingsData?.data?.settings || {};
    const withdrawalSettings = {
        min_withdrawal_amount: siteSettings.min_withdrawal_amount || 1000,
        max_withdrawal_amount: siteSettings.max_withdrawal_amount || 1000000,
        withdrawal_site_charges: siteSettings.withdrawal_site_charges || 2.50,
        withdrawal_pg_charges: siteSettings.withdrawal_pg_charges || 2.50,
        normal_withdrawal_hours: siteSettings.normal_withdrawal_hours || 24,
        express_withdrawal_hours: siteSettings.express_withdrawal_hours || 2,
        express_withdrawal_fee: siteSettings.express_withdrawal_fee || 500
    };

    // Calculate financial summary
    const calculateFinancialSummary = (events: Event[]) => {
        return events.reduce((summary, event) => {
            const eventRevenue = event.ticketTiers.reduce((tierSum, tier) => {
                return tierSum + (tier.price * tier.quantity);
            }, 0);

            return {
                totalRevenue: summary.totalRevenue + eventRevenue,
                totalEvents: summary.totalEvents + 1,
                averageRevenue: (summary.totalRevenue + eventRevenue) / (summary.totalEvents + 1)
            };
        }, {
            totalRevenue: 0,
            totalEvents: 0,
            averageRevenue: 0
        });
    };

    const financialSummary = React.useMemo(() => {
        const totalRevenue = events.reduce((sum, event) => {
            const eventRevenue = event.ticketTiers?.reduce((tierSum: number, tier: any) => {
                return tierSum + ((tier.sold_count || 0) * tier.price);
            }, 0) || 0;
            return sum + eventRevenue;
        }, 0);

        // Mock data for platform fees and available balance
        const platformFeeRate = 0.029; // 2.9% platform fee
        const totalFees = totalRevenue * platformFeeRate;
        const availableBalance = totalRevenue - totalFees;
        const pendingWithdrawals = 0; // This would come from a withdrawals API

        return {
            totalRevenue,
            totalFees,
            availableBalance,
            pendingWithdrawals
        };
    }, [events]);

    const getEventRevenue = (event: any) => {
        return event.ticket_tiers?.reduce((sum: number, tier: any) =>
            sum + ((tier.sold_count || 0) * tier.price), 0
        ) || 0;
    };

    const getEventFees = (revenue: number) => {
        return revenue * 0.029; // 2.9% platform fee
    };

    const getNetEarnings = (revenue: number) => {
        return revenue - getEventFees(revenue);
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            available: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Available' },
            pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
            processing: { color: 'bg-blue-100 text-blue-800', icon: AlertCircle, text: 'Processing' },
            completed: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle, text: 'Completed' }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.available;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {config.text}
            </span>
        );
    };

    // Calculate charges based on site settings
    const calculateCharges = (amount: number, pace: string = 'NORMAL') => {
        const siteCharges = (amount * withdrawalSettings.withdrawal_site_charges) / 100;
        const pgCharges = (amount * withdrawalSettings.withdrawal_pg_charges) / 100;
        const expressCharges = pace === 'EXPRESS' ? withdrawalSettings.express_withdrawal_fee : 0;
        return siteCharges + pgCharges + expressCharges;
    };

    const calculateSettledAmount = (amount: number, pace: string = 'NORMAL') => {
        return amount - calculateCharges(amount, pace);
    };

    const getProcessingTime = (pace: string) => {
        return pace === 'EXPRESS' ? withdrawalSettings.express_withdrawal_hours : withdrawalSettings.normal_withdrawal_hours;
    };

    const handleWithdrawalSubmit = (data: any) => {
        createWithdrawalMutation.mutate(data);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Event Withdrawals</h1>
                <p className="text-gray-600 dark:text-gray-400">Manage your event earnings and withdrawal requests</p>
                </div>
                <button
                    onClick={() => setShowRequestModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>Request Withdrawal</span>
                </button>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card-glass border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">₦{financialSummary.totalRevenue.toLocaleString()}</h3>
                            <p className="text-green-600 font-medium">Total Revenue</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="card-glass border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">₦{financialSummary.totalFees.toLocaleString()}</h3>
                            <p className="text-red-600 font-medium">Platform Fees</p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>

                <div className="card-glass border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">₦{financialSummary.availableBalance.toLocaleString()}</h3>
                            <p className="text-blue-600 font-medium">Available Balance</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="card-glass border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">₦{financialSummary.pendingWithdrawals.toLocaleString()}</h3>
                            <p className="text-yellow-600 font-medium">Pending Withdrawals</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card-glass border border-gray-200 p-6">
                <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Search className="w-4 h-4 inline mr-1" />
                            Search Events
                        </label>
                            <input
                                type="text"
                            placeholder="Search by event name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Filter className="w-4 h-4 inline mr-1" />
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="form-input focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                // Export events data
                                const csvData = events.map(event => {
                                    const revenue = getEventRevenue(event);
                                    const fees = getEventFees(revenue);
                                    const netEarnings = getNetEarnings(revenue);

                                    return {
                                        'Event Name': event.title,
                                        'Start Date': event.start_date,
                                        'Revenue': revenue,
                                        'Platform Fees': fees,
                                        'Net Earnings': netEarnings,
                                        'Status': event.status,
                                        'Tickets Sold': event.ticketTiers?.reduce((sum: number, tier: any) => sum + (tier.sold_count || 0), 0) || 0
                                    };
                                });

                                // Convert to CSV
                                const headers = Object.keys(csvData[0] || {});
                                const csvContent = [
                                    headers.join(','),
                                    ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(','))
                                ].join('\n');

                                // Download CSV
                                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                const link = document.createElement('a');
                                const url = URL.createObjectURL(blob);
                                link.setAttribute('href', url);
                                link.setAttribute('download', `event_withdrawals_${new Date().toISOString().split('T')[0]}.csv`);
                                link.style.visibility = 'hidden';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
                        >
                            <Download className="w-4 h-4" />
                            <span>Export Data</span>
                    </button>
                    </div>
                </div>
            </div>

            {/* Events Table */}
            <div className="card-glass border border-gray-200 dark:border-secondary-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-secondary-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Event Earnings</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-secondary-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Event
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Revenue
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Platform Fees
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Net Earnings
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-secondary-900 divide-y divide-gray-200 dark:divide-secondary-700">
                            {events.map((event: any) => {
                                const revenue = getEventRevenue(event);
                                const fees = getEventFees(revenue);
                                const netEarnings = getNetEarnings(revenue);

                                return (
                                    <tr key={event.id} className="hover:bg-gray-50 dark:bg-secondary-800">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img
                                                        className="h-10 w-10 rounded-full object-cover"
                                                        src={event.image || '/api/placeholder/40/40'}
                                                        alt={event.title}
                                                    />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {event.title}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        <Calendar className="w-3 h-3 inline mr-1" />
                                                        {event.start_date}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                ₦{revenue.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {event.ticketTiers?.reduce((sum: number, tier: any) => sum + (tier.sold_count || 0), 0) || 0} tickets sold
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                ₦{fees.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                2.9% platform fee
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-green-600">
                                                ₦{netEarnings.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(event.status === 'completed' ? 'available' : 'pending')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {event.status === 'completed' && netEarnings > 0 ? (
                                                <button
                                                    onClick={() => setShowRequestModal(true)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Request Withdrawal
                                                </button>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Withdrawal History (Mock Section) */}
            <div className="card-glass overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-secondary-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Withdrawals</h3>
                </div>

                <div className="p-6">
                    <div className="text-center py-8">
                        <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No withdrawal history yet</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Withdrawal requests will appear here once you start requesting payouts
                        </p>
                    </div>
                </div>
            </div>

            {/* Payment Information */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                    <div>
                        <h4 className="text-sm font-medium text-blue-900 mb-1">Payment Information</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Withdrawals are processed within {withdrawalSettings.normal_withdrawal_hours} hours (Normal) or {withdrawalSettings.express_withdrawal_hours} hours (Express)</li>
                            <li>• Platform fee: {withdrawalSettings.withdrawal_site_charges}% site charges + {withdrawalSettings.withdrawal_pg_charges}% payment gateway charges</li>
                            <li>• Minimum withdrawal amount: ₦{withdrawalSettings.min_withdrawal_amount.toLocaleString()}</li>
                            <li>• Express withdrawals have an additional fee of ₦{withdrawalSettings.express_withdrawal_fee.toLocaleString()}</li>
                            <li>• Funds from completed events are available immediately</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Withdrawal Modal */}
            <WithdrawalModal
                isOpen={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                onSubmit={handleWithdrawalSubmit}
                isLoading={createWithdrawalMutation.isPending}
                userBanks={userBanks}
            />
        </div>
    );
};

export default EventWithdrawals; 