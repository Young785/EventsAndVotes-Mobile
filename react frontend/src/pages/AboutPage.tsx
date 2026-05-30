import React from 'react';
import { Link } from 'react-router-dom';
import {
    Users,
    Target,
    Shield,
    Award,
    Heart,
    Globe,
    ArrowRight,
    CheckCircle,
    Star,
    TrendingUp
} from 'lucide-react';
import { getNomineeImageUrl } from '../utils/imageUtils'

const AboutPage: React.FC = () => {
    const stats = [
        { label: 'Active Users', value: '50,000+', icon: <Users className="w-8 h-8" /> },
        { label: 'Votes Created', value: '10,000+', icon: <Target className="w-8 h-8" /> },
        { label: 'Events Hosted', value: '5,000+', icon: <Globe className="w-8 h-8" /> },
        { label: 'Success Rate', value: '99.9%', icon: <Award className="w-8 h-8" /> }
    ];

    const features = [
        {
            icon: <Shield className="w-12 h-12" />,
            title: "Secure & Reliable",
            description: "Bank-level security with encrypted data transmission and secure authentication to protect your votes and events."
        },
        {
            icon: <Users className="w-12 h-12" />,
            title: "User-Friendly",
            description: "Intuitive interface designed for everyone. Create and participate in votes and events with just a few clicks."
        },
        {
            icon: <TrendingUp className="w-12 h-12" />,
            title: "Real-Time Analytics",
            description: "Get instant insights with comprehensive analytics and real-time reporting for all your voting activities."
        },
        {
            icon: <Globe className="w-12 h-12" />,
            title: "Global Reach",
            description: "Connect with participants worldwide. Our platform supports multiple languages and time zones."
        },
        {
            icon: <Heart className="w-12 h-12" />,
            title: "24/7 Support",
            description: "Our dedicated support team is available round the clock to help you with any questions or issues."
        },
        {
            icon: <Star className="w-12 h-12" />,
            title: "Premium Features",
            description: "Advanced customization options, detailed analytics, and priority support for premium subscribers."
        }
    ];

    const team = [
        {
            name: "Ariyo Ayomikun",
            role: "Founder & CEO",
            image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            description: "Passionate about democratizing decision-making through technology."
        },
        {
            name: "Sarah Johnson",
            role: "CTO",
            image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            description: "Leading our technical innovation and platform development."
        },
        {
            name: "Michael Chen",
            role: "Head of Product",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            description: "Ensuring our platform meets the evolving needs of our users."
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="relative py-20 bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 text-white">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')"
                    }}
                ></div>
                <div className="absolute inset-0 bg-black/50"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">About Events & Votes</h1>
                        <nav className="text-lg mb-8">
                            <Link to="/" className="text-gray-300 hover:text-white">Home</Link>
                            <span className="mx-2">•</span>
                            <span className="text-white">About Us</span>
                        </nav>
                        <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
                        <p className="text-xl opacity-90 max-w-3xl mx-auto">
                            Empowering communities to make decisions together through secure, transparent, and user-friendly voting and event management solutions.
                        </p>
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-4xl font-bold text-gray-900 mb-8">Our Mission</h2>
                        <p className="text-xl text-gray-700 leading-relaxed mb-12">
                            At Events & Votes, we believe that every voice matters. Our mission is to democratize decision-making
                            by providing accessible, secure, and transparent platforms for voting and event management. We're committed
                            to fostering community engagement and enabling organizations to make informed decisions together.
                        </p>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Target className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Transparency</h3>
                                <p className="text-gray-600">
                                    Open and transparent processes that build trust and confidence in every decision.
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Shield className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Security</h3>
                                <p className="text-gray-600">
                                    Bank-level security measures to protect the integrity of every vote and event.
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Accessibility</h3>
                                <p className="text-gray-600">
                                    User-friendly interfaces that make participation easy for everyone.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Impact</h2>
                        <p className="text-lg text-gray-600">
                            Numbers that reflect our commitment to excellence and community engagement.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="bg-white p-8 rounded-lg shadow-lg text-center">
                                <div className="text-primary mb-4 flex justify-center">
                                    {stat.icon}
                                </div>
                                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                                <div className="text-gray-600">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Us</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            We've built our platform with the features that matter most to our users.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-gray-50 p-8 rounded-lg hover:shadow-lg transition-shadow duration-300">
                                <div className="text-primary mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
                        <p className="text-lg text-gray-600">
                            The passionate individuals behind Events & Votes.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {team.map((member, index) => (
                            <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
                                <img
                                    src={getNomineeImageUrl({ image: member.image })}
                                    alt={member.name}
                                    className="w-full h-64 object-cover"
                                />
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                                    <p className="text-primary font-semibold mb-3">{member.role}</p>
                                    <p className="text-gray-600">{member.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
                            <p className="text-lg text-gray-600">
                                The principles that guide everything we do.
                            </p>
                        </div>

                        <div className="space-y-8">
                            <div className="flex items-start">
                                <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center mr-6 flex-shrink-0">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Integrity</h3>
                                    <p className="text-gray-600">
                                        We maintain the highest standards of honesty and transparency in all our operations,
                                        ensuring that every vote and event is conducted with complete integrity.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center mr-6 flex-shrink-0">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Community First</h3>
                                    <p className="text-gray-600">
                                        Our users are at the heart of everything we do. We continuously listen to feedback
                                        and evolve our platform to better serve community needs.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center mr-6 flex-shrink-0">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Innovation</h3>
                                    <p className="text-gray-600">
                                        We embrace new technologies and methodologies to continuously improve our platform
                                        and provide cutting-edge solutions for democratic participation.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
                    <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                        Join thousands of organizations and individuals who trust Events & Votes for their decision-making needs.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/register"
                            className="inline-flex items-center px-8 py-4 bg-white text-purple-600 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all duration-300"
                        >
                            Start Your Journey
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                        <Link
                            to="/contact"
                            className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-full text-lg font-semibold hover:bg-white hover:text-purple-600 transition-all duration-300"
                        >
                            Contact Us
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage; 