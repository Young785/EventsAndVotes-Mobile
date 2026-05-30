import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import Select, { SingleValue } from 'react-select'
import {
    Search,
    Filter,
    ShoppingCart,
    Vote,
    User,
    Calendar,
    Clock,
    MapPin,
    Eye,
    Plus,
    Minus,
    X,
    CreditCard,
    Wallet,
    Check,
    ArrowRight,
    Share2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../hooks/useCart'
import LoadingSpinner from '../components/LoadingSpinner'
import ShareModal from '../components/ShareModal'
import paymentService from '../services/paymentService'
import toast from 'react-hot-toast'
import { getNomineeImageUrl, getVoteImageUrl } from '../utils/imageUtils'

interface Vote {
    id: number
    vote_id: string
    name: string
    slug: string
    description: string
    start_date: string
    end_date: string
    nomination_start: string
    nomination_end_date: string
    release_result_date: string
    image: string
    payment_mode: 'FREE' | 'PAID'
    price_per_vote: number
    status: 'STARTED' | 'COMPLETED' | 'POSTPONED' | 'INACTIVE'
    positions_count: number
    nominees_count: number
    total_votes: number
    created_by: string
    created_at: string
    updated_at: string
    assigned_pg_id?: string
}

interface Position {
    id: number
    position_id: string
    vote_id: string
    title: string
    description?: string
    gender: 'MALE' | 'FEMALE' | 'ALL'
    minimum: number
    maximum: number
    status: 'ACTIVE' | 'INACTIVE'
    nominees_count?: number
    created_at: string
    updated_at: string
}

interface Nominee {
    id: number
    nominees_id: string
    position_id: string
    first_name: string
    last_name: string
    nick_name: string
    email?: string
    phone: string
    level: string
    image?: string
    total_votes: number
    position?: Position
    created_at: string
    updated_at: string
}

interface PaymentGateway {
    id: string
    name: string
    slug: string
    key: string
    pg_id: string
    logo?: string
    status: 'active' | 'inactive'
}

const VotingPage: React.FC = () => {
    const { slug, voteId } = useParams<{ slug: string; voteId: string }>()
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()

    // Get URL parameters
    const positionFilter = searchParams.get('pid') || 'all'
    const searchQuery = searchParams.get('name') || ''
    const currentPage = parseInt(searchParams.get('page') || '1', 10)

    const [selectedPosition, setSelectedPosition] = useState<string>(positionFilter)
    const [searchTerm, setSearchTerm] = useState(searchQuery)
    const [showCart, setShowCart] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)
    const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string; nominee: Nominee } | null>(null)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    const { user } = useAuth()
    const queryClient = useQueryClient()

    // Use frontend cart hook instead of backend
    const {
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
        getItemQuantity,
        cartCount,
        totalAmount
    } = useCart()

    // Update URL when filters change
    const updateURL = (newParams: { [key: string]: string | number }) => {
        const params = new URLSearchParams(searchParams)

        Object.entries(newParams).forEach(([key, value]) => {
            if (value && value !== 'all' && value !== '' && value !== 1) {
                params.set(key, value.toString())
            } else {
                params.delete(key)
            }
        })

        setSearchParams(params)
    }

    // Handle search with debouncing
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm !== searchQuery || selectedPosition !== positionFilter) {
                updateURL({
                    name: searchTerm,
                    pid: selectedPosition,
                    page: 1
                })
            }
        }, 300) // Reduced from 500ms to 300ms for better responsiveness

        return () => clearTimeout(timeoutId)
    }, [searchTerm, selectedPosition])

    // Handle position filter change
    const handlePositionChange = (position: string) => {
        setSelectedPosition(position)
        // Immediately update URL for position changes
        updateURL({
            name: searchTerm,
            pid: position,
            page: 1
        })
    }

    // Handle search input change
    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        // Don't update URL immediately, let the debounce handle it
    }

    // Handle search form submission (Enter key)
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateURL({
            name: searchTerm,
            pid: selectedPosition,
            page: 1
        })
    }

    // Handle page change
    const handlePageChange = (page: number) => {
        updateURL({
            name: searchTerm,
            pid: selectedPosition,
            page
        })
    }

    // Fetch vote details
    const { data: voteData, isLoading: voteLoading, error: voteError } = useQuery({
        queryKey: ['vote-details', slug, voteId],
        queryFn: async () => {
            console.log('Fetching vote details for:', { slug, voteId })
            const apiUrl = import.meta.env.VITE_API_URL || '/api'
            const fullUrl = `${apiUrl}/votes/${slug}/${voteId}`
            console.log('API URL:', fullUrl)

            const response = await fetch(fullUrl, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            console.log('Response status:', response.status)
            const data = await response.json()
            console.log('Response data:', data)

            return data
        },
        enabled: !!slug && !!voteId
    })

    // Fetch nominees and positions with pagination
    const { data: nomineesData, isLoading: nomineesLoading, error: nomineesError } = useQuery({
        queryKey: ['vote-nominees', slug, voteId, selectedPosition, searchTerm, currentPage],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (selectedPosition !== 'all') params.append('pid', selectedPosition)
            if (searchTerm.trim()) params.append('search', searchTerm.trim())
            params.append('page', currentPage.toString())
            params.append('per_page', '12') // 12 nominees per page

            const apiUrl = import.meta.env.VITE_API_URL || '/api'
            const fullUrl = `${apiUrl}/contest/nominees/${slug}/${voteId}?${params}`

            try {
                const response = await fetch(fullUrl, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }

                const data = await response.json()

                if (data.status === 'error') {
                    throw new Error(data.message || 'Failed to fetch nominees')
                }

                return data
            } catch (error) {
                console.error('Error fetching nominees:', error)
                throw error
            }
        },
        enabled: !!slug && !!voteId,
        retry: 2, // Retry failed requests twice
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
        staleTime: 30000, // Cache data for 30 seconds
    })

    // Extract positions from nominees data (since they come together)
    const positionsData = nomineesData?.data?.positions ? {
        status: 'success',
        data: nomineesData.data.positions
    } : null

    const vote = voteData?.data
    console.log(vote)
    console.log('Vote data structure:', { voteData, vote, voteError })
    const nominees = nomineesData?.data?.nominees || []
    const positions = nomineesData?.data?.positions || []
    const pagination = nomineesData?.data?.pagination || {
        current_page: 1,
        last_page: 1,
        per_page: 12,
        total: 0
    }

    useEffect(() => {
        if (positionFilter && positionFilter !== selectedPosition) {
            setSelectedPosition(positionFilter)
        }
        if (searchQuery && searchQuery !== searchTerm) {
            setSearchTerm(searchQuery)
        }
    }, [positionFilter, searchQuery])

    // Handle lightbox navigation
    const openLightbox = (nominee: Nominee, index: number) => {
        const imageSrc = getNomineeImageUrl({ image: nominee.image }) ||
            getNomineeImageUrl({ image: vote.image }) ||
            getNomineeImageUrl({ image: '/default-avatar.jpg' })

        setLightboxImage({
            src: imageSrc,
            alt: `${nominee.first_name} ${nominee.last_name}`,
            nominee
        })
        setCurrentImageIndex(index)
    }

    const closeLightbox = () => {
        setLightboxImage(null)
    }

    const navigateLightbox = (direction: 'prev' | 'next') => {
        if (!nominees.length) return

        let newIndex = currentImageIndex
        if (direction === 'next') {
            newIndex = (currentImageIndex + 1) % nominees.length
        } else {
            newIndex = currentImageIndex === 0 ? nominees.length - 1 : currentImageIndex - 1
        }

        const nominee = nominees[newIndex]
        openLightbox(nominee, newIndex)
    }

    // Handle keyboard navigation for lightbox
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!lightboxImage) return

            switch (e.key) {
                case 'Escape':
                    closeLightbox()
                    break
                case 'ArrowLeft':
                    e.preventDefault()
                    navigateLightbox('prev')
                    break
                case 'ArrowRight':
                    e.preventDefault()
                    navigateLightbox('next')
                    break
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [lightboxImage, currentImageIndex, nominees])

    const handleAddToCart = (nominee: Nominee) => {
        addToCart(nominee.nominees_id, 1, {
            vote_title: vote?.name || 'Vote',
            position_title: nominee.position?.title || 'Position',
            nominee_name: `${nominee.first_name} ${nominee.last_name}`,
            amount: vote?.price_per_vote || 0,
            vote_id: vote?.vote_id,
            level: nominee.level,
            // Legacy support
            name: `${nominee.first_name} ${nominee.last_name}`,
            nick_name: nominee.nick_name,
            position: nominee.position?.title || 'Position',
            price: vote?.price_per_vote || 0
        })
        toast.success('Added to cart successfully')
    }

    const handleRemoveFromCart = (nominee_id: string) => {
        removeFromCart(nominee_id)
        toast.success('Removed from cart')
    }

    const handleUpdateCartQuantity = (nominee_id: string, quantity: number) => {
        if (quantity <= 0) {
            handleRemoveFromCart(nominee_id)
        } else {
            updateQuantity(nominee_id, quantity)
        }
    }

    const handleQuantityInputChange = (nominee_id: string, value: string) => {
        const quantity = parseInt(value) || 0
        if (quantity <= 0) {
            handleRemoveFromCart(nominee_id)
        } else {
            updateQuantity(nominee_id, quantity)
        }
    }

    const getTotalCartAmount = () => {
        return totalAmount
    }

    const getTotalCartItems = () => {
        return cartCount
    }

    // Cart checkout using payment service
    const handleCheckout = async () => {
        if (cartItems.length === 0) {
            toast.error('Your cart is empty')
            return
        }

        setIsProcessing(true)

        try {
            // Convert cart items to backend format
            const cartItemsForApi = cartItems.map(item => ({
                nominee_id: item.nominee_id || item.id,
                quantity: item.quantity,
                vote_id: item.vote_id || vote?.vote_id
            })).filter(item => item.vote_id) // Filter out items without vote_id

            if (cartItemsForApi.length === 0) {
                toast.error('No valid items in cart')
                setIsProcessing(false)
                return
            }

            const checkoutData = {
                full_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Guest' : 'Guest',
                customer_email: user?.email || 'customer-' + Math.random().toString(36).substring(2, 15) + '@eventandvotes.com.ng',
                cart_items: cartItemsForApi
            }

            await paymentService.completeCheckout(
                checkoutData,
                (response) => {
                    // Payment successful
                    toast.success('Payment completed successfully! Your votes have been cast.')
                    setShowCart(false)
                    clearCart() // Clear frontend cart
                    setIsProcessing(false)
                },
                (error) => {
                    // Payment failed
                    toast.error(error)
                    setIsProcessing(false)
                },
                () => {
                    // Payment cancelled
                    toast.error('Payment was cancelled')
                    setIsProcessing(false)
                }
            )
        } catch (error: any) {
            toast.error(error.message || 'Checkout failed')
            setIsProcessing(false)
        }
    }

    const handleShare = () => {
        setShowShareModal(true)
    }

    if (voteLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        )
    }

    if (!vote) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Vote Not Found</h2>
                    <p className="text-gray-600 mb-4">The vote you're looking for doesn't exist.</p>
                    <Link to="/votes" className="text-blue-600 hover:text-blue-700">
                        Back to Votes
                    </Link>
                </div>
            </div>
        )
    }

    const isVotingActive = vote.status === 'STARTED' &&
        new Date() >= new Date(vote.start_date) &&
        new Date() <= new Date(vote.end_date)

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{vote.name}</h1>
                            <p className="mt-2 text-gray-600">{vote.description}</p>
                            <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                                <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    <span>Voting: {new Date(vote.start_date).toLocaleDateString()} - {new Date(vote.end_date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center">
                                    <Vote className="w-4 h-4 mr-1" />
                                    <span>{vote.total_votes} votes cast</span>
                                </div>
                                <div className="flex items-center">
                                    <User className="w-4 h-4 mr-1" />
                                    <span>{vote.nominees_count} nominees</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            {/* Share Button */}
                            <button
                                onClick={handleShare}
                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2"
                            >
                                <Share2 className="w-5 h-5" />
                                <span>Share</span>
                            </button>

                            {/* Cart Button */}
                            <button
                                onClick={() => setShowCart(true)}
                                className="relative bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                <span>Cart</span>
                                {getTotalCartItems() > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                                        {getTotalCartItems()}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vote Status Banner */}
            <div className={`py-3 px-4 ${isVotingActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                <div className="max-w-7xl mx-auto text-center">
                    <p className="font-medium">
                        {isVotingActive ? 'Voting is currently active!' :
                            vote.status === 'COMPLETED' ? 'Voting has ended' :
                                'Voting has not started yet'}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                        <div className="flex-1 max-w-full lg:max-w-md">
                            <div className="relative">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search nominees..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSearchSubmit(e)
                                        }
                                    }}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                            <div className="flex items-center space-x-2">
                                <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <div className="flex-1 sm:flex-none min-w-0">
                                    <Select
                                        value={positions.length > 0 ?
                                            (selectedPosition === 'all' ?
                                                { value: 'all', label: 'All Positions' } :
                                                positions.find((p: Position) => p.position_id === selectedPosition) ?
                                                    { value: selectedPosition, label: `${positions.find((p: Position) => p.position_id === selectedPosition)?.title} (${positions.find((p: Position) => p.position_id === selectedPosition)?.gender})` } :
                                                    { value: 'all', label: 'All Positions' }
                                            ) : { value: 'all', label: 'All Positions' }
                                        }
                                        onChange={(option: SingleValue<{ value: string; label: string }>) => handlePositionChange(option?.value || 'all')}
                                        options={[
                                            { value: 'all', label: 'All Positions' },
                                            ...positions.map((position: Position) => ({
                                                value: position.position_id,
                                                label: `${position.title} (${position.gender})`
                                            }))
                                        ]}
                                        placeholder="Select position..."
                                        isSearchable={true}
                                        isClearable={false}
                                        className="react-select-container"
                                        classNamePrefix="react-select"
                                        styles={{
                                            control: (provided, state) => ({
                                                ...provided,
                                                minHeight: '38px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '8px',
                                                boxShadow: state.isFocused ? '0 0 0 2px #3b82f6' : 'none',
                                                '&:hover': {
                                                    borderColor: '#9ca3af'
                                                },
                                                fontSize: window.innerWidth < 640 ? '14px' : '16px'
                                            }),
                                            option: (provided, state) => ({
                                                ...provided,
                                                backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
                                                color: state.isSelected ? 'white' : '#374151',
                                                fontSize: window.innerWidth < 640 ? '14px' : '16px',
                                                padding: '8px 12px'
                                            }),
                                            menu: (provided) => ({
                                                ...provided,
                                                zIndex: 50,
                                                borderRadius: '8px',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                                            }),
                                            menuList: (provided) => ({
                                                ...provided,
                                                borderRadius: '8px',
                                                padding: '4px'
                                            }),
                                            singleValue: (provided) => ({
                                                ...provided,
                                                color: '#374151',
                                                fontSize: window.innerWidth < 640 ? '14px' : '16px'
                                            }),
                                            placeholder: (provided) => ({
                                                ...provided,
                                                color: '#9ca3af',
                                                fontSize: window.innerWidth < 640 ? '14px' : '16px'
                                            })
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nominees Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                {nomineesLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner />
                    </div>
                ) : nominees.length === 0 ? (
                    <div className="text-center py-12">
                        <User className="w-24 h-24 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Nominees Available</h3>
                        <p className="text-gray-600 mb-2 px-4">
                            {positions.length === 0
                                ? "No positions have been created for this vote yet."
                                : "No nominees have been registered for the available positions yet."
                            }
                        </p>
                        <p className="text-gray-500 text-sm px-4">
                            Please check back later or contact the vote organizer.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {nominees.map((nominee: Nominee, index: number) => (
                            <div key={nominee.nominees_id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                                <div className="aspect-w-1 aspect-h-1 relative group cursor-pointer" onClick={() => openLightbox(nominee, index)}>
                                    <img
                                        src={getNomineeImageUrl({ image: nominee.image }) || getNomineeImageUrl({ image: vote.image }) || getNomineeImageUrl({ image: '/default-avatar.jpg' })}
                                        alt={`${nominee.first_name} ${nominee.last_name}`}
                                        className="w-full h-40 sm:h-48 object-cover transition-transform duration-200 group-hover:scale-105"
                                        style={{ objectFit: 'contain' }}
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                                        <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                    </div>
                                </div>

                                <div className="p-3 sm:p-4">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 leading-tight">
                                        {nominee.first_name} {nominee.last_name}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-600 mb-2 leading-tight">
                                        P.K.A: {nominee.nick_name}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 mb-2 leading-tight">
                                        Position: {nominee.position?.title}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 leading-tight">
                                        Level: {nominee.level.substring(3)}
                                    </p>

                                    {vote.payment_mode === 'PAID' && (
                                        <p className="text-sm font-medium text-gray-900 mb-3 sm:mb-4">
                                            ₦{vote.price_per_vote.toLocaleString()} per vote
                                        </p>
                                    )}

                                    {isVotingActive ? (
                                        isInCart(nominee.nominees_id) ? (
                                            <div className="space-y-2 sm:space-y-3">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleUpdateCartQuantity(nominee.nominees_id, getItemQuantity(nominee.nominees_id) - 1)}
                                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors duration-200"
                                                    >
                                                        <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={getItemQuantity(nominee.nominees_id)}
                                                        onChange={(e) => handleQuantityInputChange(nominee.nominees_id, e.target.value)}
                                                        className="flex-1 text-center border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                    />
                                                    <button
                                                        onClick={() => handleUpdateCartQuantity(nominee.nominees_id, getItemQuantity(nominee.nominees_id) + 1)}
                                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors duration-200"
                                                    >
                                                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveFromCart(nominee.nominees_id)}
                                                    className="w-full text-red-600 hover:text-red-700 text-xs sm:text-sm py-1"
                                                >
                                                    Remove from Cart
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleAddToCart(nominee)}
                                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
                                            >
                                                <Vote className="w-3 h-3 sm:w-4 sm:h-4" />
                                                <span>Vote {nominee.position?.gender === 'MALE' ? 'Him' : 'Her'}</span>
                                            </button>
                                        )
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed text-sm sm:text-base"
                                        >
                                            Voting Not Active
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {nominees.length > 0 && pagination.last_page > 1 && (
                    <div className="mt-8 flex items-center justify-center">
                        <div className="flex items-center space-x-1">
                            {/* Previous button */}
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-1"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Previous</span>
                            </button>

                            {/* Page numbers */}
                            {[...Array(pagination.last_page)].map((_, index) => {
                                const page = index + 1
                                const isCurrentPage = page === currentPage
                                const shouldShow = page === 1 || page === pagination.last_page || Math.abs(page - currentPage) <= 2

                                if (!shouldShow) {
                                    if (page === currentPage - 3 || page === currentPage + 3) {
                                        return (
                                            <span key={page} className="px-2 py-2 text-gray-500">
                                                ...
                                            </span>
                                        )
                                    }
                                    return null
                                }

                                return (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`px-3 py-2 rounded-lg border transition-colors duration-200 ${isCurrentPage
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                )
                            })}

                            {/* Next button */}
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === pagination.last_page}
                                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-1"
                            >
                                <span className="hidden sm:inline">Next</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Results summary */}
                {nominees.length > 0 && (
                    <div className="mt-4 text-center text-sm text-gray-600">
                        Showing {((currentPage - 1) * pagination.per_page) + 1} to {Math.min(currentPage * pagination.per_page, pagination.total)} of {pagination.total} nominees
                        {searchTerm && ` matching "${searchTerm}"`}
                        {selectedPosition !== 'all' && positions.find((p: Position) => p.position_id === selectedPosition) && ` in ${positions.find((p: Position) => p.position_id === selectedPosition)?.title}`}
                    </div>
                )}
            </div>

            {/* Cart Modal */}
            {showCart && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Your Cart ({getTotalCartItems()} items)
                                </h3>
                                <button
                                    onClick={() => setShowCart(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-96">
                            {cartItems.length === 0 ? (
                                <div className="text-center py-8">
                                    <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-600">Your cart is empty</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cartItems.map((item) => (
                                        <div key={item.nominee_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900">{item.nominee_name || item.name}</h4>
                                                <p className="text-sm text-gray-600">P.K.A: {item.nick_name}</p>
                                                <p className="text-sm text-gray-600">Position: {item.position_title || item.position}</p>
                                                <p className="text-sm text-gray-600">Level: {item.level}</p>
                                                <p className="text-sm font-medium text-gray-900">₦{(item.amount || item.price || 0).toLocaleString()} each</p>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleUpdateCartQuantity(item.nominee_id, item.quantity - 1)}
                                                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors duration-200"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleQuantityInputChange(item.nominee_id, e.target.value)}
                                                        className="w-16 text-center border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                    <button
                                                        onClick={() => handleUpdateCartQuantity(item.nominee_id, item.quantity + 1)}
                                                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors duration-200"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="text-right">
                                                    <p className="font-medium text-gray-900">₦{((item.amount || item.price || 0) * item.quantity).toLocaleString()}</p>
                                                    <button
                                                        onClick={() => handleRemoveFromCart(item.nominee_id)}
                                                        className="text-red-600 hover:text-red-700 text-sm"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {cartItems.length > 0 && (
                            <div className="p-6 border-t border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                                    <span className="text-xl font-bold text-gray-900">₦{getTotalCartAmount().toLocaleString()}</span>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={handleCheckout}
                                        disabled={isProcessing}
                                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <LoadingSpinner />
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CreditCard className="w-5 h-5" />
                                                <span>Proceed to Checkout</span>
                                            </>
                                        )}
                                    </button>

                                    <Link
                                        to="/cart"
                                        className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-2"
                                        onClick={() => setShowCart(false)}
                                    >
                                        <ShoppingCart className="w-5 h-5" />
                                        <span>View Cart</span>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Lightbox Modal */}
            {lightboxImage && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4">
                    <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center">
                        {/* Close Button */}
                        <button
                            onClick={closeLightbox}
                            className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all duration-200"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Navigation Buttons */}
                        {nominees.length > 1 && (
                            <>
                                <button
                                    onClick={() => navigateLightbox('prev')}
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all duration-200"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={() => navigateLightbox('next')}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all duration-200"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </>
                        )}

                        {/* Image Container */}
                        <div className="relative bg-white rounded-lg shadow-2xl overflow-hidden max-w-full max-h-full">
                            <img
                                src={lightboxImage.src}
                                alt={lightboxImage.alt}
                                className="max-w-full max-h-[80vh] object-contain"
                            />

                            {/* Image Info */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                                <div className="text-white">
                                    <h3 className="text-xl font-semibold mb-1">
                                        {lightboxImage.nominee.first_name} {lightboxImage.nominee.last_name}
                                    </h3>
                                    <p className="text-sm opacity-90 mb-1">P.K.A: {lightboxImage.nominee.nick_name}</p>
                                    <p className="text-sm opacity-90 mb-1">Position: {lightboxImage.nominee.position?.title}</p>
                                    <p className="text-sm opacity-90">Level: {lightboxImage.nominee.level.substring(3)}</p>
                                    {nominees.length > 1 && (
                                        <p className="text-xs opacity-75 mt-2">
                                            {currentImageIndex + 1} of {nominees.length} nominees
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Click outside to close */}
                        <div
                            className="absolute inset-0 -z-10"
                            onClick={closeLightbox}
                        />
                    </div>
                </div>
            )}

            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                title="Share This Vote"
                description="Spread the word and encourage more people to participate in this vote!"
                urls={{
                    vote: `${window.location.origin}/votes/${slug}/${voteId}`,
                    nomination: `${window.location.origin}/contest/${slug}`,
                    results: `${window.location.origin}/votes/${slug}/${voteId}/results`
                }}
                voteTitle={vote?.name || 'Vote'}
            />
        </div>
    )
}

export default VotingPage 