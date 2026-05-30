import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    User,
    Mail,
    Phone,
    Lock,
    Camera,
    Save,
    Eye,
    EyeOff,
    Shield,
    Bell,
    CreditCard,
    Gift,
    Upload,
    QrCode,
    Smartphone,
    Key
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { profileApi, notificationSettingsApi, twoFactorApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { getUserAvatarUrl } from '../utils/imageUtils';
import toast from 'react-hot-toast';

const profileSchema = z.object({
    first_name: z.string().min(2, 'First name must be at least 2 characters'),
    last_name: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
});

const passwordSchema = z.object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
    new_password_confirmation: z.string()
}).refine((data) => data.new_password === data.new_password_confirmation, {
    message: "Passwords don't match",
    path: ["new_password_confirmation"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface ProfileData {
    user_info: {
        account_id: string;
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
        image: string | null;
        email_verified_at: string | null;
        created_at: string;
        balance: number;
        role: {
            name: string;
            display_name: string;
        };
    };
    subscription_info: any | null;
    referral_info: any;
    referral_link: string;
    commission_rates: any;
}

interface NotificationSettings {
    email_notifications: boolean;
    vote_updates: boolean;
    marketing: boolean;
    security_alerts: boolean;
    referral_updates: boolean;
}

interface TwoFactorStatus {
    two_factor_enabled: boolean;
    two_factor_type: string | null;
    has_backup_codes: boolean;
}

const ProfilePage: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
        email_notifications: true,
        vote_updates: false,
        marketing: false,
        security_alerts: true,
        referral_updates: true
    });
    const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus>({
        two_factor_enabled: false,
        two_factor_type: null,
        has_backup_codes: false
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const {
        register: registerProfile,
        handleSubmit: handleProfileSubmit,
        formState: { errors: profileErrors },
        setValue: setProfileValue,
        reset: resetProfile
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            email: '',
            phone: ''
        }
    });

    const {
        register: registerPassword,
        handleSubmit: handlePasswordSubmit,
        formState: { errors: passwordErrors },
        reset: resetPassword
    } = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema)
    });

    // Load profile data on component mount
    useEffect(() => {
        loadProfileData();
        loadTwoFactorStatus();
    }, []);

    // Update form when profile data loads
    useEffect(() => {
        if (profileData) {
            setProfileValue('first_name', profileData.user_info.first_name);
            setProfileValue('last_name', profileData.user_info.last_name);
            setProfileValue('email', profileData.user_info.email);
            setProfileValue('phone', profileData.user_info.phone);
        }
    }, [profileData, setProfileValue]);

    const loadProfileData = async () => {
        try {
            setIsLoading(true);
            const response = await profileApi.getProfile();
            if (response.status === 'success' && response.data) {
                setProfileData(response.data);
            }
        } catch (error) {
            toast.error('Failed to load profile data');
        } finally {
            setIsLoading(false);
        }
    };

    const loadTwoFactorStatus = async () => {
        try {
            const response = await twoFactorApi.getStatus();
            if (response.status === 'success' && response.data) {
                setTwoFactorStatus(response.data);
            }
        } catch (error) {
            console.error('Failed to load 2FA status:', error);
        }
    };

    const onProfileSubmit = async (data: ProfileFormData) => {
        setIsLoading(true);
        try {
            const response = await profileApi.updateProfile({
                first_name: data.first_name,
                last_name: data.last_name,
                phone: data.phone
            });

            if (response.status === 'success') {
                toast.success('Profile updated successfully!');

                // Update user context
                if (user) {
                    updateUser({
                        ...user,
                        first_name: data.first_name,
                        last_name: data.last_name,
                        phone: data.phone
                    });
                }

                // Reload profile data
                await loadProfileData();
            } else {
                toast.error(response.message || 'Failed to update profile');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update profile. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const onPasswordSubmit = async (data: PasswordFormData) => {
        setIsLoading(true);
        try {
            const response = await profileApi.changePassword({
                current_password: data.current_password,
                new_password: data.new_password,
                new_password_confirmation: data.new_password_confirmation
            });

            if (response.status === 'success') {
                toast.success('Password updated successfully!');
                resetPassword();
            } else {
                toast.error(response.message || 'Failed to update password');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast.error('Image size must be less than 2MB');
                return;
            }

            if (!file.type.startsWith('image/')) {
                toast.error('Please select a valid image file');
                return;
            }

            setSelectedImage(file);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageUpload = async () => {
        if (!selectedImage) return;

        setIsLoading(true);
        try {
            const response = await profileApi.uploadAvatar(selectedImage);

            if (response.status === 'success') {
                toast.success('Profile picture updated successfully!');
                setSelectedImage(null);
                setImagePreview(null);
                await loadProfileData();
            } else {
                toast.error(response.message || 'Failed to upload image');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to upload image. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNotificationToggle = async (setting: keyof NotificationSettings) => {
        const newSettings = {
            ...notificationSettings,
            [setting]: !notificationSettings[setting]
        };
        setNotificationSettings(newSettings);

        try {
            // Convert to API format
            const apiSettings = Object.entries(newSettings).map(([key, enabled]) => ({
                type: 'database',
                category: key,
                enabled
            }));

            await notificationSettingsApi.updateSettings(apiSettings);
            toast.success('Notification settings updated');
        } catch (error) {
            // Revert on error
            setNotificationSettings(notificationSettings);
            toast.error('Failed to update notification settings');
        }
    };

    const handleEnable2FA = async (type: 'google' | 'email') => {
        try {
            setIsLoading(true);

            if (type === 'google') {
                const response = await twoFactorApi.setupGoogle();
                if (response.status === 'success') {
                    // Show QR code modal or redirect to setup page
                    toast.success('Google Authenticator setup initiated');
                }
            } else {
                const password = prompt('Please enter your password to enable 2FA:');
                if (password) {
                    const response = await twoFactorApi.setupEmail({ password });
                    if (response.status === 'success') {
                        toast.success('Email 2FA enabled successfully');
                        await loadTwoFactorStatus();
                    }
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to enable 2FA');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisable2FA = async () => {
        try {
            const password = prompt('Please enter your password to disable 2FA:');
            if (!password) return;

            const code = prompt('Please enter your 2FA code:');
            if (!code) return;

            setIsLoading(true);
            const response = await twoFactorApi.disable({ password, code });

            if (response.status === 'success') {
                toast.success('2FA disabled successfully');
                await loadTwoFactorStatus();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to disable 2FA');
        } finally {
            setIsLoading(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile Information', icon: <User className="w-4 h-4" /> },
        { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
        { id: 'billing', label: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
        { id: 'referral', label: 'Referral', icon: <Gift className="w-4 h-4" /> }
    ];

    if (isLoading && !profileData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                                {imagePreview ? (
                                    <img src={getUserAvatarUrl({ image: imagePreview })} alt="Preview" className="w-full h-full object-cover" />
                                ) : profileData?.user_info.image ? (
                                    <img src={getUserAvatarUrl({ image: profileData.user_info.image })} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    profileData?.user_info.first_name?.charAt(0).toUpperCase() || user?.first_name?.charAt(0).toUpperCase() || 'U'
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                                <Camera className="w-4 h-4 text-gray-600" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {profileData?.user_info.first_name} {profileData?.user_info.last_name}
                            </h1>
                            <p className="text-gray-600">{profileData?.user_info.email}</p>
                            <div className="flex items-center space-x-4 mt-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profileData?.user_info.email_verified_at ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {profileData?.user_info.email_verified_at ? 'Verified' : 'Unverified'}
                                </span>
                                {twoFactorStatus.two_factor_enabled && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        <Shield className="w-3 h-3 mr-1" />
                                        2FA Enabled
                                    </span>
                                )}
                            </div>
                        </div>
                        {selectedImage && (
                            <button
                                onClick={handleImageUpload}
                                disabled={isLoading}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                            >
                                <Upload className="w-4 h-4 mr-2 inline" />
                                Upload
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <nav className="bg-white rounded-lg shadow-sm p-4">
                            <ul className="space-y-2">
                                {tabs.map((tab) => (
                                    <li key={tab.id}>
                                        <button
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === tab.id
                                                ? 'bg-primary text-white'
                                                : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            {tab.icon}
                                            <span>{tab.label}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            {activeTab === 'profile' && (
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>
                                    <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    First Name
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <User className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <input
                                                        {...registerProfile('first_name')}
                                                        type="text"
                                                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${profileErrors.first_name ? 'border-red-300' : 'border-gray-300'
                                                            }`}
                                                        placeholder="First name"
                                                    />
                                                </div>
                                                {profileErrors.first_name && (
                                                    <p className="mt-1 text-sm text-red-600">{profileErrors.first_name.message}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Last Name
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <User className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <input
                                                        {...registerProfile('last_name')}
                                                        type="text"
                                                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${profileErrors.last_name ? 'border-red-300' : 'border-gray-300'
                                                            }`}
                                                        placeholder="Last name"
                                                    />
                                                </div>
                                                {profileErrors.last_name && (
                                                    <p className="mt-1 text-sm text-red-600">{profileErrors.last_name.message}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Mail className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    {...registerProfile('email')}
                                                    type="email"
                                                    disabled
                                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                                    placeholder="Email address"
                                                />
                                            </div>
                                            <p className="mt-1 text-sm text-gray-500">Email cannot be changed from this page</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Phone Number
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Phone className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    {...registerProfile('phone')}
                                                    type="tel"
                                                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${profileErrors.phone ? 'border-red-300' : 'border-gray-300'
                                                        }`}
                                                    placeholder="Phone number"
                                                />
                                            </div>
                                            {profileErrors.phone && (
                                                <p className="mt-1 text-sm text-red-600">{profileErrors.phone.message}</p>
                                            )}
                                        </div>

                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isLoading ? (
                                                    <LoadingSpinner size="sm" />
                                                ) : (
                                                    <>
                                                        <Save className="w-4 h-4 mr-2" />
                                                        Save Changes
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h2>

                                    {/* Change Password */}
                                    <div className="mb-8">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                                        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Current Password
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Lock className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <input
                                                        {...registerPassword('current_password')}
                                                        type={showCurrentPassword ? 'text' : 'password'}
                                                        className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${passwordErrors.current_password ? 'border-red-300' : 'border-gray-300'
                                                            }`}
                                                        placeholder="Enter current password"
                                                    />
                                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                        <button
                                                            type="button"
                                                            className="text-gray-400 hover:text-gray-500"
                                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                        >
                                                            {showCurrentPassword ? (
                                                                <EyeOff className="h-5 w-5" />
                                                            ) : (
                                                                <Eye className="h-5 w-5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                                {passwordErrors.current_password && (
                                                    <p className="mt-1 text-sm text-red-600">{passwordErrors.current_password.message}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    New Password
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Lock className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <input
                                                        {...registerPassword('new_password')}
                                                        type={showNewPassword ? 'text' : 'password'}
                                                        className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${passwordErrors.new_password ? 'border-red-300' : 'border-gray-300'
                                                            }`}
                                                        placeholder="Enter new password"
                                                    />
                                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                        <button
                                                            type="button"
                                                            className="text-gray-400 hover:text-gray-500"
                                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                                        >
                                                            {showNewPassword ? (
                                                                <EyeOff className="h-5 w-5" />
                                                            ) : (
                                                                <Eye className="h-5 w-5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                                {passwordErrors.new_password && (
                                                    <p className="mt-1 text-sm text-red-600">{passwordErrors.new_password.message}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Confirm New Password
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Lock className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <input
                                                        {...registerPassword('new_password_confirmation')}
                                                        type={showConfirmPassword ? 'text' : 'password'}
                                                        className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${passwordErrors.new_password_confirmation ? 'border-red-300' : 'border-gray-300'
                                                            }`}
                                                        placeholder="Confirm new password"
                                                    />
                                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                        <button
                                                            type="button"
                                                            className="text-gray-400 hover:text-gray-500"
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        >
                                                            {showConfirmPassword ? (
                                                                <EyeOff className="h-5 w-5" />
                                                            ) : (
                                                                <Eye className="h-5 w-5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                                {passwordErrors.new_password_confirmation && (
                                                    <p className="mt-1 text-sm text-red-600">{passwordErrors.new_password_confirmation.message}</p>
                                                )}
                                            </div>

                                            <div className="flex justify-end">
                                                <button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isLoading ? (
                                                        <LoadingSpinner size="sm" />
                                                    ) : (
                                                        <>
                                                            <Save className="w-4 h-4 mr-2" />
                                                            Update Password
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    </div>

                                    {/* Two Factor Authentication */}
                                    <div className="border-t pt-8">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Two-Factor Authentication</h3>
                                        <div className="space-y-4">
                                            {!twoFactorStatus.two_factor_enabled ? (
                                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                    <div className="flex items-start">
                                                        <Shield className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-medium text-yellow-800">
                                                                Two-Factor Authentication is disabled
                                                            </h4>
                                                            <p className="text-sm text-yellow-700 mt-1">
                                                                Add an extra layer of security to your account by enabling 2FA.
                                                            </p>
                                                            <div className="mt-4 flex space-x-3">
                                                                <button
                                                                    onClick={() => handleEnable2FA('google')}
                                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                                >
                                                                    <QrCode className="w-4 h-4 mr-2" />
                                                                    Google Authenticator
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEnable2FA('email')}
                                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                                                >
                                                                    <Mail className="w-4 h-4 mr-2" />
                                                                    Email 2FA
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                    <div className="flex items-start">
                                                        <Shield className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-medium text-green-800">
                                                                Two-Factor Authentication is enabled
                                                            </h4>
                                                            <p className="text-sm text-green-700 mt-1">
                                                                Your account is protected with {twoFactorStatus.two_factor_type} 2FA.
                                                            </p>
                                                            <div className="mt-4">
                                                                <button
                                                                    onClick={handleDisable2FA}
                                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                                                >
                                                                    Disable 2FA
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h2>
                                    <div className="space-y-6">
                                        {Object.entries(notificationSettings).map(([key, enabled]) => (
                                            <div key={key} className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-900">
                                                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        {key === 'email_notifications' && 'Receive notifications via email'}
                                                        {key === 'vote_updates' && 'Get notified about vote status changes'}
                                                        {key === 'marketing' && 'Receive marketing and promotional emails'}
                                                        {key === 'security_alerts' && 'Get notified about security events'}
                                                        {key === 'referral_updates' && 'Receive updates about your referrals'}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleNotificationToggle(key as keyof NotificationSettings)}
                                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${enabled ? 'bg-primary' : 'bg-gray-200'
                                                        }`}
                                                >
                                                    <span
                                                        className={`${enabled ? 'translate-x-5' : 'translate-x-0'
                                                            } inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                                                    />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'billing' && (
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Billing Information</h2>
                                    <div className="space-y-6">
                                        <div className="bg-gray-50 p-6 rounded-lg">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h3>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {profileData?.subscription_info?.plan || 'Free Plan'}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {profileData?.subscription_info?.status || 'Basic features included'}
                                                    </p>
                                                </div>
                                                <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                                                    Upgrade Plan
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Balance</h3>
                                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                                <div className="text-center">
                                                    <p className="text-3xl font-bold text-gray-900">
                                                        ₦{profileData?.user_info.balance?.toLocaleString() || '0.00'}
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-1">Available Balance</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'referral' && profileData && (
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Referral Program</h2>
                                    <div className="space-y-6">
                                        {/* Referral Stats */}
                                        <div className="grid md:grid-cols-3 gap-6">
                                            <div className="bg-blue-50 p-6 rounded-lg">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                                            <User className="w-4 h-4 text-white" />
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <p className="text-sm font-medium text-blue-900">Total Referrals</p>
                                                        <p className="text-2xl font-bold text-blue-900">
                                                            {profileData.referral_info?.total_referrals || 0}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-green-50 p-6 rounded-lg">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                                            <CreditCard className="w-4 h-4 text-white" />
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <p className="text-sm font-medium text-green-900">Total Earnings</p>
                                                        <p className="text-2xl font-bold text-green-900">
                                                            ₦{profileData.referral_info?.total_earnings?.toLocaleString() || '0.00'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-purple-50 p-6 rounded-lg">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                                                            <Gift className="w-4 h-4 text-white" />
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <p className="text-sm font-medium text-purple-900">Pending Rewards</p>
                                                        <p className="text-2xl font-bold text-purple-900">
                                                            ₦{profileData.referral_info?.pending_earnings?.toLocaleString() || '0.00'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Referral Code */}
                                        <div className="bg-gray-50 p-6 rounded-lg">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Link</h3>
                                            <div className="flex items-center space-x-4">
                                                <div className="flex-1">
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={profileData.referral_link}
                                                            readOnly
                                                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(profileData.referral_link);
                                                        toast.success('Referral link copied to clipboard!');
                                                    }}
                                                    className="px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                                                >
                                                    Copy Link
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-2">
                                                Share this link with friends to earn rewards when they sign up and make purchases.
                                            </p>
                                        </div>

                                        {/* Commission Rates */}
                                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Rates</h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <span className="text-sm font-medium text-gray-900">Registration Bonus</span>
                                                    <span className="text-sm font-bold text-green-600">
                                                        ₦{profileData.commission_rates?.registration || '500'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <span className="text-sm font-medium text-gray-900">Subscription Plans</span>
                                                    <span className="text-sm font-bold text-green-600">
                                                        {profileData.commission_rates?.subscription || '10'}%
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <span className="text-sm font-medium text-gray-900">Vote Purchases</span>
                                                    <span className="text-sm font-bold text-green-600">
                                                        {profileData.commission_rates?.vote_purchase || '5'}%
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <span className="text-sm font-medium text-gray-900">Event Purchases</span>
                                                    <span className="text-sm font-bold text-green-600">
                                                        {profileData.commission_rates?.event_purchase || '8'}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;