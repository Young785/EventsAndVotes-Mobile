import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    Camera,
    X,
    CheckCircle,
    AlertTriangle,
    XCircle,
    RefreshCw,
    MapPin,
    Clock,
    User,
    Ticket
} from 'lucide-react';
import { ticketsApi } from '../services/api';
import { toast } from 'react-hot-toast';

interface QRScannerProps {
    isOpen: boolean;
    onClose: () => void;
    eventId?: string;
    location?: string;
}

interface ScanResult {
    success: boolean;
    ticket?: {
        id: string;
        uuid: string;
        customer_name: string;
        tier_name: string;
        event_title: string;
        status: string;
        scan_count: number;
        can_re_enter: boolean;
    };
    message: string;
    warning?: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({
    isOpen,
    onClose,
    eventId,
    location = 'Main Gate'
}) => {
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [manualCode, setManualCode] = useState('');
    const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const scanTicketMutation = useMutation({
        mutationFn: ticketsApi.scanTicket,
        onSuccess: (data) => {
            setScanResult(data);
            if (data.success) {
                if (data.warning) {
                    toast.success(data.message, { icon: '⚠️' });
                } else {
                    toast.success(data.message);
                }
            } else {
                toast.error(data.message);
            }
        },
        onError: (error: any) => {
            console.error('Scan error:', error);
            const errorMessage = error.response?.data?.message || 'Failed to scan ticket';
            setScanResult({
                success: false,
                message: errorMessage
            });
            toast.error(errorMessage);
        }
    });

    const overrideScanMutation = useMutation({
        mutationFn: ({ ticketId, reason }: { ticketId: string; reason: string }) =>
            ticketsApi.overrideScan(ticketId, { reason, location }),
        onSuccess: (data) => {
            toast.success('Ticket override successful');
            setScanResult(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to override scan');
        }
    });

    useEffect(() => {
        if (isOpen && scanMode === 'camera') {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isOpen, scanMode]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsScanning(true);
            }
        } catch (error) {
            console.error('Camera access error:', error);
            toast.error('Unable to access camera. Please use manual entry.');
            setScanMode('manual');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsScanning(false);
    };

    const handleScan = (qrData: string) => {
        if (!qrData.trim()) {
            toast.error('Please enter a valid QR code');
            return;
        }

        const scanData = {
            qr_data: qrData,
            scan_type: 'entry',
            location
        };

        scanTicketMutation.mutate(scanData);
    };

    const handleManualScan = () => {
        if (!manualCode.trim()) {
            toast.error('Please enter a ticket code');
            return;
        }
        handleScan(manualCode);
        setManualCode('');
    };

    const handleOverride = (reason: string) => {
        if (scanResult?.ticket?.id) {
            overrideScanMutation.mutate({
                ticketId: scanResult.ticket.id,
                reason
            });
        }
    };

    const resetScan = () => {
        setScanResult(null);
        setManualCode('');
    };

    const getStatusColor = (result: ScanResult) => {
        if (result.success) {
            return result.warning ? 'text-yellow-600' : 'text-green-600';
        }
        return 'text-red-600';
    };

    const getStatusIcon = (result: ScanResult) => {
        if (result.success) {
            return result.warning ? (
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
            ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
            );
        }
        return <XCircle className="w-8 h-8 text-red-600" />;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-50 dark:bg-secondary-8000 bg-opacity-75" onClick={onClose} />

                <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-secondary-900 shadow-xl rounded-lg">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-secondary-700">
                        <div className="flex items-center space-x-3">
                            <Camera className="w-6 h-6 text-primary" />
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ticket Scanner</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <MapPin className="w-4 h-4 inline mr-1" />
                                    {location}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-secondary-800"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {!scanResult ? (
                            <div className="space-y-6">
                                {/* Scan Mode Toggle */}
                                <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setScanMode('camera')}
                                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${scanMode === 'camera'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        <Camera className="w-4 h-4 inline mr-2" />
                                        Camera Scan
                                    </button>
                                    <button
                                        onClick={() => setScanMode('manual')}
                                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${scanMode === 'manual'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        <Ticket className="w-4 h-4 inline mr-2" />
                                        Manual Entry
                                    </button>
                                </div>

                                {scanMode === 'camera' ? (
                                    <div className="space-y-4">
                                        <div className="relative bg-black rounded-lg overflow-hidden">
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                className="w-full h-64 object-cover"
                                            />
                                            {!isScanning && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                                                    <div className="text-center text-white">
                                                        <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                        <p>Starting camera...</p>
                                                    </div>
                                                </div>
                                            )}
                                            {/* Scan overlay */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg opacity-75"></div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 text-center">
                                            Position the QR code within the frame to scan
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Enter Ticket Code
                                            </label>
                                            <div className="flex space-x-2">
                                                <input
                                                    type="text"
                                                    value={manualCode}
                                                    onChange={(e) => setManualCode(e.target.value)}
                                                    placeholder="Enter ticket UUID or QR code data"
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                                    onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                                                />
                                                <button
                                                    onClick={handleManualScan}
                                                    disabled={!manualCode.trim() || scanTicketMutation.isPending}
                                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {scanTicketMutation.isPending ? (
                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Scan'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Scan Result */
                            <div className="space-y-6">
                                <div className="text-center">
                                    {getStatusIcon(scanResult)}
                                    <h4 className={`text-xl font-semibold mt-3 ${getStatusColor(scanResult)}`}>
                                        {scanResult.success ? 'Valid Ticket' : 'Invalid Ticket'}
                                    </h4>
                                    <p className="text-gray-600 mt-2">{scanResult.message}</p>
                                </div>

                                {scanResult.ticket && (
                                    <div className="bg-gray-50 dark:bg-secondary-800 rounded-lg p-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Customer:</span>
                                                <p className="text-gray-900 dark:text-white">{scanResult.ticket.customer_name}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Ticket Type:</span>
                                                <p className="text-gray-900 dark:text-white">{scanResult.ticket.tier_name}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Event:</span>
                                                <p className="text-gray-900 dark:text-white">{scanResult.ticket.event_title}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Scan Count:</span>
                                                <p className="text-gray-900 dark:text-white">{scanResult.ticket.scan_count}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex space-x-3">
                                    <button
                                        onClick={resetScan}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:bg-secondary-800"
                                    >
                                        Scan Another
                                    </button>

                                    {!scanResult.success && scanResult.ticket && (
                                        <button
                                            onClick={() => handleOverride('Manual override by gate staff')}
                                            disabled={overrideScanMutation.isPending}
                                            className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                                        >
                                            {overrideScanMutation.isPending ? 'Overriding...' : 'Override'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-secondary-800 border-t border-gray-200 dark:border-secondary-700">
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4" />
                                <span>{new Date().toLocaleTimeString()}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <User className="w-4 h-4" />
                                <span>Gate Staff</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRScanner; 