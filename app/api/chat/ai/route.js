export const maxDuration = 300; // 增加到 5 分鐘
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import LTIUser from "@/models/LTIUser";
import LTICourse from "@/models/LTICourse";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { checkChatflowPermission } from "@/utils/permissionUtilsNew.mjs";
import { getLanguageFromRequest, createTranslator } from "@/utils/serverTranslations.js";
import { validateRequestBody, logSecurityEvent } from "@/middleware/securityValidation.js";

// Flowise API configuration
const FLOWISE_BASE_URL = process.env.FLOWISE_BASE_URL;
const FLOWISE_API_KEY = process.env.FLOWISE_API_KEY;

// Function to create session ID based on user_id and chat_id
// This ensures the same chat conversation always uses the same session ID
function createSessionId(userId, chatId) {
    // Create a namespace UUID (version 5)
    const namespace = "b6Vzr2ZBar8Ssb34euKp9VCm_n23DzBJMm0Baa7bphU";
    
    // Combine user_id and chat_id (no timestamp to ensure consistency)
    const seed = `${userId}:${chatId}`;
    
    // Generate a UUID based on the namespace and seed using crypto.createHash
    const crypto = require('crypto');
    const hash = crypto.createHash('sha1').update(namespace + seed).digest('hex');
    
    // Format as UUID v5
    const uuid = [
        hash.substr(0, 8),
        hash.substr(8, 4),
        '5' + hash.substr(13, 3), // Version 5
        ((parseInt(hash.substr(16, 1), 16) & 0x3) | 0x8).toString(16) + hash.substr(17, 3), // Variant
        hash.substr(20, 12)
    ].join('-');
    
    return uuid;
}

// Helper function to query Flowise API with streaming support
async function queryFlowise(data, chatflowId, streaming = false, t = (key) => key) {
    const FLOWISE_API_URL = `${FLOWISE_BASE_URL}/api/v1/prediction/${chatflowId}`;
    
    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时（streaming需要更长时间）
    
    try {
        const response = await fetch(FLOWISE_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(FLOWISE_API_KEY && { "Authorization": `Bearer ${FLOWISE_API_KEY}` })
            },
            body: JSON.stringify(data),
            signal: controller.signal,
            keepalive: true,
            cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            // Get detailed error information
            let errorMessage = `Flowise API error: ${response.status} ${response.statusText}`;
            try {
                const errorBody = await response.text();
                if (errorBody) {
                    errorMessage += ` - ${errorBody}`;
                }
            } catch (e) {
                // Ignore errors when parsing error response body
            }
            throw new Error(errorMessage);
        }
        
        // For streaming responses, return the response object directly
        if (streaming) {
            return response;
        }
        
        // For non-streaming responses, parse as JSON
        const result = await response.json();
        return result;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error(t('Request timeout - AI service took too long to respond'));
        }
        throw error;
    }
}

