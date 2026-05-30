import { useEffect, useState } from 'react';

interface UseKeyboardShortcutsProps {
    onQuickNavigation?: () => void;
    onThemeToggle?: () => void;
    onNotificationToggle?: () => void;
}

interface ShortcutInfo {
    key: string;
    ctrlKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    description: string;
    action: () => void;
}

export const useKeyboardShortcuts = ({
    onQuickNavigation,
    onThemeToggle,
    onNotificationToggle
}: UseKeyboardShortcutsProps = {}) => {
    const [isEnabled, setIsEnabled] = useState(true);

    const shortcuts: ShortcutInfo[] = [
        {
            key: 'k',
            ctrlKey: true,
            description: 'Open quick navigation',
            action: () => onQuickNavigation?.()
        },
        {
            key: 'k',
            metaKey: true, // Cmd on Mac
            description: 'Open quick navigation (Mac)',
            action: () => onQuickNavigation?.()
        },
        {
            key: 't',
            ctrlKey: true,
            altKey: true,
            description: 'Toggle theme',
            action: () => onThemeToggle?.()
        },
        {
            key: 'n',
            ctrlKey: true,
            altKey: true,
            description: 'Toggle notifications',
            action: () => onNotificationToggle?.()
        },
        {
            key: '/',
            description: 'Focus search (when available)',
            action: () => {
                const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLInputElement;
                if (searchInput) {
                    searchInput.focus();
                }
            }
        }
    ];

    useEffect(() => {
        if (!isEnabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            // Don't trigger shortcuts when user is typing in input fields
            const target = event.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.contentEditable === 'true'
            ) {
                // Exception: allow Ctrl+K and Cmd+K even in input fields
                if (
                    event.key?.toLowerCase() === 'k' &&
                    (event.ctrlKey || event.metaKey)
                ) {
                    event.preventDefault();
                    onQuickNavigation?.();
                }
                return;
            }

            // Find matching shortcut
            const matchingShortcut = shortcuts.find(shortcut => {
                return (
                    event.key?.toLowerCase() === shortcut.key.toLowerCase() &&
                    !!event.ctrlKey === !!shortcut.ctrlKey &&
                    !!event.altKey === !!shortcut.altKey &&
                    !!event.metaKey === !!shortcut.metaKey
                );
            });

            if (matchingShortcut) {
                event.preventDefault();
                matchingShortcut.action();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isEnabled, onQuickNavigation, onThemeToggle, onNotificationToggle]);

    const getShortcutsList = () => {
        return shortcuts.map(shortcut => ({
            keys: [
                shortcut.ctrlKey && 'Ctrl',
                shortcut.metaKey && 'Cmd',
                shortcut.altKey && 'Alt',
                shortcut.key.toUpperCase()
            ].filter(Boolean).join(' + '),
            description: shortcut.description
        }));
    };

    const enableShortcuts = () => setIsEnabled(true);
    const disableShortcuts = () => setIsEnabled(false);

    return {
        isEnabled,
        enableShortcuts,
        disableShortcuts,
        getShortcutsList
    };
}; 