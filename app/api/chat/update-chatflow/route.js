import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function PUT(req) {
    try {
        // Get user ID from LTI session cookie
        const token = req.cookies.get('lti_session')?.value;
        
        if (!token) {
            return NextResponse.json({
                success: false,
                message: "User not authenticated",
            });
        }

        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            userId = decoded.userId;
        } catch (error) {
            return NextResponse.json({
                success: false,
                message: "Invalid session",
            });
        }

        const body = await req.json();
        const { chatId, chatflowId } = body;

        if (!chatId) {
            return NextResponse.json({
                success: false,
                message: "Chat ID is required",
            });
        }

        // Connect to the database and update the chat
        await connectDB();
        
        const updatedChat = await Chat.findOneAndUpdate(
            { _id: chatId, userId }, // 确保只能更新属于当前用户的聊天
            { chatflowId: chatflowId || null },
            { new: true }
        );

        if (!updatedChat) {
            return NextResponse.json({
                success: false,
                message: "Chat not found or unauthorized",
            });
        }

        return NextResponse.json({ 
            success: true, 
            message: "Chat chatflow updated successfully",
            data: updatedChat
        });

    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        });
    }
}
