import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import QuickNavigation from './components/layout/QuickNavigation'
import RegisterPage from './pages/auth/RegisterPage'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import VotesPage from './pages/votes/VotesPage'
import VoteDetailsPage from './pages/votes/VoteDetailsPage'
import PositionsPage from './pages/votes/PositionsPage'
import VotePricingPage from './pages/VotePricingPage'
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import EventTicketsPage from './pages/EventTicketsPage'
import EventPricingPage from './pages/EventPricingPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import UserDashboard from './pages/dashboard/UserDashboard'
import EarningsPage from './pages/EarningsPage'
import CartPage from './pages/CartPage'
import GuestCheckoutPage from './pages/GuestCheckoutPage'
import VotingContestPage from './pages/VotingContestPage'
import HelpCenterPage from './pages/HelpCenterPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsOfServicePage from './pages/TermsOfServicePage'
import ProfilePage from './pages/ProfilePage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import EarnPage from './pages/EarnPage'
import ReferralWithdrawalsPage from './pages/ReferralWithdrawalsPage'
import ProtectedRoute from './components/ProtectedRoute'
import VerificationPage from './pages/VerificationPage'

// Public Voting Pages
import PricingPage from './pages/PricingPage'
import VotingPage from './pages/VotingPage'
import VotesListPage from './pages/VotesListPage'
import VoteResultsPage from './pages/VoteResultsPage'

// Admin Components
import AdminDashboard from './pages/admin/AdminDashboard'
import EnhancedAdminDashboard from './pages/admin/EnhancedAdminDashboard'
import AdminVotes from './pages/admin/AdminVotes'
import AdminSubscriptions from './pages/admin/AdminSubscriptions'
import AdminWithdrawals from './pages/admin/AdminWithdrawals'
import AdminProfile from './pages/admin/AdminProfile'
import AdminEvents from './pages/admin/AdminEvents'
import EventAnalytics from './pages/admin/EventAnalytics'
import EventCreate from './pages/admin/EventCreate'
import EventEdit from './pages/admin/EventEdit'
import EventTickets from './pages/admin/EventTickets'
import EventsSubscription from './pages/admin/EventsSubscription'
import ScanLocationManagement from './pages/admin/ScanLocationManagement'
import EventWithdrawals from './pages/admin/EventWithdrawals'
import TicketScanner from './pages/admin/TicketScanner'
import AdminManagement from './pages/admin/AdminManagement'
import AdminUserManagement from './pages/admin/AdminUserManagement'
import AdminNotifications from './pages/admin/AdminNotifications'
import AdminNotificationSettings from './pages/admin/AdminNotificationSettings'
import AdminActivityLogs from './pages/admin/AdminActivityLogs'
import AdminSettings from './pages/admin/AdminSettings'
import SiteSettings from './pages/admin/SiteSettings'
import UsersManagement from './pages/admin/UsersManagement'
import UserDetails from './pages/admin/UserDetails'
import NomineesPage from './pages/admin/NomineesPage'
import VoteTransactionsPage from './pages/admin/VoteTransactionsPage'
import SubscriptionsPage from './pages/admin/SubscriptionsPage'
import TransactionsPage from './pages/admin/TransactionsPage'
import TransactionsManagementPage from './pages/admin/TransactionsManagementPage'
import PaymentGatewaysPage from './pages/admin/PaymentGatewaysPage'
import SubscriptionPlansPage from './pages/admin/SubscriptionPlansPage'
import ReferralManagement from './pages/admin/ReferralManagement'
import SubscriptionRequests from './pages/admin/SubscriptionRequests'

// SuperAdmin Components
import SuperAdminBanks from './pages/superadmin/SuperAdminBanks'
import SuperAdminSubscriptionTransactions from './pages/superadmin/SuperAdminSubscriptionTransactions'
import SuperAdminPaymentGateways from './pages/superadmin/SuperAdminPaymentGateways'
import SuperAdminSubscriptionPlans from './pages/superadmin/SuperAdminSubscriptionPlans'
import PaymentGatewayTransactions from './pages/superadmin/PaymentGatewayTransactions'
import AdminLayout from './components/AdminLayout'
import './App.css'
import NominationFormPage from './pages/NominationFormPage'
import PaymentCallbackPage from './pages/PaymentCallbackPage'
import ScanPage from './pages/ScanPage'

// Debug component
const DebugRoute: React.FC = () => {
    console.log('Debug route rendered')
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Admin Debug Page</h1>
            <p>If you can see this, the admin routing is working!</p>
        </div>
    )
}

