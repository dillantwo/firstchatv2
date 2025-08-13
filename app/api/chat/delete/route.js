import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req){
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

        const { chatId } = await req.json();

        // Connect to the database and delete the chat
        await connectDB();
        await Chat.deleteOne({_id: chatId, userId})

        return NextResponse.json({ success: true, message: "Chat Deleted" });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message });
    }
}