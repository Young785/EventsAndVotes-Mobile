import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, FileText, Shield, AlertTriangle, Calendar, CheckCircle } from 'lucide-react';

const TermsOfServicePage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="relative py-20 bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 text-white">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')"
                    }}
                ></div>
                <div className="absolute inset-0 bg-black/50"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">Terms of Service</h1>
                        <nav className="text-lg mb-8">
                            <Link to="/" className="text-gray-300 hover:text-white">Home</Link>
                            <span className="mx-2">•</span>
                            <span className="text-white">Terms of Service</span>
                        </nav>
                        <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
                        <p className="text-xl opacity-90 max-w-2xl mx-auto">
                            Please read these terms carefully before using our platform. They govern your use of our services.
                        </p>
                    </div>
                </div>
            </section>

            {/* Last Updated */}
            <section className="py-8 bg-white border-b border-gray-200">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-center text-gray-600">
                        <Calendar className="w-5 h-5 mr-2" />
                        <span>Last updated: January 15, 2024</span>
                    </div>
                </div>
            </section>

            {/* Terms Overview */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="grid md:grid-cols-3 gap-8 mb-12">
                            <div className="text-center">
                                <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Scale className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Fair Usage</h3>
                                <p className="text-gray-600">Clear guidelines for responsible use of our platform</p>
                            </div>
                            <div className="text-center">
                                <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Shield className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">User Protection</h3>
                                <p className="text-gray-600">Your rights and protections when using our services</p>
                            </div>
                            <div className="text-center">
                                <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Service Quality</h3>
                                <p className="text-gray-600">Our commitment to providing reliable and secure services</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Terms Content */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-lg shadow-lg p-8">
                            <div className="prose prose-lg max-w-none">
                                <h2 className="text-3xl font-bold text-gray-900 mb-6">1. Acceptance of Terms</h2>

                                <p className="text-gray-700 mb-6">
                                    By accessing and using Events & Votes ("the Platform", "our Service"), you accept and agree to be bound by the terms and provision of this agreement.
                                    If you do not agree to abide by the above, please do not use this service.
                                </p>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">2. Description of Service</h2>

                                <p className="text-gray-700 mb-4">
                                    Events & Votes provides an online platform for creating, managing, and participating in voting contests and events. Our services include:
                                </p>
                                <ul className="list-disc pl-6 mb-6 text-gray-700">
                                    <li>Vote creation and management tools</li>
                                    <li>Event planning and registration systems</li>
                                    <li>Analytics and reporting features</li>
                                    <li>Payment processing for premium features</li>
                                    <li>Customer support and technical assistance</li>
                                </ul>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">3. User Accounts and Registration</h2>

                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Creation</h3>
                                <p className="text-gray-700 mb-4">
                                    To use certain features of our platform, you must register for an account. You agree to:
                                </p>
                                <ul className="list-disc pl-6 mb-6 text-gray-700">
                                    <li>Provide accurate, current, and complete information during registration</li>
                                    <li>Maintain and promptly update your account information</li>
                                    <li>Maintain the security of your password and account</li>
                                    <li>Accept responsibility for all activities under your account</li>
                                    <li>Notify us immediately of any unauthorized use of your account</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Eligibility</h3>
                                <p className="text-gray-700 mb-6">
                                    You must be at least 13 years old to create an account. If you are under 18, you represent that you have your parent's or guardian's permission to use the service.
                                </p>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">4. Acceptable Use Policy</h2>

                                <p className="text-gray-700 mb-4">
                                    You agree not to use the platform for any unlawful purpose or in any way that could damage, disable, or impair the service. Prohibited activities include:
                                </p>
                                <ul className="list-disc pl-6 mb-6 text-gray-700">
                                    <li>Creating fraudulent or misleading votes or events</li>
                                    <li>Attempting to manipulate voting results through automated means</li>
                                    <li>Uploading malicious software or harmful content</li>
                                    <li>Violating any applicable laws or regulations</li>
                                    <li>Infringing on intellectual property rights</li>
                                    <li>Harassing, threatening, or abusing other users</li>
                                    <li>Spamming or sending unsolicited communications</li>
                                    <li>Attempting to gain unauthorized access to our systems</li>
                                </ul>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">5. Content and Intellectual Property</h2>

                                <h3 className="text-xl font-semibold text-gray-900 mb-4">User Content</h3>
                                <p className="text-gray-700 mb-4">
                                    You retain ownership of content you create and upload to the platform. By uploading content, you grant us a non-exclusive, worldwide, royalty-free license to:
                                </p>
                                <ul className="list-disc pl-6 mb-6 text-gray-700">
                                    <li>Display, distribute, and promote your content on the platform</li>
                                    <li>Make necessary technical modifications for platform functionality</li>
                                    <li>Remove content that violates these terms or applicable laws</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Platform Content</h3>
                                <p className="text-gray-700 mb-6">
                                    All platform features, design, text, graphics, and other materials are owned by Events & Votes and protected by intellectual property laws.
                                    You may not copy, modify, or distribute our content without permission.
                                </p>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">6. Payment Terms</h2>

                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Subscription Plans</h3>
                                <p className="text-gray-700 mb-4">
                                    We offer various subscription plans with different features and limitations. Payment terms include:
                                </p>
                                <ul className="list-disc pl-6 mb-6 text-gray-700">
                                    <li>Subscription fees are billed in advance on a monthly basis</li>
                                    <li>All fees are non-refundable except as required by law</li>
                                    <li>We reserve the right to change pricing with 30 days notice</li>
                                    <li>Failed payments may result in service suspension</li>
                                    <li>You can cancel your subscription at any time</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Refund Policy</h3>
                                <p className="text-gray-700 mb-6">
                                    Refunds are generally not provided for subscription fees. However, we may provide refunds at our discretion for technical issues,
                                    service outages, or other exceptional circumstances.
                                </p>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">7. Privacy and Data Protection</h2>

                                <p className="text-gray-700 mb-6">
                                    Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy,
                                    which is incorporated into these terms by reference. By using our service, you consent to the collection and use of your information as described in the Privacy Policy.
                                </p>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">8. Service Availability and Modifications</h2>

                                <p className="text-gray-700 mb-4">
                                    We strive to provide reliable service but cannot guarantee 100% uptime. We reserve the right to:
                                </p>
                                <ul className="list-disc pl-6 mb-6 text-gray-700">
                                    <li>Modify, suspend, or discontinue any part of the service</li>
                                    <li>Perform maintenance that may temporarily affect service availability</li>
                                    <li>Update features and functionality to improve user experience</li>
                                    <li>Implement security measures that may affect service performance</li>
                                </ul>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">9. Limitation of Liability</h2>

                                <p className="text-gray-700 mb-6">
                                    To the maximum extent permitted by law, Events & Votes shall not be liable for any indirect, incidental, special, consequential,
                                    or punitive damages, including but not limited to loss of profits, data, or business opportunities, arising from your use of the service.
                                </p>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">10. Indemnification</h2>

                                <p className="text-gray-700 mb-6">
                                    You agree to indemnify and hold harmless Events & Votes, its officers, directors, employees, and agents from any claims,
                                    damages, or expenses arising from your use of the service, violation of these terms, or infringement of any rights of another party.
                                </p>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">11. Termination</h2>

                                <p className="text-gray-700 mb-4">
                                    Either party may terminate this agreement at any time. We may terminate or suspend your account immediately for:
                                </p>
                                <ul className="list-disc pl-6 mb-6 text-gray-700">
                                    <li>Violation of these terms of service</li>
                                    <li>Fraudulent or illegal activity</li>
                                    <li>Non-payment of fees</li>
                                    <li>Abuse of the platform or other users</li>
                                </ul>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">12. Governing Law and Dispute Resolution</h2>

                                <p className="text-gray-700 mb-6">
                                    These terms are governed by the laws of Nigeria. Any disputes arising from these terms or your use of the service
                                    will be resolved through binding arbitration in Lagos, Nigeria, except where prohibited by law.
                                </p>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">13. Changes to Terms</h2>

                                <p className="text-gray-700 mb-6">
                                    We may update these terms from time to time. We will notify users of material changes by email or through the platform.
                                    Your continued use of the service after changes are posted constitutes acceptance of the updated terms.
                                </p>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">14. Contact Information</h2>

                                <p className="text-gray-700 mb-4">
                                    If you have any questions about these Terms of Service, please contact us:
                                </p>
                                <div className="bg-gray-50 p-6 rounded-lg">
                                    <p className="text-gray-700 mb-2"><strong>Email:</strong> legal@eventsandvotes.com</p>
                                    <p className="text-gray-700 mb-2"><strong>Phone:</strong> +234 801 234 5678</p>
                                    <p className="text-gray-700 mb-2"><strong>Address:</strong> 123 Tech Street, Victoria Island, Lagos, Nigeria</p>
                                    <p className="text-gray-700"><strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM (WAT)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Important Notice */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                            <div className="flex items-start">
                                <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Notice</h3>
                                    <p className="text-yellow-700">
                                        These terms constitute a legally binding agreement between you and Events & Votes.
                                        Please read them carefully and contact us if you have any questions before using our services.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-lg">
                            <div className="flex items-center justify-center mb-4">
                                <Scale className="w-12 h-12 text-primary mr-4" />
                                <FileText className="w-12 h-12 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Questions About Our Terms?</h3>
                            <p className="text-gray-700 mb-6">
                                Our legal team is available to help clarify any questions you may have about our terms of service.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    to="/contact"
                                    className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-300 font-semibold"
                                >
                                    Contact Legal Team
                                </Link>
                                <Link
                                    to="/help-center"
                                    className="inline-flex items-center px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors duration-300 font-semibold"
                                >
                                    Help Center
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default TermsOfServicePage; 