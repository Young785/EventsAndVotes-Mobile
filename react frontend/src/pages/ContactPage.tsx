import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Mail,
    Phone,
    MapPin,
    Clock,
    Send,
    MessageCircle,
    HeadphonesIcon,
    Globe
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const contactSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    subject: z.string().min(5, 'Subject must be at least 5 characters'),
    message: z.string().min(10, 'Message must be at least 10 characters')
});

type ContactFormData = z.infer<typeof contactSchema>;

const ContactPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema)
    });

    const onSubmit = async (data: ContactFormData) => {
        setIsLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            toast.success('Message sent successfully! We\'ll get back to you soon.');
            reset();
        } catch (error) {
            toast.error('Failed to send message. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const contactInfo = [
        {
            icon: <Mail className="w-6 h-6" />,
            title: "Email Us",
            details: "EventsAndVotes@gmail.com",
            description: "Send us an email anytime!"
        },
        {
            icon: <Phone className="w-6 h-6" />,
            title: "Call Us",
            details: "+2348061163188",
            description: "Mon-Fri from 8am to 5pm"
        },
        {
            icon: <MapPin className="w-6 h-6" />,
            title: "Visit Us",
            details: "Ijebu Ode, Ogun State",
            description: "Come say hello at our office"
        },
        {
            icon: <Clock className="w-6 h-6" />,
            title: "Working Hours",
            details: "Mon - Fri: 9AM - 6PM",
            description: "Weekend support available"
        }
    ];

    const supportOptions = [
        {
            icon: <MessageCircle className="w-12 h-12" />,
            title: "Live Chat",
            description: "Get instant help from our support team",
            action: "Start Chat",
            available: true
        },
        {
            icon: <HeadphonesIcon className="w-12 h-12" />,
            title: "Phone Support",
            description: "Call us for immediate assistance",
            action: "Call Now",
            available: true
        },
        {
            icon: <Globe className="w-12 h-12" />,
            title: "Help Center",
            description: "Browse our comprehensive knowledge base",
            action: "Visit Help Center",
            available: true
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="relative py-20 bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 text-white">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1423666639041-f56000c27a9a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')"
                    }}
                ></div>
                <div className="absolute inset-0 bg-black/50"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">Contact Us</h1>
                        <nav className="text-lg mb-8">
                            <Link to="/" className="text-gray-300 hover:text-white">Home</Link>
                            <span className="mx-2">•</span>
                            <span className="text-white">Contact</span>
                        </nav>
                        <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
                        <p className="text-xl opacity-90 max-w-2xl mx-auto">
                            Have questions or need support? We're here to help! Get in touch with our team.
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact Info Cards */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {contactInfo.map((info, index) => (
                            <div key={index} className="text-center p-6 bg-gray-50 rounded-lg hover:shadow-lg transition-shadow duration-300">
                                <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    {info.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{info.title}</h3>
                                <p className="text-lg font-semibold text-primary mb-2">{info.details}</p>
                                <p className="text-gray-600">{info.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Form and Map */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Contact Form */}
                        <div className="bg-white p-8 rounded-lg shadow-lg">
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Send us a Message</h2>
                            <p className="text-gray-600 mb-8">
                                Fill out the form below and we'll get back to you as soon as possible.
                            </p>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            {...register('name')}
                                            type="text"
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.name ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            placeholder="Your full name"
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            {...register('email')}
                                            type="email"
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.email ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            placeholder="your.email@example.com"
                                        />
                                        {errors.email && (
                                            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                                        Subject
                                    </label>
                                    <input
                                        {...register('subject')}
                                        type="text"
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.subject ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="What is this about?"
                                    />
                                    {errors.subject && (
                                        <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        {...register('message')}
                                        rows={6}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${errors.message ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="Tell us more about your inquiry..."
                                    ></textarea>
                                    {errors.message && (
                                        <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-dark transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {isLoading ? (
                                        <LoadingSpinner size="sm" />
                                    ) : (
                                        <>
                                            Send Message
                                            <Send className="ml-2 w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Map/Additional Info */}
                        <div className="space-y-8">
                            <div className="bg-white p-8 rounded-lg shadow-lg">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h3>
                                <p className="text-gray-600 mb-6">
                                    We're always happy to hear from our users. Whether you have questions about our platform,
                                    need technical support, or want to share feedback, don't hesitate to reach out.
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <Mail className="w-5 h-5 text-primary mr-3" />
                                        <span className="text-gray-700">EventsAndVotes@gmail.com</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Phone className="w-5 h-5 text-primary mr-3" />
                                        <span className="text-gray-700">+2348061163188</span>
                                    </div>
                                    <div className="flex items-center">
                                        <MapPin className="w-5 h-5 text-primary mr-3" />
                                        <span className="text-gray-700">Ijebu Ode, Ogun State, Nigeria</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Clock className="w-5 h-5 text-primary mr-3" />
                                        <span className="text-gray-700">Monday - Friday, 9:00 AM - 6:00 PM (WAT)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Map Placeholder */}
                            <div className="bg-white p-8 rounded-lg shadow-lg">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Location</h3>
                                <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-500">Interactive map coming soon</p>
                                        <p className="text-sm text-gray-400">Ijebu Ode, Ogun State</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Support Options */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Other Ways to Get Help</h2>
                        <p className="text-lg text-gray-600">
                            Choose the support option that works best for you
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {supportOptions.map((option, index) => (
                            <div key={index} className="text-center p-8 bg-gray-50 rounded-lg hover:shadow-lg transition-shadow duration-300">
                                <div className="text-primary mb-6 flex justify-center">
                                    {option.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">{option.title}</h3>
                                <p className="text-gray-600 mb-6">{option.description}</p>
                                <button className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-dark transition-colors duration-300">
                                    {option.action}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
                        <p className="text-lg text-gray-600 mb-8">
                            Quick answers to common questions
                        </p>
                        <Link
                            to="/help-center"
                            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-300 font-semibold"
                        >
                            Visit Help Center
                            <MessageCircle className="ml-2 w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ContactPage; 