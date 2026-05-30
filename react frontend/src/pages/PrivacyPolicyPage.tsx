import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Eye, Lock, Users, FileText, Calendar } from 'lucide-react';

const PrivacyPolicyPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-secondary-800">
            {/* Hero Section */}
            <section className="relative py-20 bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 text-white">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')"
                    }}
                ></div>
                <div className="absolute inset-0 bg-black/50"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">Privacy Policy</h1>
                        <nav className="text-lg mb-8">
                            <Link to="/" className="text-gray-300 hover:text-white">Home</Link>
                            <span className="mx-2">•</span>
                            <span className="text-white">Privacy Policy</span>
                        </nav>
                        <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
                        <p className="text-xl opacity-90 max-w-2xl mx-auto">
                            Your privacy is important to us. Learn how we collect, use, and protect your information.
                        </p>
                    </div>
                </div>
            </section>

            {/* Last Updated */}
            <section className="py-8 bg-white dark:bg-secondary-900 border-b border-gray-200 dark:border-secondary-700">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-center text-gray-600 dark:text-gray-400">
                        <Calendar className="w-5 h-5 mr-2" />
                        <span>Last updated: January 15, 2024</span>
                    </div>
                </div>
            </section>

            {/* Privacy Overview */}
            <section className="py-16 bg-white dark:bg-secondary-900">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="grid md:grid-cols-3 gap-8 mb-12">
                            <div className="text-center">
                                <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Shield className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Data Protection</h3>
                                <p className="text-gray-600 dark:text-gray-400">We use industry-standard security measures to protect your data</p>
                            </div>
                            <div className="text-center">
                                <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Eye className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Transparency</h3>
                                <p className="text-gray-600 dark:text-gray-400">Clear information about what data we collect and how we use it</p>
                            </div>
                            <div className="text-center">
                                <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Your Rights</h3>
                                <p className="text-gray-600 dark:text-gray-400">You have control over your personal information and privacy settings</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Privacy Policy Content */}
            <section className="py-16 bg-gray-50 dark:bg-secondary-800">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-lg p-8">
                            <div className="prose prose-lg max-w-none">
                                <h2 className="text-3xl font-bold text-gray-900 mb-6">1. Information We Collect</h2>

                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h3>
                                <p className="text-gray-700 mb-4">
                                    When you create an account or use our services, we may collect the following personal information:
                                </p>
                                <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
                                    <li>Name and contact information (email address, phone number)</li>
                                    <li>Account credentials (username, password)</li>
                                    <li>Profile information and preferences</li>
                                    <li>Payment information (processed securely through third-party providers)</li>
                                    <li>Communication history with our support team</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Usage Information</h3>
                                <p className="text-gray-700 mb-4">
                                    We automatically collect certain information about your use of our platform:
                                </p>
                                <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
                                    <li>Device information (IP address, browser type, operating system)</li>
                                    <li>Usage patterns and interactions with our platform</li>
                                    <li>Voting and event participation data</li>
                                    <li>Log files and analytics data</li>
                                </ul>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">2. How We Use Your Information</h2>

                                <p className="text-gray-700 mb-4">
                                    We use the collected information for the following purposes:
                                </p>
                                <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
                                    <li><strong>Service Provision:</strong> To provide, maintain, and improve our voting and event management services</li>
                                    <li><strong>Account Management:</strong> To create and manage your account, authenticate users, and provide customer support</li>
                                    <li><strong>Communication:</strong> To send important updates, notifications, and respond to your inquiries</li>
                                    <li><strong>Security:</strong> To detect, prevent, and address technical issues and fraudulent activities</li>
                                    <li><strong>Analytics:</strong> To understand how our services are used and improve user experience</li>
                                    <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
                                </ul>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">3. Information Sharing and Disclosure</h2>

                                <p className="text-gray-700 mb-4">
                                    We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
                                </p>
                                <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
                                    <li><strong>Service Providers:</strong> With trusted third-party service providers who assist us in operating our platform</li>
                                    <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
                                    <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                                    <li><strong>Consent:</strong> With your explicit consent for specific purposes</li>
                                    <li><strong>Public Information:</strong> Voting results and public event information as intended by the platform's functionality</li>
                                </ul>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">4. Data Security</h2>

                                <p className="text-gray-700 mb-4">
                                    We implement appropriate technical and organizational security measures to protect your personal information:
                                </p>
                                <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
                                    <li>Encryption of data in transit and at rest</li>
                                    <li>Regular security assessments and updates</li>
                                    <li>Access controls and authentication mechanisms</li>
                                    <li>Secure payment processing through certified providers</li>
                                    <li>Regular backups and disaster recovery procedures</li>
                                </ul>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">5. Your Rights and Choices</h2>

                                <p className="text-gray-700 mb-4">
                                    You have the following rights regarding your personal information:
                                </p>
                                <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
                                    <li><strong>Access:</strong> Request access to your personal information we hold</li>
                                    <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                                    <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
                                    <li><strong>Portability:</strong> Request a copy of your data in a structured, machine-readable format</li>
                                    <li><strong>Objection:</strong> Object to certain processing of your personal information</li>
                                    <li><strong>Withdrawal:</strong> Withdraw consent for specific data processing activities</li>
                                </ul>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">6. Cookies and Tracking Technologies</h2>

                                <p className="text-gray-700 mb-4">
                                    We use cookies and similar tracking technologies to enhance your experience:
                                </p>
                                <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300">
                                    <li><strong>Essential Cookies:</strong> Required for basic platform functionality</li>
                                    <li><strong>Analytics Cookies:</strong> Help us understand how you use our platform</li>
                                    <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                                    <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements (with your consent)</li>
                                </ul>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">7. Data Retention</h2>

                                <p className="text-gray-700 mb-6">
                                    We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy.
                                    Specific retention periods depend on the type of information and legal requirements. When information is no longer needed,
                                    we securely delete or anonymize it.
                                </p>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">8. International Data Transfers</h2>

                                <p className="text-gray-700 mb-6">
                                    Your information may be transferred to and processed in countries other than your country of residence.
                                    We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.
                                </p>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">9. Children's Privacy</h2>

                                <p className="text-gray-700 mb-6">
                                    Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
                                    If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.
                                </p>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">10. Changes to This Privacy Policy</h2>

                                <p className="text-gray-700 mb-6">
                                    We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws.
                                    We will notify you of any material changes by posting the updated policy on our website and updating the "Last Updated" date.
                                    Your continued use of our services after such changes constitutes acceptance of the updated policy.
                                </p>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">11. Contact Us</h2>

                                <p className="text-gray-700 mb-4">
                                    If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                                </p>
                                <div className="bg-gray-50 dark:bg-secondary-800 p-6 rounded-lg">
                                    <p className="text-gray-700 mb-2"><strong>Email:</strong> privacy@eventsandvotes.com</p>
                                    <p className="text-gray-700 mb-2"><strong>Phone:</strong> +234 801 234 5678</p>
                                    <p className="text-gray-700 mb-2"><strong>Address:</strong> 123 Tech Street, Victoria Island, Lagos, Nigeria</p>
                                    <p className="text-gray-700 dark:text-gray-300"><strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM (WAT)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-16 bg-white dark:bg-secondary-900">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-lg">
                            <div className="flex items-center justify-center mb-4">
                                <Lock className="w-12 h-12 text-primary mr-4" />
                                <FileText className="w-12 h-12 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Questions About Your Privacy?</h3>
                            <p className="text-gray-700 mb-6">
                                Our team is here to help you understand how we protect your information and answer any privacy-related questions.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    to="/contact"
                                    className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-300 font-semibold"
                                >
                                    Contact Us
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

export default PrivacyPolicyPage; 