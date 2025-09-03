import { assets } from '@/assets/assets'
import { useAppContext } from '@/context/AppContextLTI';
import { useLTIAuth } from '@/context/LTIAuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import SimpleChatflowSelector from './SimpleChatflowSelector';
import axios from 'axios';
import Image from 'next/image'
import React, { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast';
import { performanceMonitor, withPerformanceTracking } from '@/utils/performanceMonitor';

const PromptBox = ({setIsLoading, isLoading}) => {

    const [prompt, setPrompt] = useState('');
    const [uploadedImages, setUploadedImages] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [previewModal, setPreviewModal] = useState({ isOpen: false, image: null });
    const [textareaHeight, setTextareaHeight] = useState('auto');
    const [isListening, setIsListening] = useState(false);
    const [speechRecognition, setSpeechRecognition] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState('zh-yue-HK'); // 添加语言状态
    const [isStreaming, setIsStreaming] = useState(false); // 添加流式传输状态
    const streamingRef = useRef(false); // Track streaming status
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);
    const {user, chats, setChats, selectedChat, setSelectedChat, selectedChatflow, setSelectedChatflow, createNewChat, handleChatflowChange} = useAppContext();
    const { isAuthenticated, user: authUser } = useLTIAuth();
    const { isDark } = useTheme();
    const { t } = useLanguage();

    // Add performance monitoring effect
    useEffect(() => {
        // Show performance summary every 10 API calls
        const metrics = performanceMonitor.getMetrics();
        if (metrics.apiCalls > 0 && metrics.apiCalls % 10 === 0) {
            performanceMonitor.logSummary();
            
            // Show warning if average response time is too high
            if (metrics.averageResponseTime > 8000) {
                console.warn(`⚠️ High average response time: ${metrics.averageResponseTime.toFixed(2)}ms`);
                toast.error(t('AI 响应速度较慢，建议检查网络连接'), { duration: 3000 });
            }
        }
    }, []);

    // 支持的语言列表
    const supportedLanguages = [
        { code: 'en-US', name: 'English', flag: 'US' },
        { code: 'zh-yue-HK', name: '粵語', flag: 'HK' },
        { code: 'zh-CN', name: '普通话', flag: 'CN' },
    ];

    // iPad Chrome viewport optimization
    useEffect(() => {
        const isIPad = /iPad|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
        const isChrome = /Chrome/.test(navigator.userAgent);
        
        if (isIPad) {
            // 动态调整视口高度，适应iPad Chrome
            const adjustViewport = () => {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
                
                // 为iPad Chrome添加额外的底部边距
                if (isChrome) {
                    const promptContainer = document.querySelector('.prompt-container');
                    if (promptContainer) {
                        promptContainer.style.marginBottom = 'max(16px, env(safe-area-inset-bottom))';
                    }
                }
            };
            
            adjustViewport();
            window.addEventListener('resize', adjustViewport);
            window.addEventListener('orientationchange', () => {
                setTimeout(adjustViewport, 100);
            });
            
            return () => {
                window.removeEventListener('resize', adjustViewport);
                window.removeEventListener('orientationchange', adjustViewport);
            };
        }
    }, []);

    // Preset quick phrases
    const quickPrompts = [
        { text: t("Let's learn"), content: t("Let's learn") + "！" },
        { text: t('Please continue'), content: t('Please continue') + ' ' }
    ];

    // Handle quick phrase click - send message directly
    const handleQuickPrompt = async (content) => {
        // 如果正在加载或流式传输，则不允许发送
        if (isLoading || isStreaming) return;
        
        // Create a mock event object for sendPrompt function
        const mockEvent = {
            preventDefault: () => {}
        };
        
        // Temporarily set prompt to quick phrase content
        const originalPrompt = prompt;
        setPrompt(content);
        
        // Wait for a microtask to ensure state update
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Directly call sendPrompt to send message
        try {
            await sendPromptWithContent(mockEvent, content);
        } catch (error) {
            // If sending fails, restore original prompt
            setPrompt(originalPrompt);
        }
    };

    // Clean up streaming status and speech recognition
    useEffect(() => {
        return () => {
            streamingRef.current = false;
            // Clean up speech recognition
            if (speechRecognition && isListening) {
                speechRecognition.stop();
                setIsListening(false);
            }
        };
    }, [speechRecognition, isListening]);

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true; // Enable continuous recognition
                recognition.interimResults = true; // Show interim results
                recognition.maxAlternatives = 1;
                recognition.lang = selectedLanguage; // Use selected language
                
                recognition.onstart = () => {
                    setIsListening(true);
                };
                
                recognition.onresult = (event) => {
                    let finalTranscript = '';
                    let interimTranscript = '';
                    
                    // Process all recognition results
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            finalTranscript += transcript;
                        } else {
                            interimTranscript += transcript;
                        }
                    }
                    
                    // Only update input box when there's final result
                    if (finalTranscript) {
                        setPrompt(prev => prev + finalTranscript + ' ');
                        setTimeout(adjustTextareaHeight, 0);
                    }
                    
                    // Can display interim results here (optional)
                    if (interimTranscript) {
                        // Interim results processing
                    }
                };
                
                recognition.onerror = (event) => {
                    
                    if (event.error === 'not-allowed') {
                        setIsListening(false);
                        toast.error('Please allow microphone access permission');
                    } else if (event.error === 'network') {
                        setIsListening(false);
                        toast.error('Network error, please check network connection');
                    } else if (event.error === 'language-not-supported') {
                        // If Cantonese is not supported, automatically switch to English
                        recognition.lang = 'en-US';
                        toast.error('Cantonese recognition not supported, switched to English recognition');
                    } else if (event.error === 'no-speech') {
                        // No speech detected, no need to stop in continuous mode
                    } else if (event.error === 'aborted') {
                        // User manually stopped, don't show error
                    } else {
                        // Other errors, try to restart (if still in listening state)
                        if (isListening) {
                            setTimeout(() => {
                                if (isListening) {
                                    try {
                                        recognition.start();
                                    } catch (e) {
                                        // Failed to restart
                                    }
                                }
                            }, 1000);
                        }
                    }
                };
                
                recognition.onend = () => {
                    // In continuous mode, if still in listening state, automatically restart
                    if (isListening) {
                        setTimeout(() => {
                            if (isListening) {
                                try {
                                    recognition.start();
                                } catch (e) {
                                    setIsListening(false);
                                }
                            }
                        }, 100);
                    }
                };
                
                setSpeechRecognition(recognition);
            } else {
                // Browser does not support speech recognition
            }
        }
    }, [selectedLanguage]); // 添加 selectedLanguage 作为依赖项

    // Auto-adjust textarea height
    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            // Reset height to get correct scrollHeight
            textarea.style.height = 'auto';
            
            // Calculate content height
            const scrollHeight = textarea.scrollHeight;
            const lineHeight = 24; // Height per line
            const minHeight = lineHeight * 2; // Minimum 2 lines
            const maxHeight = lineHeight * 8; // Maximum 8 lines
            
            // Set height but don't exceed maximum
            const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
            textarea.style.height = `${newHeight}px`;
            
            // Enable scrolling if content exceeds maximum height
            if (scrollHeight > maxHeight) {
                textarea.style.overflowY = 'auto';
            } else {
                textarea.style.overflowY = 'hidden';
            }
        }
    };

    // Reset textarea height to initial state
    const resetTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = '48px'; // Reset to minimum height
            textarea.style.overflowY = 'hidden';
        }
    };

    // Handle input changes
    const handleInputChange = (e) => {
        setPrompt(e.target.value);
        // Delay height adjustment to ensure content is updated
        setTimeout(adjustTextareaHeight, 0);
    };

    // Adjust initial height after component mount
    useEffect(() => {
        if (prompt === '') {
            resetTextareaHeight();
        } else {
            adjustTextareaHeight();
        }
    }, [prompt]);

    const handleKeyDown = (e)=>{
        if(e.key === "Enter" && !e.shiftKey && !isLoading && !isStreaming){
            e.preventDefault();
            sendPrompt(e);
        }
    }

    // Handle speech recognition
    const handleSpeechRecognition = () => {
        if (!speechRecognition) {
            toast.error(t('Your browser does not support speech recognition feature'));
            return;
        }
        
        if (isListening) {
            // Stop speech recognition
            setIsListening(false);
            speechRecognition.stop();
        } else {
            // Start speech recognition
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                    speechRecognition.lang = selectedLanguage; // 使用选择的语言
                    setIsListening(true);
                    speechRecognition.start();
                })
                .catch((error) => {
                    toast.error('Please allow microphone access permission');
                });
        }
    };

    // Handle image upload
    const handleImageUpload = (files) => {
        const validFiles = Array.from(files).filter(file => {
            if (!file.type.startsWith('image/')) {
                toast.error('Only image files are allowed');
                return false;
            }
            if (file.size > 50 * 1024 * 1024) { // 50MB limit
                toast.error('Image file cannot exceed 50MB');
                return false;
            }
            return true;
        });

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = {
                    id: Date.now() + Math.random(),
                    file,
                    url: e.target.result,
                    name: file.name
                };
                setUploadedImages(prev => [...prev, imageData]);
            };
            reader.readAsDataURL(file);
        });
    };

    // Handle file selection
    const handleFileSelect = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleImageUpload(files);
        }
    };

    // Handle drag and drop
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleImageUpload(files);
        }
    };

    // Handle paste
    const handlePaste = (e) => {
        const items = e.clipboardData.items;
        let hasImage = false;
        
        for (let item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    handleImageUpload([file]);
                    hasImage = true;
                }
            }
        }
        
        // If no image, it's text paste, need to adjust height
        if (!hasImage) {
            setTimeout(() => {
                adjustTextareaHeight();
            }, 0);
        }
    };

    // Remove image
    const removeImage = (imageId) => {
        setUploadedImages(prev => prev.filter(img => img.id !== imageId));
    };

    // Open file selector
    const openFileSelector = () => {
        fileInputRef.current?.click();
    };

    // Open image preview modal
    const openPreviewModal = (image) => {
        setPreviewModal({ isOpen: true, image });
    };

    // Close image preview modal
    const closePreviewModal = () => {
        setPreviewModal({ isOpen: false, image: null });
    };

    // 停止流式传输
    const stopStreaming = () => {
        streamingRef.current = false;
        setIsStreaming(false);
        setIsLoading(false);
        
        // 显示停止消息
        toast.success(t('Response stopped'));
    };

    const sendPrompt = async (e)=>{
        e.preventDefault();
        
        const promptCopy = prompt;
        await sendPromptWithContent(e, promptCopy);
    }

    const sendPromptWithContent = async (e, contentToSend)=>{
        e.preventDefault();
        
        try {
            
            if(!user || !isAuthenticated) {
                toast.error(t('Please access this tool through Moodle LTI'));
                return;
            }
            if(isLoading) return toast.error(t('Wait for the previous prompt response'));
            if(!contentToSend.trim()) return; // If no input content, do nothing
            
            // 立即设置加载和流式传输状态
            setIsLoading(true);
            setIsStreaming(true);
            setPrompt(""); // Clear input to prevent duplicate submission
            
            // If no chat is selected, automatically create a new chat
            let currentChat = selectedChat;
            if(!currentChat) {
                // 状态已经在上面设置了，这里不需要重复设置
                
                try {
                    // Create new chat
                    const chatData = selectedChatflow ? { chatflowId: selectedChatflow.id } : {};
                    
                    const createResponse = await axios.post('/api/chat/create', chatData, {
                        withCredentials: true
                    });
                    
                    if (!createResponse.data.success) {
                        // 恢复状态
                        setIsLoading(false);
                        setIsStreaming(false);
                        setPrompt(contentToSend); // Restore input content
                        return toast.error(t('Failed to create new chat. Please try again.'));
                    }
                    
                    // Get newly created chat
                    const chatsResponse = await axios.get('/api/chat/get', {
                        withCredentials: true
                    });
                    
                    if (chatsResponse.data.success && chatsResponse.data.data.length > 0) {
                        // Find the newly created chat (latest one)
                        const sortedChats = chatsResponse.data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                        let newChat;
                        
                        if (selectedChatflow) {
                            // If chatflow is selected, find the latest chat belonging to that chatflow
                            newChat = sortedChats.find(chat => chat.chatflowId === selectedChatflow.id);
                        } else {
                            // If no chatflow is selected, take the latest chat
                            newChat = sortedChats[0];
                        }
                        
                        if (newChat) {
                            currentChat = newChat;
                            // Update state but don't wait, continue sending message
                            setChats(chatsResponse.data.data);
                            setSelectedChat(newChat);
                        } else {
                            // 恢复状态
                            setIsLoading(false);
                            setIsStreaming(false);
                            setPrompt(contentToSend);
                            return toast.error(t('Failed to find created chat.'));
                        }
                    } else {
                        // 恢复状态
                        setIsLoading(false);
                        setIsStreaming(false);
                        setPrompt(contentToSend);
                        return toast.error(t('Failed to retrieve chat after creation.'));
                    }
                } catch (createError) {
                    // 恢复状态
                    setIsLoading(false);
                    setIsStreaming(false);
                    setPrompt(contentToSend);
                    if (createError.response?.status === 401) {
                        // Token expired, will be handled by interceptor
                        return;
                    }
                    return toast.error(t('Failed to create new chat. Please try again.'));
                }
            }

            // Now send message
            const userPrompt = {
                role: "user",
                content: contentToSend,
                timestamp: Date.now(),
                images: uploadedImages.length > 0 ? uploadedImages.map(img => ({
                    name: img.name,
                    url: img.url
                })) : undefined
            }

            // saving user prompt in chats array
            setChats((prevChats)=> prevChats.map((chat)=> chat._id === currentChat._id ?
             {
                ...chat,
                messages: [...chat.messages, userPrompt]
            }: chat
        ))
        // saving user prompt in selected chat
        setSelectedChat((prev)=> ({
            ...prev,
            messages: [...prev.messages, userPrompt]
        }))

        // Prepare data to send, including images
        const sendData = {
            chatId: currentChat._id,
            prompt: contentToSend,
            images: uploadedImages.length > 0 ? uploadedImages.map(img => img.url) : undefined,
        };
        
        // Only add chatflowId when a chatflow is selected
        if (selectedChatflow?.id) {
            sendData.chatflowId = selectedChatflow.id;
        }
        
        // Add current course context if available
        if (authUser?.context_id) {
            sendData.courseId = authUser.context_id;
        }        
        
        // 优化：添加超时配置和错误处理，集成性能监控
        const chatId = `chat-${currentChat._id}-${Date.now()}`;
        const {data} = await withPerformanceTracking(chatId, () => 
            axios.post('/api/chat/ai', sendData, {
                timeout: 60000, // 60秒超时
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                }
            })
        );

        if(data.success){
            const message = data.data.content;
            
            const messageTokens = message.split(" ");
            let assistantMessage = {
                role: 'assistant',
                content: "",
                timestamp: Date.now(),
            }

            // If backend returned updated chat name, update related state
            if(data.chatName && data.chatName !== currentChat.name) {
                // Update chat name in chats array - but don't add the message yet, wait for streaming
                setChats((prevChats)=>prevChats.map((chat)=>
                    chat._id === currentChat._id 
                        ? {...chat, name: data.chatName} 
                        : chat
                ))
                // Update currently selected chat name and add empty assistant message for streaming
                setSelectedChat((prev) => ({
                    ...prev,
                    name: data.chatName,
                    messages: [...prev.messages, assistantMessage],
                }))
            } else {
                // Only add empty assistant message for streaming, don't add the backend message yet
                setSelectedChat((prev) => ({
                    ...prev,
                    messages: [...prev.messages, assistantMessage],
                }))
            }

            // Optimized streaming effect - 提升显示速度
            const streamMessage = (fullContent) => {
                streamingRef.current = true; // Start streaming
                setIsStreaming(true); // 设置流式传输状态
                
                // Use Array.from to properly handle Unicode characters including Chinese
                const chars = Array.from(fullContent);
                let currentIndex = 0;
                const baseSpeed = 15; // 加快速度：从30改为15ms
                
                const typeNextChunk = () => {
                    if (!streamingRef.current) {
                        return;
                    }
                    
                    if (currentIndex >= chars.length) {
                        streamingRef.current = false;
                        setIsStreaming(false); // 清除流式传输状态
                        // Final update to ensure complete content is displayed
                        setSelectedChat((prev) => {
                            if (!prev) return prev;
                            const updatedMessages = [
                                ...prev.messages.slice(0, -1),
                                { ...assistantMessage, content: fullContent }
                            ];
                            return { ...prev, messages: updatedMessages };
                        });
                        
                        // Also update the chats array with final content
                        setChats((prevChats) => prevChats.map((chat) =>
                            chat._id === currentChat._id 
                                ? {
                                    ...chat, 
                                    messages: [...chat.messages, { ...assistantMessage, content: fullContent }]
                                } 
                                : chat
                        ));
                        return;
                    }
                    
                    // 优化：增加每次显示的字符数量，减少更新频率
                    let chunkSize = 2; // 从1改为2
                    const remainingChars = chars.length - currentIndex;
                    
                    if (remainingChars > 300) {
                        chunkSize = 4; // 长文本显示更快
                    } else if (remainingChars > 100) {
                        chunkSize = 3;
                        chunkSize = Math.min(3, remainingChars); // Fast display for long content
                    } else if (remainingChars > 50) {
                        chunkSize = Math.min(2, remainingChars); // Medium display for medium content
                    } else {
                        chunkSize = 1; // Slower display for short content, character by character
                    }
                    
                    currentIndex += chunkSize;
                    // Ensure we don't go beyond the content length
                    if (currentIndex > chars.length) {
                        currentIndex = chars.length;
                    }
                    
                    const currentContent = chars.slice(0, currentIndex).join('');
                    
                    // Use requestAnimationFrame to avoid frequent state updates
                    requestAnimationFrame(() => {
                        if (!streamingRef.current) return;
                        
                        setSelectedChat((prev) => {
                            if (!prev) return prev;
                            
                            const updatedMessages = [
                                ...prev.messages.slice(0, -1),
                                { ...assistantMessage, content: currentContent }
                            ];
                            return { ...prev, messages: updatedMessages };
                        });
                    });
                    
                    if (currentIndex < chars.length && streamingRef.current) {
                        // Dynamic speed adjustment
                        let delay = baseSpeed;
                        const currentChar = chars[currentIndex - 1];
                        
                        // Check if current character is Chinese
                        const isChineseChar = /[\u4e00-\u9fff]/.test(currentChar);
                        if (isChineseChar) {
                            delay = baseSpeed * 1.2; // Slightly slower for Chinese characters
                        } else if (currentChar === '.' || currentChar === '!' || currentChar === '?') {
                            delay = baseSpeed * 2; // Brief pause after period
                        } else if (currentChar === ',' || currentChar === ';') {
                            delay = baseSpeed * 1.5; // Light pause after comma
                        } else if (currentChar === ' ') {
                            delay = baseSpeed * 0.8; // Slightly faster for spaces
                        }
                        
                        // Fast display for code blocks
                        if (currentContent.includes('```') && !currentContent.trim().endsWith('```')) {
                            delay = baseSpeed * 0.5;
                        }
                        
                        setTimeout(typeNextChunk, delay);
                    } else if (currentIndex >= chars.length) {
                        // Reached the end, trigger final update
                        setTimeout(() => {
                            if (streamingRef.current) {
                                streamingRef.current = false;
                                setIsStreaming(false); // 清除流式传输状态
                                setSelectedChat((prev) => {
                                    if (!prev) return prev;
                                    const updatedMessages = [
                                        ...prev.messages.slice(0, -1),
                                        { ...assistantMessage, content: fullContent }
                                    ];
                                    return { ...prev, messages: updatedMessages };
                                });
                                
                                // Also update the chats array with final content
                                setChats((prevChats) => prevChats.map((chat) =>
                                    chat._id === currentChat._id 
                                        ? {
                                            ...chat, 
                                            messages: [...chat.messages, { ...assistantMessage, content: fullContent }]
                                        } 
                                        : chat
                                ));
                            }
                        }, 50);
                    }
                };
                
                // Start displaying
                setTimeout(typeNextChunk, 100); // Initial delay
            };
            
            // Start streaming
            streamMessage(message);
            
            // Clear uploaded images
            setUploadedImages([]);
        }else{
            toast.error(data.message);
            // 恢复状态
            setIsStreaming(false);
            setPrompt(contentToSend);
        }

        } catch (error) {
            // 清除流式传输状态
            streamingRef.current = false;
            setIsStreaming(false);
            
            // 401 errors are automatically handled by axios interceptor
            if (error.response?.status === 401) {
                // Token expired, interceptor will handle the popup
                setPrompt(contentToSend);
            } else {
                toast.error(t(error.message || 'Failed to send message'));
                setPrompt(contentToSend);
            }
        } finally {
            setIsLoading(false);
            // 注意：这里不清除 isStreaming，因为可能正在流式传输
            // isStreaming 会在流式传输完成或被停止时清除
        }
    }

  return (
    <div className={`w-full px-2 sm:px-0 ${selectedChat?.messages.length > 0 ? "max-w-3xl" : "max-w-2xl"} transition-all prompt-container`}
         style={{
           paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 12px)',
           marginBottom: '8px',
           position: 'relative',
           zIndex: 10
         }}>
      {/* Image preview area */}
      {uploadedImages.length > 0 && (
        <div className={`mb-3 p-3 ${isDark ? 'bg-[#404045]' : 'bg-gray-100'} rounded-2xl`}>
          <div className="flex flex-wrap gap-2">
            {uploadedImages.map((image) => (
              <div key={image.id} className="relative group">
                <img 
                  src={image.url} 
                  alt={image.name}
                  className={`w-16 h-16 object-cover rounded-lg border ${isDark ? 'border-gray-600' : 'border-gray-300'} cursor-pointer hover:opacity-80 transition-opacity`}
                  onClick={() => openPreviewModal(image)}
                />
                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-[9999]"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image preview modal */}
      {previewModal.isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={closePreviewModal}
        >
          <div 
            className="relative max-w-4xl max-h-4xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closePreviewModal}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors z-10"
            >
              ×
            </button>
            <img 
              src={previewModal.image.url} 
              alt={previewModal.image.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm">
              {previewModal.image.name}
            </div>
          </div>
        </div>
      )}

      {/* Quick phrase buttons */}
      <div className="flex items-center gap-2 mb-3 flex-wrap px-1">
        {quickPrompts
          .filter((item) => {
            // For new chat state (no selected chat or empty messages), only show "Let's learn" button
            const isNewChat = !selectedChat || !selectedChat.messages || selectedChat.messages.length === 0;
            if (isNewChat) {
              return item.text === t("Let's learn");
            }
            // For non-new chat state, show all buttons
            return true;
          })
          .map((item) => (
          <button
            key={item.text}
            type="button"
            onClick={() => handleQuickPrompt(item.content)}
            disabled={isLoading || isStreaming}
            className={`quick-prompt-btn flex items-center gap-1.5 px-4 py-2 ${isDark ? 'bg-[#404045]/80 border-gray-300/30 text-white/90 hover:bg-gray-500/30 hover:border-gray-300/60' : 'bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-900 hover:border-gray-500 opacity-70 hover:opacity-100'} border rounded-full text-xs group min-w-[100px] justify-center transition-all shadow-sm ${
                (isLoading || isStreaming) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {item.text === 'Good' && (
              <Image src={assets.like_icon} alt="" className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
            )}
            {item.text === t("Let's learn") && (
              <Image src={assets.arrow_icon} alt="" className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
            )}
            {item.text === 'Please recommend' && (
              <span className="text-sm opacity-70 group-hover:opacity-100 transition-opacity">😊</span>
            )}
            {item.text === t('Please continue') && (
              <Image src={assets.regenerate_icon} alt="" className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
            )}
            {item.text === 'Free to chat' && (
              <Image src={assets.chat_icon} alt="" className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
            )}
            <span className="whitespace-nowrap font-medium">{item.text}</span>
          </button>
        ))}
      </div>

      <form onSubmit={sendPrompt}
       className={`w-full ${isDark ? 'bg-[#404045]' : 'bg-gray-50 border-2 border-gray-300'} p-4 rounded-3xl mt-4 transition-all ${isDragging ? 'border-2 border-blue-500 border-dashed' : ''} shadow-sm`}
       onDragOver={handleDragOver}
       onDragLeave={handleDragLeave}
       onDrop={handleDrop}>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <textarea
        ref={textareaRef}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        disabled={isLoading || isStreaming}
        className={`outline-none w-full resize-none bg-transparent leading-6 text-sm sm:text-base ${isDark ? 'placeholder:text-gray-400 text-white' : 'placeholder:text-gray-500 text-gray-900'} scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent textarea-smooth ${
            (isLoading || isStreaming) ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{ 
            minHeight: '48px', // Minimum height for 2 lines
            maxHeight: '192px', // Maximum height for 8 lines
            overflowY: 'hidden',
            lineHeight: '24px',
            wordWrap: 'break-word',
            paddingRight: '8px', // Leave space for scrollbar
            fontSize: '16px', // 防止 iOS Safari 和 Chrome 自动缩放
            transform: 'translateZ(0)', // 硬件加速，防止渲染问题
            WebkitTransform: 'translateZ(0)',
            touchAction: 'manipulation', // 优化触摸响应
            WebkitTapHighlightColor: 'transparent' // 移除点击高亮
        }}
        placeholder={isDragging ? t('Drag images here to upload...') : isListening ? t('Continuous listening...') : t('Type a message, drag images, or use voice input...')} 
        onChange={handleInputChange} 
        value={prompt}
        rows={2}/>

        <div className='flex items-center justify-between text-sm'>
            <div className='flex items-center gap-2'>
                {/* Chatflow selector - bottom left position */}
                <SimpleChatflowSelector 
                    selectedChatflow={selectedChatflow} 
                    onChatflowChange={handleChatflowChange}
                    disabled={isLoading || isStreaming}
                />
            </div>

            <div className='flex items-center gap-2'>
            {/* Image upload button */}
            <button
              type="button"
              onClick={openFileSelector}
              disabled={isLoading || isStreaming}
              className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                isDark ? 'hover:bg-gray-600/30' : 'bg-gray-800 hover:bg-gray-900 hover:shadow-sm opacity-70 hover:opacity-100'
              } ${(isLoading || isStreaming) ? 'opacity-30 cursor-not-allowed' : ''}`}
              title={t("Upload Image")}
            >
              <Image 
                className={`w-3.5 transition-all ${isDark ? '' : 'brightness-0 invert'}`} 
                src={assets.file_upload} 
                alt='Upload Image'
              />
            </button>
            
            {/* Language selector */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              disabled={isLoading || isStreaming}
              className={`text-xs px-2 py-1 rounded-md border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                  : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
              } ${(isLoading || isStreaming) ? 'opacity-30 cursor-not-allowed' : ''}`}
              title={t("Select voice recognition language")}
            >
              {supportedLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
            
            {/* Voice recognition button */}
            <button
              type="button"
              onClick={handleSpeechRecognition}
              disabled={isLoading || isStreaming}
              className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                isListening 
                  ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' 
                  : `${isDark ? 'hover:bg-gray-600/30' : 'bg-gray-800 hover:bg-gray-900 hover:shadow-sm opacity-70 hover:opacity-100'}`
              } ${(isLoading || isStreaming) ? 'opacity-30 cursor-not-allowed' : ''}`}
              title={isListening ? t("Click to stop continuous recording") : t("Click to start continuous voice input")}
            >
              <Image 
                className={`w-5 transition-all ${isListening ? 'brightness-0 invert' : `${isDark ? 'brightness-0 invert' : 'brightness-0 invert'}`}`}
                src={assets.mic_svgrepo_com} 
                alt={t('Voice Input')}
              />
            </button>
            
            <button 
                type={(isLoading || isStreaming) ? "button" : "submit"}
                onClick={(isLoading || isStreaming) ? stopStreaming : undefined}
                className={`${
                    (isLoading || isStreaming)
                        ? "bg-red-600 hover:bg-red-700" 
                        : (prompt || uploadedImages.length > 0) && selectedChatflow 
                            ? "bg-blue-700 hover:bg-blue-800" 
                            : "bg-blue-600"
                } rounded-full p-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                disabled={!selectedChatflow && !(isLoading || isStreaming)}
                title={
                    (isLoading || isStreaming)
                        ? t("Click to stop response") 
                        : !selectedChatflow 
                            ? t("Please select a chatflow first") 
                            : ""
                }
            >
                <Image 
                    className='w-3.5 aspect-square brightness-0 invert sepia saturate-[500%] hue-rotate-[190deg]' 
                    src={
                        (isLoading || isStreaming)
                            ? assets.stop_icon 
                            : (prompt || uploadedImages.length > 0) && selectedChatflow 
                                ? assets.arrow_icon 
                                : assets.arrow_icon_dull
                    } 
                    alt={(isLoading || isStreaming) ? t('Stop') : t('Send')}
                />
            </button>
            </div>
        </div>
    </form>
    </div>
  )
}

export default PromptBox
