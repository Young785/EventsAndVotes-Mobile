import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Search,
    Filter,
    Calendar,
    Users,
    Eye,
    Star,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { votesApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { getNomineeImageUrl } from '../utils/imageUtils';

const VotesPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const [filters, setFilters] = useState({
        searchQuery: searchParams.get('search') || '',
        status: searchParams.get('status') || '',
        category: 'all'
    });
    const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

    // Determine category from URL path
    useEffect(() => {
        const path = location.pathname;
        if (path.includes('/upcoming')) {
            setFilters(prev => ({ ...prev, category: 'upcoming' }));
        } else if (path.includes('/popular')) {
            setFilters(prev => ({ ...prev, category: 'popular' }));
        } else if (path.includes('/ongoing')) {
            setFilters(prev => ({ ...prev, category: 'ongoing' }));
        } else if (path.includes('/past')) {
            setFilters(prev => ({ ...prev, category: 'past' }));
        } else {
            setFilters(prev => ({ ...prev, category: 'all' }));
        }
    }, [location.pathname]);

    // Get API endpoint based on category
    const getApiEndpoint = () => {
        switch (filters.category) {
            case 'upcoming':
                return () => votesApi.getUpcoming(filters);
            case 'popular':
                return () => votesApi.getPopular(filters);
            case 'ongoing':
                return () => votesApi.getOngoing(filters);
            case 'past':
                return () => votesApi.getPast(filters);
            default:
                return () => votesApi.getVotes(filters);
        }
    };

    const { data: votesData, isLoading, error } = useQuery({
        queryKey: ['votes', filters.category, filters.searchQuery, filters.status],
        queryFn: getApiEndpoint()
    });

    const votes = votesData?.data || [];
    const pagination = votesData ? {
        current_page: votesData.current_page,
        last_page: votesData.last_page,
        per_page: votesData.per_page,
        total: votesData.total
    } : null;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setFilters(prev => ({ ...prev, searchQuery: searchInput }));
        const newSearchParams = new URLSearchParams(searchParams);
        if (searchInput) {
            newSearchParams.set('search', searchInput);
        } else {
            newSearchParams.delete('search');
        }
        if (filters.status) {
            newSearchParams.set('status', filters.status);
        } else {
            newSearchParams.delete('status');
        }
        setSearchParams(newSearchParams);
    };

    const handleCategoryChange = (category: string) => {
        setFilters(prev => ({ ...prev, category }));

        // Navigate to appropriate URL
        const basePath = '/votes';
        let newPath = basePath;

        switch (category) {
            case 'upcoming':
                newPath = `${basePath}/upcoming`;
                break;
            case 'popular':
                newPath = `${basePath}/popular`;
                break;
            case 'ongoing':
                newPath = `${basePath}/ongoing`;
                break;
            case 'past':
                newPath = `${basePath}/past`;
                break;
            default:
                newPath = basePath;
        }

        window.history.pushState({}, '', newPath);
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'STARTED': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
            'COMPLETED': { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="w-4 h-4" /> },
            'INACTIVE': { color: 'bg-gray-100 text-gray-800', icon: <XCircle className="w-4 h-4" /> },
            'POSTPONED': { color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="w-4 h-4" /> }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['INACTIVE'];

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                {config.icon}
                <span className="ml-1">{status}</span>
            </span>
        );
    };

    const getCategoryTitle = () => {
        switch (filters.category) {
            case 'upcoming': return 'Upcoming';
            case 'popular': return 'Popular';
            case 'ongoing': return 'Ongoing';
            case 'past': return 'Past';
            default: return 'All';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="relative py-20 bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 text-white">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')"
                    }}
                ></div>
                <div className="absolute inset-0 bg-black/50"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">{getCategoryTitle()} Votings</h1>
                        <nav className="text-lg mb-8">
                            <Link to="/" className="text-gray-300 hover:text-white">Home</Link>
                            <span className="mx-2">•</span>
                            <Link to="/votes" className="text-gray-300 hover:text-white">Votes</Link>
                            <span className="mx-2">•</span>
                            <span className="text-white">{getCategoryTitle()}</span>
                        </nav>
                        <div className="w-24 h-1 bg-primary mx-auto"></div>
                    </div>
                </div>
            </section>

            {/* Filters Section */}
            <section className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Filter className="w-5 h-5 mr-2" />
                            Filter Below:
                        </h3>

                        <form onSubmit={handleSearch} className="grid md:grid-cols-4 gap-4">
                            {/* Category Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    Date Category
                                </label>
                                <select
                                    value={filters.category}
                                    onChange={(e) => handleCategoryChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="all">Select a Category</option>
                                    <option value="ongoing">Ongoing</option>
                                    <option value="popular">Popular</option>
                                    <option value="upcoming">Upcoming</option>
                                    <option value="past">Past</option>
                                </select>
                            </div>

                            {/* Search Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Search className="w-4 h-4 inline mr-1" />
                                    Search by anything
                                </label>
                                <input
                                    type="text"
                                    placeholder="Search Voting"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <AlertCircle className="w-4 h-4 inline mr-1" />
                                    Status
                                </label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="">Choose a Status</option>
                                    <option value="STARTED">STARTED</option>
                                    <option value="INACTIVE">INACTIVE</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                    <option value="POSTPONED">POSTPONED</option>
                                </select>
                            </div>

                            {/* Search Button */}
                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors duration-300 flex items-center justify-center"
                                >
                                    <Search className="w-4 h-4 mr-2" />
                                    Search
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            {/* Votes List */}
            <section className="py-12">
                <div className="container mx-auto px-4">
                    {votes.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-gray-400 mb-4">
                                <Eye className="w-24 h-24 mx-auto" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">No Voting Available</h2>
                            <p className="text-gray-600 mb-8">
                                Try adjusting your filters or check back later for new voting opportunities.
                            </p>
                            <Link
                                to="/votes"
                                className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-300"
                            >
                                View All Votes
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {votes.map((vote: any) => (
                                <div key={vote.vote_id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
                                    <div className="md:flex">
                                        {/* Vote Image */}
                                        <div className="md:w-1/3">
                                            <div className="relative h-64 md:h-full">
                                                <img
                                                    src={getNomineeImageUrl({ image: vote.image })}
                                                    alt={vote.name}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/20"></div>
                                            </div>
                                        </div>

                                        {/* Vote Content */}
                                        <div className="md:w-2/3 p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center space-x-3">
                                                    <img
                                                        src={vote.user?.image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'}
                                                        alt={vote.user?.nick_name || 'User'}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                    <div>
                                                        <p className="text-sm text-gray-600">Added By:</p>
                                                        <p className="font-semibold text-gray-900">{vote.user?.nick_name || 'Anonymous'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end space-y-2">
                                                    {getStatusBadge(vote.status)}
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {vote.payment_mode}
                                                    </span>
                                                </div>
                                            </div>

                                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                                <Link
                                                    to={`/votes/${vote.slug}/${vote.vote_id}`}
                                                    className="hover:text-primary transition-colors duration-300"
                                                >
                                                    {vote.name}
                                                </Link>
                                            </h3>

                                            <p className="text-gray-600 mb-4 line-clamp-2">
                                                {vote.description}
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                    <span className="flex items-center">
                                                        <Users className="w-4 h-4 mr-1" />
                                                        {vote.nominees?.length || 0} nominees
                                                    </span>
                                                    <span className="flex items-center">
                                                        <Star className="w-4 h-4 mr-1" />
                                                        {vote.total_votes || 0} votes
                                                    </span>
                                                    <span className="flex items-center">
                                                        <Clock className="w-4 h-4 mr-1" />
                                                        {new Date(vote.end_date).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                <Link
                                                    to={`/votes/${vote.slug}/${vote.vote_id}`}
                                                    className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-300"
                                                >
                                                    View Details
                                                    <Eye className="w-4 h-4 ml-2" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.last_page > 1 && (
                        <div className="mt-12 flex justify-center">
                            <nav className="flex items-center space-x-2">
                                {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ${page === pagination.current_page
                                            ? 'bg-primary text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    )}
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-4">Join our online community</h2>
                    <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                        Stay updated with the latest happenings. Every vote counts, and every event brings us closer. Let's shape the future together!
                    </p>
                    <Link
                        to="/register"
                        className="inline-flex items-center px-8 py-4 bg-white text-purple-600 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all duration-300"
                    >
                        Sign Up
                        <Users className="ml-2 w-5 h-5" />
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default VotesPage; 