import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
    className?: string;
    showLabel?: boolean;
    dropdown?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
    className = '',
    showLabel = false,
    dropdown = false
}) => {
    const { theme, effectiveTheme, setTheme, toggleTheme } = useTheme();

    const getThemeIcon = (themeName: string) => {
        switch (themeName) {
            case 'light':
                return 'ph-duotone ph-sun';
            case 'dark':
                return 'ph-duotone ph-moon';
            case 'auto':
                return 'ph-duotone ph-circle-half';
            case 'time':
                return 'ph-duotone ph-clock';
            default:
                return 'ph-duotone ph-circle-half';
        }
    };

    const getThemeLabel = (themeName: string) => {
        switch (themeName) {
            case 'light':
                return 'Light';
            case 'dark':
                return 'Dark';
            case 'auto':
                return 'Auto';
            case 'time':
                return 'Time';
            default:
                return 'Auto';
        }
    };

    if (dropdown) {
        return (
            <li className={`dropdown pc-h-item ${className}`}>
                <a
                    className="pc-head-link dropdown-toggle arrow-none me-0"
                    data-bs-toggle="dropdown"
                    href="#"
                    role="button"
                    aria-haspopup="false"
                    aria-expanded="false"
                >
                    <i className={getThemeIcon(theme)}></i>
                    {showLabel && <span className="ms-1">{getThemeLabel(theme)}</span>}
                </a>
                <div className="dropdown-menu dropdown-menu-end pc-h-dropdown">
                    <h6 className="dropdown-header">Choose Theme</h6>
                    <button
                        className={`dropdown-item ${theme === 'light' ? 'active' : ''}`}
                        onClick={() => setTheme('light')}
                    >
                        <i className="ph-duotone ph-sun me-2"></i>
                        Light
                    </button>
                    <button
                        className={`dropdown-item ${theme === 'dark' ? 'active' : ''}`}
                        onClick={() => setTheme('dark')}
                    >
                        <i className="ph-duotone ph-moon me-2"></i>
                        Dark
                    </button>
                    <button
                        className={`dropdown-item ${theme === 'time' ? 'active' : ''}`}
                        onClick={() => setTheme('time')}
                    >
                        <i className="ph-duotone ph-clock me-2"></i>
                        Time-based (6PM-6AM)
                    </button>
                    <button
                        className={`dropdown-item ${theme === 'auto' ? 'active' : ''}`}
                        onClick={() => setTheme('auto')}
                    >
                        <i className="ph-duotone ph-circle-half me-2"></i>
                        Auto (System)
                    </button>
                </div>
            </li>
        );
    }

    return (
        <button
            type="button"
            className={`relative p-2.5 rounded-xl bg-gray-100 dark:bg-secondary-800 hover:bg-gray-200 dark:hover:bg-secondary-700 transition-all duration-200 active:scale-95 group ${className}`}
            onClick={toggleTheme}
            title={`Current theme: ${getThemeLabel(theme)}. Click to switch.`}
            aria-label={`Switch theme from ${getThemeLabel(theme)}`}
        >
            <div className="w-5 h-5 relative">
                {theme === 'light' && (
                    <svg className="w-5 h-5 text-yellow-500 animate-scale-in" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                )}
                {theme === 'dark' && (
                    <svg className="w-5 h-5 text-blue-400 animate-scale-in" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                )}
                {theme === 'time' && (
                    <svg className="w-5 h-5 text-purple-500 dark:text-purple-400 animate-scale-in" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )}
                {theme === 'auto' && (
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 animate-scale-in" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                )}
            </div>
            {showLabel && <span className="ml-2 text-sm font-medium">{getThemeLabel(theme)}</span>}
            
            {/* Tooltip */}
            <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                {getThemeLabel(theme)} mode
            </span>
        </button>
    );
};

export default ThemeToggle; 