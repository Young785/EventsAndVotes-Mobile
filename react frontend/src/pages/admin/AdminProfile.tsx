import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    User,
    Mail,
    Calendar,
    Shield,
    Camera,
    Save,
    Eye,
    EyeOff,
    Edit3,
    X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { getNomineeImageUrl } from '../../utils/imageUtils';


const AdminProfile: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Email change verification states
    const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
    const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [emailVerificationCode, setEmailVerificationCode] = useState('');

    // Phone change verification states
    const [showPhoneChangeModal, setShowPhoneChangeModal] = useState(false);
    const [showPhoneVerificationModal, setShowPhoneVerificationModal] = useState(false);
    const [newPhone, setNewPhone] = useState('');
    const [phoneVerificationCode, setPhoneVerificationCode] = useState('');

    // Form states
    const [profileForm, setProfileForm] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
        state: user?.state || '',
        country: user?.country || '',
        gender: user?.gender || ''
    });

    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        password: '',
        password_confirmation: ''
    });

    // Fetch profile data
    const { data: profileData, isLoading } = useQuery({
        queryKey: ['admin-profile'],
        queryFn: () => adminApi.getProfile()
    });

    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: adminApi.updateProfile,
        onSuccess: () => {
            toast.success('Profile updated successfully!');
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        }
    });

    // Update password mutation
    const updatePasswordMutation = useMutation({
        mutationFn: adminApi.updatePassword,
        onSuccess: () => {
            toast.success('Password updated successfully!');
            setShowPasswordForm(false);
            setPasswordForm({
                current_password: '',
                password: '',
                password_confirmation: ''
            });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update password');
        }
    });

    // Upload avatar mutation
    const uploadAvatarMutation = useMutation({
        mutationFn: adminApi.uploadAvatar,
        onSuccess: () => {
            toast.success('Avatar updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to upload avatar');
        }
    });

    // Email change request mutation
    const requestEmailChangeMutation = useMutation({
        mutationFn: adminApi.requestEmailChange,
        onSuccess: () => {
            toast.success('Verification code sent to your new email!');
            setShowEmailChangeModal(false);
            setShowEmailVerificationModal(true);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to send verification code');
        }
    });

    // Email change verification mutation
    const verifyEmailChangeMutation = useMutation({
        mutationFn: adminApi.verifyEmailChange,
        onSuccess: (response) => {
            toast.success('Email updated successfully!');
            setShowEmailVerificationModal(false);
            setEmailVerificationCode('');
            setNewEmail('');
            queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
            // Update the form with new email
            if (response.data && response.data.email) {
                setProfileForm(prev => ({ ...prev, email: response.data!.email }));
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to verify email');
        }
    });

    // Phone change request mutation
    const requestPhoneChangeMutation = useMutation({
        mutationFn: adminApi.requestPhoneChange,
        onSuccess: () => {
            toast.success('Verification code sent to your email!');
            setShowPhoneChangeModal(false);
            setShowPhoneVerificationModal(true);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to send verification code');
        }
    });

    // Phone change verification mutation
    const verifyPhoneChangeMutation = useMutation({
        mutationFn: adminApi.verifyPhoneChange,
        onSuccess: (response) => {
            toast.success('Phone number updated successfully!');
            setShowPhoneVerificationModal(false);
            setPhoneVerificationCode('');
            setNewPhone('');
            queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
            // Update the form with new phone
            if (response.data && response.data.phone) {
                setProfileForm(prev => ({ ...prev, phone: response.data!.phone || '' }));
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to verify phone');
        }
    });

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate(profileForm);
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.password !== passwordForm.password_confirmation) {
            toast.error('Password confirmation does not match');
            return;
        }
        updatePasswordMutation.mutate(passwordForm);
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append('avatar', file);
            uploadAvatarMutation.mutate(formData);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setProfileForm({
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            address: user?.address || '',
            state: user?.state || '',
            country: user?.country || '',
            gender: user?.gender || ''
        });
    };

    const handleEmailChangeRequest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail || !newEmail.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }
        requestEmailChangeMutation.mutate({ new_email: newEmail });
    };

    const handleEmailVerification = (e: React.FormEvent) => {
        e.preventDefault();
        if (emailVerificationCode.length !== 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }
        verifyEmailChangeMutation.mutate({ verification_code: emailVerificationCode });
    };

    const handlePhoneChangeRequest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPhone || newPhone.length < 10) {
            toast.error('Please enter a valid phone number');
            return;
        }
        requestPhoneChangeMutation.mutate({ new_phone: newPhone });
    };

    const handlePhoneVerification = (e: React.FormEvent) => {
        e.preventDefault();
        if (phoneVerificationCode.length !== 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }
        verifyPhoneChangeMutation.mutate({ verification_code: phoneVerificationCode });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    const currentUser = profileData?.data || user;

    return (
        <div className="space-y-6 p-5">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage your account settings and preferences</p>
                </div>
                <div className="flex space-x-3">
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="btn-primary"
                        >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit Profile
                        </button>
                    ) : (
                        <div className="flex space-x-2">
                            <button
                                onClick={handleCancel}
                                className="btn-outline"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </button>
                            <button
                                onClick={handleProfileSubmit}
                                disabled={updateProfileMutation.isPending}
                                className="btn-primary disabled:opacity-50"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Information Card */}
                <div className="lg:col-span-2">
                    <div className="card-glass p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Profile Information</h2>

                        <form onSubmit={handleProfileSubmit} className="space-y-6">
                            {/* Name Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="form-label">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.first_name}
                                        onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                                        disabled={!isEditing}
                                        className="form-input disabled:bg-gray-100 dark:disabled:bg-secondary-800 disabled:text-gray-500 dark:disabled:text-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="form-label">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.last_name}
                                        onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                                        disabled={!isEditing}
                                        className="form-input disabled:bg-gray-100 dark:disabled:bg-secondary-800 disabled:text-gray-500 dark:disabled:text-gray-400"
                                    />
                                </div>
                            </div>

                            {/* Contact Fields - Email and Phone require verification */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="form-label">
                                        Email Address
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            value={profileForm.email}
                                            disabled
                                            className="form-input flex-1 bg-gray-100 dark:bg-secondary-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowEmailChangeModal(true)}
                                            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors whitespace-nowrap"
                                        >
                                            Change
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Email changes require verification
                                    </p>
                                </div>
                                <div>
                                    <label className="form-label">
                                        Phone Number
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="tel"
                                            value={profileForm.phone}
                                            disabled
                                            className="form-input flex-1 bg-gray-100 dark:bg-secondary-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPhoneChangeModal(true)}
                                            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors whitespace-nowrap"
                                        >
                                            Change
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Phone changes require verification
                                    </p>
                                </div>
                            </div>

                            {/* Address Field */}
                            <div>
                                <label className="form-label">
                                    Address
                                </label>
                                <textarea
                                    value={profileForm.address}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                                    disabled={!isEditing}
                                    rows={3}
                                    className="form-textarea disabled:bg-gray-100 dark:disabled:bg-secondary-800 disabled:text-gray-500 dark:disabled:text-gray-400"
                                />
                            </div>

                            {/* Location Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="form-label">
                                        State
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.state}
                                        onChange={(e) => setProfileForm(prev => ({ ...prev, state: e.target.value }))}
                                        disabled={!isEditing}
                                        className="form-input disabled:bg-gray-100 dark:disabled:bg-secondary-800 disabled:text-gray-500 dark:disabled:text-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="form-label">
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.country}
                                        onChange={(e) => setProfileForm(prev => ({ ...prev, country: e.target.value }))}
                                        disabled={!isEditing}
                                        className="form-input disabled:bg-gray-100 dark:disabled:bg-secondary-800 disabled:text-gray-500 dark:disabled:text-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="form-label">
                                        Gender
                                    </label>
                                    <select
                                        value={profileForm.gender}
                                        onChange={(e) => setProfileForm(prev => ({ ...prev, gender: e.target.value }))}
                                        disabled={!isEditing}
                                        className="form-select disabled:bg-gray-100 dark:disabled:bg-secondary-800 disabled:text-gray-500 dark:disabled:text-gray-400"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Profile Picture Card */}
                    <div className="card-glass p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Picture</h3>
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <img
                                    src={getNomineeImageUrl({ image: currentUser?.image }) || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.first_name + ' ' + currentUser?.last_name)}&background=6366f1&color=ffffff&size=120`}
                                    alt={currentUser?.first_name}
                                    className="w-24 h-24 rounded-full object-cover"
                                />
                                <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary-dark">
                                    <Camera className="w-4 h-4" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            <div className="text-center mt-4">
                                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                    {currentUser?.first_name} {currentUser?.last_name}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                                    {currentUser?.role?.display_name || currentUser?.role?.name?.replace('_', ' ')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Account Details Card */}
                    <div className="card-glass p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Details</h3>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <User className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Account ID</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser?.account_id || 'Not assigned'}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Email Status</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {currentUser?.email_verified_at ? 'Verified' : 'Unverified'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <Shield className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Account Status</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser?.status || 'Active'}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Member Since</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString() : 'Not available'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Password Update Card */}
                    <div className="card-glass p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security</h3>
                            <button
                                onClick={() => setShowPasswordForm(!showPasswordForm)}
                                className="text-primary dark:text-blue-400 hover:text-primary-dark dark:hover:text-blue-300 text-sm font-medium"
                            >
                                Change Password
                            </button>
                        </div>

                        {showPasswordForm && (
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <div>
                                    <label className="form-label">
                                        Current Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={passwordForm.current_password}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                                            className="form-input pr-10"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="form-label">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            value={passwordForm.password}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, password: e.target.value }))}
                                            className="form-input pr-10"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="form-label">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={passwordForm.password_confirmation}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, password_confirmation: e.target.value }))}
                                            className="form-input pr-10"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        type="submit"
                                        disabled={updatePasswordMutation.isPending}
                                        className="btn-primary flex-1 disabled:opacity-50"
                                    >
                                        Update Password
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPasswordForm(false);
                                            setPasswordForm({
                                                current_password: '',
                                                password: '',
                                                password_confirmation: ''
                                            });
                                        }}
                                        className="btn-outline"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* Email Change Request Modal */}
            {showEmailChangeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Email Address</h3>
                            <button
                                onClick={() => {
                                    setShowEmailChangeModal(false);
                                    setNewEmail('');
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleEmailChangeRequest}>
                            <div className="mb-4">
                                <label className="form-label">Current Email</label>
                                <input
                                    type="email"
                                    value={profileForm.email}
                                    disabled
                                    className="form-input bg-gray-100 dark:bg-secondary-800 cursor-not-allowed"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="form-label">New Email Address</label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="form-input"
                                    placeholder="Enter new email address"
                                    required
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    A verification code will be sent to this email address
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={requestEmailChangeMutation.isPending}
                                    className="btn-primary flex-1 disabled:opacity-50"
                                >
                                    {requestEmailChangeMutation.isPending ? 'Sending...' : 'Send Verification Code'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEmailChangeModal(false);
                                        setNewEmail('');
                                    }}
                                    className="btn-outline"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Email Verification Modal */}
            {showEmailVerificationModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Verify Email Change</h3>
                            <button
                                onClick={() => {
                                    setShowEmailVerificationModal(false);
                                    setEmailVerificationCode('');
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleEmailVerification}>
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    We've sent a 6-digit verification code to <strong>{newEmail}</strong>. 
                                    Please enter it below to complete the email change.
                                </p>
                                <label className="form-label">Verification Code</label>
                                <input
                                    type="text"
                                    value={emailVerificationCode}
                                    onChange={(e) => setEmailVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="form-input text-center text-2xl tracking-widest"
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Code expires in 15 minutes
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={verifyEmailChangeMutation.isPending || emailVerificationCode.length !== 6}
                                    className="btn-primary flex-1 disabled:opacity-50"
                                >
                                    {verifyEmailChangeMutation.isPending ? 'Verifying...' : 'Verify & Update Email'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEmailVerificationModal(false);
                                        setEmailVerificationCode('');
                                    }}
                                    className="btn-outline"
                                >
                                    Cancel
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowEmailVerificationModal(false);
                                    setShowEmailChangeModal(true);
                                }}
                                className="w-full mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Didn't receive the code? Try again
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Phone Change Request Modal */}
            {showPhoneChangeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Phone Number</h3>
                            <button
                                onClick={() => {
                                    setShowPhoneChangeModal(false);
                                    setNewPhone('');
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handlePhoneChangeRequest}>
                            <div className="mb-4">
                                <label className="form-label">Current Phone</label>
                                <input
                                    type="tel"
                                    value={profileForm.phone}
                                    disabled
                                    className="form-input bg-gray-100 dark:bg-secondary-800 cursor-not-allowed"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="form-label">New Phone Number</label>
                                <input
                                    type="tel"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    className="form-input"
                                    placeholder="Enter new phone number"
                                    required
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    A verification code will be sent to your email
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={requestPhoneChangeMutation.isPending}
                                    className="btn-primary flex-1 disabled:opacity-50"
                                >
                                    {requestPhoneChangeMutation.isPending ? 'Sending...' : 'Send Verification Code'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPhoneChangeModal(false);
                                        setNewPhone('');
                                    }}
                                    className="btn-outline"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Phone Verification Modal */}
            {showPhoneVerificationModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Verify Phone Change</h3>
                            <button
                                onClick={() => {
                                    setShowPhoneVerificationModal(false);
                                    setPhoneVerificationCode('');
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handlePhoneVerification}>
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    We've sent a 6-digit verification code to your email. 
                                    Please enter it below to complete the phone number change to <strong>{newPhone}</strong>.
                                </p>
                                <label className="form-label">Verification Code</label>
                                <input
                                    type="text"
                                    value={phoneVerificationCode}
                                    onChange={(e) => setPhoneVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="form-input text-center text-2xl tracking-widest"
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Code expires in 15 minutes
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={verifyPhoneChangeMutation.isPending || phoneVerificationCode.length !== 6}
                                    className="btn-primary flex-1 disabled:opacity-50"
                                >
                                    {verifyPhoneChangeMutation.isPending ? 'Verifying...' : 'Verify & Update Phone'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPhoneVerificationModal(false);
                                        setPhoneVerificationCode('');
                                    }}
                                    className="btn-outline"
                                >
                                    Cancel
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowPhoneVerificationModal(false);
                                    setShowPhoneChangeModal(true);
                                }}
                                className="w-full mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Didn't receive the code? Try again
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProfile; 