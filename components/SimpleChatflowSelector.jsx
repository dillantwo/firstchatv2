import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { assets } from '@/assets/assets';
import { useHydration } from '@/utils/useHydration';
import { useLTIAuth } from '@/context/LTIAuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const SimpleChatflowSelector = ({ selectedChatflow, onChatflowChange, disabled = false }) => {
    const [chatflows, setChatflows] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const hasHydrated = useHydration();
    const { user, isAuthenticated } = useLTIAuth();
    const { isDark } = useTheme();
    const { t } = useLanguage();

    // Fetch chatflows function
    const fetchChatflows = async () => {
        if (!isAuthenticated || !user) {
            return;
        }
        
        setIsLoading(true);
        
        try {
            const response = await fetch('/api/chatflows', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                setChatflows(data.data);
                
                // Auto-select first chatflow if none selected
                if (!selectedChatflow && data.data.length > 0) {
                    onChatflowChange(data.data[0]);
                }
            } else {
                if (data.message === 'Authentication required') {
                    toast.error(t('Please access this tool through Moodle LTI'));
                } else {
                    toast.error(t('No chatflows available'));
                }
            }
        } catch (error) {
            console.error('Fetch chatflows error:', error);
            if (error.response?.status === 401) {
                // Token expired, will be handled by interceptor, no toast needed
                return;
            }
            toast.error(t('No chatflows available'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (hasHydrated && isAuthenticated && user) {
            fetchChatflows();
        } else if (hasHydrated && !isAuthenticated) {
            setChatflows([]);
        }
    }, [hasHydrated, isAuthenticated, user]);

    const handleSelect = (chatflow) => {
        onChatflowChange(chatflow);
        setIsOpen(false);
    };

    const handleButtonClick = (e) => {
        e.preventDefault(); // Prevent form submission
        e.stopPropagation(); // Stop event bubbling
        if (!disabled) {
            setIsOpen(!isOpen);
        }
    };

    // Don't render until hydrated
    if (!hasHydrated) {
        return null;
    }

    if (!isAuthenticated || !user) {
        return (
            <div className="relative">
                <button
                    className={`flex items-center gap-2 px-2 py-1.5 ${isDark ? 'bg-[#404045] border-gray-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-100 opacity-70'} border rounded-md text-xs shadow-sm`}
                    disabled={true}
                >
                    <Image src={assets.chat_icon} alt="" className="w-3 h-3" />
                    <span>Please login</span>
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Simple selection button */}
            <button
                type="button"
                onClick={handleButtonClick}
                className={`flex items-center gap-2 px-2 py-1.5 ${isDark ? 'bg-[#404045] border-gray-500 text-white hover:bg-gray-600' : 'bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-900 opacity-70 hover:opacity-100'} border rounded-md transition-all text-xs shadow-sm ${
                    disabled ? 'opacity-30 cursor-not-allowed' : ''
                }`}
                disabled={isLoading || disabled}
            >
                <Image src={assets.chat_icon} alt="" className="w-3 h-3" />
                <span className="truncate max-w-[120px]">
                    {isLoading ? t('Loading...') : (selectedChatflow?.name || t('Select Chatflow'))}
                </span>
                <Image 
                    src={assets.arrow_icon} 
                    alt="" 
                    className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                />
            </button>

            {/* Simple dropdown menu with solid background */}
            {isOpen && !isLoading && !disabled && (
                <div className={`absolute bottom-full left-0 mb-1 min-w-[300px] max-w-[400px] ${isDark ? 'bg-[#2f2f35] border-gray-500' : 'bg-white border-gray-300'} border rounded-md shadow-xl z-[9999] max-h-40 overflow-y-auto`}>
                    {chatflows.length === 0 ? (
                        <div className={`px-3 py-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t('No chatflows available')}
                        </div>
                    ) : (
                        chatflows.map((chatflow) => (
                            <button
                                key={chatflow.id}
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSelect(chatflow);
                                }}
                                className={`w-full text-left px-3 py-2 ${isDark ? 'hover:bg-gray-600 border-gray-600' : 'hover:bg-gray-100 border-gray-200'} transition-colors text-xs border-b last:border-b-0 ${
                                    selectedChatflow?.id === chatflow.id ? (isDark ? 'bg-gray-600' : 'bg-gray-100') : ''
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                    <div className="flex-1">
                                        <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium whitespace-nowrap overflow-hidden text-ellipsis`}>
                                            {chatflow.name}
                                        </div>
                                        {chatflow.description && (
                                            <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs whitespace-nowrap overflow-hidden text-ellipsis`}>
                                                {chatflow.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default SimpleChatflowSelector;
