import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search,
    Filter,
    Users,
    Calendar,
    MapPin,
    Clock,
    ChevronDown,
    ChevronUp,
    ShoppingCart,
    Plus,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    Star,
    Award,
    Vote as VoteIcon,
    User,
    Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../hooks/useCart';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { getNomineeImageUrl } from '../utils/imageUtils';

interface Vote {
    vote_id: string;
    name: string;
    description: string;
    slug: string;
    image: string;
    status: string;
    start_date: string;
    end_date: string;
    nomination_start: string;
    nomination_end_date: string;
    price_per_vote: number;
    payment_mode: string;
}

interface Position {
    position_id: string;
    title: string;
    gender: string;
    description?: string;
    minimum?: number;
    maximum?: number;
}

interface Nominee {
    nominees_id: string;
    first_name: string;
    last_name: string;
    nick_name: string;
    level: string;
    image?: string;
    phone: string;
    email?: string;
    total_votes: number;
    position: Position;
}

interface CartItem {
    id: string;
    quantity: number;
}

// API functions
const fetchVoteDetails = async (slug: string, id: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/votes/${slug}/${id}`);
    if (!response.ok) {
        console.error('Vote details fetch error:', response.status, response.statusText);
        throw new Error('Failed to fetch vote details');
    }
    const data = await response.json();
    console.log('Vote details response:', data);
    return data;
};

const fetchContestDetails = async (slug: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/contest/${slug}`);
    if (!response.ok) {
        console.error('Contest details fetch error:', response.status, response.statusText);
        throw new Error('Failed to fetch contest details');
    }
    const data = await response.json();
    console.log('Contest details response:', data);
    return data;
};

const fetchNominees = async (slug: string, voteId: string, params?: any) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${import.meta.env.VITE_API_URL}/contest/nominees/${slug}/${voteId}?${query}`);
    if (!response.ok) {
        console.error('Nominees fetch error:', response.status, response.statusText);
        throw new Error('Failed to fetch nominees');
    }
    const data = await response.json();
    console.log('Nominees response:', data);
    return data;
};

const fetchPositions = async (slug: string, voteId: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/contest/positions/${slug}/${voteId}`);
    if (!response.ok) {
        console.error('Positions fetch error:', response.status, response.statusText);
        // If positions endpoint fails, try to get positions from nominees endpoint
        return null;
    }
    const data = await response.json();
    console.log('Positions response:', data);
    return data;
};

