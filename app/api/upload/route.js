export const maxDuration = 300;

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mammoth from "mammoth";
import { isFileNameSafe, containsDangerousPattern, logSecurityEvent } from "@/middleware/securityValidation";

export async function POST(req) {
    try {
        console.log('[Upload API] Starting file upload process');
        
        // Get user ID from LTI session cookie
        const token = req.cookies.get('lti_session')?.value;
        
        if (!token) {
            console.log('[Upload API] No authentication token found');
            return NextResponse.json({
                success: false,
                message: "User not authenticated",
            });
        }

        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            userId = decoded.userId;
            console.log('[Upload API] User authenticated:', userId);
        } catch (error) {
            console.log('[Upload API] Invalid session token:', error.message);
            return NextResponse.json({
                success: false,
                message: "Invalid session",
            });
        }

        // 獲取請求體大小
        const contentLength = req.headers.get('content-length');
        console.log('[Upload API] Content length:', contentLength);
        
        // 檢查是否超過限制（50MB = 52428800 bytes）
        if (contentLength && parseInt(contentLength) > 52428800) {
            console.log('[Upload API] File size exceeds limit');
            return NextResponse.json({
                success: false,
                message: "File size exceeds 50MB limit",
            });
        }

        const formData = await req.formData();
        const files = formData.getAll('files');
        
        console.log('[Upload API] Files received:', files.length);

        if (files.length === 0) {
            return NextResponse.json({
                success: false,
                message: "No files uploaded",
            });
        }

        const processedFiles = [];
        
        for (const file of files) {
            console.log(`[Upload API] Processing file: ${file.name} Type: ${file.type} Size: ${file.size}`);
            
            // Security: 使用统一的文件名验证
            if (!isFileNameSafe(file.name)) {
                logSecurityEvent({
                    type: 'dangerous_file_upload',
                    userId,
                    fileName: file.name,
                    ip: req.headers.get('x-forwarded-for') || 'unknown',
                    timestamp: new Date().toISOString()
                });
                
                return NextResponse.json({
                    success: false,
                    message: `File "${file.name}" is not allowed for security reasons`,
                }, { status: 400 });
            }
            
            if (file.size === 0) {
                console.log('[Upload API] Empty file detected');
                return NextResponse.json({
                    success: false,
                    message: `File ${file.name} is empty`,
                });
            }

            if (file.size > 50 * 1024 * 1024) { // 50MB limit
                console.log('[Upload API] File size exceeds limit');
                return NextResponse.json({
                    success: false,
                    message: `File ${file.name} exceeds 50MB limit`,
                });
            }
            
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            console.log('[Upload API] File converted to buffer, size:', buffer.length);
            
            let processedData = {};
            
            // Handle different file types
            if (file.type.startsWith('image/')) {
                console.log('[Upload API] Processing as image');
                // 處理圖片文件 - 保持原有邏輯，轉換為 base64
                const base64 = buffer.toString('base64');
                const dataUrl = `data:${file.type};base64,${base64}`;
                
                processedData = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    url: dataUrl,
                    fileType: 'image'
                };
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                      file.name.toLowerCase().endsWith('.docx')) {
                console.log('[Upload API] Processing as Word document');
                // 處理 Word 文檔
                try {
                    const result = await mammoth.extractRawText({ buffer });
                    console.log('[Upload API] Word text extracted, length:', result.value.length);
                    processedData = {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        text: result.value,
                        fileType: 'document',
                        documentType: 'word'
                    };
                } catch (error) {
                    console.error('[Upload API] Error processing Word document:', error);
                    return NextResponse.json({
                        success: false,
                        message: `Failed to process Word document ${file.name}: ${error.message}`,
                    });
                }
            } else {
                console.log('[Upload API] Unsupported file type:', file.type);
                return NextResponse.json({
                    success: false,
                    message: `Unsupported file type: ${file.type}. Only images (.jpg, .png, .gif, etc.) and Word documents (.docx) are supported.`,
                });
            }
            
            processedFiles.push(processedData);
            console.log('[Upload API] File processed successfully:', file.name);
        }

        console.log('[Upload API] All files processed successfully, count:', processedFiles.length);
        return NextResponse.json({
            success: true,
            data: processedFiles
        });
        
    } catch (error) {
        // 记录错误但不让进程崩溃
        console.error('[API Error - Upload]', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to process file upload'
        }, { status: 500 });
    }
}
