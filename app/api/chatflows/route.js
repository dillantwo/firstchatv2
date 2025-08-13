import { NextResponse } from "next/server";
import jwt from 'jsonwebtoken';
import connectDB from '@/config/db';
import LTIUser from '@/models/LTIUser';
import { ChatflowPermission } from '@/models/ChatflowPermission';

// Flowise API configuration
const FLOWISE_BASE_URL = process.env.FLOWISE_BASE_URL;
const FLOWISE_API_KEY = process.env.FLOWISE_API_KEY;

export async function GET(request) {
    console.log('[Chatflows API] === Chatflows API called ===');
    try {
        // Check authentication
        const cookies = request.cookies;
        const token = cookies.get('lti_session')?.value;
        console.log('[Chatflows API] Token exists:', !!token);

        if (!token) {
            console.log('[Chatflows API] No token found');
            return NextResponse.json({ 
                success: false, 
                message: 'Authentication required' 
            }, { status: 401 });
        }

        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('[Chatflows API] Token decoded successfully, userId:', decoded.userId);
        } catch (error) {
            console.log('[Chatflows API] Token verification failed:', error.message);
            return NextResponse.json({ 
                success: false, 
                message: 'Invalid token' 
            }, { status: 401 });
        }

        // Connect to database
        await connectDB();
        console.log('[Chatflows API] Database connected');

        // Find user
        const user = await LTIUser.findById(decoded.userId);
        if (!user) {
            console.log('[Chatflows API] User not found for ID:', decoded.userId);
            return NextResponse.json({ 
                success: false, 
                message: 'User not found' 
            }, { status: 401 });
        }

        console.log('[Chatflows API] User found:', {
            id: user._id,
            name: user.name,
            context_id: user.context_id,
            roles: user.roles
        });

        // Get user's chatflow permissions based on course and role
        const permissions = await ChatflowPermission.find({ 
            courseId: user.context_id, 
            hasAccess: true,
            allowedRoles: { $in: user.roles }
        });

        const allowedChatflowIds = permissions.map(p => p.chatflowId);

        console.log(`[Chatflows API] User: ${user.name}, Course: ${user.context_id}, Roles: ${user.roles?.join(',')}`);
        console.log(`[Chatflows API] Found ${permissions.length} permissions for ${allowedChatflowIds.length} chatflows`);

        if (allowedChatflowIds.length === 0) {
            console.log(`[Chatflows API] No chatflow permissions found for user in course ${user.context_id}`);
            return NextResponse.json({
                success: true,
                data: []
            });
        }

        // Get all chatflows from Flowise
        const response = await fetch(`${FLOWISE_BASE_URL}/api/v1/chatflows`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${FLOWISE_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Flowise API error: ${response.status} ${response.statusText}`);
        }

        const chatflows = await response.json();
        
        // Filter to only allowed chatflows and format data
        const filteredChatflows = chatflows
            .filter(flow => allowedChatflowIds.includes(flow.id))
            .map(flow => ({
                id: flow.id,
                name: flow.name,
                description: flow.description || '',
                deployed: true, // All fetched ones are available
                category: flow.category || 'General'
            }));

        return NextResponse.json({
            success: true,
            data: filteredChatflows
        });

    } catch (error) {
        console.error('Error fetching chatflows:', error);
        return NextResponse.json({ 
            success: false, 
            message: error.message || 'Failed to fetch chatflows',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
