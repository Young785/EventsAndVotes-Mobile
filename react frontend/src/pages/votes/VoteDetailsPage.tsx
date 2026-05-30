import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Calendar,
    Clock,
    Users,
    CheckCircle,
    Trophy,
    ArrowLeft,
    AlertCircle,
    PlayCircle,
    StopCircle,
    UserPlus,
    Vote
} from 'lucide-react';
import { votesApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { format, parseISO, isAfter, isBefore, differenceInSeconds } from 'date-fns';

interface CountdownProps {
    targetDate: string;
    label: string;
    onExpiry?: () => void;
}

const Countdown: React.FC<CountdownProps> = ({ targetDate, label, onExpiry }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const difference = target - now;

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                setTimeLeft({ days, hours, minutes, seconds });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                setIsExpired(true);
                if (onExpiry) onExpiry();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate, onExpiry]);

    if (isExpired) {
        return (
            <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                <StopCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-red-600 font-semibold">{label} has ended</p>
            </div>
        );
    }

    return (
        <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <Clock className="w-12 h-12 text-blue-500 mx-auto mb-3 animate-pulse" />
            <p className="text-sm text-gray-600 mb-4">{label}</p>
            <div className="grid grid-cols-4 gap-4">
                {[
                    { value: timeLeft.days, label: 'Days' },
                    { value: timeLeft.hours, label: 'Hours' },
                    { value: timeLeft.minutes, label: 'Minutes' },
                    { value: timeLeft.seconds, label: 'Seconds' }
                ].map(({ value, label }) => (
                    <div key={label} className="bg-white rounded-lg shadow-sm p-3">
                        <div className="text-2xl font-bold text-blue-600">{value.toString().padStart(2, '0')}</div>
                        <div className="text-xs text-gray-500">{label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const VoteDetailsPage: React.FC = () => {
    const { voteId, slug } = useParams<{ voteId: string; slug: string }>();
    const navigate = useNavigate();
    const [currentPhase, setCurrentPhase] = useState<string>('');

    const { data: voteData, isLoading, error } = useQuery({
        queryKey: ['vote-details', slug, voteId],
        queryFn: async () => {
            if (!voteId || !slug) throw new Error('Vote ID and slug are required');

            // Fetch vote details from the API
            const response = await fetch(`${import.meta.env.VITE_API_URL}/votes/${slug}/${voteId}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch vote details');
            }

            return response.json();
        },
        enabled: !!voteId && !!slug
    });

    const vote = voteData?.data;

    // Determine current phase
    useEffect(() => {
        if (!vote) return;

        const now = new Date();
        const nominationStart = new Date(vote.nomination_start);
        const nominationEnd = new Date(vote.nomination_end_date);
        const votingStart = new Date(vote.start_date);
        const votingEnd = new Date(vote.end_date);

        if (isBefore(now, nominationStart)) {
            setCurrentPhase('upcoming');
        } else if (isBefore(now, nominationEnd)) {
            setCurrentPhase('nomination');
        } else if (isBefore(now, votingStart)) {
            setCurrentPhase('waiting');
        } else if (isBefore(now, votingEnd)) {
            setCurrentPhase('voting');
        } else {
            setCurrentPhase('ended');
        }
    }, [vote]);

    const getPhaseInfo = () => {
        if (!vote) return null;

        const now = new Date();

        switch (currentPhase) {
            case 'upcoming':
                return {
                    title: 'Nomination Period Starting Soon',
                    description: 'Get ready! Nominations will open soon.',
                    targetDate: vote.nomination_start,
                    countdown: 'Time until nominations open',
                    color: 'blue',
                    icon: <UserPlus className="w-8 h-8" />
                };
            case 'nomination':
                return {
                    title: 'Nominations Are Open',
                    description: 'Submit your nominations now!',
                    targetDate: vote.nomination_end_date,
                    countdown: 'Nominations close in',
                    color: 'green',
                    icon: <UserPlus className="w-8 h-8" />
                };
            case 'waiting':
                return {
                    title: 'Voting Starts Soon',
                    description: 'Nominations have closed. Voting will begin shortly.',
                    targetDate: vote.start_date,
                    countdown: 'Voting starts in',
                    color: 'yellow',
                    icon: <Clock className="w-8 h-8" />
                };
            case 'voting':
                return {
                    title: 'Voting Is Live!',
                    description: 'Cast your votes now!',
                    targetDate: vote.end_date,
                    countdown: 'Voting ends in',
                    color: 'purple',
                    icon: <Vote className="w-8 h-8" />
                };
            case 'ended':
                return {
                    title: 'Voting Has Ended',
                    description: 'Thank you for participating! Results will be announced soon.',
                    targetDate: null,
                    countdown: null,
                    color: 'gray',
                    icon: <CheckCircle className="w-8 h-8" />
                };
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    if (error || !vote) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Vote Not Found</h1>
                    <p className="text-gray-600 mb-4">The vote you're looking for doesn't exist or has been removed.</p>
                    <Link
                        to="/votes"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Votes
                    </Link>
                </div>
            </div>
        );
    }

    const phaseInfo = getPhaseInfo();
    const colorClasses = {
        blue: 'bg-blue-500 text-white',
        green: 'bg-green-500 text-white',
        yellow: 'bg-yellow-500 text-white',
        purple: 'bg-purple-500 text-white',
        gray: 'bg-gray-500 text-white'
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <Link
                    to="/votes"
                    className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Votes
                </Link>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{vote.name}</h1>
                <p className="text-lg text-gray-600">{vote.description}</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Phase Status & Countdown */}
                    {phaseInfo && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-4 ${colorClasses[phaseInfo.color as keyof typeof colorClasses]}`}>
                                {phaseInfo.icon}
                                <span className="ml-2">{phaseInfo.title}</span>
                            </div>
                            <p className="text-gray-600 mb-6">{phaseInfo.description}</p>

                            {phaseInfo.targetDate && phaseInfo.countdown && (
                                <Countdown
                                    targetDate={phaseInfo.targetDate}
                                    label={phaseInfo.countdown}
                                />
                            )}
                        </div>
                    )}

                    {/* Vote Information */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Vote</h2>
                        <div className="prose max-w-none">
                            <p className="text-gray-700 leading-relaxed">{vote.description}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4">
                        {currentPhase === 'nomination' && (
                            <Link
                                to={`/votes/${vote.slug}/${vote.vote_id}/contest`}
                                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                                <Trophy className="w-5 h-5 mr-2" />
                                Submit Nomination
                            </Link>
                        )}

                        {currentPhase === 'voting' && (
                            <Link
                                to={`/votes/${vote.slug}/${vote.vote_id}/voting`}
                                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                            >
                                <Vote className="w-5 h-5 mr-2" />
                                Cast Your Vote
                            </Link>
                        )}

                        <Link
                            to={`/votes/${vote.slug}/${vote.vote_id}/results`}
                            className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                        >
                            <Trophy className="w-5 h-5 mr-2" />
                            View Results
                        </Link>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Vote Details Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vote Details</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Status</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${vote.status === 'STARTED' ? 'bg-green-100 text-green-800' :
                                    vote.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                        vote.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                                            'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {vote.status}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Payment Mode</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${vote.payment_mode === 'FREE' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                    {vote.payment_mode}
                                </span>
                            </div>

                            {vote.payment_mode === 'PAID' && (
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Price per Vote</span>
                                    <span className="font-medium">₦{parseFloat(vote.price_per_vote).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timeline Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Nominations Start', date: vote.nomination_start, icon: <UserPlus className="w-4 h-4" /> },
                                { label: 'Nominations End', date: vote.nomination_end_date, icon: <StopCircle className="w-4 h-4" /> },
                                { label: 'Voting Starts', date: vote.start_date, icon: <PlayCircle className="w-4 h-4" /> },
                                { label: 'Voting Ends', date: vote.end_date, icon: <StopCircle className="w-4 h-4" /> }
                            ].map((item, index) => (
                                <div key={index} className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                        {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                                        <p className="text-sm text-gray-600">
                                            {format(parseISO(item.date), 'MMM dd, yyyy - hh:mm a')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoteDetailsPage; 