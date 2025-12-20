'use client';

import { useState } from 'react';

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    autoFocus?: boolean;
}

const countryCodes = [
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+1', country: 'USA', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
];

export default function PhoneInput({ value, onChange, placeholder, disabled, autoFocus }: PhoneInputProps) {
    const [selectedCode, setSelectedCode] = useState('+91'); // Default to India
    const [showDropdown, setShowDropdown] = useState(false);

    const handlePhoneChange = (phone: string) => {
        // Remove any existing country code from input
        const cleanPhone = phone.replace(/^\+\d+\s*/, '');
        // Combine selected country code with phone number
        onChange(`${selectedCode}${cleanPhone}`);
    };

    const handleCodeSelect = (code: string) => {
        setSelectedCode(code);
        setShowDropdown(false);
        // Update the value with new country code
        const currentPhone = value.replace(/^\+\d+\s*/, '');
        onChange(`${code}${currentPhone}`);
    };

    // Extract phone number without country code for display
    const displayPhone = value.replace(/^\+\d+\s*/, '');

    return (
        <div className="relative">
            <div className="flex gap-2">
                {/* Country Code Dropdown */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowDropdown(!showDropdown)}
                        disabled={disabled}
                        className="h-full px-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all flex items-center gap-2 min-w-[100px]"
                    >
                        <span className="text-xl">
                            {countryCodes.find(c => c.code === selectedCode)?.flag}
                        </span>
                        <span className="text-sm font-medium">{selectedCode}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                            {countryCodes.map((country) => (
                                <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => handleCodeSelect(country.code)}
                                    className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3 ${selectedCode === country.code ? 'bg-white/5' : ''
                                        }`}
                                >
                                    <span className="text-2xl">{country.flag}</span>
                                    <div className="flex-1">
                                        <div className="text-white text-sm font-medium">{country.country}</div>
                                        <div className="text-slate-400 text-xs">{country.code}</div>
                                    </div>
                                    {selectedCode === country.code && (
                                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Phone Number Input */}
                <input
                    type="tel"
                    value={displayPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder={placeholder || "Enter phone number"}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-slate-600"
                    disabled={disabled}
                    autoFocus={autoFocus}
                />
            </div>
        </div>
    );
}
