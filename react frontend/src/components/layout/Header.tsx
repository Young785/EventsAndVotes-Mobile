import React from 'react';
import SettingsService from '../../services/settingsService';

const Header: React.FC = () => {
    // Get site settings from localStorage
    const siteName = SettingsService.getSiteName();
    const siteLogo = SettingsService.getSiteLogo();
    const currencySymbol = SettingsService.getCurrencySymbol();

    return (
        <header className="bg-white dark:bg-secondary-900 shadow-sm border-b border-gray-200 dark:border-secondary-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo and Site Name */}
                    <div className="flex items-center space-x-3">
                        {siteLogo && (
                            <img
                                src={siteLogo}
                                alt={`${siteName} Logo`}
                                className="h-8 w-auto"
                                onError={(e) => {
                                    // Hide image if it fails to load
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        )}
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            {siteName}
                        </h1>
                    </div>

                    {/* Currency Display */}
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Currency:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {currencySymbol}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header; 