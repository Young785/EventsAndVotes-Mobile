import React from 'react';
import SettingsService from '../services/settingsService';

interface CurrencyDisplayProps {
    amount: number;
    className?: string;
    showSymbol?: boolean;
}

const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({ 
    amount, 
    className = '', 
    showSymbol = true 
}) => {
    // Format currency using the settings service
    const formattedAmount = showSymbol 
        ? SettingsService.formatCurrency(amount)
        : amount.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });

    return (
        <span className={className}>
            {formattedAmount}
        </span>
    );
};

export default CurrencyDisplay; 