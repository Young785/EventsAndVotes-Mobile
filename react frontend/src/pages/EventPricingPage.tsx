import React from 'react';
import { Link } from 'react-router-dom';
import {
    Check,
    ArrowRight,
    Heart,
    Settings,
    Shield,
    Clock,
    BarChart3,
    CheckSquare,
    Monitor,
    Calendar,
    Users
} from 'lucide-react';

const EventPricingPage: React.FC = () => {
    const subscriptions = [
        {
            id: 1,
            name: "Basic",
            price: 8000,
            events: 5,
            attendees: 100,
            duration: 30,
            slug: "basic"
        },
        {
            id: 2,
            name: "Standard",
            price: 20000,
            events: 15,
            attendees: 500,
            duration: 30,
            slug: "standard"
        },
        {
            id: 3,
            name: "Premium",
            price: 40000,
            events: 50,
            attendees: 2000,
            duration: 30,
            slug: "premium"
        },
        {
            id: 4,
            name: "Enterprise",
            price: 0,
            events: 0,
            attendees: 0,
            duration: 0,
            slug: "others"
        }
    ];

    const features = [
        {
            icon: <Heart className="w-8 h-8" />,
            title: "24 Hours Support",
            description: "Experience round-the-clock support with our dedicated team available 24/7 to assist you with any event management issues, ensuring seamless event execution."
        },
        {
            icon: <Settings className="w-8 h-8" />,
            title: "Event Management Panel",
            description: "Manage your events seamlessly with our intuitive Event Management Panel. Control registrations, schedules, and attendee communications with ease."
        },
        {
            icon: <Shield className="w-8 h-8" />,
            title: "Secure Event Platform",
            description: "Ensure security and privacy with our robust event platform. Utilize encryption and authentication measures to protect attendee data and event integrity."
        },
        {
            icon: <Clock className="w-8 h-8" />,
            title: "Real-Time Event Updates",
            description: "Keep attendees informed with real-time event updates. Instantly communicate schedule changes, announcements, and important information."
        },
        {
            icon: <BarChart3 className="w-8 h-8" />,
            title: "Comprehensive Event Analytics",
            description: "Gain insights with comprehensive event analytics. Track attendance, engagement rates, and feedback to improve future events and strategies."
        },
        {
            icon: <CheckSquare className="w-8 h-8" />,
            title: "Customizable Event Options",
            description: "Tailor event experiences with customizable options. Configure registration forms, event layouts, and attendee interactions to suit various event types."
        },
        {
            icon: <Monitor className="w-8 h-8" />,
            title: "User-Friendly Interface",
            description: "Provide an intuitive experience with a user-friendly interface. Simplify event registration, navigation, and participation for all attendees."
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-secondary-800">
            {/* Hero Section */}
            <section className="relative py-20 bg-gradient-to-r from-green-900 via-blue-900 to-purple-900 text-white">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')"
                    }}
                ></div>
                <div className="absolute inset-0 bg-black/50"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">Event Pricing</h1>
                        <nav className="text-lg mb-8">
                            <Link to="/" className="text-gray-300 hover:text-white">Home</Link>
                            <span className="mx-2">•</span>
                            <span className="text-white">Event Pricing Lists</span>
                        </nav>
                        <div className="w-24 h-1 bg-primary mx-auto"></div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-20 bg-white dark:bg-secondary-900">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Event Pricing Tables</h2>
                        <p className="text-gray-600 mb-2">cost of our event management services</p>
                        <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
                        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                            Below are the event management pricing list, choose the best plan that suit your event requirements.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                        {subscriptions.map((subscription) => (
                            <div key={subscription.id} className="bg-white dark:bg-secondary-900 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-secondary-700">
                                {/* Header */}
                                <div className="bg-green-600 text-white p-6 text-center">
                                    <h3 className="text-2xl font-bold">{subscription.name}</h3>
                                </div>

                                {/* Price */}
                                <div className="p-6 text-center border-b border-gray-200 dark:border-secondary-700">
                                    <div className="text-4xl font-bold text-gray-900 mb-2">
                                        {subscription.slug === "others" ? (
                                            "Contact Us"
                                        ) : (
                                            <>₦{subscription.price.toLocaleString()}</>
                                        )}
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-400">Per month</div>
                                </div>

                                {/* Features */}
                                <div className="p-6">
                                    <ul className="space-y-4 mb-8">
                                        <li className="flex items-center">
                                            <Check className="w-5 h-5 text-green-500 mr-3" />
                                            <span>
                                                Events: <strong>
                                                    {subscription.slug === "others" ? "Unlimited" : subscription.events.toLocaleString()}
                                                </strong>
                                            </span>
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="w-5 h-5 text-green-500 mr-3" />
                                            <span>
                                                Max Attendees: <strong>
                                                    {subscription.slug === "others" ? "Unlimited" : subscription.attendees.toLocaleString()}
                                                </strong>
                                            </span>
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="w-5 h-5 text-green-500 mr-3" />
                                            <span>
                                                Duration: <strong>
                                                    {subscription.slug === "others" ? "Unlimited" : `${subscription.duration} Days`}
                                                </strong>
                                            </span>
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="w-5 h-5 text-green-500 mr-3" />
                                            <span>Event Analytics</span>
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="w-5 h-5 text-green-500 mr-3" />
                                            <span>Registration Management</span>
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="w-5 h-5 text-green-500 mr-3" />
                                            <span>Email Notifications</span>
                                        </li>
                                    </ul>

                                    {subscription.slug === "others" ? (
                                        <Link
                                            to="/contact"
                                            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300 flex items-center justify-center"
                                        >
                                            Contact Us
                                            <ArrowRight className="ml-2 w-4 h-4" />
                                        </Link>
                                    ) : (
                                        <Link
                                            to="/login"
                                            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300 flex items-center justify-center"
                                        >
                                            Choose {subscription.name}
                                            <ArrowRight className="ml-2 w-4 h-4" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Features Grid */}
                    <div className="border-t border-gray-200 pt-16">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                            {features.slice(0, 4).map((feature, index) => (
                                <div key={index} className="text-center p-6">
                                    <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {features.slice(4).map((feature, index) => (
                                <div key={index + 4} className="text-center p-6">
                                    <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Comparison Section */}
            <section className="py-20 bg-gray-50 dark:bg-secondary-800">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Our Event Platform?</h2>
                        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                            Compare our features and see why thousands of event organizers trust our platform.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white dark:bg-secondary-900 p-8 rounded-lg shadow-lg text-center">
                            <Calendar className="w-16 h-16 text-green-600 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Easy Event Creation</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Create and customize events in minutes with our intuitive event builder.
                                No technical skills required.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-secondary-900 p-8 rounded-lg shadow-lg text-center">
                            <Users className="w-16 h-16 text-green-600 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Attendee Management</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Manage registrations, send invitations, and track attendance with
                                powerful attendee management tools.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-secondary-900 p-8 rounded-lg shadow-lg text-center">
                            <BarChart3 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Detailed Analytics</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Get insights into your event performance with detailed analytics
                                and reporting features.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600 text-white">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div className="md:w-2/3 mb-8 md:mb-0">
                            <h3 className="text-4xl font-bold mb-4">Ready to Host Amazing Events?</h3>
                            <p className="text-xl opacity-90">
                                Join our community of successful event organizers. Create memorable experiences
                                and connect with your audience like never before!
                            </p>
                        </div>
                        <div className="md:w-1/3 text-center md:text-right">
                            <Link
                                to="/register"
                                className="inline-flex items-center px-8 py-4 bg-white dark:bg-secondary-900 text-green-600 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all duration-300"
                            >
                                Start Creating
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default EventPricingPage; 