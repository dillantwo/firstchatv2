import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req){
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

        // Connect to the database and fetch all chats for the user
        await connectDB();
        const data = await Chat.find({userId});

        return NextResponse.json({ success: true, data })
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message });
    }
}