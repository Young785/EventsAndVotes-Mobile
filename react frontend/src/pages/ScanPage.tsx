import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Camera,
    QrCode,
    Calendar,
    MapPin,
    Users,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Clock,
    Scan,
    Shield,
    LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ScanUser {
    id: string;
    name: string;
    email: string;
    role: 'scanner' | 'supervisor';
    scan_location: {
        id: string;
        name: string;
        description: string;
        location_type: 'entry' | 'exit' | 'checkpoint';
        event: {
            id: string;
            title: string;
            venue: string;
            start_date: string;
            start_time: string;
            status: string;
            poster_image?: string;
        };
    };
    permissions: string[];
    token_expires_at: string;
    is_active: boolean;
    total_scans: number;
}

const ScanPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [scannerOpen, setScannerOpen] = useState(false);
    const [scanStats, setScanStats] = useState({
        todayScans: 0,
        totalScans: 0,
        lastScan: null as Date | null
    });

    // Validate scan user token and get user info
    const { data: scanUserData, isLoading, error } = useQuery({
        queryKey: ['scan-user', token],
        queryFn: async () => {
            if (!token) throw new Error('No scan token provided');
            
            const response = await fetch(`${import.meta.env.VITE_API_URL}/scan/validate/${token}`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Invalid or expired scan token');
            }
            
            return response.json();
        },
        enabled: !!token,
        retry: 1
    });

    const scanUser: ScanUser | null = scanUserData?.data || null;

    useEffect(() => {
        if (error) {
            toast.error('Invalid or expired scan URL');
            navigate('/login');
        }
    }, [error, navigate]);

    const handleStartScanning = () => {
        if (!scanUser) {
            toast.error('No scan user authenticated');
            return;
        }
        setScannerOpen(true);
    };

    const handleTicketScan = async (qrData: string) => {
        if (!scanUser) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/scan/ticket`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    qr_data: qrData,
                    scan_token: token,
                    scan_type: scanUser.scan_location.location_type,
                    location: scanUser.scan_location.name
                })
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                toast.success('Ticket scanned successfully');
                setScanStats(prev => ({
                    ...prev,
                    todayScans: prev.todayScans + 1,
                    totalScans: prev.totalScans + 1,
                    lastScan: new Date()
                }));
            } else {
                toast.error(result.message || 'Failed to scan ticket');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to scan ticket');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (timeString: string) => {
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleLogout = () => {
        navigate('/');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Validating scan access...</p>
                </div>
            </div>
        );
    }

    if (error || !scanUser) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                    <p className="text-gray-600 mb-4">Invalid or expired scan URL</p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    const event = scanUser.scan_location.event;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <QrCode className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900">Ticket Scanner</h1>
                                <p className="text-sm text-gray-600">{scanUser.scan_location.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-right text-sm">
                                <p className="text-gray-900 font-medium">{scanUser.name}</p>
                                <p className="text-gray-500 capitalize">{scanUser.role}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-400 hover:text-gray-600"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Event Information */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Information</h2>
                    <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                        <div className="flex items-start space-x-3">
                            {event.poster_image ? (
                                <img
                                    src={event.poster_image}
                                    alt={event.title}
                                    className="w-16 h-16 object-cover rounded-lg"
                                />
                            ) : (
                                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <Calendar className="w-8 h-8 text-gray-400" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 text-lg">
                                    {event.title}
                                </h3>
                                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>{formatDate(event.start_date)}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Clock className="w-4 h-4" />
                                        <span>{formatTime(event.start_time)}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <MapPin className="w-4 h-4" />
                                        <span>{event.venue}</span>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center space-x-4">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                        event.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {event.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Location Info */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Scan Location</h2>
                    <div className="flex items-center space-x-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <MapPin className="w-8 h-8 text-purple-600" />
                        <div>
                            <h3 className="font-medium text-gray-900">{scanUser.scan_location.name}</h3>
                            <p className="text-sm text-gray-600">{scanUser.scan_location.description}</p>
                            <p className="text-xs text-purple-600 uppercase font-medium mt-1">
                                {scanUser.scan_location.location_type}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Scanner Controls */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Ticket Scanner</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Today's Scans</p>
                                    <p className="text-2xl font-bold text-blue-600">{scanStats.todayScans}</p>
                                </div>
                                <Scan className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Scans</p>
                                    <p className="text-2xl font-bold text-green-600">{scanUser.total_scans + scanStats.totalScans}</p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Last Scan</p>
                                    <p className="text-sm font-medium text-orange-600">
                                        {scanStats.lastScan ? scanStats.lastScan.toLocaleTimeString() : 'None'}
                                    </p>
                                </div>
                                <Clock className="w-8 h-8 text-orange-600" />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleStartScanning}
                        className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
                    >
                        <Camera className="w-6 h-6" />
                        <span>Start Scanning Tickets</span>
                    </button>
                </div>

                {/* Security Info */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-medium text-yellow-800">Security Information</h4>
                            <div className="mt-1 text-xs text-yellow-700">
                                <p>Token expires: {new Date(scanUser.token_expires_at).toLocaleString()}</p>
                                <p>Permissions: {scanUser.permissions.join(', ') || 'Standard scanning'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* QR Scanner Modal */}
            {scannerOpen && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">QR Code Scanner</h3>
                            <button
                                onClick={() => setScannerOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <p className="text-gray-600">
                                Enter ticket QR code data manually or use a camera to scan:
                            </p>
                            <input
                                type="text"
                                placeholder="Enter QR code data"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const input = e.currentTarget;
                                        if (input.value.trim()) {
                                            handleTicketScan(input.value.trim());
                                            input.value = '';
                                            setScannerOpen(false);
                                        }
                                    }
                                }}
                            />
                            <button
                                onClick={() => setScannerOpen(false)}
                                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScanPage; 