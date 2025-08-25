import { NextResponse } from "next/server";
import jwt from 'jsonwebtoken';
import connectDB from '@/config/db';
import LTIUser from '@/models/LTIUser';
import LTICourse from '@/models/LTICourse';
import ChatflowPermission from '@/models/ChatflowPermission';
import Chatflow from '@/models/Chatflow';

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

        // Find user using LTI structure
        const user = await LTIUser.findById(decoded.userId);
        if (!user) {
            console.log('[Chatflows API] User not found for ID:', decoded.userId);
            return NextResponse.json({ 
                message: 'User not found' 
            }, { status: 401 });
        }

        console.log('[Chatflows API] User found:', {
            id: user._id,
            name: user.name,
            username: user.username
        });

        // Get user's current course context from JWT token first
        let contextId = decoded.context_id; // Use context from JWT token (current LTI session)
        let userRoles = decoded.roles || [];
        
        console.log('[Chatflows API] Using JWT token context:', contextId);
        
        // Get course association details for additional info
        const courseAssociation = await LTICourse.findOne({
            user_id: user._id,
            context_id: contextId
        });
        
        if (courseAssociation) {
            // Use roles from course association if available
            userRoles = courseAssociation.roles || decoded.roles || [];
            console.log('[Chatflows API] Course association found:', {
                course: courseAssociation.context_title,
                roles: userRoles
            });
        } else {
            console.log('[Chatflows API] No course association found for user:', user._id);
            return NextResponse.json({
                success: true,
                data: [],
                message: 'No course association found'
            });
        }
        
        console.log('[Chatflows API] Course context:', contextId);
        console.log('[Chatflows API] User roles in course:', userRoles);
        
        const permissions = await ChatflowPermission.find({
            courseId: contextId,
            allowedRoles: { $in: userRoles },
            isActive: true
        });
        
        console.log(`[Chatflows API] Found ${permissions.length} chatflow permissions for course ${contextId}`);
        
        if (permissions.length === 0) {
            console.log('[Chatflows API] No chatflow permissions found for this course and roles');
            return NextResponse.json({
                success: true,
                data: [],
                message: 'No chatflow permissions for this course and your roles'
            });
        }

        // Get allowed chatflow IDs
        const allowedChatflowIds = permissions.map(p => p.chatflowId);
        console.log('[Chatflows API] Allowed chatflow IDs:', allowedChatflowIds);

        // Get chatflow details from local database
        const chatflows = await Chatflow.find({
            flowId: { $in: allowedChatflowIds },
            isActive: true
        });
        
        console.log(`[Chatflows API] Found ${chatflows.length} chatflows in local database`);
        
        // Format response data
        const filteredChatflows = chatflows.map(flow => ({
            id: flow.flowId,
            name: flow.name,
            description: flow.description || '',
            deployed: flow.deployed || false,
            category: flow.category || 'General',
            endpoint: flow.apiConfig?.endpoint || `https://aiagent.qefmoodle.com/api/v1/prediction/${flow.flowId}`
        }));

        console.log(`[Chatflows API] Returning ${filteredChatflows.length} chatflows for course: ${courseAssociation.context_title}`);
        console.log(`[Chatflows API] Final chatflows:`, filteredChatflows.map(f => ({ id: f.id, name: f.name })));

        return NextResponse.json({
            success: true,
            data: filteredChatflows,
            courseInfo: {
                courseId: contextId,
                courseName: courseAssociation.context_title,
                userRoles: courseAssociation.roles
            }
        });

    } catch (error) {
        console.error('[Chatflows API] Error fetching chatflows:', error);
        return NextResponse.json({ 
            success: false, 
            message: error.message || 'Failed to fetch chatflows',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
