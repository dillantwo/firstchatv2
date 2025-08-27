"use client";
import { useLTIAuth } from "@/context/LTIAuthContext";
import { useHydration } from "@/utils/useHydration";
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const useAppContext = ()=>{
    return useContext(AppContext)
}

export const AppContextProvider = ({children})=>{
    const { user, isAuthenticated } = useLTIAuth();
    const hasHydrated = useHydration();
    
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [selectedChatflow, setSelectedChatflow] = useState(null);
    const [filteredChats, setFilteredChats] = useState([]);

    const createNewChat = async ()=>{
        try {
            if(!user || !isAuthenticated) return null;

            // 创建新聊天时关联到当前选中的 chatflow
            const chatData = selectedChatflow ? { chatflowId: selectedChatflow.id } : {};

            const response = await axios.post('/api/chat/create', chatData)

            if(response.data.success) {
                await fetchUsersChats();
                return true; // 返回成功标识
            }
            return false;
        } catch (error) {
            toast.error(error.message)
            return false;
        }
    }

    const fetchUsersChats = async ()=>{
        try {
            if (!user || !isAuthenticated) return;

            const {data} = await axios.get('/api/chat/get')
            if(data.success){
                setChats(data.data)

                 // If the user has no chats, create one
                 if(data.data.length === 0){
                    // 当没有聊天时，清空选中的聊天
                    setSelectedChat(null);
                 }else{
                    // sort chats by updated date
                    data.data.sort((a, b)=> new Date(b.updatedAt) - new Date(a.updatedAt));

                     // 如果有选中的 chatflow，优先选择该 chatflow 下的聊天
                     if(selectedChatflow) {
                        const chatflowChats = data.data.filter(chat => chat.chatflowId === selectedChatflow.id);
                        if(chatflowChats.length > 0) {
                            setSelectedChat(chatflowChats[0]);
                        } else {
                            // 如果当前 chatflow 没有聊天，检查当前选中的聊天是否还存在
                            const stillExists = data.data.find(chat => chat._id === selectedChat?._id);
                            if (!stillExists) {
                                setSelectedChat(null);
                            }
                        }
                     } else {
                        // 如果没有选中 chatflow，检查当前选中的聊天是否还存在
                        const stillExists = data.data.find(chat => chat._id === selectedChat?._id);
                        if (stillExists) {
                            // 如果当前选中的聊天仍然存在，保持选中
                            setSelectedChat(stillExists);
                        } else {
                            // 否则选择第一个聊天
                            setSelectedChat(data.data[0]);
                        }
                     }
                 }
            }
        } catch (error) {
            console.error('Failed to fetch chats:', error);
            toast.error("Failed to load chats")
        }
    }

    const deleteChat = async (id) => {
        try {
            if(!user || !isAuthenticated) return false;

            const response = await axios.delete(`/api/chat/delete/${id}`)
            
            if(response.data.success) {
                // Update chats state by removing the deleted chat
                const updatedChats = chats.filter(chat => chat._id !== id);
                setChats(updatedChats);
                
                // If the deleted chat was selected, select another one or clear selection
                if(selectedChat && selectedChat._id === id) {
                    if(updatedChats.length > 0) {
                        // If there's a selected chatflow, prefer chats from that chatflow
                        if(selectedChatflow) {
                            const chatflowChats = updatedChats.filter(chat => chat.chatflowId === selectedChatflow.id);
                            setSelectedChat(chatflowChats.length > 0 ? chatflowChats[0] : updatedChats[0]);
                        } else {
                            setSelectedChat(updatedChats[0]);
                        }
                    } else {
                        setSelectedChat(null);
                    }
                }
                
                toast.success("Chat deleted successfully");
                return true;
            }
            return false;
        } catch (error) {
            toast.error(error.message)
            return false;
        }
    }

    const updateChatName = async (id, newName) => {
        try {
            if(!user || !isAuthenticated) return false;

            const response = await axios.put(`/api/chat/update/${id}`, { name: newName })
            
            if(response.data.success) {
                // Update the chat in the local state
                setChats(prevChats => 
                    prevChats.map(chat => 
                        chat._id === id ? { ...chat, name: newName } : chat
                    )
                );
                
                // Update selected chat if it's the one being renamed
                if(selectedChat && selectedChat._id === id) {
                    setSelectedChat(prev => ({ ...prev, name: newName }));
                }
                
                toast.success("Chat renamed successfully");
                return true;
            }
            return false;
        } catch (error) {
            toast.error(error.message)
            return false;
        }
    }

    // Filter chats based on selected chatflow
    useEffect(() => {
        if (selectedChatflow) {
            const filtered = chats.filter(chat => chat.chatflowId === selectedChatflow.id);
            setFilteredChats(filtered);
        } else {
            setFilteredChats(chats);
        }
    }, [chats, selectedChatflow]);

    // Handle chatflow change
    const handleChatflowChange = (chatflow) => {
        setSelectedChatflow(chatflow);
        
        if (chatflow) {
            // Find the first chat for this chatflow
            const chatflowChats = chats.filter(chat => chat.chatflowId === chatflow.id);
            if (chatflowChats.length > 0) {
                setSelectedChat(chatflowChats[0]);
            } else {
                setSelectedChat(null);
            }
        } else {
            // If no chatflow selected, show the first chat or null
            setSelectedChat(chats.length > 0 ? chats[0] : null);
        }
    };

    useEffect(()=>{
        if(user && isAuthenticated){
            fetchUsersChats()
        } else {
            // Clear data when user is not authenticated
            setChats([]);
            setSelectedChat(null);
            setFilteredChats([]);
        }
    },[user, isAuthenticated, selectedChatflow])

    const value = {
        user,
        chats,
        setChats,
        selectedChat,
        setSelectedChat,
        createNewChat,
        deleteChat,
        updateChatName,
        fetchUsersChats,
        selectedChatflow,
        setSelectedChatflow,
        handleChatflowChange,
        filteredChats
    }

    // Prevent hydration mismatch by ensuring client-side rendering is ready
    if (!hasHydrated) {
        return (
            <AppContext.Provider value={value}>
                {children}
            </AppContext.Provider>
        );
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}