export async function POST(req){
    try {
        // Get language preference and create translator
        const language = getLanguageFromRequest(req);
        const t = createTranslator(language);
        
        // Get user ID from LTI session cookie
        const token = req.cookies.get('lti_session')?.value;
        
        if (!token) {
            return NextResponse.json({
                success: false,
                message: t("User not authenticated"),
            });
        }

        let userId, currentContextId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            userId = decoded.userId;
            currentContextId = decoded.context_id; // 从token获取当前课程ID
        } catch (error) {
            return NextResponse.json({
                success: false,
                message: t("Invalid session"),
            });
        }

        // Extract chatId, prompt, images, documents, chatflowId, and optional courseId from the request body
        const { chatId, prompt, images, documents, chatflowId, courseId } = await req.json();

        // Security validation - 使用统一的验证函数
        const securityViolations = validateRequestBody(
            { prompt, chatflowId, courseId, images, documents },
            ['prompt', 'chatflowId', 'courseId', 'images', 'documents']
        );
        
        if (securityViolations) {
            logSecurityEvent({
                type: 'command_injection_attempt',
                userId,
                violations: securityViolations,
                ip: req.headers.get('x-forwarded-for') || 'unknown',
                userAgent: req.headers.get('user-agent')
            });
            
            return NextResponse.json({
                success: false,
                message: t("Security violation detected. Request blocked."),
            }, { status: 403 });
        }

        // Validate required parameters
        if(!prompt?.trim()){
            return NextResponse.json({
                success: false,
                message: t("Prompt is required"),
              });
        }

        if(!chatflowId){
            return NextResponse.json({
                success: false,
                message: t("Chatflow selection is required"),
              });
        }

        // Connect to database and get user information
        await connectDB();
        
        // 优化：并行查询用户信息和课程关联，减少数据库查询时间
        const [user, courseAssociation] = await Promise.all([
            LTIUser.findById(userId).lean(), // 使用 lean() 减少内存开销
            LTICourse.findOne({ 
                user_id: userId,
                context_id: currentContextId || courseId
            }).lean() || LTICourse.findOne({ 
                user_id: userId 
            }).sort({ last_access: -1 }).lean()
        ]);
        
        if (!user) {
            return NextResponse.json({
                success: false,
                message: t("User not found"),
            });
        }

        if (!courseAssociation) {
            return NextResponse.json({
                success: false,
                message: t("No course association found"),
            });
        }

        // Check if user has permission to use this chatflow
        const hasPermission = await checkChatflowPermission(
            userId,
            courseAssociation.context_id,  // Use context_id instead of courseId
            courseAssociation.roles,
            chatflowId,
            'chat'
        );

        if (!hasPermission) {
            return NextResponse.json({
                success: false,
                message: t("You do not have permission to use this chatflow"),
            });
        }

        // Generate session ID for this chat conversation
        // Same chat will always have the same session ID for context continuity
        const sessionId = createSessionId(userId, chatId);

        // Find the chat document in the database based on userId and chatId
        const data = await Chat.findOne({userId, _id: chatId})

        if(!data){
            return NextResponse.json({
                success: false,
                message: t("Chat not found"),
              });
        }

        // Process images if provided
        let processedImages = [];
        if (images && images.length > 0) {
            processedImages = images.filter(img => {
                return (typeof img === 'string' && img.startsWith('data:')) ||
                       (typeof img === 'string' && (img.startsWith('http') || img.startsWith('blob:')));
            });
        }

        // Create a user message object
        const userPrompt = {
            role: "user",
            content: prompt,
            timestamp: Date.now(),
            // Handle image information: if images is a string array (URLs), convert to object format
            ...(images && images.length > 0 && { 
                images: images.map((img, index) => {
                    if (typeof img === 'string') {
                        // If it's a string (URL), convert to object format
                        return {
                            name: `Image ${index + 1}`,
                            url: img
                        };
                    } else if (typeof img === 'object' && img.url) {
                        // If it's already in object format, use it directly
                        return img;
                    } else {
                        // Fallback handling
                        return {
                            name: `Image ${index + 1}`,
                            url: img
                        };
                    }
                })
            }),
            // Handle document information
            ...(documents && documents.length > 0 && {
                documents: documents.map(doc => ({
                    name: doc.name,
                    type: doc.type || 'document',
                    text: doc.text,
                    pages: doc.pages || null
                }))
            })
        };

        data.messages.push(userPrompt);

        // If this is the first user message (chat just created), set the question as chat name
        const isFirstMessage = data.messages.filter(msg => msg.role === 'user').length === 1;
        if (isFirstMessage && data.name === "New Chat") {
            // Truncate to first 50 characters as chat name to avoid overly long names
            const chatName = prompt.length > 50 ? prompt.substring(0, 50) + "..." : prompt;
            data.name = chatName;
        }

        // Prepare chat history for Flowise API
        // Flowise may need historical messages to maintain conversation context
        const chatHistory = data.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            ...(msg.images && { images: msg.images }),
            ...(msg.documents && { documents: msg.documents })
        }));

        // Call the Flowise API to get a chat completion with streaming
        // Use the session ID generated earlier
        
        // Prepare the enhanced prompt with document content if available
        let enhancedPrompt = prompt;
        if (documents && documents.length > 0) {
            const documentContent = documents.map(doc => 
                `\n\n--- ${doc.name} (${doc.type?.toUpperCase()}) ---\n${doc.text}`
            ).join('\n');
            enhancedPrompt = `${prompt}\n\nAttached Documents:${documentContent}`;
        }
        
        // Request data for Flowise API
        const requestData = {
            question: enhancedPrompt,
            overrideConfig: {
                sessionId: sessionId
            },
            streaming: true  // Enable streaming
        };
        
        // Only add uploads field when there are images
        if (images && images.length > 0) {
            requestData.uploads = images.map((img, index) => {
                const upload = {
                    data: img,
                    type: img.startsWith('data:') ? 'file' : 'url',
                    name: `image_${index + 1}.png`,
                    mime: img.startsWith('data:image/') ? img.split(';')[0].split(':')[1] : 'image/png'
                };
                return upload;
            });
        }
        
        // Get streaming response from Flowise
        let streamResponse;
        try {
            streamResponse = await queryFlowise(requestData, chatflowId, true, t);
        } catch (error) {
            // Fallback to non-streaming request
            const fallbackData = { ...requestData };
            delete fallbackData.streaming;
            const completion = await queryFlowise(fallbackData, chatflowId, false, t);
            
            // Handle non-streaming response
            let responseContent = '';
            if (typeof completion === 'string') {
                responseContent = completion;
            } else if (completion && typeof completion === 'object') {
                responseContent = completion.text || 
                                 completion.response || 
                                 completion.answer || 
                                 completion.data || 
                                 completion.result ||
                                 completion.message ||
                                 (typeof completion.content === 'string' ? completion.content : '') ||
                                 JSON.stringify(completion);
            } else {
                responseContent = "Sorry, I couldn't generate a response.";
            }
            
            const message = {
                role: "assistant",
                content: responseContent,
                timestamp: Date.now()
            };
            
            data.messages.push(message);
            await data.save();
            
            return NextResponse.json({
                success: true, 
                data: message,
                chatName: data.name
            });
        }
        
        // Create a ReadableStream for streaming the response
        const stream = new ReadableStream({
            async start(controller) {
                const reader = streamResponse.body.getReader();
                const decoder = new TextDecoder();
                let fullMessage = '';
                let tokenUsage = null;
                
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        
                        if (done) {
                            // Streaming completed, save the final message to database
                            const message = {
                                role: "assistant",
                                content: fullMessage,
                                timestamp: Date.now(),
                                ...(tokenUsage && { tokenUsage })
                            };
                            
                            data.messages.push(message);
                            
                            // Update aggregate token usage for the chat
                            if (tokenUsage) {
                                if (!data.totalTokenUsage) {
                                    data.totalTokenUsage = {
                                        promptTokens: 0,
                                        completionTokens: 0,
                                        totalTokens: 0,
                                        lastUpdated: new Date()
                                    };
                                }
                                
                                data.totalTokenUsage.promptTokens += tokenUsage.promptTokens;
                                data.totalTokenUsage.completionTokens += tokenUsage.completionTokens;
                                data.totalTokenUsage.totalTokens += tokenUsage.totalTokens;
                                data.totalTokenUsage.lastUpdated = new Date();
                            }
                            
                            await data.save();
                            
                            // Send final completion signal
                            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                                type: 'done',
                                chatName: data.name,
                                tokenUsage: tokenUsage
                            })}\n\n`));
                            
                            controller.close();
                            break;
                        }
                        
                        const chunk = decoder.decode(value, { stream: true });
                        const lines = chunk.split('\n');
                        
                        for (const line of lines) {
                            if (line.startsWith('data:')) {
                                const dataStr = line.slice(5); // Remove 'data:' prefix
                                if (dataStr === '[DONE]') {
                                    continue;
                                }
                                
                                try {
                                    const parsed = JSON.parse(dataStr);
                                    
                                    // Handle token events from Flowise
                                    if (parsed.event === 'token' && parsed.data) {
                                        const content = parsed.data;
                                        if (content && content.trim()) {
                                            fullMessage += content;
                                            
                                            // Send the streaming content to client
                                            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                                                type: 'content',
                                                content: content
                                            })}\n\n`));
                                        }
                                    }
                                    // Handle usage metadata for token tracking
                                    else if (parsed.event === 'usageMetadata' && parsed.data) {
                                        const usage = parsed.data;
                                        tokenUsage = {
                                            promptTokens: usage.input_tokens || 0,
                                            completionTokens: usage.output_tokens || 0,
                                            totalTokens: usage.total_tokens || 0
                                        };
                                    }
                                    // Handle end event
                                    else if (parsed.event === 'end') {
                                        break;
                                    }
                                    // Ignore other events like agentFlowEvent, nextAgentFlow, etc.
                                } catch (e) {
                                    // Skip non-JSON data - don't send to client
                                }
                            }
                            // Skip all other lines including 'message:' lines and raw text
                        }
                    }
                } catch (error) {
                    // 记录错误但不抛出，避免影响服务
                    console.error('[Stream Error]', error);
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                        type: 'error',
                        error: error.message
                    })}\n\n`));
                    controller.close();
                }
            }
        });
        
        // Return streaming response
        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no' // Disable Nginx buffering
            }
        });
    } catch (error) {
        // 记录所有错误但不让进程崩溃
        console.error('[API Error - Chat AI]', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        return NextResponse.json({ 
            success: false, 
            message: error.message || t('An error occurred while processing your request'),
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}