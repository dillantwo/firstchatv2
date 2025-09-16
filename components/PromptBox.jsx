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

const PromptBox = ({setIsLoading, isLoading, onPreviewModalChange, showPinnedPanel = false}) => {

    const [prompt, setPrompt] = useState('');
    const [uploadedImages, setUploadedImages] = useState([]);
    const [previewModal, setPreviewModal] = useState({ isOpen: false, image: null });
    const [textareaHeight, setTextareaHeight] = useState('auto');
    const [isListening, setIsListening] = useState(false);
    const [speechRecognition, setSpeechRecognition] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState('zh-yue-HK'); // 添加语言状态
    const [isStreaming, setIsStreaming] = useState(false); // 添加流式传输状态
    const [uploadingFiles, setUploadingFiles] = useState([]); // 添加正在上传的文件状态
    const [isIPadPortrait, setIsIPadPortrait] = useState(false); // 检测iPad竖屏模式
    const streamingRef = useRef(false); // Track streaming status
    const abortControllerRef = useRef(null); // Track current request for cancellation
    const charQueue = useRef([]);
    const isProcessingQueue = useRef(false);
    const streamCompleted = useRef(false);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);
    const {user, chats, setChats, selectedChat, setSelectedChat, selectedChatflow, setSelectedChatflow, createNewChat, handleChatflowChange} = useAppContext();
    const { isAuthenticated, user: authUser } = useLTIAuth();
    const { isDark } = useTheme();
    const { t } = useLanguage();

    // Notify parent component when preview modal state changes
    useEffect(() => {
        if (onPreviewModalChange) {
            onPreviewModalChange(previewModal.isOpen);
        }
    }, [previewModal.isOpen, onPreviewModalChange]);

    // 检测iPad竖屏模式
    useEffect(() => {
        const checkIPadPortrait = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const isTablet = width <= 1024 && width > 768;
            const isPortrait = height > width;
            setIsIPadPortrait(isTablet && isPortrait);
        };

        checkIPadPortrait();
        window.addEventListener('resize', checkIPadPortrait);
        window.addEventListener('orientationchange', checkIPadPortrait);

        return () => {
            window.removeEventListener('resize', checkIPadPortrait);
            window.removeEventListener('orientationchange', checkIPadPortrait);
        };
    }, []);

    // 支持的语言列表
    const supportedLanguages = [
        { code: 'en-US', name: 'English', flag: 'US' },
        { code: 'zh-yue-HK', name: '粵語', flag: 'HK' },
        { code: 'zh-CN', name: '普通话', flag: 'CN' },
    ];

    // Unified iPad viewport optimization - responsive for both orientations
    useEffect(() => {
        const isTablet = /iPad|Macintosh|Android.*Tablet/.test(navigator.userAgent) && 'ontouchend' in document;
        
        if (isTablet) {
            // 统一的视口高度调整，适应所有方向
            const adjustViewport = () => {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
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
        
        // Directly call sendPrompt to send message without modifying prompt state
        try {
            await sendPromptWithContent(mockEvent, content);
        } catch (error) {
            console.error('Failed to send quick prompt:', error);
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
            // Clean up any ongoing requests
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
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
            // 只支持圖片和Word文檔
            const isImage = file.type.startsWith('image/');
            const isWord = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                          file.name.toLowerCase().endsWith('.docx');
            
            if (!isImage && !isWord) {
                toast.error('Only image files (.jpg, .png, .gif, etc.) and Word documents (.docx) are supported');
                return false;
            }
            if (file.size > 50 * 1024 * 1024) { // 50MB limit
                toast.error('File cannot exceed 50MB');
                return false;
            }
            return true;
        });

        validFiles.forEach(file => {
            const isImage = file.type.startsWith('image/');
            
            if (isImage) {
                // 對於圖片，立即添加到预览区域
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageData = {
                        id: Date.now() + Math.random(),
                        file,
                        url: e.target.result,
                        name: file.name,
                        fileType: 'image'
                    };
                    setUploadedImages(prev => [...prev, imageData]);
                };
                reader.readAsDataURL(file);
            } else {
                // 對於文檔文件，先添加loading状态，然后上傳到服務器進行處理
                const uploadingFile = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    fileType: 'document',
                    isUploading: true
                };
                setUploadingFiles(prev => [...prev, uploadingFile]);
                handleDocumentUpload(file, uploadingFile.id);
            }
        });
    };

    // Handle document upload (Word, PDF)
    const handleDocumentUpload = async (file, uploadingId) => {
        const formData = new FormData();
        formData.append('files', file);
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            
            // Check if response is ok
            if (!response.ok) {
                const errorText = await response.text();
                // 移除loading状态
                setUploadingFiles(prev => prev.filter(f => f.id !== uploadingId));
                toast.error(`Failed to upload ${file.name}: Server error (${response.status})`);
                return;
            }
            
            // Check content type
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const responseText = await response.text();
                // 移除loading状态
                setUploadingFiles(prev => prev.filter(f => f.id !== uploadingId));
                toast.error(`Failed to upload ${file.name}: Invalid server response`);
                return;
            }
            
            const result = await response.json();
            
            if (result.success && result.data && result.data.length > 0) {
                const documentData = result.data[0];
                const processedDocument = {
                    id: Date.now() + Math.random(),
                    file,
                    name: documentData.name,
                    text: documentData.text,
                    fileType: documentData.fileType,
                    documentType: documentData.documentType,
                    pages: documentData.pages || null
                };
                // 移除loading状态并添加处理完成的文档
                setUploadingFiles(prev => prev.filter(f => f.id !== uploadingId));
                setUploadedImages(prev => [...prev, processedDocument]);
            } else {
                // 移除loading状态
                setUploadingFiles(prev => prev.filter(f => f.id !== uploadingId));
                toast.error(result.message || 'Failed to process document');
            }
        } catch (error) {
            // 移除loading状态
            setUploadingFiles(prev => prev.filter(f => f.id !== uploadingId));
            toast.error(`Failed to upload ${file.name}: ${error.message}`);
        }
    };

    // Handle file selection
    const handleFileSelect = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleImageUpload(files);
        }
    };

    // Handle paste
    const handlePaste = (e) => {
        const items = e.clipboardData.items;
        let hasFile = false;
        
        for (let item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    handleImageUpload([file]);
                    hasFile = true;
                }
            }
        }
        
        // If no file, it's text paste, need to adjust height
        if (!hasFile) {
            setTimeout(() => {
                adjustTextareaHeight();
            }, 0);
        }
    };

    // Remove image
    const removeImage = (imageId) => {
        setUploadedImages(prev => prev.filter(img => img.id !== imageId));
    };
    
    // Remove uploading file (cancel upload)
    const removeUploadingFile = (uploadingId) => {
        setUploadingFiles(prev => prev.filter(file => file.id !== uploadingId));
    };

    // Open file selector
    const openFileSelector = () => {
        fileInputRef.current?.click();
    };

    // Open image preview modal
    const openPreviewModal = (file) => {
        setPreviewModal({ isOpen: true, file });
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
        
        // Cancel the ongoing request if it exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        
        // Clear character queue to stop rendering
        charQueue.current = [];
        isProcessingQueue.current = false;
        streamCompleted.current = true; // Mark as completed to stop queue processing

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
            
            // Create abort controller for this request
            abortControllerRef.current = new AbortController();
            
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
                        abortControllerRef.current = null;
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
                            abortControllerRef.current = null;
                            setPrompt(contentToSend);
                            return toast.error(t('Failed to find created chat.'));
                        }
                    } else {
                        // 恢复状态
                        setIsLoading(false);
                        setIsStreaming(false);
                        abortControllerRef.current = null;
                        setPrompt(contentToSend);
                        return toast.error(t('Failed to retrieve chat after creation.'));
                    }
                } catch (createError) {
                    // 恢复状态
                    setIsLoading(false);
                    setIsStreaming(false);
                    abortControllerRef.current = null;
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
                images: uploadedImages.length > 0 ? uploadedImages.map(file => ({
                    name: file.name,
                    url: file.url,
                    fileType: file.fileType,
                    text: file.text,
                    documentType: file.documentType
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

        // Prepare data to send, including images and documents
        const sendData = {
            chatId: currentChat._id,
            prompt: contentToSend,
            images: uploadedImages.length > 0 ? uploadedImages.filter(file => file.fileType === 'image').map(img => img.url) : undefined,
            documents: uploadedImages.length > 0 ? uploadedImages.filter(file => file.fileType === 'document').map(doc => ({
                name: doc.name,
                text: doc.text,
                type: doc.documentType
            })) : undefined,
        };
        
        // Only add chatflowId when a chatflow is selected
        if (selectedChatflow?.id) {
            sendData.chatflowId = selectedChatflow.id;
        }
        
        // Add current course context if available
        if (authUser?.context_id) {
            sendData.courseId = authUser.context_id;
        }        
        
        // 优化：添加超时配置和错误处理
        const response = await fetch('/api/chat/ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sendData),
            signal: abortControllerRef.current?.signal, // Add abort signal
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Check if response is streaming
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('text/plain')) {
            // Handle streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantMessage = {
                role: 'assistant',
                content: "",
                timestamp: Date.now(),
            };

            // If backend returned updated chat name, update related state
            setSelectedChat((prev) => ({
                ...prev,
                messages: [...prev.messages, assistantMessage],
            }))

            // Start streaming
            streamingRef.current = true;
            setIsStreaming(true);
            
            let fullContent = '';
            let finalTokenUsage = null;
            let finalChatName = null;
            
            const processQueue = () => {
                if (charQueue.current.length === 0) {
                    if (streamCompleted.current) {
                        isProcessingQueue.current = false;
                        
                        // Final update
                        setSelectedChat((prev) => {
                            if (!prev) return prev;
                            const finalMessage = { 
                                ...assistantMessage, 
                                content: fullContent,
                                ...(finalTokenUsage && { tokenUsage: finalTokenUsage })
                            };
                            const updatedMessages = [
                                ...prev.messages.slice(0, -1),
                                finalMessage
                            ];
                            return { 
                                ...prev, 
                                messages: updatedMessages,
                                ...(finalChatName && { name: finalChatName })
                            };
                        });

                        // Update chats array
                        setChats((prevChats) => prevChats.map((chat) =>
                            chat._id === currentChat._id 
                                ? {
                                    ...chat, 
                                    messages: [...chat.messages, { 
                                        ...assistantMessage, 
                                        content: fullContent,
                                        ...(finalTokenUsage && { tokenUsage: finalTokenUsage })
                                    }],
                                    ...(finalChatName && { name: finalChatName })
                                } 
                                : chat
                        ));

                        // Clear uploaded images and uploading files
                        setUploadedImages([]);
                        setUploadingFiles([]);
                        
                        // Clear abort controller since request completed successfully
                        abortControllerRef.current = null;
                        setIsLoading(false); // Set loading to false when everything is done
                        return;
                    }
                    setTimeout(processQueue, 50);
                    return;
                }

                isProcessingQueue.current = true;
                
                // Process multiple characters in batches to reduce state updates
                let batchCount = 0;
                const maxBatchSize = Math.min(3, charQueue.current.length); // Process up to 3 characters at once
                
                while (batchCount < maxBatchSize && charQueue.current.length > 0) {
                    const char = charQueue.current.shift();
                    fullContent += char;
                    batchCount++;
                }

                // Use requestAnimationFrame to batch state updates and prevent excessive re-renders
                requestAnimationFrame(() => {
                    setSelectedChat((prev) => {
                        if (!prev) return prev;
                        const updatedMessages = [
                            ...prev.messages.slice(0, -1),
                            { ...assistantMessage, content: fullContent }
                        ];
                        return { ...prev, messages: updatedMessages };
                    });
                });

                // Increase delay to prevent maximum update depth exceeded
                setTimeout(processQueue, 20); // Increased from 5ms to 20ms for stability
            };
            
            try {
                streamCompleted.current = false;
                charQueue.current = [];

                while (true) {
                    const { done, value } = await reader.read();
                    
                    if (done) {
                        streamCompleted.current = true;
                        break;
                    }
                    
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data.trim()) {
                                try {
                                    const parsed = JSON.parse(data);
                                    
                                    if (parsed.type === 'content' && parsed.content) {
                                        if (!streamingRef.current) break;
                                        
                                        for (const char of parsed.content) {
                                            charQueue.current.push(char);
                                        }

                                        if (!isProcessingQueue.current) {
                                            processQueue();
                                        }
                                    } else if (parsed.type === 'done') {
                                        if (parsed.chatName) {
                                            finalChatName = parsed.chatName;
                                        }
                                        if (parsed.tokenUsage) {
                                            finalTokenUsage = parsed.tokenUsage;
                                        }
                                        streamingRef.current = false;
                                        setIsStreaming(false);
                                        streamCompleted.current = true;
                                        break;
                                    } else if (parsed.type === 'error') {
                                        streamingRef.current = false;
                                        setIsStreaming(false);
                                        streamCompleted.current = true;
                                        throw new Error(parsed.error);
                                    }
                                } catch (e) {
                                    // Skip parsing errors
                                }
                            }
                        }
                    }
                    
                    if (!streamingRef.current) break;
                }
            } catch (error) {
                streamingRef.current = false;
                setIsStreaming(false);
                streamCompleted.current = true;
                if (!isProcessingQueue.current) {
                    processQueue(); // Ensure queue processing stops and final state is updated
                }
                throw error;
            }
            
            if (!isProcessingQueue.current) {
                processQueue();
            }
            
        } else {
            // Handle non-streaming response (fallback)
            const data = await response.json();
            
            if(data.success){
                const message = data.data.content;
                
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

                // Optimized streaming effect - 提升显示速度和顺滑度
                const streamMessage = (fullContent) => {
                    streamingRef.current = true; // Start streaming
                    setIsStreaming(true); // 设置流式传输状态
                    
                    // Use Array.from to properly handle Unicode characters including Chinese
                    const chars = Array.from(fullContent);
                    let currentIndex = 0;
                    const baseSpeed = 5; // 进一步加快速度：从15改为8ms
                    
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
                        
                        // 优化：智能批量显示字符，提升流畅度
                        let chunkSize = 1;
                        const remainingChars = chars.length - currentIndex;
                        const currentContent = chars.slice(0, currentIndex).join('');
                        
                        // 根据内容类型和剩余长度动态调整显示块大小
                        if (currentContent.includes('```') && !currentContent.trim().endsWith('```')) {
                            // 代码块内容：快速显示
                            chunkSize = Math.min(5, remainingChars);
                        } else if (remainingChars > 500) {
                            chunkSize = 4; // 超长文本：快速显示
                        } else if (remainingChars > 200) {
                            chunkSize = 3; // 长文本：中等速度
                        } else if (remainingChars > 50) {
                            chunkSize = 2; // 中等文本：稍快显示
                        } else {
                            chunkSize = 1; // 短文本：逐字显示，保持效果
                        }
                        
                        currentIndex += chunkSize;
                        // Ensure we don't go beyond the content length
                        if (currentIndex > chars.length) {
                            currentIndex = chars.length;
                        }
                        
                        const newContent = chars.slice(0, currentIndex).join('');
                        
                        // 使用防抖优化减少重复渲染
                        if (!streamingRef.current) return;
                        
                        setSelectedChat((prev) => {
                            if (!prev) return prev;
                            
                            const updatedMessages = [
                                ...prev.messages.slice(0, -1),
                                { ...assistantMessage, content: newContent }
                            ];
                            return { ...prev, messages: updatedMessages };
                        });
                        
                        if (currentIndex < chars.length && streamingRef.current) {
                            // 优化的动态速度调整
                            let delay = baseSpeed;
                            const lastChar = chars[currentIndex - 1];
                            const nextChar = chars[currentIndex] || '';
                            const currentDisplayContent = newContent;
                            
                            // 根据当前内容类型调整速度
                            if (currentDisplayContent.includes('```') && !currentDisplayContent.trim().endsWith('```')) {
                                delay = baseSpeed * 0.3; // 代码块内容快速显示
                            } else if (/[\u4e00-\u9fff]/.test(lastChar)) {
                                delay = baseSpeed * 0.8; // 中文字符稍快显示
                            } else if (lastChar === '.' || lastChar === '!' || lastChar === '?' || lastChar === '。' || lastChar === '！' || lastChar === '？') {
                                delay = baseSpeed * 1.8; // 句号后稍作停顿
                            } else if (lastChar === ',' || lastChar === ';' || lastChar === '，' || lastChar === '；') {
                                delay = baseSpeed * 1.2; // 逗号后轻微停顿
                            } else if (lastChar === ' ' || lastChar === '\n') {
                                delay = baseSpeed * 0.6; // 空格和换行快速显示
                            }
                            
                            // 根据剩余内容长度调整整体速度
                            const remaining = chars.length - currentIndex;
                            if (remaining > 300) {
                                delay *= 0.7; // 长文本整体加速
                            } else if (remaining < 20) {
                                delay *= 1.3; // 短文本尾部稍慢，增加效果
                            }
                            
                            setTimeout(typeNextChunk, Math.max(2, delay)); // 最小2ms间隔
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
                
                // Clear uploaded images and uploading files
                setUploadedImages([]);
                setUploadingFiles([]);
                
                // Clear abort controller since request completed successfully
                abortControllerRef.current = null;
            }else{
                toast.error(data.message);
                // 恢复状态
                setIsStreaming(false);
                abortControllerRef.current = null;
                setPrompt(contentToSend);
            }
        }

        } catch (error) {
            if (error.name === 'AbortError') {
                // Request was cancelled, do nothing
            } else {
                toast.error(t('An error occurred while sending the message. Please try again.'));
            }
            setIsLoading(false);
            setIsStreaming(false);
            streamingRef.current = false;
            streamCompleted.current = true;
            abortControllerRef.current = null;
            
            // Restore input content if sending failed
            setPrompt(contentToSend);
        } finally {
            // This block will run after try/catch, but streaming is async.
            // Final state updates are handled within the streaming logic.
        }
    }

  return (
    <div className={`w-full px-2 sm:px-4 md:px-0 ${selectedChat?.messages.length > 0 ? "max-w-3xl" : "max-w-2xl"} transition-all duration-300 prompt-container`}
         style={{
           paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 12px)',
           marginBottom: 'max(55px, env(safe-area-inset-bottom))',
           position: 'relative',
           zIndex: 10
         }}>
      {/* File preview area */}
      {(uploadedImages.length > 0 || uploadingFiles.length > 0) && (
        <div className={`mb-2 md:mb-3 p-2 md:p-3 ${isDark ? 'bg-[#404045]' : 'bg-gray-100'} rounded-xl md:rounded-2xl`}>
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {/* 显示正在上传的文件 */}
            {uploadingFiles.map((file) => (
              <div key={file.id} className="relative group w-16">
                <div 
                  className={`w-16 h-16 flex flex-col items-center justify-center rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'} relative overflow-hidden`}
                >
                  {/* Loading 遮罩 */}
                  <div className={`absolute inset-0 ${isDark ? 'bg-gray-800' : 'bg-gray-200'} bg-opacity-80 flex flex-col items-center justify-center`}>
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mb-1"></div>
                    <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} font-medium`}>
                      {t('Uploading')}
                    </div>
                  </div>
                  
                  {/* 文档图标背景 */}
                  <div className="text-2xl mb-1 opacity-30">
                    📝
                  </div>
                  <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} text-center px-1 opacity-30`}>
                    DOCX
                  </div>
                </div>
                
                {/* 取消上传按钮 */}
                <button
                  onClick={() => removeUploadingFile(file.id)}
                  className={`absolute -top-1 -right-1 bg-white hover:bg-gray-100 rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center transition-colors z-10 shadow-sm border border-gray-200 ${previewModal.isOpen ? 'hidden' : ''}`}
                  title={`${t('Cancel upload')} ${file.name}`}
                >
                  <Image 
                    src={assets.delete_icon} 
                    alt="delete" 
                    width={12} 
                    height={12} 
                    className="filter brightness-0 saturate-100 invert-[25%] sepia-[100%] saturate-[2000%] hue-rotate-[330deg] brightness-[95%] contrast-[100%]"
                  />
                </button>
                
                {/* 文件名提示 */}
                <div className={`absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded-b-lg truncate ${previewModal.isOpen ? 'hidden' : ''}`}>
                  {file.name} ({t('Uploading')}...)
                </div>
              </div>
            ))}
            
            {/* 显示已上传的文件 */}
            {uploadedImages.map((file) => (
              <div key={file.id} className="relative group w-16">
                {file.fileType === 'image' ? (
                  // 圖片預覽
                  <img 
                    src={file.url} 
                    alt={file.name}
                    className={`w-16 h-16 object-cover rounded-lg border ${isDark ? 'border-gray-600' : 'border-gray-300'} cursor-pointer hover:opacity-80 transition-opacity`}
                    onClick={() => openPreviewModal(file)}
                  />
                ) : (
                  // 文檔圖標
                  <div 
                    className={`w-16 h-16 flex flex-col items-center justify-center rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'} cursor-pointer hover:opacity-80 transition-opacity`}
                    onClick={() => openPreviewModal(file)}
                  >
                    <div className="text-2xl mb-1">
                      📝
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} text-center px-1`}>
                      {file.documentType?.toUpperCase()}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => removeImage(file.id)}
                  className={`absolute -top-1 -right-1 bg-white hover:bg-gray-100 rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center transition-colors z-10 shadow-sm border border-gray-200 ${previewModal.isOpen ? 'hidden' : ''}`}
                  title={`${t('Remove')} ${file.name}`}
                >
                  <Image 
                    src={assets.delete_icon} 
                    alt="delete" 
                    width={12} 
                    height={12} 
                    className="filter brightness-0 saturate-100 invert-[25%] sepia-[100%] saturate-[2000%] hue-rotate-[330deg] brightness-[95%] contrast-[100%]"
                  />
                </button>
                {/* 文件名提示 */}
                <div className={`absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded-b-lg truncate ${previewModal.isOpen ? 'hidden' : ''} w-full`}>
                  {file.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File preview modal */}
      {previewModal.isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[10000]"
          onClick={closePreviewModal}
        >
          <div 
            className="relative max-w-lg max-h-[60vh] p-4 m-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closePreviewModal}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors z-[10001]"
            >
              ×
            </button>
            
            {previewModal.file.fileType === 'image' ? (
              // 圖片預覽
              <img 
                src={previewModal.file.url} 
                alt={previewModal.file.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            ) : (
              // 文檔內容預覽
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-2xl max-h-[80vh] overflow-hidden`}>
                <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {previewModal.file.name}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {previewModal.file.documentType?.toUpperCase()} Document
                    {previewModal.file.pages && ` • ${previewModal.file.pages} pages`}
                  </p>
                </div>
                <div className={`p-4 max-h-96 overflow-y-auto ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                    {previewModal.file.text || 'No text content available'}
                  </pre>
                </div>
              </div>
            )}
            
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm">
              {previewModal.file.name}
            </div>
          </div>
        </div>
      )}

      {/* Quick phrase buttons */}
      <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3 flex-wrap px-0.5 md:px-1">
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
            className={`quick-prompt-btn flex items-center gap-1 md:gap-1.5 px-3 md:px-4 py-1.5 md:py-2 ${isDark ? 'bg-[#404045]/80 border-gray-300/30 text-white/90 hover:bg-gray-500/30 hover:border-gray-300/60' : 'bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-900 hover:border-gray-500 opacity-70 hover:opacity-100'} border rounded-full text-xs md:text-xs group min-w-[80px] md:min-w-[100px] justify-center transition-all duration-200 shadow-sm hover:shadow-md ${
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
       className={`w-full ${isDark ? 'bg-[#404045]' : 'bg-gray-50 border-2 border-gray-300'} p-3 md:p-4 rounded-2xl md:rounded-3xl mt-3 md:mt-4 transition-all duration-300 shadow-sm hover:shadow-md`}>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <textarea
        ref={textareaRef}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        disabled={isLoading || isStreaming}
        className={`outline-none w-full resize-none bg-transparent leading-6 text-sm md:text-base ${isDark ? 'placeholder:text-gray-400 text-white' : 'placeholder:text-gray-500 text-gray-900'} textarea-smooth ${
            (isLoading || isStreaming) ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{ 
            minHeight: '48px', // Minimum height for 2 lines
            maxHeight: '192px', // Maximum height for 8 lines
            overflowY: 'hidden',
            lineHeight: '24px',
            wordWrap: 'break-word',
            paddingRight: '8px', // Leave space for scrollbar
            fontSize: 'clamp(16px, 4vw, 18px)', // 响应式字体大小，防止移动端缩放
            transform: 'translateZ(0)', // 硬件加速
            WebkitTransform: 'translateZ(0)',
            touchAction: 'manipulation', // 优化触摸响应
            WebkitTapHighlightColor: 'transparent' // 移除点击高亮
        }}
        placeholder={isListening ? t('Continuous listening...') : t('Type a message or use voice input...')} 
        onChange={handleInputChange} 
        value={prompt}
        rows={2}/>

        <div className='flex items-center justify-between text-xs md:text-sm'>
            <div className='flex items-center gap-1.5 md:gap-2'>
                {/* Chatflow selector - bottom left position */}
                {/* 当PIN面板打开时隐藏chatflow选择器，为输入框腾出更多空间 */}
                {!showPinnedPanel && (
                    <SimpleChatflowSelector 
                        selectedChatflow={selectedChatflow} 
                        onChatflowChange={handleChatflowChange}
                        disabled={isLoading || isStreaming}
                    />
                )}
            </div>

            <div className='flex items-center gap-1.5 md:gap-2'>
            {/* Image upload button */}
            <button
              type="button"
              onClick={openFileSelector}
              disabled={isLoading || isStreaming}
              className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                isDark ? 'hover:bg-gray-600/30' : 'bg-gray-800 hover:bg-gray-900 hover:shadow-sm opacity-70 hover:opacity-100'
              } ${(isLoading || isStreaming) ? 'opacity-30 cursor-not-allowed' : ''}`}
              title={t("Upload Files (Images, Word)")}
            >
              <Image 
                className={`w-3 md:w-3.5 transition-all ${isDark ? '' : 'brightness-0 invert'}`} 
                src={assets.file_upload} 
                alt='Upload Files'
              />
            </button>
            
            {/* Language selector */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              disabled={isLoading || isStreaming || isListening}
              className={`text-xs px-1.5 md:px-2 py-1 rounded-md border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                  : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
              } ${(isLoading || isStreaming || isListening) ? 'opacity-30 cursor-not-allowed' : ''}`}
              title={isListening ? t("Cannot change language during voice input") : t("Select voice recognition language")}
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
              className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                isListening 
                  ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' 
                  : `${isDark ? 'hover:bg-gray-600/30' : 'bg-gray-800 hover:bg-gray-900 hover:shadow-sm opacity-70 hover:opacity-100'}`
              } ${(isLoading || isStreaming) ? 'opacity-30 cursor-not-allowed' : ''}`}
              title={isListening ? t("Click to stop continuous recording") : t("Click to start continuous voice input")}
            >
              <Image 
                className={`w-4 md:w-5 transition-all ${isListening ? 'brightness-0 invert' : `${isDark ? 'brightness-0 invert' : 'brightness-0 invert'}`}`}
                src={assets.mic_svgrepo_com} 
                alt={t('Voice Input')}
              />
            </button>
            
            <button 
                type="button"
                onClick={() => {
                    if (isLoading || isStreaming) {
                        stopStreaming();
                    } else {
                        sendPrompt(new Event('submit'));
                    }
                }}
                className={`${
                    (isLoading || isStreaming)
                        ? "bg-red-600 hover:bg-red-700" 
                        : (prompt || uploadedImages.length > 0) && selectedChatflow 
                            ? "bg-blue-700 hover:bg-blue-800" 
                            : "bg-blue-600"
                } rounded-full p-1.5 md:p-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md`}
                disabled={!((prompt || uploadedImages.length > 0) && selectedChatflow) && !(isLoading || isStreaming)}
                title={
                    (isLoading || isStreaming)
                        ? t("Click to stop response") 
                        : !selectedChatflow 
                            ? t("Please select a chatflow first") 
                            : t("Send")
                }
            >
                <Image 
                    className='w-3 md:w-3.5 aspect-square brightness-0 invert sepia saturate-[500%] hue-rotate-[190deg] transition-transform duration-200 hover:scale-110' 
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
