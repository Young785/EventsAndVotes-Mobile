import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'auto' | 'time';

interface ThemeContextType {
    theme: Theme;
    effectiveTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

// Helper function to determine theme based on time
const getThemeByTime = (): 'light' | 'dark' => {
    const hour = new Date().getHours();
    // Dark mode from 6 PM (18:00) to 6 AM (6:00)
    return (hour >= 18 || hour < 6) ? 'dark' : 'light';
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        const saved = localStorage.getItem('admin-theme');
        return (saved as Theme) || 'time';
    });

    const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const updateEffectiveTheme = () => {
            let newEffectiveTheme: 'light' | 'dark';

            if (theme === 'auto') {
                // System preference based
                newEffectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            } else if (theme === 'time') {
                // Time-based theme switching
                newEffectiveTheme = getThemeByTime();
            } else {
                // Manual theme selection
                newEffectiveTheme = theme;
            }

            setEffectiveTheme(newEffectiveTheme);

            // Apply Tailwind dark mode class
            const html = document.documentElement;
            if (newEffectiveTheme === 'dark') {
                html.classList.add('dark');
            } else {
                html.classList.remove('dark');
            }

            // Apply theme to document for compatibility
            html.setAttribute('data-theme', newEffectiveTheme);
            html.setAttribute('data-bs-theme', newEffectiveTheme);
            html.setAttribute('data-pc-theme', newEffectiveTheme);
            html.setAttribute('data-pc-preset', 'preset-1');

            // Update body class for backward compatibility
            document.body.classList.toggle('dark-mode', newEffectiveTheme === 'dark');
            document.body.classList.toggle('light-mode', newEffectiveTheme === 'light');

            // Remove any theme preset classes
            html.classList.remove('theme-1', 'theme-2', 'theme-3', 'theme-4');
        };

        updateEffectiveTheme();

        // Set up interval for time-based theme checking (check every minute)
        let intervalId: NodeJS.Timeout | null = null;
        if (theme === 'time') {
            intervalId = setInterval(updateEffectiveTheme, 60000); // Check every minute
        }

        // Listen for system theme changes if auto mode
        if (theme === 'auto') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', updateEffectiveTheme);
            return () => {
                mediaQuery.removeEventListener('change', updateEffectiveTheme);
                if (intervalId) clearInterval(intervalId);
            };
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('admin-theme', newTheme);
    };

    const toggleTheme = () => {
        if (theme === 'light') {
            setTheme('dark');
        } else if (theme === 'dark') {
            setTheme('time');
        } else if (theme === 'time') {
            setTheme('auto');
        } else {
            setTheme('light');
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}; 