import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { assets } from '@/assets/assets';
import { useHydration } from '@/utils/useHydration';
import { useLTIAuth } from '@/context/LTIAuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const ChatflowSelector = ({ selectedChatflow, onChatflowChange }) => {
    console.log('[ChatflowSelector] Component rendered');
    
    const [chatflows, setChatflows] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const hasHydrated = useHydration();
    const { user, isAuthenticated } = useLTIAuth();

    // Fetch chatflows function - now includes user context for role-based filtering
    const fetchChatflows = async () => {
        console.log('[ChatflowSelector] Starting API call...');
        console.log('[ChatflowSelector] User context:', {
            isAuthenticated,
            user: user ? {
                name: user.name,
                courseId: user.context_id,
                roles: user.roles
            } : null
        });
        
        if (!isAuthenticated || !user) {
            console.log('[ChatflowSelector] User not authenticated, skipping fetch');
            return;
        }
        
        setIsLoading(true);
        
        try {
            console.log('[ChatflowSelector] Making fetch call with user context...');
            const response = await fetch('/api/chatflows', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            console.log('[ChatflowSelector] Fetch response received! Status:', response.status);
            console.log('[ChatflowSelector] Response OK:', response.ok);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('[ChatflowSelector] API response data:', data);
            
            if (data.success) {
                setChatflows(data.data);
                console.log('[ChatflowSelector] Set chatflows for user:', data.data);
                console.log(`[ChatflowSelector] User ${user.name} in course ${user.context_id} with roles ${user.roles?.join(', ')} has access to ${data.data.length} chatflows`);
                
                // Auto-select first chatflow if none selected
                if (!selectedChatflow && data.data.length > 0) {
                    console.log('[ChatflowSelector] Auto-selecting first available chatflow');
                    onChatflowChange(data.data[0]);
                }
            } else {
                console.error('[ChatflowSelector] API returned success=false:', data.message);
                if (data.message === 'Authentication required') {
                    toast.error('Please login to view available chatflows');
                } else {
                    toast.error('Unable to load chatflow list');
                }
            }
        } catch (error) {
            console.error('[ChatflowSelector] API call failed with error:', error);
            console.error('[ChatflowSelector] Error details:', error.message);
            toast.error('Failed to load chatflows, please try again later');
        } finally {
            setIsLoading(false);
            console.log('[ChatflowSelector] API call completed');
        }
    };

    // Only run effect after hydration and when user authentication changes
    useEffect(() => {
        if (hasHydrated && isAuthenticated && user) {
            console.log('[ChatflowSelector] useEffect triggered - fetching chatflows for authenticated user');
            console.log('[ChatflowSelector] User info:', {
                name: user.name,
                courseId: user.context_id,
                roles: user.roles
            });
            fetchChatflows();
        } else if (hasHydrated && !isAuthenticated) {
            console.log('[ChatflowSelector] User not authenticated, clearing chatflows');
            setChatflows([]);
        }
    }, [hasHydrated, isAuthenticated, user]); // Dependencies include user authentication state
    const handleSelect = (chatflow) => {
        onChatflowChange(chatflow);
        setIsOpen(false);
    };

    // Don't render dropdown interactions until hydrated and authenticated
    if (!hasHydrated) {
        return (
            <div className="relative">
                <button
                    className="flex items-center gap-2 px-3 py-2 bg-[#404045] border border-gray-300/40 rounded-lg w-full md:max-w-56 justify-between overflow-hidden"
                    disabled={true}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                        <Image src={assets.chat_icon} alt="" className="w-4 h-4 flex-shrink-0" />
                        <div className="text-left flex-1 min-w-0 overflow-hidden">
                            <div className="text-sm font-medium text-white truncate">
                                Loading...
                            </div>
                        </div>
                    </div>
                    <Image 
                        src={assets.arrow_icon} 
                        alt="" 
                        className="w-4 h-4 flex-shrink-0" 
                    />
                </button>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <div className="relative">
                <button
                    className="flex items-center gap-2 px-3 py-2 bg-[#404045] border border-gray-300/40 rounded-lg w-full md:max-w-56 justify-between overflow-hidden"
                    disabled={true}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                        <Image src={assets.chat_icon} alt="" className="w-4 h-4 flex-shrink-0" />
                        <div className="text-left flex-1 min-w-0 overflow-hidden">
                            <div className="text-sm font-medium text-white truncate">
                                Please login
                            </div>
                        </div>
                    </div>
                    <Image 
                        src={assets.arrow_icon} 
                        alt="" 
                        className="w-4 h-4 flex-shrink-0" 
                    />
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Selection button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-[#404045] border border-gray-300/40 rounded-lg hover:bg-gray-500/20 transition-colors w-full md:max-w-56 justify-between overflow-hidden"
                disabled={isLoading}
            >
                <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                    <Image src={assets.chat_icon} alt="" className="w-4 h-4 flex-shrink-0" />
                    <div className="text-left flex-1 min-w-0 overflow-hidden">
                        <div className="text-sm font-medium text-white truncate">
                            {isLoading ? 'Loading...' : (selectedChatflow?.name || 'Select Chatflow')}
                        </div>
                        {selectedChatflow && (
                            <div className="text-xs text-gray-400 truncate">
                                {selectedChatflow.category}
                            </div>
                        )}
                    </div>
                </div>
                <Image 
                    src={assets.arrow_icon} 
                    alt="" 
                    className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
                />
            </button>

            {/* Dropdown menu */}
            {isOpen && !isLoading && (
                <div className="absolute top-full left-0 mt-1 w-full min-w-64 bg-[#2f2f35] border border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {chatflows.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400">
                            {isLoading ? 'Loading...' : 'No available chatflows'}
                            {!isLoading && user && (
                                <div className="text-xs text-gray-500 mt-1">
                                    Course: {user.context_title || user.context_id}
                                    <br />
                                    Role: {user.roles?.join(', ') || 'No role'}
                                </div>
                            )}
                        </div>
                    ) : (
                        chatflows.map((chatflow) => (
                            <button
                                key={chatflow.id}
                                onClick={() => handleSelect(chatflow)}
                                className={`w-full text-left px-3 py-2 hover:bg-gray-600/50 transition-colors border-b border-gray-600/30 last:border-b-0 overflow-hidden ${
                                    selectedChatflow?.id === chatflow.id ? 'bg-gray-600/30' : ''
                                }`}
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0 bg-green-500" />
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <div className="text-sm font-medium text-white truncate">
                                            {chatflow.name}
                                        </div>
                                        {chatflow.description && (
                                            <div className="text-xs text-gray-400 truncate">
                                                {chatflow.description}
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-500 truncate">
                                            {chatflow.category}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                    
                    {/* Refresh button */}
                    <div className="px-3 py-2 border-t border-gray-600/30">
                        <button
                            onClick={() => {
                                fetchChatflows();
                                setIsOpen(false);
                            }}
                            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
                        >
                            <Image src={assets.regenerate_icon} alt="" className="w-3 h-3" />
                            Refresh Chatflow List
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatflowSelector;
