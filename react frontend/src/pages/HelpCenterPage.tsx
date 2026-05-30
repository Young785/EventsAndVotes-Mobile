import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Search,
    ChevronDown,
    ChevronRight,
    HelpCircle,
    Book,
    MessageCircle,
    Mail,
    Phone,
    ArrowRight,
    CheckCircle,
    AlertCircle,
    Info
} from 'lucide-react';

const HelpCenterPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const categories = [
        {
            icon: <Book className="w-8 h-8" />,
            title: "Getting Started",
            description: "Learn the basics of using our platform",
            articles: 12
        },
        {
            icon: <CheckCircle className="w-8 h-8" />,
            title: "Voting & Events",
            description: "How to create and manage votes and events",
            articles: 8
        },
        {
            icon: <MessageCircle className="w-8 h-8" />,
            title: "Account Management",
            description: "Manage your account settings and preferences",
            articles: 6
        },
        {
            icon: <AlertCircle className="w-8 h-8" />,
            title: "Troubleshooting",
            description: "Common issues and how to resolve them",
            articles: 10
        }
    ];

    const faqs = [
        {
            question: "How do I create my first vote?",
            answer: "To create your first vote, log into your account and click on 'Create Vote' from your dashboard. Fill in the required details including vote title, description, start and end dates, and add your nominees. Once you're satisfied with the setup, publish your vote to make it live."
        },
        {
            question: "What payment methods do you accept?",
            answer: "We accept various payment methods including credit/debit cards, bank transfers, and popular payment gateways like Paystack and Flutterwave. All payments are processed securely using industry-standard encryption."
        },
        {
            question: "Can I customize the appearance of my vote?",
            answer: "Yes! Our platform offers various customization options including themes, colors, logos, and layout options. You can brand your vote to match your organization's identity and create a professional appearance."
        },
        {
            question: "How do I ensure my vote is secure?",
            answer: "Our platform implements multiple security measures including encrypted data transmission, secure authentication, IP tracking, and fraud detection. We also provide options for email verification and one-time voting restrictions."
        },
        {
            question: "Can I export voting results?",
            answer: "Absolutely! You can export voting results in various formats including PDF, Excel, and CSV. The export includes detailed analytics, voter information (if permitted), and comprehensive reports for your records."
        },
        {
            question: "What happens if I exceed my plan limits?",
            answer: "If you approach your plan limits, we'll notify you in advance. You can upgrade your plan at any time to accommodate more votes, nominees, or features. We also offer temporary upgrades for special events."
        },
        {
            question: "How do I invite people to vote?",
            answer: "You can invite voters through multiple channels: email invitations, social media sharing, direct links, QR codes, or embedding the vote on your website. Our platform provides tools to track invitation delivery and response rates."
        },
        {
            question: "Can I schedule votes for future dates?",
            answer: "Yes, you can schedule votes to start and end at specific dates and times. The platform will automatically open and close voting according to your schedule, and send notifications to participants."
        }
    ];

    const guides = [
        {
            title: "Complete Guide to Creating Effective Votes",
            description: "Learn best practices for setting up votes that engage your audience",
            readTime: "10 min read",
            category: "Getting Started"
        },
        {
            title: "Managing Event Registrations",
            description: "Step-by-step guide to handling event attendees and communications",
            readTime: "8 min read",
            category: "Events"
        },
        {
            title: "Understanding Analytics and Reports",
            description: "Make sense of your voting data and improve future campaigns",
            readTime: "12 min read",
            category: "Analytics"
        },
        {
            title: "Security Best Practices",
            description: "Ensure your votes are secure and trustworthy",
            readTime: "6 min read",
            category: "Security"
        }
    ];

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const filteredFaqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-secondary-800">
            {/* Hero Section */}
            <section className="relative py-20 bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 text-white">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')"
                    }}
                ></div>
                <div className="absolute inset-0 bg-black/50"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">Help Center</h1>
                        <nav className="text-lg mb-8">
                            <Link to="/" className="text-gray-300 hover:text-white">Home</Link>
                            <span className="mx-2">•</span>
                            <span className="text-white">Help Center</span>
                        </nav>
                        <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
                        <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
                            Find answers to your questions and get the help you need to make the most of our platform.
                        </p>

                        {/* Search Bar */}
                        <div className="max-w-2xl mx-auto">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-6 w-6 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search for help articles, FAQs, and guides..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-4 text-gray-900 bg-white dark:bg-secondary-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="py-16 bg-white dark:bg-secondary-900">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Browse by Category</h2>
                        <p className="text-gray-600 dark:text-gray-400">Find help articles organized by topic</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {categories.map((category, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-secondary-800 p-6 rounded-lg hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                                <div className="text-primary mb-4">
                                    {category.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{category.title}</h3>
                                <p className="text-gray-600 mb-4">{category.description}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">{category.articles} articles</span>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Popular Guides Section */}
            <section className="py-16 bg-gray-50 dark:bg-secondary-800">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Guides</h2>
                        <p className="text-gray-600 dark:text-gray-400">Step-by-step tutorials to help you succeed</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {guides.map((guide, index) => (
                            <div key={index} className="bg-white dark:bg-secondary-900 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <div className="flex items-start justify-between mb-4">
                                    <span className="inline-block px-3 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full">
                                        {guide.category}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">{guide.readTime}</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{guide.title}</h3>
                                <p className="text-gray-600 mb-4">{guide.description}</p>
                                <button className="inline-flex items-center text-primary hover:text-primary-dark font-semibold">
                                    Read Guide
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 bg-white dark:bg-secondary-900" id="faq">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
                        <p className="text-gray-600 dark:text-gray-400">Quick answers to common questions</p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        {filteredFaqs.map((faq, index) => (
                            <div key={index} className="mb-4">
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full text-left p-6 bg-gray-50 dark:bg-secondary-800 hover:bg-gray-100 rounded-lg transition-colors duration-300 flex items-center justify-between"
                                >
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">{faq.question}</span>
                                    {openFaq === index ? (
                                        <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                    )}
                                </button>
                                {openFaq === index && (
                                    <div className="p-6 bg-white dark:bg-secondary-900 border border-gray-200 rounded-b-lg">
                                        <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}

                        {filteredFaqs.length === 0 && searchTerm && (
                            <div className="text-center py-12">
                                <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
                                <p className="text-gray-600 mb-6">
                                    We couldn't find any FAQs matching "{searchTerm}". Try different keywords or contact support.
                                </p>
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-300"
                                >
                                    Clear Search
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Contact Support Section */}
            <section className="py-16 bg-gray-50 dark:bg-secondary-800">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Still Need Help?</h2>
                        <p className="text-gray-600 dark:text-gray-400">Our support team is here to assist you</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="bg-white dark:bg-secondary-900 p-8 rounded-lg shadow-lg text-center">
                            <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Live Chat</h3>
                            <p className="text-gray-600 mb-6">
                                Get instant help from our support team through live chat.
                            </p>
                            <button className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-dark transition-colors duration-300">
                                Start Chat
                            </button>
                        </div>

                        <div className="bg-white dark:bg-secondary-900 p-8 rounded-lg shadow-lg text-center">
                            <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Email Support</h3>
                            <p className="text-gray-600 mb-6">
                                Send us an email and we'll respond within 24 hours.
                            </p>
                            <Link
                                to="/contact"
                                className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-dark transition-colors duration-300 inline-block"
                            >
                                Send Email
                            </Link>
                        </div>

                        <div className="bg-white dark:bg-secondary-900 p-8 rounded-lg shadow-lg text-center">
                            <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Phone className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Phone Support</h3>
                            <p className="text-gray-600 mb-6">
                                Call us for immediate assistance with urgent issues.
                            </p>
                            <a
                                href="tel:+2348012345678"
                                className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-dark transition-colors duration-300 inline-block"
                            >
                                Call Now
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Tips Section */}
            <section className="py-16 bg-white dark:bg-secondary-900">
                <div className="container mx-auto px-4">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-lg">
                        <div className="flex items-start">
                            <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                                <Info className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Pro Tips for Success</h3>
                                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                    <li>• Test your vote with a small group before going live</li>
                                    <li>• Use clear, descriptive titles and instructions</li>
                                    <li>• Set appropriate voting periods for your audience</li>
                                    <li>• Promote your vote through multiple channels</li>
                                    <li>• Monitor results and engage with participants</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HelpCenterPage; 