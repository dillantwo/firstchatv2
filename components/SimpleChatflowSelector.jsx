import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { assets } from '@/assets/assets';
import { useHydration } from '@/utils/useHydration';
import { useLTIAuth } from '@/context/LTIAuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const SimpleChatflowSelector = ({ selectedChatflow, onChatflowChange }) => {
    const [chatflows, setChatflows] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const hasHydrated = useHydration();
    const { user, isAuthenticated } = useLTIAuth();

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
                    toast.error('Please login to view available chatflows');
                } else {
                    toast.error('Unable to load chatflow list');
                }
            }
        } catch (error) {
            console.error('Fetch chatflows error:', error);
            if (error.response?.status === 401) {
                // Token expired, will be handled by interceptor, no toast needed
                return;
            }
            toast.error('Failed to load chatflows, please try again later');
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

    // Don't render until hydrated
    if (!hasHydrated) {
        return null;
    }

    if (!isAuthenticated || !user) {
        return (
            <div className="relative">
                <button
                    className="flex items-center gap-2 px-2 py-1.5 bg-[#404045] border border-gray-500 rounded-md text-xs"
                    disabled={true}
                >
                    <Image src={assets.chat_icon} alt="" className="w-3 h-3" />
                    <span className="text-white">Please login</span>
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Simple selection button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-2 py-1.5 bg-[#404045] border border-gray-500 rounded-md hover:bg-gray-600 transition-colors text-xs"
                disabled={isLoading}
            >
                <Image src={assets.chat_icon} alt="" className="w-3 h-3" />
                <span className="text-white truncate max-w-[120px]">
                    {isLoading ? 'Loading...' : (selectedChatflow?.name || 'Select AI')}
                </span>
                <Image 
                    src={assets.arrow_icon} 
                    alt="" 
                    className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                />
            </button>

            {/* Simple dropdown menu with solid background */}
            {isOpen && !isLoading && (
                <div className="absolute bottom-full left-0 mb-1 w-48 bg-[#2f2f35] border border-gray-500 rounded-md shadow-xl z-50 max-h-40 overflow-y-auto">
                    {chatflows.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-gray-400">
                            No available chatflows
                        </div>
                    ) : (
                        chatflows.map((chatflow) => (
                            <button
                                key={chatflow.id}
                                onClick={() => handleSelect(chatflow)}
                                className={`w-full text-left px-3 py-2 hover:bg-gray-600 transition-colors text-xs border-b border-gray-600 last:border-b-0 ${
                                    selectedChatflow?.id === chatflow.id ? 'bg-gray-600' : ''
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white truncate font-medium">
                                            {chatflow.name}
                                        </div>
                                        {chatflow.description && (
                                            <div className="text-gray-400 truncate text-xs">
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
