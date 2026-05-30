import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
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
    Scan
} from 'lucide-react';
import { eventsApi, scanApi } from '../../services/api';
import QRScanner from '../../components/QRScanner';
import { toast } from 'react-hot-toast';

const TicketScanner: React.FC = () => {
    const { id: eventId } = useParams<{ id: string }>();
    const [scannerOpen, setScannerOpen] = useState(false);
    const [scanLocation, setScanLocation] = useState('Main Gate');
    const [scanHistory, setScanHistory] = useState<any[]>([]);
    const [scanning, setScanning] = useState(false);
    const [scanToken] = useState('demo-scan-token'); // In real app, get from auth

    // Get specific event
    const { data: eventData, isLoading } = useQuery({
        queryKey: ['admin-event', eventId],
        queryFn: () => eventsApi.getEvent(eventId!),
        enabled: !!eventId
    });

    const event = eventData?.data;

    const handleStartScanning = () => {
        if (!eventId) {
            toast.error('No event selected');
            return;
        }
        setScannerOpen(true);
    };

    const handleScanSuccess = async (qrData: string) => {
        setScanning(true);
        try {
            const response = await scanApi.scanTicket({
                qr_data: qrData,
                scan_token: scanToken,
                scan_type: 'entry',
                location: scanLocation
            });

            if (response.status === 'success') {
                toast.success('Ticket scanned successfully!');
                // Add to scan history
                setScanHistory(prev => [{
                    id: Date.now(),
                    qr_data: qrData,
                    scan_time: new Date().toISOString(),
                    result: 'success',
                    ticket_info: response.data.ticket,
                    customer_name: response.data.ticket?.customer_name || 'Unknown'
                }, ...prev.slice(0, 9)]); // Keep last 10 scans
            } else {
                toast.error(response.message || 'Scan failed');
                setScanHistory(prev => [{
                    id: Date.now(),
                    qr_data: qrData,
                    scan_time: new Date().toISOString(),
                    result: 'failed',
                    error: response.message
                }, ...prev.slice(0, 9)]);
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Scan failed';
            toast.error(message);
            setScanHistory(prev => [{
                id: Date.now(),
                qr_data: qrData,
                scan_time: new Date().toISOString(),
                result: 'failed',
                error: message
            }, ...prev.slice(0, 9)]);
        } finally {
            setScanning(false);
            setScannerOpen(false);
        }
    };

    const handleScanError = (error: string) => {
        toast.error(`Scanner error: ${error}`);
        setScanning(false);
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

    if (!event && !isLoading) {
        return (
            <div className="p-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
                <p className="text-gray-600">The event you're looking for doesn't exist or you don't have permission to scan tickets for it.</p>
                <Link to="/admin/events" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Back to Events
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <Link to="/admin/events" className="text-blue-600 hover:text-blue-800">
                            Events
                        </Link>
                        <span className="text-gray-400">/</span>
                        <Link to={`/admin/events/${eventId}/tickets`} className="text-blue-600 hover:text-blue-800">
                            {event?.title || 'Event'}
                        </Link>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-900">Scanner</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Ticket Scanner</h1>
                    <p className="text-gray-600">Scan and validate tickets for {event?.title}</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{new Date().toLocaleString()}</span>
                    </div>
                    <Link
                        to={`/admin/events/${eventId}/analytics`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        View Analytics
                    </Link>
                </div>
            </div>

            {/* Event Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Information</h2>

                {isLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 mt-2">Loading event...</p>
                    </div>
                ) : event ? (
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
                                        <span>{event.start_time ? formatTime(event.start_time) : 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <MapPin className="w-4 h-4" />
                                        <span>{event.venue}</span>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center space-x-4">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${event.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {event.status}
                                    </span>
                                                                {event.statistics && (
                                <span className="text-sm text-gray-600">
                                    <Users className="w-4 h-4 inline mr-1" />
                                    {event.statistics.total_tickets_sold || 0} tickets sold
                                </span>
                            )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Quick Stats */}
            {event && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Valid Scans</p>
                                <p className="text-2xl font-bold text-gray-900">0</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Invalid Scans</p>
                                <p className="text-2xl font-bold text-gray-900">0</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Re-entries</p>
                                <p className="text-2xl font-bold text-gray-900">0</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Entries</p>
                                <p className="text-2xl font-bold text-gray-900">0</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Scanner Controls */}
            {event && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Scanner Settings</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Scan Location
                            </label>
                            <select
                                value={scanLocation}
                                onChange={(e) => setScanLocation(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="Main Gate">Main Gate</option>
                                <option value="VIP Entrance">VIP Entrance</option>
                                <option value="Side Gate">Side Gate</option>
                                <option value="Staff Entrance">Staff Entrance</option>
                                <option value="Emergency Exit">Emergency Exit</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleStartScanning}
                                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                            >
                                <Scan className="w-5 h-5" />
                                <span>Start Scanning</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Scan History */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Scans</h2>
                
                {scanHistory.length > 0 ? (
                    <div className="space-y-3">
                        {scanHistory.map((scan) => (
                            <div key={scan.id} className={`p-3 rounded-lg border-l-4 ${
                                scan.result === 'success' 
                                    ? 'border-green-500 bg-green-50' 
                                    : 'border-red-500 bg-red-50'
                            }`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            {scan.result === 'success' ? (
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-red-600" />
                                            )}
                                            <span className="font-medium text-gray-900">
                                                {scan.result === 'success' ? 'Valid Ticket' : 'Scan Failed'}
                                            </span>
                                        </div>
                                        {scan.customer_name && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                Customer: {scan.customer_name}
                                            </p>
                                        )}
                                        {scan.error && (
                                            <p className="text-sm text-red-600 mt-1">
                                                Error: {scan.error}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">
                                            QR: {scan.qr_data.substring(0, 20)}...
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">
                                            {new Date(scan.scan_time).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No scans yet</p>
                        <p className="text-sm text-gray-500">Start scanning tickets to see history here</p>
                    </div>
                )}
            </div>

            {/* QR Scanner Modal */}
            <QRScanner
                isOpen={scannerOpen}
                onClose={() => setScannerOpen(false)}
                eventId={eventId || ''}
                location={scanLocation}
            />

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Use the Scanner</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                    <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                            <QrCode className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>Select an active event from the list above</span>
                        </div>
                        <div className="flex items-start space-x-2">
                            <Camera className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>Choose your scanning location (gate/entrance)</span>
                        </div>
                        <div className="flex items-start space-x-2">
                            <Scan className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>Click "Start Scanning" to open the scanner</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>Point camera at QR code or enter ticket code manually</span>
                        </div>
                        <div className="flex items-start space-x-2">
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>Review scan results and handle re-entries appropriately</span>
                        </div>
                        <div className="flex items-start space-x-2">
                            <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>Use override function for special cases if needed</span>
                        </div>
                    </div>
                </div>
            </div>


        </div>
    );
};

export default TicketScanner; 