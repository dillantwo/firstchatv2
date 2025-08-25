import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import LTIUser from "@/models/LTIUser";
import LTICourse from "@/models/LTICourse";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req){
    try {
        console.log('[Chat Create] API called');
        
        // Get user ID from LTI session cookie
        const token = req.cookies.get('lti_session')?.value;
        
        if (!token) {
            console.log('[Chat Create] No token found');
            return NextResponse.json({success: false, message: "User not authenticated"})
        }

        let userId, currentContextId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            userId = decoded.userId;
            currentContextId = decoded.context_id; // 从token获取当前课程ID
            console.log('[Chat Create] Decoded userId:', userId, 'contextId:', currentContextId);
        } catch (error) {
            console.log('[Chat Create] Token verification failed:', error.message);
            return NextResponse.json({success: false, message: "Invalid session"})
        }
        
        // Get chatflowId from request body
        const body = await req.json();
        const { chatflowId } = body;
        console.log('[Chat Create] Received chatflowId:', chatflowId);

        // Connect to the database and get user information
        await connectDB();
        
        // Get user's course context for chat association
        const user = await LTIUser.findById(userId);
        if (!user) {
            return NextResponse.json({success: false, message: "User not found"});
        }

        // Get user's current course context from JWT token
        let courseId = currentContextId; // Use context from JWT token (current LTI session)
        
        console.log('[Chat Create] Using JWT token context:', courseId);
        
        // Get course association for additional details if needed
        const courseAssociation = await LTICourse.findOne({
            user_id: user._id,
            context_id: courseId
        });

        if (courseAssociation) {
            console.log('[Chat Create] Course association found:', courseAssociation.context_title);
        } else {
            console.log('[Chat Create] No course association found for context:', courseId);
        }

        // Prepare the chat data to be saved in the database
        const chatData = {
            userId,
            messages: [],
            name: "New Chat", // Keep default name, will be updated on first conversation
            chatflowId: chatflowId || null, // If chatflowId is provided, associate with that chatflow
            courseId: courseId || null, // Associate with user's current course for token tracking
        };
        console.log('[Chat Create] Chat data to create:', chatData);

        // Create a new chat
        const newChat = await Chat.create(chatData);
        console.log('[Chat Create] Chat created successfully with ID:', newChat._id);

        return NextResponse.json({ success: true, message: "Chat created", chatId: newChat._id })

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message });
    }
}