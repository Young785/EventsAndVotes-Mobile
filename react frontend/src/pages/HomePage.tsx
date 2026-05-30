import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    Users,
    Calendar,
    TrendingUp,
    CheckCircle,
    Eye,
    BarChart3,
    Shield,
    Star,
    MessageCircle,
    Clock,
    MapPin
} from 'lucide-react';


import { useQuery } from '@tanstack/react-query';
import { votesApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useSettings } from '../hooks/useSettings';
import { getVoteImageUrl } from '../utils/imageUtils';

const HomePage: React.FC = () => {
    const { settings, loading: settingsLoading, error: settingsError } = useSettings();
    const [stats, setStats] = useState({
        newVisitors: 0,
        happyCustomers: 0,
        voteCategories: 0,
        eventCategories: 0
    });

    // Fetch featured votes
    const { data: featuredVotes, isLoading } = useQuery({
        queryKey: ['featured-votes'],
        queryFn: () => votesApi.getVotes({ page: 1 })
    });

    // Animate counters
    useEffect(() => {
        const animateCounter = (target: number, setter: (value: number) => void) => {
            let current = 0;
            const increment = target / 100;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    setter(target);
                    clearInterval(timer);
                } else {
                    setter(Math.floor(current));
                }
            }, 20);
        };

        animateCounter(5, (value) => setStats(prev => ({ ...prev, newVisitors: value })));
        animateCounter(100, (value) => setStats(prev => ({ ...prev, happyCustomers: value })));
        animateCounter(50, (value) => setStats(prev => ({ ...prev, voteCategories: value })));
        animateCounter(20, (value) => setStats(prev => ({ ...prev, eventCategories: value })));
    }, []);

    // Show loading spinner while settings are loading
    if (settingsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // Show error message if settings failed to load
    if (settingsError) {
        console.error('Settings error:', settingsError);
        // Continue to render with default values
    }

    const testimonials = [
        {
            id: 1,
            name: "John",
            role: "Event Organizer",
            rating: 5,
            text: "Events and Votes has transformed the way we manage our annual conferences. The seamless event management tools and real-time voting features have significantly increased attendee engagement. The support team is always responsive and helpful. Highly recommend!"
        },
        {
            id: 2,
            name: "Big Sammy",
            role: "Event Organizer",
            rating: 4,
            text: "Events and Votes made organizing our community fundraiser a breeze. The registration process was simple, and the real-time voting kept everyone engaged throughout the event. The detailed analytics were an added bonus, helping us plan better for the future."
        },
        {
            id: 3,
            name: "Manny",
            role: "Corporate Event Planner",
            rating: 5,
            text: "As a corporate event planner, I've used various tools, but Events and Votes stands out for its ease of use and excellent customer support. The live voting feature added an interactive element to our meetings that was very well received by attendees."
        },
        {
            id: 4,
            name: "Anonymous",
            role: "Workshop Participant",
            rating: 4,
            text: "I attended a conference that used Events and Votes, and it was fantastic! The live voting feature allowed us to choose topics we were most interested in, and the event was organized so smoothly. It made the whole experience interactive and fun."
        }
    ];

    const features = [
        {
            icon: <MapPin className="w-8 h-8" />,
            title: "Discover Events",
            description: "Find exciting events in your area and connect with like-minded people. Browse through various categories and discover new opportunities to engage with your community."
        },
        {
            icon: <MessageCircle className="w-8 h-8" />,
            title: "Connect with Organizers",
            description: "Get in touch with event organizers directly through our platform. Ask questions, get updates, and stay informed about all the details you need to know."
        },
        {
            icon: <CheckCircle className="w-8 h-8" />,
            title: "Participate & Vote",
            description: "Make your voice heard by participating in votes and polls. Your opinion matters, and every vote contributes to shaping the future of events and decisions."
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-secondary-900 transition-colors duration-300">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-950">
                <div className="absolute inset-0 bg-black/40 dark:bg-black/60"></div>
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 dark:opacity-10"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')"
                    }}
                ></div>

                <div className="relative z-10 text-center text-white max-w-5xl mx-auto px-4 py-20">
                    <div className="mb-6 inline-block px-4 py-2 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-full text-sm font-medium border border-white/20">
                        ✨ Welcome to Events & Votes Platform
                    </div>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 animate-fade-in-up leading-tight">
                        Stay Informed <br className="hidden sm:block" />
                        <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 dark:from-yellow-400 dark:via-orange-400 dark:to-pink-400 bg-clip-text text-transparent">
                            and Involved
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl mb-10 text-gray-100 dark:text-gray-200 max-w-3xl mx-auto animate-fade-in leading-relaxed">
                        Explore exciting events, participate in voting opportunities, and make your voice heard in shaping the future.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center px-8 py-4 bg-white text-primary-700 dark:bg-primary-600 dark:text-white rounded-full text-lg font-semibold hover:bg-gray-100 dark:hover:bg-primary-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl animate-fade-in-up"
                        >
                            Get Started
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                        <Link
                            to="/earn"
                            className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-white text-white rounded-full text-lg font-semibold hover:bg-white hover:text-primary-700 dark:hover:bg-white/10 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm animate-fade-in-up"
                        >
                            Start Earning
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                    </div>

                    {/* Floating elements */}
                    <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse-slow"></div>
                    <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl animate-pulse-slow"></div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
                    <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
                        <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
                    </div>
                </div>
            </section>

            {/* Featured Categories Section */}
            <section className="py-20 bg-gray-50 dark:bg-secondary-800 transition-colors duration-300">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm uppercase tracking-wider">Catalog of Categories</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 mt-2">Featured Categories</h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-purple-500 mx-auto mb-6"></div>
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            Explore some of the best events and voting opportunities from around the community, curated by our partners and friends.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                        <div className="relative group overflow-hidden rounded-2xl shadow-xl dark:shadow-2xl hover:shadow-2xl dark:hover:shadow-primary-500/20 transition-all duration-300">
                            <div
                                className="h-72 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                style={{
                                    backgroundImage: "url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')"
                                }}
                            ></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                <div className="bg-primary-600 dark:bg-primary-500 px-4 py-1.5 rounded-full text-sm mb-3 inline-block font-medium shadow-lg">
                                    <MapPin className="w-3 h-3 inline mr-1" />
                                    10 Locations
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold mb-2 group-hover:text-primary-300 transition-colors">Conference and Event</h3>
                                <p className="text-gray-200 dark:text-gray-300">Professional conferences with networking opportunities and expert speakers</p>
                            </div>
                        </div>

                        <div className="relative group overflow-hidden rounded-2xl shadow-xl dark:shadow-2xl hover:shadow-2xl dark:hover:shadow-primary-500/20 transition-all duration-300">
                            <div
                                className="h-72 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                style={{
                                    backgroundImage: "url('https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')"
                                }}
                            ></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                <div className="bg-primary-600 dark:bg-primary-500 px-4 py-1.5 rounded-full text-sm mb-3 inline-block font-medium shadow-lg">
                                    <MapPin className="w-3 h-3 inline mr-1" />
                                    6 Locations
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold mb-2 group-hover:text-primary-300 transition-colors">Cafe - Pub</h3>
                                <p className="text-gray-200 dark:text-gray-300">Casual meetups and social gatherings in comfortable settings</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <Link
                            to="/votes"
                            className="inline-flex items-center px-8 py-4 bg-primary-600 dark:bg-primary-500 text-white rounded-full text-lg font-semibold hover:bg-primary-700 dark:hover:bg-primary-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            View All
                            <Eye className="ml-2 w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Earn Money Section */}
            <section className="py-20 bg-white dark:bg-secondary-900 transition-colors duration-300">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm uppercase tracking-wider">Multiple Ways to Earn</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 mt-2">Earn Money with Us</h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-emerald-500 mx-auto mb-6"></div>
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            Join our referral program and start earning money by sharing {settings?.site_name || 'Events & Votes'} with your network.
                        </p>
                    </div>

                    {settingsLoading ? (
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 dark:border-primary-400 mx-auto"></div>
                        </div>
                    ) : settingsError || !settings ? (
                        <div className="text-center text-gray-500 dark:text-gray-400">
                            <p>Unable to load earning information</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-3 gap-8 mb-12">
                            <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-secondary-800 dark:to-secondary-700 rounded-2xl shadow-lg hover:shadow-xl dark:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-secondary-600">
                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                    <Users className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Refer Friends</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">Share your unique referral link with friends and family</p>
                                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">{settings.currency_icon || '$'}{settings.commission_rates?.user_registration || 5}</div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">per successful referral</p>
                            </div>

                            <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-secondary-800 dark:to-secondary-700 rounded-2xl shadow-lg hover:shadow-xl dark:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-secondary-600">
                                <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                    <BarChart3 className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Event Hosting</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">Host events and earn commission from ticket sales</p>
                                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">{settings.commission_rates?.event_purchase || 10}%</div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">commission on sales</p>
                            </div>

                            <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-secondary-800 dark:to-secondary-700 rounded-2xl shadow-lg hover:shadow-xl dark:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-secondary-600">
                                <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                    <Shield className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Premium Membership</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">Upgrade referrals to premium and earn more</p>
                                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">{settings.commission_rates?.subscription || 15}%</div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">per premium upgrade</p>
                            </div>
                        </div>
                    )}

                    <div className="text-center">
                        <Link
                            to="/earn"
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white rounded-full text-lg font-semibold hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            Start Earning Now
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Community Section */}
            <section className="py-20 bg-gradient-to-br from-primary-600 to-purple-600 dark:from-primary-800 dark:to-purple-900 text-white relative overflow-hidden transition-colors duration-300">
                <div className="absolute inset-0 opacity-10 dark:opacity-20">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-white dark:bg-white/30 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-48 h-48 bg-white dark:bg-white/30 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white dark:bg-white/30 rounded-full blur-3xl"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="relative">
                            <div className="text-6xl font-bold opacity-20 absolute -top-8 -left-4">
                                Events<span className="text-yellow-400">AndVotes</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <img
                                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
                                        alt="Community member"
                                        className="w-full h-48 object-cover rounded-lg"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <img
                                        src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
                                        alt="Community member"
                                        className="w-full h-20 object-cover rounded-lg"
                                    />
                                    <img
                                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
                                        alt="Community member"
                                        className="w-full h-20 object-cover rounded-lg"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <img
                                        src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
                                        alt="Community member"
                                        className="w-full h-32 object-cover rounded-lg"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <img
                                        src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
                                        alt="Community member"
                                        className="w-full h-24 object-cover rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-4xl md:text-5xl font-bold mb-6">Join our online community</h3>
                            <p className="text-xl mb-8 text-gray-100 dark:text-gray-200 leading-relaxed">
                                Stay updated with the latest happenings. Every vote counts, and every event brings us closer. Let's shape the future together!
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center px-8 py-4 bg-white text-primary-700 dark:bg-white/95 dark:text-primary-800 rounded-full text-lg font-semibold hover:bg-gray-100 dark:hover:bg-white transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
                            >
                                Sign In Now
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 bg-white dark:bg-secondary-900 transition-colors duration-300">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm uppercase tracking-wider">Discover & Connect</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 mt-2">How it works</h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-purple-500 mx-auto mb-6"></div>
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            Get started with Events & Votes in three simple steps and become part of our growing community.
                        </p>
                    </div>

                    <div className="relative">
                        <div className="grid md:grid-cols-3 gap-8">
                            {features.map((feature, index) => (
                                <div key={index} className="text-center relative p-6 rounded-2xl hover:bg-gray-50 dark:hover:bg-secondary-800 transition-all duration-300 group">
                                    <div className="bg-gradient-to-br from-primary-600 to-purple-600 dark:from-primary-500 dark:to-purple-500 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                                        {feature.icon}
                                    </div>
                                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-6xl font-bold text-gray-100 dark:text-secondary-800 -z-10">
                                        0{index + 1}
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{feature.title}</h4>
                                    <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                                    {index < features.length - 1 && (
                                        <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary-200 to-transparent dark:from-primary-800 dark:to-transparent transform translate-x-8"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="text-center mt-12">
                            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                                <CheckCircle className="w-7 h-7" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Statistics Section */}
            <section className="py-20 bg-gradient-to-br from-primary-600 to-indigo-700 dark:from-primary-800 dark:to-indigo-950 text-white relative overflow-hidden transition-colors duration-300">
                <div className="absolute inset-0 opacity-10 dark:opacity-20">
                    <div className="absolute top-10 right-10 w-32 h-32 bg-white dark:bg-white/30 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 left-10 w-48 h-48 bg-white dark:bg-white/30 rounded-full blur-3xl"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="text-center p-6 rounded-2xl backdrop-blur-sm bg-white/5 dark:bg-white/10 hover:bg-white/10 dark:hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                            <div className="text-5xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-yellow-300 to-orange-300 dark:from-yellow-200 dark:to-orange-200 bg-clip-text text-transparent">{stats.newVisitors}</div>
                            <h6 className="text-base md:text-lg text-gray-100 dark:text-gray-200">New Visitors Every Week</h6>
                        </div>
                        <div className="text-center p-6 rounded-2xl backdrop-blur-sm bg-white/5 dark:bg-white/10 hover:bg-white/10 dark:hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                            <div className="text-5xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-green-300 to-emerald-300 dark:from-green-200 dark:to-emerald-200 bg-clip-text text-transparent">{stats.happyCustomers}</div>
                            <h6 className="text-base md:text-lg text-gray-100 dark:text-gray-200">Happy customers every year</h6>
                        </div>
                        <div className="text-center p-6 rounded-2xl backdrop-blur-sm bg-white/5 dark:bg-white/10 hover:bg-white/10 dark:hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                            <div className="text-5xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-blue-300 to-cyan-300 dark:from-blue-200 dark:to-cyan-200 bg-clip-text text-transparent">{stats.voteCategories}</div>
                            <h6 className="text-base md:text-lg text-gray-100 dark:text-gray-200">Total vote categories</h6>
                        </div>
                        <div className="text-center p-6 rounded-2xl backdrop-blur-sm bg-white/5 dark:bg-white/10 hover:bg-white/10 dark:hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                            <div className="text-5xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-pink-300 to-purple-300 dark:from-pink-200 dark:to-purple-200 bg-clip-text text-transparent">{stats.eventCategories}</div>
                            <h6 className="text-base md:text-lg text-gray-100 dark:text-gray-200">Total events categories</h6>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 bg-gray-50 dark:bg-secondary-800 transition-colors duration-300">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm uppercase tracking-wider">Clients Reviews</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 mt-2">Testimonials</h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 mx-auto mb-6"></div>
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            Below are the testimonials from our customers.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {testimonials.slice(0, 3).map((testimonial) => (
                            <div key={testimonial.id} className="bg-white dark:bg-secondary-700 p-8 rounded-2xl shadow-lg dark:shadow-2xl hover:shadow-xl dark:hover:shadow-primary-500/10 transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-secondary-600">
                                <div className="flex mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-5 h-5 ${i < testimonial.rating 
                                                ? 'text-yellow-400 fill-yellow-400' 
                                                : 'text-gray-300 dark:text-gray-600'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 mb-6 italic leading-relaxed">"{testimonial.text}"</p>
                                <div className="flex items-center">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold mr-4">
                                        {testimonial.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">{testimonial.name}</h4>
                                        <span className="text-gray-500 dark:text-gray-400 text-sm">{testimonial.role}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Call to Action Section */}
            <section className="py-20 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-800 dark:via-pink-800 dark:to-blue-800 text-white relative overflow-hidden transition-colors duration-300">
                <div className="absolute inset-0 opacity-10 dark:opacity-20">
                    <div
                        className="w-full h-full bg-cover bg-center"
                        style={{
                            backgroundImage: "url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')"
                        }}
                    ></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="md:w-2/3 text-center md:text-left">
                            <h3 className="text-4xl md:text-5xl font-bold mb-4">Do You Have Questions?</h3>
                            <p className="text-xl text-gray-100 dark:text-gray-200">
                                Feel free to reach out to us by clicking the button. We're here to help!
                            </p>
                        </div>
                        <div className="md:w-1/3 text-center md:text-right">
                            <Link
                                to="/contact"
                                className="inline-flex items-center px-8 py-4 bg-white text-purple-700 dark:bg-white/95 dark:text-purple-800 rounded-full text-lg font-semibold hover:bg-gray-100 dark:hover:bg-white transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
                            >
                                Get In Touch
                                <MessageCircle className="ml-2 w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Votes Section */}
            {featuredVotes?.data && featuredVotes.data.length > 0 && (
                <section className="py-20 bg-white dark:bg-secondary-900 transition-colors duration-300">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm uppercase tracking-wider">Latest Voting Events</span>
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 mt-2">Featured Votes</h2>
                            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto mb-6"></div>
                            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                                Participate in the latest voting events and make your voice heard.
                            </p>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center">
                                <LoadingSpinner />
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {featuredVotes.data.slice(0, 6).map((vote: any) => (
                                    <div key={vote.vote_id} className="bg-white dark:bg-secondary-800 rounded-2xl shadow-lg dark:shadow-2xl overflow-hidden hover:shadow-xl dark:hover:shadow-primary-500/20 transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-secondary-700">
                                        <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative overflow-hidden group">
                                            <img
                                                src={getVoteImageUrl({ image: vote.image }) || getVoteImageUrl({ image: '/images/default-vote.jpg' })}
                                                alt={vote.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        </div>
                                        <div className="p-6">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">{vote.name}</h3>
                                            <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{vote.description}</p>
                                            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-4 gap-2">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    <span className="text-xs">Start: {new Date(vote.start_date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    <span className="text-xs">End: {new Date(vote.end_date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <Link
                                                to={`/votes/${vote.slug}/${vote.vote_id}`}
                                                className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold transition-colors"
                                            >
                                                View Details
                                                <ArrowRight className="ml-1 w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
};

export default HomePage; 