const App: React.FC = () => {
    console.log('App component rendered')
    const [showQuickNav, setShowQuickNav] = useState(false)

    useKeyboardShortcuts({
        onQuickNavigation: () => setShowQuickNav(true)
    })

    return (
        <AuthProvider>
            <ThemeProvider>
                <div className="min-h-screen bg-gray-50 dark:bg-secondary-800">
                    <Routes>
                        <Route path="/" element={<Layout />}>
                            {/* Public Routes */}
                            <Route index element={<HomePage />} />
                            <Route path="login" element={<LoginPage />} />
                            <Route path="register" element={<RegisterPage />} />
                            <Route path="forgot-password" element={<ForgotPasswordPage />} />
                            <Route path="reset-password" element={<ResetPasswordPage />} />
                            <Route path="about" element={<AboutPage />} />
                            <Route path="contact" element={<ContactPage />} />
                            <Route path="earn" element={<EarnPage />} />

                            {/* Public Pricing Route */}
                            <Route path="pricing" element={<PricingPage />} />

                            {/* Public Voting Routes */}
                            <Route path="votes" element={<VotesListPage />} />
                            <Route path="votes/:slug/:voteId" element={<VoteDetailsPage />} />
                            <Route path="votes/:slug/:voteId/voting" element={<VotingPage />} />
                            <Route path="votes/:slug/:voteId/contest" element={<VotingContestPage />} />
                            <Route path="votes/:slug/:voteId/results" element={<VoteResultsPage />} />
                            <Route path="contest/:slug/:id" element={<VotingContestPage />} />
                            <Route path="contest/:slug" element={<NominationFormPage />} />

                            {/* Cart and Checkout Routes (available to all users) */}
                            <Route path="cart" element={<CartPage />} />
                            <Route path="guest-checkout" element={<GuestCheckoutPage />} />

                            {/* Legacy Votes Routes */}
                            <Route path="/votes/upcoming" element={<VotesPage />} />
                            <Route path="/votes/popular" element={<VotesPage />} />
                            <Route path="/votes/ongoing" element={<VotesPage />} />
                            <Route path="/votes/past" element={<VotesPage />} />
                            <Route path="/votes/pricing" element={<VotePricingPage />} />

                            {/* Event Routes */}
                            <Route path="events" element={<EventsPage />} />
                            <Route path="events/:id" element={<EventDetailPage />} />
                            <Route path="events/:id/tickets" element={<EventTicketsPage />} />
                            <Route path="events/pricing" element={<EventPricingPage />} />

                            {/* Support & Legal Routes */}
                            <Route path="help-center" element={<HelpCenterPage />} />
                            <Route path="privacy" element={<PrivacyPolicyPage />} />
                            <Route path="terms" element={<TermsOfServicePage />} />

                            {/* Payment Callback Route */}
                            <Route path="payment/callback" element={<PaymentCallbackPage />} />

                            {/* Public Scan Route */}
                            <Route path="scan/:token" element={<ScanPage />} />

                            {/* Protected Routes */}
                            <Route path="main" element={
                                <ProtectedRoute>
                                    <UserDashboard />
                                </ProtectedRoute>
                            } />
                            <Route path="dashboard" element={
                                <ProtectedRoute>
                                    <UserDashboard />
                                </ProtectedRoute>
                            } />
                            <Route path="profile" element={
                                <ProtectedRoute>
                                    <ProfilePage />
                                </ProtectedRoute>
                            } />
                            <Route path="earnings" element={
                                <ProtectedRoute>
                                    <EarningsPage />
                                </ProtectedRoute>
                            } />
                            <Route path="verification" element={
                                <ProtectedRoute>
                                    <VerificationPage />
                                </ProtectedRoute>
                            } />
                            <Route path="referral-withdrawals" element={
                                <ProtectedRoute>
                                    <ReferralWithdrawalsPage />
                                </ProtectedRoute>
                            } />
                            <Route path="my-tickets" element={
                                <ProtectedRoute>
                                    <div className="p-8">
                                        <h1 className="text-2xl font-bold">My Tickets</h1>
                                        <p>View and manage your event tickets here.</p>
                                    </div>
                                </ProtectedRoute>
                            } />
                        </Route>

                        {/* Admin Routes */}
                        <Route path="/admin" element={
                            <ProtectedRoute allowedRoles={['admin', 'superadmin', 'admin_vote', 'admin_event', 'admin_both']}>
                                <AdminLayout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<AdminDashboard />} />
                            <Route path="dashboard" element={<AdminDashboard />} />
                            <Route path="profile" element={<AdminProfile />} />
                            <Route path="settings" element={<AdminSettings />} />
                            <Route path="notifications" element={<AdminNotifications />} />
                            <Route path="notifications/settings" element={<AdminNotificationSettings />} />

                            {/* Referral Management */}
                            <Route path="referrals" element={<ReferralManagement />} />

                            {/* Subscription Requests (SuperAdmin Only) */}
                            <Route path="subscription-requests" element={
                                <ProtectedRoute allowedRoles={['superadmin']}>
                                    <SubscriptionRequests />
                                </ProtectedRoute>
                            } />

                            {/* SuperAdmin Only Routes */}
                            <Route path="activity-logs" element={
                                <ProtectedRoute allowedRoles={['superadmin']}>
                                    <AdminActivityLogs />
                                </ProtectedRoute>
                            } />
                            <Route path="management" element={
                                <ProtectedRoute allowedRoles={['superadmin']}>
                                    <AdminManagement />
                                </ProtectedRoute>
                            } />
                            <Route path="management/elections" element={
                                <ProtectedRoute allowedRoles={['superadmin']}>
                                    <AdminManagement />
                                </ProtectedRoute>
                            } />
                            <Route path="management/site-settings" element={
                                <ProtectedRoute allowedRoles={['superadmin']}>
                                    <SiteSettings />
                                </ProtectedRoute>
                            } />

                            <Route path="events" element={<AdminEvents />} />
                            <Route path="events/create" element={<EventCreate />} />
                            <Route path="events/:id/edit" element={<EventEdit />} />
                            <Route path="events/:id/tickets" element={<EventTickets />} />
                            <Route path="events/:id/scanner" element={<TicketScanner />} />
                            <Route path="events/:id/scan-locations" element={<ScanLocationManagement />} />
                            <Route path="events/:id/withdrawals" element={<EventWithdrawals />} />
                            <Route path="events/:id/analytics" element={<EventAnalytics />} />
                            <Route path="events/subscriptions" element={<EventsSubscription />} />
                            <Route path="withdrawals" element={<AdminWithdrawals />} />
                            <Route path="withdrawal-requests" element={<AdminWithdrawals />} />
                            <Route path="user-management" element={<AdminUserManagement />} />
                            <Route path="banks" element={<SuperAdminBanks />} />

                            {/* User Management Routes */}
                            <Route path="users" element={<UsersManagement />} />
                            <Route path="users/:id" element={<UserDetails />} />

                            {/* Votes Management Routes */}
                            <Route path="votes" element={<AdminVotes />} />
                            <Route path="votes/:voteSlug/positions" element={<PositionsPage />} />
                            <Route path="votes/:voteSlug/nominees" element={<NomineesPage />} />
                            <Route path="votes/:voteId/transactions" element={<VoteTransactionsPage />} />

                            {/* Subscriptions Management Routes */}
                            <Route path="subscriptions" element={<SubscriptionsPage />} />

                            {/* Transactions Management Routes */}
                            <Route path="transactions" element={<TransactionsPage />} />
                            <Route path="transactions-management" element={<TransactionsManagementPage />} />

                            {/* SuperAdmin Management Routes */}
                            <Route path="payment-gateways" element={
                                <ProtectedRoute allowedRoles={['superadmin']}>
                                    <PaymentGatewaysPage />
                                </ProtectedRoute>
                            } />
                            <Route path="subscription-plans" element={
                                <ProtectedRoute allowedRoles={['superadmin']}>
                                    <SubscriptionPlansPage />
                                </ProtectedRoute>
                            } />
                        </Route>

                        {/* SuperAdmin Routes */}
                        <Route path="/superadmin/*" element={
                            <ProtectedRoute allowedRoles={['superadmin']}>
                                <AdminLayout />
                            </ProtectedRoute>
                        }>
                            <Route path="subscription-transactions" element={<SuperAdminSubscriptionTransactions />} />
                            <Route path="subscription-plans" element={<SuperAdminSubscriptionPlans />} />
                            <Route path="payment-gateways" element={<SuperAdminPaymentGateways />} />
                            <Route path="payment-gateways/:id/transactions" element={<PaymentGatewayTransactions />} />
                            <Route path="banks" element={<SuperAdminBanks />} />
                            <Route path="" element={<AdminDashboard />} />
                        </Route>
                    </Routes>
                </div>

                {/* Quick Navigation */}
                <QuickNavigation
                    isOpen={showQuickNav}
                    onClose={() => setShowQuickNav(false)}
                />

                <Toaster position="top-right" />
            </ThemeProvider>
        </AuthProvider>
    )
}

export default App 