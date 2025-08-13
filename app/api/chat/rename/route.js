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

        const {chatId, name} = await req.json();
        // Connect to the database and update the chat name
        await connectDB();
        await Chat.findOneAndUpdate({_id: chatId, userId}, {name});

        return NextResponse.json({ success: true, message: "Chat Renamed" });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message });
    }
}