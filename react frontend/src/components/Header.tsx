import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../hooks/useCart'
import { Menu, X, User, LogOut, Settings, Vote, ShoppingCart, ChevronDown, DollarSign, LayoutDashboard } from 'lucide-react'

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const [isVotesDropdownOpen, setIsVotesDropdownOpen] = useState(false)
    const [isEventsDropdownOpen, setIsEventsDropdownOpen] = useState(false)
    const { user, isAuthenticated, logout } = useAuth()
    console.log(user, "user")
    const { cartCount } = useCart()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/')
        setIsUserMenuOpen(false)
    }

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
    const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen)

    return (
        <header className="bg-white dark:bg-secondary-900 shadow-sm border-b border-gray-200 dark:border-secondary-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2">
                            <Vote className="h-8 w-8 text-primary-600" />
                            <span className="text-xl font-bold text-gray-900 dark:text-white">Events & Votes</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link to="/" className="text-gray-700 hover:text-primary-600 transition-colors">
                            Home
                        </Link>

                        {/* Votes Dropdown */}
                        <div
                            className="relative"
                            onMouseEnter={() => setIsVotesDropdownOpen(true)}
                            onMouseLeave={() => setIsVotesDropdownOpen(false)}
                        >
                            <button
                                className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
                            >
                                <Link to="/votes" className="flex items-center">
                                    Votes
                                    <ChevronDown className="ml-1 h-4 w-4" />
                                </Link>
                            </button>

                            {isVotesDropdownOpen && (
                                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-secondary-900 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-secondary-700">
                                    <Link
                                        to="/votes"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-secondary-800"
                                    >
                                        Browse Votes
                                    </Link>
                                    <Link
                                        to="/votes/pricing"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-secondary-800"
                                    >
                                        Vote Pricing
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Events Dropdown */}
                        <div
                            className="relative"
                            onMouseEnter={() => setIsEventsDropdownOpen(true)}
                            onMouseLeave={() => setIsEventsDropdownOpen(false)}
                        >
                            <button
                                className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
                            >
                                Events
                                <ChevronDown className="ml-1 h-4 w-4" />
                            </button>

                            {isEventsDropdownOpen && (
                                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-secondary-900 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-secondary-700">
                                    <Link
                                        to="/events"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-secondary-800"
                                    >
                                        Browse Events
                                    </Link>
                                    <Link
                                        to="/events/pricing"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-secondary-800"
                                    >
                                        Event Pricing
                                    </Link>
                                </div>
                            )}
                        </div>

                        <Link to="/earn" className="text-gray-700 hover:text-primary-600 transition-colors">
                            Earn
                        </Link>
                        <Link to="/about" className="text-gray-700 hover:text-primary-600 transition-colors">
                            About
                        </Link>
                        <Link to="/contact" className="text-gray-700 hover:text-primary-600 transition-colors">
                            Contact
                        </Link>
                    </nav>

                    {/* Cart and User Menu / Auth Buttons */}
                    <div className="hidden md:flex items-center space-x-4">
                        {/* Cart Icon - Always visible */}
                        <Link
                            to={isAuthenticated ? "/cart" : "/login"}
                            className="relative text-gray-700 hover:text-primary-600 transition-colors"
                        >
                            <ShoppingCart className="h-6 w-6" />
                            {/* Cart badge */}
                            <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {cartCount}
                            </span>
                        </Link>

                        {isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={toggleUserMenu}
                                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                                >
                                    <User className="h-5 w-5" />
                                    <span>{user?.name}</span>
                                </button>

                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-secondary-900 rounded-md shadow-lg py-1 z-50">
                                        <Link
                                            to="/dashboard"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-secondary-800"
                                            onClick={() => setIsUserMenuOpen(false)}
                                        >
                                            <Settings className="inline h-4 w-4 mr-2" />
                                            Dashboard
                                        </Link>
                                        <Link
                                            to="/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-secondary-800"
                                            onClick={() => setIsUserMenuOpen(false)}
                                        >
                                            <User className="inline h-4 w-4 mr-2" />
                                            Profile
                                        </Link>
                                        <Link
                                            to="/earnings"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-secondary-800"
                                            onClick={() => setIsUserMenuOpen(false)}
                                        >
                                            <DollarSign className="inline h-4 w-4 mr-2" />
                                            Earnings
                                        </Link>

                                        {user && (user.role?.name === "admin_vote" || user.role?.name === "admin_event" || user.role?.name === "superadmin") && (
                                            <Link
                                                to="/admin/dashboard"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-secondary-800"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <LayoutDashboard className="inline h-4 w-4 mr-2" />
                                                Go Back to Admin
                                            </Link>
                                        )}
                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-secondary-800"
                                        >
                                            <LogOut className="inline h-4 w-4 mr-2" />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/login"
                                    className="text-gray-700 hover:text-primary-600 transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn-primary"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center space-x-2">
                        {/* Mobile Cart Icon - Always visible */}
                        <Link
                            to={isAuthenticated ? "/cart" : "/login"}
                            className="relative text-gray-700 hover:text-primary-600 transition-colors"
                        >
                            <ShoppingCart className="h-6 w-6" />
                            {/* Cart badge */}
                            <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {cartCount}
                            </span>
                        </Link>

                        <button
                            onClick={toggleMenu}
                            className="text-gray-700 hover:text-primary-600 transition-colors"
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            <Link
                                to="/"
                                className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Home
                            </Link>

                            {/* Mobile Votes Menu */}
                            <div className="px-3 py-2">
                                <div className="text-gray-700 font-medium mb-2">Votes</div>
                                <div className="pl-4 space-y-1">
                                    <Link
                                        to="/votes"
                                        className="block py-1 text-gray-600 hover:text-primary-600 transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Browse Votes
                                    </Link>
                                    <Link
                                        to="/votes/pricing"
                                        className="block py-1 text-gray-600 hover:text-primary-600 transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Vote Pricing
                                    </Link>
                                </div>
                            </div>

                            {/* Mobile Events Menu */}
                            <div className="px-3 py-2">
                                <div className="text-gray-700 font-medium mb-2">Events</div>
                                <div className="pl-4 space-y-1">
                                    <Link
                                        to="/events"
                                        className="block py-1 text-gray-600 hover:text-primary-600 transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Browse Events
                                    </Link>
                                    <Link
                                        to="/events/pricing"
                                        className="block py-1 text-gray-600 hover:text-primary-600 transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Event Pricing
                                    </Link>
                                </div>
                            </div>

                            <Link
                                to="/earn"
                                className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Earn
                            </Link>
                            <Link
                                to="/about"
                                className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                About
                            </Link>
                            <Link
                                to="/contact"
                                className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Contact
                            </Link>

                            {isAuthenticated ? (
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                        Signed in as {user?.name}
                                    </div>
                                    <Link
                                        to="/dashboard"
                                        className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        to="/profile"
                                        className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Profile
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleLogout()
                                            setIsMenuOpen(false)
                                        }}
                                        className="block w-full text-left px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="border-t border-gray-200 pt-4 space-y-1">
                                    <Link
                                        to="/login"
                                        className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Register
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}

export default Header 