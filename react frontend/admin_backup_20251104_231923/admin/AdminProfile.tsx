import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Shield,
    Camera,
    Save,
    Lock,
    Eye,
    EyeOff,
    Edit,
    Edit3,
    X,
    Globe,
    Upload
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { profileApi, uploadApi, adminApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { getNomineeImageUrl } from '../../utils/imageUtils';

const profileSchema = z.object({
    first_name: z.string().min(2, 'First name must be at least 2 characters'),
    last_name: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    address: z.string().min(10, 'Address must be at least 10 characters'),
    state: z.string().min(1, 'State is required'),
    country: z.string().min(1, 'Country is required')
});

const passwordSchema = z.object({
    current_password: z.string().min(1, 'Current password is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string()
}).refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const AdminProfile: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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

                            {/* Contact Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="form-label">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={profileForm.email}
                                        onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                                        disabled={!isEditing}
                                        className="form-input disabled:bg-gray-100 dark:disabled:bg-secondary-800 disabled:text-gray-500 dark:disabled:text-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="form-label">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={profileForm.phone}
                                        onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                                        disabled={!isEditing}
                                        className="form-input disabled:bg-gray-100 dark:disabled:bg-secondary-800 disabled:text-gray-500 dark:disabled:text-gray-400"
                                    />
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
        </div>
    );
};

export default AdminProfile; 