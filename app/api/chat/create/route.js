import connectDB from "@/config/db";
import Chat from "@/models/Chat";
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

        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            userId = decoded.userId;
            console.log('[Chat Create] Decoded userId:', userId);
        } catch (error) {
            console.log('[Chat Create] Token verification failed:', error.message);
            return NextResponse.json({success: false, message: "Invalid session"})
        }
        
        // Get chatflowId from request body
        const body = await req.json();
        const { chatflowId } = body;
        console.log('[Chat Create] Received chatflowId:', chatflowId);

        // Prepare the chat data to be saved in the database
        const chatData = {
            userId,
            messages: [],
            name: "New Chat", // Keep default name, will be updated on first conversation
            chatflowId: chatflowId || null, // If chatflowId is provided, associate with that chatflow
        };
        console.log('[Chat Create] Chat data to create:', chatData);

        // Connect to the database and create a new chat
        await connectDB();
        const newChat = await Chat.create(chatData);
        console.log('[Chat Create] Chat created successfully with ID:', newChat._id);

        return NextResponse.json({ success: true, message: "Chat created", chatId: newChat._id })

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message });
    }
}