const VotingContestPage: React.FC = () => {
    const { slug, id } = useParams<{ slug: string; id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPosition, setSelectedPosition] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    // Fetch contest details first
    const { data: contestData, isLoading: contestLoading, error: contestError } = useQuery({
        queryKey: ['contest-details', slug],
        queryFn: () => fetchContestDetails(slug!),
        enabled: !!slug,
        retry: 2
    });

    // Get vote ID from contest data
    const voteId = contestData?.data?.vote?.vote_id || id;

    // Fetch vote details as fallback
    const { data: voteData, isLoading: voteLoading, error: voteError } = useQuery({
        queryKey: ['vote-details', slug, voteId],
        queryFn: () => fetchVoteDetails(slug!, voteId!),
        enabled: !!slug && !!voteId && !contestData,
        retry: 2
    });

    // Fetch nominees with filters
    const { data: nomineesData, isLoading: nomineesLoading } = useQuery({
        queryKey: ['vote-nominees', slug, voteId],
        queryFn: () => fetchNominees(slug!, voteId!),
        enabled: !!slug && !!voteId,
        retry: 2
    });

    // Fetch positions
    const { data: positionsData } = useQuery({
        queryKey: ['vote-positions', slug, voteId],
        queryFn: () => fetchPositions(slug!, voteId!),
        enabled: !!slug && !!voteId,
        retry: 2
    });

    // Use the primary data source (contest data first, then vote data as fallback)
    const vote: Vote = contestData?.data?.vote || voteData?.data;
    const nominees: Nominee[] = nomineesData?.data?.nominees || [];
    const positions: Position[] = positionsData?.data?.positions || nomineesData?.data?.positions || contestData?.data?.positions || [];

    // Check if we're still loading
    const isLoading = contestLoading || (voteLoading && !contestData) || nomineesLoading;

    console.log('Debug info:', {
        slug,
        id,
        voteId,
        contestLoading,
        voteLoading,
        nomineesLoading,
        vote: vote?.name || 'No vote loaded',
        nominees: nominees.length,
        positions: positions.length,
        contestData: contestData?.data ? 'Has contest data' : 'No contest data',
        voteData: voteData?.data ? 'Has vote data' : 'No vote data'
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        )
    }

    if (contestError && voteError) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Contest Not Found</h2>
                    <p className="text-gray-600 mb-4">The contest you're looking for doesn't exist or is not available.</p>
                    <p className="text-sm text-gray-500 mb-4">
                        Error: {contestError?.message || voteError?.message}
                    </p>
                    <Link to="/votes" className="text-blue-600 hover:text-blue-700">
                        Back to Votes
                    </Link>
                </div>
            </div>
        )
    }

    if (!vote) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Contest Not Available</h2>
                    <p className="text-gray-600 mb-4">This contest is not currently available for viewing.</p>
                    <Link to="/votes" className="text-blue-600 hover:text-blue-700">
                        Back to Votes
                    </Link>
                </div>
            </div>
        )
    }

    // Check if nomination is active
    const nominationActive = contestData?.data?.nomination_active ||
        (vote.nomination_end_date && new Date(vote.nomination_end_date) > new Date());

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            {/* Header */}
            <div className="bg-white dark:bg-secondary-900 shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">{vote.name}</h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
                            {vote.description}
                        </p>

                        {/* Contest Status */}
                        <div className="flex items-center justify-center space-x-6 text-sm">
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span>Nomination: {new Date(vote.nomination_start).toLocaleDateString()} - {new Date(vote.nomination_end_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <User className="w-4 h-4 mr-2" />
                                <span>{nominees.length} nominees</span>
                            </div>
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <MapPin className="w-4 h-4 mr-2" />
                                <span>{positions.length} positions</span>
                            </div>
                        </div>

                        {/* Nomination Status */}
                        <div className={`mt-6 inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${nominationActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {nominationActive ? 'Nominations Open' : 'Nominations Closed'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Nomination Form Link */}
                {nominationActive && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-blue-900 mb-2">Submit Your Nomination</h3>
                            <p className="text-blue-700 mb-4">
                                Nominations are currently open. Submit your nomination to participate in this contest.
                            </p>
                            <Link
                                to={`/contest/${slug}`}
                                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Submit Nomination
                            </Link>
                        </div>
                    </div>
                )}

                {/* Positions Grid */}
                {positions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {positions.map((position: Position) => {
                            const positionNominees = nominees.filter(n => n.position?.position_id === position.position_id);
                            return (
                                <div key={position.position_id} className="bg-white dark:bg-secondary-900 rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{position.title}</h3>
                                    {position.description && (
                                        <p className="text-gray-600 mb-4">{position.description}</p>
                                    )}
                                    <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center justify-between">
                                            <span>Gender:</span>
                                            <span className="font-medium">{position.gender}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Nominees:</span>
                                            <span className="font-medium">{positionNominees.length}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Min/Max:</span>
                                            <span className="font-medium">{position.minimum} - {position.maximum}</span>
                                        </div>
                                    </div>

                                    {positionNominees.length > 0 && (
                                        <div className="mt-4">
                                            <Link
                                                to={`/votes/${slug}/${voteId}?position=${position.position_id}`}
                                                className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                                            >
                                                View Nominees
                                                <ArrowRight className="w-4 h-4 ml-1" />
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <MapPin className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Positions Available</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            No positions have been created for this contest yet.
                        </p>
                    </div>
                )}

                {/* Recent Nominees */}
                {nominees.length > 0 && (
                    <div className="bg-white dark:bg-secondary-900 rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Nominees</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {nominees.slice(0, 8).map((nominee: Nominee) => (
                                <div key={nominee.nominees_id} className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-200 flex items-center justify-center">
                                        {nominee.image ? (
                                            <img
                                                src={getNomineeImageUrl({ image: nominee.image }) || getNomineeImageUrl({ image: '/default-avatar.jpg' })}
                                                alt={`${nominee.first_name} ${nominee.last_name}`}
                                                className="w-16 h-16 rounded-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-8 h-8 text-gray-400" />
                                        )}
                                    </div>
                                    <h4 className="font-medium text-gray-900 text-sm">
                                        {nominee.first_name} {nominee.last_name}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{nominee.position?.title}</p>
                                </div>
                            ))}
                        </div>

                        {nominees.length > 8 && (
                            <div className="text-center mt-6">
                                <Link
                                    to={`/votes/${slug}/${voteId}`}
                                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    View All Nominees
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                    <Link
                        to={`/votes/${slug}/${voteId}`}
                        className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <VoteIcon className="w-5 h-5 mr-2" />
                        Start Voting
                    </Link>

                    <Link
                        to={`/votes/${slug}/${voteId}/results`}
                        className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <Eye className="w-5 h-5 mr-2" />
                        View Results
                    </Link>
                </div>
            </div>
        </div>
    )
};

export default VotingContestPage; 